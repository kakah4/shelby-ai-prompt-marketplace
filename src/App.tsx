import { useState } from 'react';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 
'white', fontFamily: 'system-ui, sans-serif', padding: '40px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', 
alignItems: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '900' }}>🚀 Shelby AI 
Prompt Marketplace</h1>
          <button
            onClick={() => setWalletConnected(!walletConnected)}
            style={{
              backgroundColor: '#ff00aa',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '9999px',
              fontSize: '18px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {walletConnected ? '✅ Connected' : 'Connect Petra Wallet'}
          </button>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '52px', fontWeight: '900', marginBottom: 
'20px' }}>
            The Future of AI Prompts is Here
          </h2>
          <p style={{ fontSize: '24px', color: '#aaaaaa', maxWidth: 
'700px', margin: '0 auto 40px' }}>
            Buy, sell & own AI prompts on Shelby Testnet with real money 
and on-chain proof.
          </p>
          <button style={{
            backgroundColor: 'white',
            color: 'black',
            fontSize: '22px',
            fontWeight: '700',
            padding: '20px 48px',
            borderRadius: '9999px'
          }}>
            EXPLORE MARKETPLACE →
          </button>
        </div>

        {/* Upload Box */}
        <div style={{ backgroundColor: '#1a1a1a', padding: '50px', 
borderRadius: '30px', textAlign: 'center', marginBottom: '60px' }}>
          <h3 style={{ fontSize: '28px', marginBottom: '30px' }}>Upload 
Your Prompt & Earn</h3>
          <button style={{
            background: 'linear-gradient(to right, #ff00aa, #00ffff)',
            color: 'white',
            padding: '20px 60px',
            fontSize: '20px',
            fontWeight: '700',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer'
          }}>
            Select File & Upload to Shelby
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#666', marginTop: '60px' 
}}>
          Built by Kakah4 • Shelby Testnet
        </p>
      </div>
    </div>
  );
}

export default App;
