
// // index.js
// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const fs = require("fs");
// const util = require("util");
// const path = require("path");
// const textToSpeech = require("@google-cloud/text-to-speech");

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json({ limit: "500mb" }));

// // Google TTS client
// const client = new textToSpeech.TextToSpeechClient({
//   keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
// });

// // Cache voices
// let availableVoices = [];
// async function loadVoices() {
//   try {
//     const [result] = await client.listVoices({});
//     availableVoices = (result.voices || []).map((v) => ({
//       name: v.name,
//       languageCodes: v.languageCodes,
//       ssmlGender: v.ssmlGender,
//       naturalSampleRateHertz: v.naturalSampleRateHertz,
//     }));
//     console.log(`Loaded ${availableVoices.length} voices from Google TTS`);
//   } catch (err) {
//     console.error("Failed to load voices:", err);
//   }
// }
// loadVoices();

// // Helpers
// function voiceExists(voiceName) {
//   return availableVoices.some((v) => v.name.toLowerCase() === voiceName.toLowerCase());
// }

// function getNeuralVoiceForLanguage(langCode) {
//   const v = availableVoices.find(
//     (v) => v.languageCodes.includes(langCode) && v.name.includes("Wavenet")
//   );
//   return v ? v.name : null;
// }

// // Split long text into safe SSML chunks under ~850 bytes
// function chunkSSMLByBytes(input, maxBytes = 1200) {
//   const parts = [];
//   let current = "";

//   const sentences = input.split(/(?<=[.?!])\s+/); // split by sentence
//   for (let s of sentences) {
//     const testChunk = current ? current + " " + s : s;
//     const byteLength = Buffer.byteLength(testChunk, "utf8");

//     if (byteLength > maxBytes) {
//       if (current) parts.push(`<speak>${current}</speak>`);

//       if (Buffer.byteLength(s, "utf8") > maxBytes) {
//         let subStr = "";
//         for (let char of s) {
//           const newStr = subStr + char;
//           if (Buffer.byteLength(newStr, "utf8") > maxBytes) {
//             parts.push(`<speak>${subStr}</speak>`);
//             subStr = char;
//           } else {
//             subStr = newStr;
//           }
//         }
//         if (subStr) parts.push(`<speak>${subStr}</speak>`);
//         current = "";
//       } else {
//         current = s;
//       }
//     } else {
//       current = testChunk;
//     }
//   }

//   if (current.trim()) {
//     parts.push(`<speak>${current.trim()}</speak>`);
//   }

//   return parts;
// }

// // --- ROUTES ---
// // Get voices
// app.get("/voices", (req, res) => {
//   res.json({ voices: availableVoices });
// });

// // Synthesize TTS
// app.post("/synthesize", async (req, res) => {
//   try {
//     let { ssml } = req.body;
//     let voiceName = req.body.voiceName || req.body.voice || null;
//     let audioFormat = req.body.audioFormat || req.body.format || "MP3";

//     if (!ssml) {
//       return res.status(400).json({ error: "SSML text is required" });
//     }

//     ssml = ssml.replace(/^<speak>/i, "").replace(/<\/speak>$/i, "").trim();

//     // Choose neural voice if none specified
//     if (!voiceName) {
//       voiceName =
//         getNeuralVoiceForLanguage("ml-IN") ||
//         getNeuralVoiceForLanguage("hi-IN") ||
//         getNeuralVoiceForLanguage("en-IN") ||
//         getNeuralVoiceForLanguage("en-US") ||
//         availableVoices[0].name;
//     }

//     // Validate voice
//     if (!voiceExists(voiceName)) {
//       const sample = availableVoices.slice(0, 10).map((v) => v.name);
//       return res.status(400).json({
//         error: `Requested voice '${voiceName}' not found.`,
//         hint: "Use /voices to see available voice names.",
//         sampleVoices: sample,
//       });
//     }

//     // Audio encoding
//     const fmt = ("" + audioFormat).toUpperCase();
//     const audioEncoding = fmt === "WAV" || fmt === "LINEAR16" ? "LINEAR16" : "MP3";

//     const voiceObj = availableVoices.find((v) => v.name.toLowerCase() === voiceName.toLowerCase());
//     const languageCode = (voiceObj && voiceObj.languageCodes[0]) || "en-US";

//     // Chunk text
//     const chunks = chunkSSMLByBytes(ssml, 1200);
//     if (chunks.length === 0) {
//       return res.status(400).json({ error: "Input too small after processing" });
//     }

//     // Synthesize each chunk
//     let allAudio = Buffer.alloc(0);
//     for (let chunk of chunks) {
//       const request = {
//         input: { ssml: chunk },
//         voice: {
//           languageCode,
//           name: voiceObj.name,
//           ssmlGender: voiceObj.ssmlGender || "NEUTRAL",
//           model: "latest", // 🔹 crucial for neural voices
//         },
//         audioConfig: { audioEncoding },
//       };

//       const [response] = await client.synthesizeSpeech(request);
//       allAudio = Buffer.concat([allAudio, Buffer.from(response.audioContent, "base64")]);
//     }

//     // Save merged file
//     const fileExt = audioEncoding === "LINEAR16" ? "wav" : "mp3";
//     const fileName = `tts_${Date.now()}.${fileExt}`;
//     const outputFile = path.join(__dirname, fileName);
//     await util.promisify(fs.writeFile)(outputFile, allAudio, "binary");

//     return res.json({
//       message: "✅ Audio generated successfully",
//       downloadUrl: `http://localhost:${process.env.PORT || 5000}/download/${fileName}`,
//       chunks: chunks.length,
//       voiceUsed: voiceName,
//     });
//   } catch (error) {
//     console.error("Error in /synthesize:", error);
//     return res.status(500).json({
//       error: "Failed to generate audio",
//       details: error.message || error.toString(),
//     });
//   }
// });

// // Download route
// app.get("/download/:filename", (req, res) => {
//   const filePath = path.join(__dirname, req.params.filename);
//   if (fs.existsSync(filePath)) {
//     res.download(filePath);
//   } else {
//     res.status(404).json({ error: "File not found" });
//   }
// });

// // Verify endpoint
// app.get("/verify", async (req, res) => {
//   try {
//     const projectId = await client.getProjectId();
//     res.json({ message: "Google TTS credentials valid", projectId });
//   } catch (err) {
//     res.status(500).json({ error: "Google TTS authentication failed", details: err.message || err });
//   }
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));



//fix the issue of waw voice download

// index.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const util = require("util");
const path = require("path");
const textToSpeech = require("@google-cloud/text-to-speech");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "500mb" }));

// Google TTS client
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Cache voices
let availableVoices = [];
async function loadVoices() {
  try {
    const [result] = await client.listVoices({});
    availableVoices = (result.voices || []).map((v) => ({
      name: v.name,
      languageCodes: v.languageCodes,
      ssmlGender: v.ssmlGender,
      naturalSampleRateHertz: v.naturalSampleRateHertz,
    }));
    console.log(`Loaded ${availableVoices.length} voices from Google TTS`);
  } catch (err) {
    console.error("Failed to load voices:", err);
  }
}
loadVoices();

// Helpers
function voiceExists(voiceName) {
  return availableVoices.some((v) => v.name.toLowerCase() === voiceName.toLowerCase());
}

function getNeuralVoiceForLanguage(langCode) {
  const v = availableVoices.find(
    (v) => v.languageCodes.includes(langCode) && v.name.includes("Wavenet")
  );
  return v ? v.name : null;
}

// Split long text into safe SSML chunks under ~850 bytes
function chunkSSMLByBytes(input, maxBytes = 1200) {
  const parts = [];
  let current = "";

  const sentences = input.split(/(?<=[.?!])\s+/);
  for (let s of sentences) {
    const testChunk = current ? current + " " + s : s;
    const byteLength = Buffer.byteLength(testChunk, "utf8");

    if (byteLength > maxBytes) {
      if (current) parts.push(`<speak>${current}</speak>`);

      if (Buffer.byteLength(s, "utf8") > maxBytes) {
        let subStr = "";
        for (let char of s) {
          const newStr = subStr + char;
          if (Buffer.byteLength(newStr, "utf8") > maxBytes) {
            parts.push(`<speak>${subStr}</speak>`);
            subStr = char;
          } else {
            subStr = newStr;
          }
        }
        if (subStr) parts.push(`<speak>${subStr}</speak>`);
        current = "";
      } else {
        current = s;
      }
    } else {
      current = testChunk;
    }
  }

  if (current.trim()) {
    parts.push(`<speak>${current.trim()}</speak>`);
  }

  return parts;
}

// --- WAV header builder ---
function createWavHeader(dataLength, sampleRate = 24000, channels = 1, bitDepth = 16) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28);
  header.writeUInt16LE(channels * (bitDepth / 8), 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

// --- ROUTES ---
// Get voices
app.get("/voices", (req, res) => {
  res.json({ voices: availableVoices });
});

// Synthesize TTS
app.post("/synthesize", async (req, res) => {
  try {
    let { ssml } = req.body;
    let voiceName = req.body.voiceName || req.body.voice || null;
    let audioFormat = req.body.audioFormat || req.body.format || "MP3";

    if (!ssml) {
      return res.status(400).json({ error: "SSML text is required" });
    }

    ssml = ssml.replace(/^<speak>/i, "").replace(/<\/speak>$/i, "").trim();

    if (!voiceName) {
      voiceName =
        getNeuralVoiceForLanguage("ml-IN") ||
        getNeuralVoiceForLanguage("hi-IN") ||
        getNeuralVoiceForLanguage("en-IN") ||
        getNeuralVoiceForLanguage("en-US") ||
        availableVoices[0].name;
    }

    if (!voiceExists(voiceName)) {
      const sample = availableVoices.slice(0, 10).map((v) => v.name);
      return res.status(400).json({
        error: `Requested voice '${voiceName}' not found.`,
        hint: "Use /voices to see available voice names.",
        sampleVoices: sample,
      });
    }

    const fmt = ("" + audioFormat).toUpperCase();
    const audioEncoding = fmt === "WAV" || fmt === "LINEAR16" ? "LINEAR16" : "MP3";

    const voiceObj = availableVoices.find((v) => v.name.toLowerCase() === voiceName.toLowerCase());
    const languageCode = (voiceObj && voiceObj.languageCodes[0]) || "en-US";

    const chunks = chunkSSMLByBytes(ssml, 1200);
    if (chunks.length === 0) {
      return res.status(400).json({ error: "Input too small after processing" });
    }

    let allAudio = Buffer.alloc(0);
    let rawChunks = [];

    for (let chunk of chunks) {
      const request = {
        input: { ssml: chunk },
        voice: {
          languageCode,
          name: voiceObj.name,
          ssmlGender: voiceObj.ssmlGender || "NEUTRAL",
          model: "latest",
        },
        audioConfig: { audioEncoding },
      };

      const [response] = await client.synthesizeSpeech(request);

      if (audioEncoding === "LINEAR16") {
        rawChunks.push(Buffer.from(response.audioContent, "base64"));
      } else {
        allAudio = Buffer.concat([allAudio, Buffer.from(response.audioContent, "base64")]);
      }
    }

    if (audioEncoding === "LINEAR16") {
      const pcmData = Buffer.concat(rawChunks);
      const header = createWavHeader(pcmData.length);
      allAudio = Buffer.concat([header, pcmData]);
    }

    const fileExt = audioEncoding === "LINEAR16" ? "wav" : "mp3";
    const fileName = `tts_${Date.now()}.${fileExt}`;
    const outputFile = path.join(__dirname, fileName);
    await util.promisify(fs.writeFile)(outputFile, allAudio, "binary");

    return res.json({
      message: "✅ Audio generated successfully",
      downloadUrl: `http://localhost:${process.env.PORT || 5000}/download/${fileName}`,
      chunks: chunks.length,
      voiceUsed: voiceName,
    });
  } catch (error) {
    console.error("Error in /synthesize:", error);
    return res.status(500).json({
      error: "Failed to generate audio",
      details: error.message || error.toString(),
    });
  }
});

// Download route
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// Verify endpoint
app.get("/verify", async (req, res) => {
  try {
    const projectId = await client.getProjectId();
    res.json({ message: "Google TTS credentials valid", projectId });
  } catch (err) {
    res.status(500).json({ error: "Google TTS authentication failed", details: err.message || err });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));



