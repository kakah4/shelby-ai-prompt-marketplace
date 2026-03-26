import { useState } from 'react';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🚀</span>
            <h1 className="text-4xl font-bold">Shelby AI Prompt 
Marketplace</h1>
          </div>
          <button
            onClick={() => setWalletConnected(!walletConnected)}
            className="bg-[#00ff9d] hover:bg-[#00cc7a] text-black px-8 
py-3 rounded-2xl font-semibold transition"
          >
            {walletConnected ? '✅ Connected' : 'Connect Petra Wallet'}
          </button>
        </div>

        <p className="text-center text-xl text-gray-400 mb-10">
          Upload your best AI prompts • Set your own price • Earn from 
paid verifiable reads
        </p>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-600 
hover:border-[#00ff9d] rounded-3xl p-16 text-center transition mb-12">
          <div className="text-7xl mb-6">📤</div>
          <h2 className="text-3xl font-semibold mb-3">Drop your prompt 
here</h2>
          <p className="text-gray-400 mb-8">or click to select a .txt 
file</p>
          <button className="bg-white text-black px-10 py-4 rounded-2xl 
text-lg font-medium">
            Select Prompt File
          </button>
        </div>

        {/* Prompt Gallery */}
        <h2 className="text-2xl font-semibold mb-6">Featured Prompts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1a1a] rounded-3xl p-6">
            <p className="font-medium mb-4">Explain decentralized hot 
storage for beginners</p>
            <div className="text-xs bg-[#00ff9d] text-black px-4 py-2 
inline-block rounded-full">0.001 ShelbyUSD</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-3xl p-6">
            <p className="font-medium mb-4">Midjourney prompt for 
cyberpunk city at night</p>
            <div className="text-xs bg-[#00ff9d] text-black px-4 py-2 
inline-block rounded-full">0.0005 ShelbyUSD</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-3xl p-6">
            <p className="font-medium mb-4">ChatGPT system prompt for a 
helpful AI tutor</p>
            <div className="text-xs bg-[#00ff9d] text-black px-4 py-2 
inline-block rounded-full">0.002 ShelbyUSD</div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-16">
          Built as a complete beginner • Proof-of-work for Shelby Early 
Access
        </p>
      </div>
    </div>
  );
}

export default App;
