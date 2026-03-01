import { useState, useEffect } from 'react'
import { PillButton } from './components/PillButton'
import { ReadOnlyBadge } from './components/ReadOnlyBadge'
import { Board } from './components/Board'
import { useTasks } from './useTasks'
import { dbAPI } from './api'

function App() {
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') === 'true');
  const [isLargeFont, setIsLargeFont] = useState(() => localStorage.getItem('isLargeFont') === 'true');
  const [dbStatus, setDbStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode.toString());
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('isLargeFont', isLargeFont.toString());
  }, [isLargeFont]);
  const tasksApi = useTasks();

  useEffect(() => {
    dbAPI.checkDb()
      .then((success) => {
        if (success) {
          setDbStatus('connected');
        } else {
          setDbStatus('error');
        }
      })
      .catch(() => setDbStatus('error'));
  }, []);

  if (dbStatus === 'loading') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh', width: '100%',
        alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--c-bg)', color: 'var(--c-title)'
      }}>
        <div style={{
          width: '40px', height: '40px', border: '4px solid var(--c-border)',
          borderTopColor: 'var(--c-btn-on)', borderRadius: '50%',
          animation: 'spin 1s linear infinite', marginBottom: '16px'
        }} />
        <h2 style={{ margin: 0, fontWeight: 600 }}>Connecting to MongoDB Atlas...</h2>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (dbStatus === 'error') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh', width: '100%',
        alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--c-bg)', color: 'var(--c-urgent-text)'
      }}>
        <h2 style={{ margin: '0 0 16px', fontWeight: 600 }}>Failed to connect to Database</h2>
        <p>Please check your internet connection or MongoDB Atlas settings.</p>
        <button onClick={() => window.location.reload()} style={{
          marginTop: '16px', padding: '8px 16px', backgroundColor: 'var(--c-btn-on)',
          color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
        }}>Retry</button>
      </div>
    );
  }

  return (
    <div className={isLargeFont ? 'font-xl' : ''} style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      {/* TOOLBAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '52px',
          backgroundColor: 'var(--c-toolbar)',
          padding: '0 20px',
          borderBottom: '1px solid var(--c-border)',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          zIndex: 10
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center' }}>
          {viewMode ? '📋 Task Flow — View Mode' : '⚡ Task Flow Manager'}
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {viewMode && (
            <PillButton isOn={isLargeFont} onToggle={() => setIsLargeFont(!isLargeFont)} text="A A" />
          )}

          {viewMode ? (
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <ReadOnlyBadge />
              <PillButton isOn={viewMode} onToggle={() => setViewMode(!viewMode)} text="👁 View Mode" />
            </div>
          ) : (
            <PillButton isOn={viewMode} onToggle={() => setViewMode(!viewMode)} text="👁 View Mode" />
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, padding: '10px' }}>
          <Board api={tasksApi} readOnly={viewMode} />
        </div>
      </div>
    </div>
  )
}

export default App
