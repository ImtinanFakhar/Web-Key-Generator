import React, { useState } from 'react';
import { Key, Copy, Check, ShieldCheck } from 'lucide-react';

// !!! MUST MATCH main.cjs and key-gen.cjs !!!
const SECRET_PHOENIX_SALT = 'TE-ANALYSE-GENERATOR-FIXED-SALT-2024';

function App() {
  const [computerId, setComputerId] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const generateKey = async () => {
    if (!computerId.trim()) return;

    const cleanId = computerId.trim().toUpperCase();

    // Web Crypto SHA-256 logic (Deterministic replacement for Node's crypto)
    const encoder = new TextEncoder();
    const data = encoder.encode(cleanId + SECRET_PHOENIX_SALT);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const key = hashHex.substring(0, 16).toUpperCase();
    setResult(key);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app-container">
      <div className="glass-panel">
        <div className="title-section">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <ShieldCheck size={48} color="var(--accent-color)" strokeWidth={1.5} />
          </div>
          <h1 className="title-gradient">TE KEY GENERATOR</h1>
          <p className="subtitle">Admin License Portal</p>
        </div>

        <div className="input-group">
          <label>Computer-ID Eingeben</label>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="367B6EDF9A26"
              value={computerId}
              onChange={(e) => setComputerId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && generateKey()}
            />
          </div>
        </div>

        <button className="btn-generate" onClick={generateKey}>
          <Key size={18} />
          SCHLÜSSEL GENERIEREN
        </button>

        {result && (
          <div className="result-section">
            <div className="result-box" onClick={copyToClipboard}>
              <div className="result-label">LIZENZSCHLÜSSEL</div>
              <div className="result-value">{result}</div>
              <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                {copied ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} opacity={0.5} />}
              </div>
            </div>
            <p className="copy-hint">{copied ? 'In die Zwischenablage kopiert!' : 'Klicken zum Kopieren'}</p>
          </div>
        )}
      </div>

      <footer>
        &copy; {new Date().getFullYear()} Terra Energetic | Internes Admin-Tool
      </footer>
    </div>
  );
}

export default App;
