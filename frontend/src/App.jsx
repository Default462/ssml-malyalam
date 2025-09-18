import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [ssml, setSsml] = useState("");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("ml-IN-Wavenet-A");
  const [audioFormat, setAudioFormat] = useState("MP3");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const backendUrl = "http://localhost:5000";

  // Malayalam voices you specifically mentioned
  const malayalamVoices = [
    { name: "ml-IN-Wavenet-A", displayName: "Aoede (Malayalam)" },
    { name: "ml-IN-Wavenet-B", displayName: "Sulafat (Malayalam)" },
    { name: "ml-IN-Wavenet-C", displayName: "Sadaltager (Malayalam)" },
  ];

  // Load available voices
  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await axios.get(`${backendUrl}/voices`);
        const availableVoices = res.data.voices || [];
        
        // Filter for Malayalam voices and the specific ones you mentioned
        const filteredVoices = availableVoices.filter(v => 
          v.languageCodes.includes("ml-IN") || 
          ["Aoede", "Sulafat", "Sadaltager"].some(name => v.name.includes(name))
        );
        
        setVoices(filteredVoices);
        
        // Set default voice if available
        if (filteredVoices.length > 0) {
          setSelectedVoice(filteredVoices[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch voices", err);
        setError("Could not load voices. Please ensure the backend is running.");
      }
    }
    fetchVoices();
  }, []);

  const handleSynthesize = async () => {
    if (!ssml.trim()) {
      setError("Please enter SSML text to synthesize.");
      return;
    }

    setLoading(true);
    setError("");
    setAudioUrl(null);
    setProgress("Initializing synthesis...");

    try {
      setProgress("Processing SSML and generating audio chunks...");
      
      const res = await axios.post(`${backendUrl}/synthesize`, {
        ssml: ssml.trim(),
        voiceName: selectedVoice,
        audioFormat,
      });

      if (res.data.downloadUrl) {
        setAudioUrl(res.data.downloadUrl);
        setProgress(`✅ Audio generated successfully! Processed ${res.data.chunks} chunks using ${res.data.voiceUsed}`);
      } else {
        setError("No download URL received from server.");
      }
    } catch (err) {
      console.error("Synthesis error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to synthesize audio. Please check your SSML format and try again.");
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  const handleClearText = () => {
    setSsml("");
    setAudioUrl(null);
    setError("");
    setProgress("");
  };

  const getCharacterCount = () => {
    return ssml.length;
  };

  const getWordCount = () => {
    return ssml.trim() ? ssml.trim().split(/\s+/).length : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Malayalam TTS Generator
          </h1>
          <p className="text-gray-600">
            Professional SSML-optimized text-to-speech for Malayalam content
          </p>
        </div>

        {/* Main Interface */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* SSML Input Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-lg font-semibold text-gray-700">
                SSML Text Input
              </label>
              <div className="text-sm text-gray-500">
                {getCharacterCount()} characters • {getWordCount()} words
              </div>
            </div>
            
            <textarea
              rows={12}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors font-mono text-sm"
              placeholder="Paste your complete SSML-formatted text here...

Example:
<speak>
  <p>നമസ്കാരം! <break time='500ms'/> ഇത് ഒരു Malayalam TTS ടെസ്റ്റ് ആണ്.</p>
  <p>This is a <phoneme alphabet='ipa' ph='tɛst'>test</phoneme> with English mixed in.</p>
</speak>"
              value={ssml}
              onChange={(e) => setSsml(e.target.value)}
            />
            
            {ssml && (
              <button
                onClick={handleClearText}
                className="mt-2 px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
              >
                Clear Text
              </button>
            )}
          </div>

          {/* Controls Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Malayalam Voice
              </label>
              <select
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {voices.length > 0 ? (
                  voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.languageCodes.join(", ")})
                    </option>
                  ))
                ) : (
                  <option value="">Loading voices...</option>
                )}
              </select>
            </div>

            {/* Audio Format */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Audio Format
              </label>
              <select
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                value={audioFormat}
                onChange={(e) => setAudioFormat(e.target.value)}
              >
                <option value="MP3">MP3 (Recommended)</option>
                <option value="WAV">WAV (Uncompressed)</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center mb-6">
            <button
              onClick={handleSynthesize}
              disabled={loading || !ssml.trim()}
              className={`px-8 py-4 rounded-lg font-semibold text-white transition-all transform hover:scale-105 ${
                loading || !ssml.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Generating Audio...
                </div>
              ) : (
                "Generate Audio"
              )}
            </button>
          </div>

          {/* Progress */}
          {progress && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">{progress}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          )}

          {/* Audio Player and Download */}
          {audioUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                🎉 Audio Generated Successfully!
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Audio:
                  </label>
                  <audio 
                    controls 
                    src={audioUrl}
                    className="w-full"
                    preload="metadata"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
                
                <div className="flex gap-3">
                  <a
                    href={audioUrl}
                    download
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Audio File
                  </a>
                  
                  <button
                    onClick={() => {
                      setAudioUrl(null);
                      setProgress("");
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Generate New Audio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Supports long-form SSML content with automatic chunking • 
            Optimized for Malayalam with English mixed content
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;