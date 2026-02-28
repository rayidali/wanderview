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
      <h2>API Keys (Optional)</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '16px' }}>
        The game works without keys using mock data. Add keys for the full AI experience.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '4px' }}>
            Mistral AI API Key
          </label>
          <input
            type="password"
            value={mistralKey}
            onChange={(e) => setMistralKey(e.target.value)}
            placeholder="Enter Mistral API key..."
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '4px' }}>
            Google Maps API Key
          </label>
          <input
            type="password"
            value={googleKey}
            onChange={(e) => setGoogleKey(e.target.value)}
            placeholder="Enter Google API key..."
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
        </div>

        <button
          type="submit"
          className="mode-option"
          style={{ background: 'rgba(255,107,53,0.2)', borderColor: 'rgba(255,107,53,0.5)' }}
        >
          <span className="mode-name">Start with API Keys</span>
          <span className="mode-desc">Full AI game master + real place data</span>
        </button>

        <button
          type="button"
          className="mode-option"
          onClick={handleSkip}
        >
          <span className="mode-name">Play without Keys</span>
          <span className="mode-desc">Demo mode with mock narration and places</span>
        </button>
      </form>
    </div>
  );
}
