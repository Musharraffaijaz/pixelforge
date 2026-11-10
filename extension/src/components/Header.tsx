import { useState, useEffect } from 'react'

export default function Header() {
  const [isTab, setIsTab] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIsTab(params.get('mode') === 'tab' || window.innerWidth > 600)
  }, [])

  const handleToggleView = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      if (isTab) {
        chrome.runtime.sendMessage({ type: 'OPEN_WINDOW' })
      } else {
        chrome.runtime.sendMessage({ type: 'OPEN_TAB' })
      }
    }
  }

  return (
    <div style={{
      padding: '12px 16px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      borderBottom: '1px solid var(--border)',
      position: 'relative',
      zIndex: 1,
      background: 'var(--surface)',
    }}>
      {/* Logo */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        flexShrink: 0,
        boxShadow: '0 0 15px rgba(99,102,241,0.4)',
      }}>
        🎨
      </div>

      <div>
        <h1 className="gradient-text" style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>
          PixelForge
        </h1>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
          Image & PDF Toolkit
        </p>
      </div>

      {/* Actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {typeof chrome !== 'undefined' && chrome.runtime && (
          <button
            onClick={handleToggleView}
            title={isTab ? 'Open as compact window' : 'Open in full browser tab'}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#818cf8'
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            {isTab ? '❐ Window' : '↗ Tab'}
          </button>
        )}
        <span className="badge badge-purple">v1.0</span>
      </div>
    </div>
  )
}
