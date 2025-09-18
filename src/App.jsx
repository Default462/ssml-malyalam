import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [ssmlText, setSsmlText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('ml-IN-Wavenet-A')
  const [audioFormat, setAudioFormat] = useState('MP3')
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [availableVoices, setAvailableVoices] = useState([])

  const backendUrl = 'http://localhost:5000'

  // Malayalam voices with friendly names
  const malayalamVoices = [
    { id: 'ml-IN-Wavenet-A', name: 'Aoede (Malayalam Female)' },
    { id: 'ml-IN-Wavenet-B', name: 'Sulafat (Malayalam Male)' },
    { id: 'ml-IN-Wavenet-C', name: 'Sadaltager (Malayalam Female)' },
  ]

  // Load available voices from backend
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await axios.get(`${backendUrl}/voices`)
        setAvailableVoices(response.data.voices || [])
      } catch (err) {
        console.error('Failed to load voices:', err)
        setError('Could not connect to TTS service. Please ensure the backend is running on port 5000.')
      }
    }
    fetchVoices()
  }, [])

  const handleGenerate = async () => {
    if (!ssmlText.trim()) {
      setError('Please enter SSML text to generate audio.')
      return
    }

    setIsGenerating(true)
    setError('')
    setAudioUrl(null)
    setProgress('Initializing audio generation...')

    try {
      setProgress('Processing SSML and generating audio chunks...')
      
      const response = await axios.post(`${backendUrl}/synthesize`, {
        ssml: ssmlText.trim(),
        voiceName: selectedVoice,
        audioFormat: audioFormat
      })

      if (response.data.downloadUrl) {
        setAudioUrl(response.data.downloadUrl)
        setProgress(`✅ Audio generated successfully! Processed ${response.data.chunks} chunks using ${response.data.voiceUsed}`)
      } else {
        setError('No download URL received from server.')
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.response?.data?.error || 'Failed to generate audio. Please check your SSML format and try again.')
      setProgress('')
    } finally {
      setIsGenerating(false)
    }
  }

  const clearAll = () => {
    setSsmlText('')
    setAudioUrl(null)
    setError('')
    setProgress('')
  }

  const getStats = () => {
    const chars = ssmlText.length
    const words = ssmlText.trim() ? ssmlText.trim().split(/\s+/).length : 0
    return { chars, words }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Malayalam TTS Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional SSML-optimized text-to-speech for Malayalam content with advanced voice control
          </p>
        </div>

        {/* Main Interface */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Input Section */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">SSML Text Input</h2>
              <div className="text-sm text-gray-500 font-medium">
                {stats.chars.toLocaleString()} characters • {stats.words.toLocaleString()} words
              </div>
            </div>
            
            <textarea
              value={ssmlText}
              onChange={(e) => setSsmlText(e.target.value)}
              placeholder="Paste your complete SSML-formatted text here...

Example:
<speak>
  <p>നമസ്കാരം! <break time='500ms'/> ഇത് ഒരു Malayalam TTS ടെസ്റ്റ് ആണ്.</p>
  <p>This is a <phoneme alphabet='ipa' ph='tɛst'>test</phoneme> with English mixed in.</p>
  <p><prosody rate='slow' pitch='+2st'>Slow and higher pitched text</prosody></p>
</speak>"
              rows={16}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-malayalam-500 focus:ring-4 focus:ring-malayalam-100 transition-all duration-200 font-mono text-sm resize-none"
            />
            
            {ssmlText && (
              <button
                onClick={clearAll}
                className="mt-3 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Controls Section */}
          <div className="p-8 bg-gray-50">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Malayalam Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-malayalam-500 focus:ring-4 focus:ring-malayalam-100 transition-all duration-200 bg-white"
                >
                  {malayalamVoices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audio Format */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Audio Format
                </label>
                <select
                  value={audioFormat}
                  onChange={(e) => setAudioFormat(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-malayalam-500 focus:ring-4 focus:ring-malayalam-100 transition-all duration-200 bg-white"
                >
                  <option value="MP3">MP3 (Recommended)</option>
                  <option value="WAV">WAV (Uncompressed)</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !ssmlText.trim()}
                className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 ${
                  isGenerating || !ssmlText.trim()
                    ? 'bg-gray-400 cursor-not-allowed scale-100'
                    : 'bg-gradient-to-r from-malayalam-600 to-blue-600 hover:from-malayalam-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generating Audio...
                  </div>
                ) : (
                  'Generate Audio'
                )}
              </button>
            </div>
          </div>

          {/* Progress Section */}
          {progress && (
            <div className="p-6 bg-blue-50 border-t border-blue-100">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <p className="text-blue-800 font-medium">{progress}</p>
              </div>
            </div>
          )}

          {/* Error Section */}
          {error && (
            <div className="p-6 bg-red-50 border-t border-red-100">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 text-red-500 mr-3 mt-0.5">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-red-800 font-semibold">Error</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Section */}
          {audioUrl && (
            <div className="p-8 bg-green-50 border-t border-green-100">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Audio Generated Successfully!
                </h3>
                <p className="text-green-700 mb-6">
                  Your Malayalam audio is ready for preview and download
                </p>

                {/* Audio Player */}
                <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Audio Preview:
                  </label>
                  <audio 
                    controls 
                    src={audioUrl}
                    className="w-full max-w-md mx-auto"
                    preload="metadata"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={audioUrl}
                    download
                    className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Audio File
                  </a>
                  
                  <button
                    onClick={() => {
                      setAudioUrl(null)
                      setProgress('')
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors duration-200"
                  >
                    Generate New Audio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Supports long-form SSML content with automatic chunking • 
            Optimized for Malayalam with English mixed content • 
            Professional voice synthesis using Google Cloud TTS
          </p>
        </div>
      </div>
    </div>
  )
}

export default App