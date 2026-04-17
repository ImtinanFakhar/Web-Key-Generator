import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, ShieldCheck, LayoutDashboard, History, PlusCircle, Trash2, Search, ArrowUpRight, Download } from 'lucide-react';

const SALT_AG = 'TE-ANALYSE-GENERATOR-FIXED-SALT-2024';
const SALT_AVS = 'TE-ANALYSE-VIRTUAL-FIXED-SALT-2024';
const SALT_BUNDLE = 'TE-ANALYSE-BUNDLE-FIXED-SALT-2024';

function App() {
  const [activeTab, setActiveTab] = useState('generator');
  const [computerId, setComputerId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('AG');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const updateCloud = async (newHistory) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHistory)
      });
    } catch(e) {
      console.error('Failed to sync with KV cloud', e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initHistory = async () => {
      try {
        const res = await fetch('/api/history');
        let cloudHistory = [];
        if (res.ok) {
          cloudHistory = await res.json();
        }

        const localData = localStorage.getItem('te_keygen_history');
        if (localData) {
          const parsedLocal = JSON.parse(localData);
          if (parsedLocal.length > 0) {
            const merged = [...parsedLocal, ...cloudHistory];
            const uniqueMap = new Map();
            merged.forEach(item => uniqueMap.set(item.computerId, item));
            const finalMerged = Array.from(uniqueMap.values()).sort((a,b) => b.id - a.id);
            
            if (isMounted) setHistory(finalMerged.slice(0, 150));
            await updateCloud(finalMerged.slice(0, 150));
            
            localStorage.removeItem('te_keygen_history');
            
            if (isMounted) setIsLoading(false);
            return;
          }
        }

        if (isMounted) {
          setHistory(cloudHistory);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('KV Fetch Error:', err);
        if (isMounted) setIsLoading(false);
      }
    };
    initHistory();
    return () => { isMounted = false; };
  }, []);

  const generateKey = async () => {
    if (!computerId.trim()) return;

    const cleanId = computerId.trim().toUpperCase();
    
    let activeSalt = SALT_AG;
    if (selectedProduct === 'AVS') activeSalt = SALT_AVS;
    if (selectedProduct === 'BUNDLE') activeSalt = SALT_BUNDLE;

    const encoder = new TextEncoder();
    const data = encoder.encode(cleanId + activeSalt);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const key = hashHex.substring(0, 16).toUpperCase();
    setResult(key);
    setCopied(false);

    // Save to history
    const newEntry = {
      id: Date.now(),
      computerId: cleanId,
      key: key,
      product: selectedProduct,
      date: new Date().toLocaleString('de-DE')
    };

    // Avoid duplicates in history
    const newArr = [newEntry, ...history.filter(h => h.computerId !== cleanId)].slice(0, 150);
    setHistory(newArr);
    updateCloud(newArr);
  };

  const downloadHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `te_keygen_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteEntry = (id) => {
    const newArr = history.filter(entry => entry.id !== id);
    setHistory(newArr);
    updateCloud(newArr);
  };

  const filteredHistory = history.filter(h =>
    h.computerId.includes(searchTerm.toUpperCase()) || h.key.includes(searchTerm.toUpperCase())
  );

  return (
    <div className="app-container">
      <div className="glass-panel">
        <div className="title-section">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <ShieldCheck size={64} color="var(--accent-color)" strokeWidth={1.5} />
          </div>
          <h1 className="title-gradient">TE KEY GENERATOR</h1>
          <p className="subtitle">Admin License Portal</p>
        </div>

        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
            onClick={() => setActiveTab('generator')}
          >
            <PlusCircle size={18} /> GENERATOR
          </button>
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} /> DASHBOARD
          </button>
        </div>

        {activeTab === 'generator' ? (
          <div className="tab-content animate-fade-in">
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

            <div className="input-group">
              <label>Produkttyp Auswählen</label>
              <div className="product-selector">
                <label className={`product-option ${selectedProduct === 'AG' ? 'selected' : ''}`}>
                  <input type="radio" value="AG" checked={selectedProduct === 'AG'} onChange={(e) => setSelectedProduct(e.target.value)} />
                  AG Einzel-Lizenz
                </label>
                <label className={`product-option ${selectedProduct === 'AVS' ? 'selected' : ''}`}>
                  <input type="radio" value="AVS" checked={selectedProduct === 'AVS'} onChange={(e) => setSelectedProduct(e.target.value)} />
                  AVS Einzel-Lizenz
                </label>
                <label className={`product-option ${selectedProduct === 'BUNDLE' ? 'selected' : ''}`}>
                  <input type="radio" value="BUNDLE" checked={selectedProduct === 'BUNDLE'} onChange={(e) => setSelectedProduct(e.target.value)} />
                  KOMPLETT (AG+AVS)
                </label>
              </div>
            </div>

            <button className="btn-generate" onClick={generateKey}>
              <Key size={18} />
              SCHLÜSSEL GENERIEREN
            </button>

            {result && (
              <div className="result-section">
                <div className="result-box" onClick={() => copyToClipboard(result)}>
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
        ) : (
          <div className="tab-content animate-fade-in">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Gesamt</div>
                <div className="stat-value">{history.length}</div>
              </div>
              <div className="stat-card" onClick={downloadHistory} style={{ cursor: 'pointer', border: '2px solid var(--accent-color)', background: 'rgba(88, 166, 255, 0.05)' }}>
                <div className="stat-label" style={{ color: 'var(--accent-color)' }}>Backup</div>
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Download size={24} />
                  <span style={{ fontSize: '1.2rem' }}>Download</span>
                </div>
              </div>
            </div>

            <div className="search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Suche nach ID oder Key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="history-list">
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Lade Cloud-Historie...
                </div>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map(entry => (
                  <div key={entry.id} className="history-item">
                    <div className="history-main">
                      <div className="history-id">
                        {entry.computerId}
                        {entry.product && <span style={{ marginLeft: '10px', fontSize: '0.9rem', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--accent-hover)', padding: '4px 10px', borderRadius: '6px' }}>{entry.product}</span>}
                      </div>
                      <div className="history-date">{entry.date}</div>
                    </div>
                    <div className="history-actions">
                      <button className="action-btn" onClick={() => copyToClipboard(entry.key)} title="Key kopieren">
                        <Copy size={14} />
                      </button>
                      <button className="action-btn delete" onClick={() => deleteEntry(entry.id)} title="Löschen">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="history-key-preview">{entry.key}</div>
                  </div>
                ))
              ) : (
                <p className="empty-msg">Keine Einträge gefunden</p>
              )}
            </div>
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
