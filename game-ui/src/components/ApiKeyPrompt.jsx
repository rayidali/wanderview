import React, { useState } from 'react';

export default function ApiKeyPrompt({ onSubmit }) {
  const [mistralKey, setMistralKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ mistralKey: mistralKey.trim(), googleKey: googleKey.trim() });
  };

  const handleSkip = () => {
    onSubmit({ mistralKey: '', googleKey: '' });
  };

  return (
    <div className="mode-selector interactive" style={{ minWidth: '420px' }}>
      <h2>WanderView Setup</h2>
      <p>API keys are optional. The game works without them using demo data.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px', textAlign: 'left' }}>
          <label>Mistral AI API Key</label>
          <input
            type="password"
            value={mistralKey}
            onChange={(e) => setMistralKey(e.target.value)}
            placeholder="Enter Mistral API key..."
          />
        </div>

        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <label>Google Maps API Key</label>
          <input
            type="password"
            value={googleKey}
            onChange={(e) => setGoogleKey(e.target.value)}
            placeholder="Enter Google API key..."
          />
        </div>

        <button
          type="submit"
          className="mode-option"
          style={{ background: 'var(--navy)', color: 'var(--white)', borderColor: 'var(--navy)' }}
        >
          <span className="mode-name" style={{ color: 'var(--white)' }}>Start with API Keys</span>
          <span className="mode-desc" style={{ color: 'rgba(255,255,255,0.6)' }}>Full AI game master + real place data</span>
        </button>

        <button
          type="button"
          className="mode-option"
          onClick={handleSkip}
        >
          <span className="mode-name">Play Demo Mode</span>
          <span className="mode-desc">Mock narration and places — no keys needed</span>
        </button>
      </form>
    </div>
  );
}
