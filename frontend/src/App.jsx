// src/App.jsx
import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [ssml, setSsml] = useState("<speak>Hello, world!</speak>");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [audioFormat, setAudioFormat] = useState("MP3");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");

  const backendUrl = "http://localhost:5000"; // change if deploying

  // Load available voices
  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await axios.get(`${backendUrl}/voices`);
        setVoices(res.data.voices || []);
      } catch (err) {
        console.error("Failed to fetch voices", err);
        setError("Could not load voices. Check backend.");
      }
    }
    fetchVoices();
  }, []);

  const handleSynthesize = async () => {
    setLoading(true);
    setError("");
    setAudioUrl(null);

    try {
      const res = await axios.post(`${backendUrl}/synthesize`, {
        ssml,
        voiceName: selectedVoice,
        audioFormat,
      });

      if (res.data.downloadUrl) {
        setAudioUrl(res.data.downloadUrl);
      } else {
        setError("No download URL received.");
      }
    } catch (err) {
      console.error("Synthesis error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to synthesize.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Arial", padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>Google TTS Synthesizer</h1>

      {/* SSML Input */}
      <label>SSML Input:</label>
      <textarea
        rows={6}
        style={{ width: "100%", marginTop: "8px" }}
        value={ssml}
        onChange={(e) => setSsml(e.target.value)}
      />

      {/* Voice Selection */}
      <div style={{ marginTop: "15px" }}>
        <label>Voice: </label>
        <select
          style={{ marginLeft: "10px", padding: "5px" }}
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
        >
          <option value="">Auto (let backend choose)</option>
            {voices
              .filter((v) => ["Aoede", "Sulafat", "Sadaltager"].includes(v.name))
              .map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.languageCodes.join(", ")})
                </option>
              ))}
        </select>
      </div>

      {/* Audio Format */}
      <div style={{ marginTop: "15px" }}>
        <label>Format: </label>
        <select
          style={{ marginLeft: "10px", padding: "5px" }}
          value={audioFormat}
          onChange={(e) => setAudioFormat(e.target.value)}
        >
          <option value="MP3">MP3</option>
          <option value="WAV">WAV</option>
        </select>
      </div>

      {/* Synthesize Button */}
      <button
        onClick={handleSynthesize}
        disabled={loading}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate Audio"}
      </button>

      {/* Error */}
      {error && <p style={{ color: "red", marginTop: "10px" }}>Error: {error}</p>}

      {/* Audio Player */}
      {audioUrl && (
        <div style={{ marginTop: "20px" }}>
          <h3>Preview:</h3>
          <audio controls src={audioUrl}></audio>
          <br />
          <a href={audioUrl} download>
            Download Audio
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
