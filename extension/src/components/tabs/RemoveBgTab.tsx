import { useState, useEffect } from 'react'
import DropZone from '../DropZone'
import { removeBackground, downloadBlob } from '../../api'

interface Props { backendOnline: boolean }

export default function RemoveBgTab({ backendOnline }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [alphaMatting, setAlphaMatting] = useState(true)
  const [postProcess, setPostProcess] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
      setResult(null); setResultUrl(null); setShowResult(false)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  const handleRemove = async () => {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const blob = await removeBackground(file, alphaMatting, postProcess)
      const url = URL.createObjectURL(blob)
      setResult(blob)
      setResultUrl(url)
      setShowResult(true)
    } catch (e: any) {
      setError(e.message || 'Background removal failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    const filename = file.name.replace(/\.[^.]+$/, '') + '_no_bg.png'
    downloadBlob(result, filename)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Remove Background</h2>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          AI-powered background removal using U2Net model — fully offline
        </p>
      </div>

      <DropZone
        file={file}
        onFile={setFile}
        accept="image/*"
        sublabel="PNG, JPG, JPEG — outputs transparent PNG"
      />

      {file && preview && (
        <>
          {/* Preview area */}
          <div className="card" style={{ padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Preview</span>
              {resultUrl && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setShowResult(false)}
                    style={{
                      padding: '3px 8px', borderRadius: 6, border: 'none', fontSize: 11,
                      background: !showResult ? 'rgba(99,102,241,0.2)' : 'var(--surface2)',
                      color: !showResult ? '#818cf8' : 'var(--text-muted)', cursor: 'pointer',
                    }}
                  >Original</button>
                  <button
                    onClick={() => setShowResult(true)}
                    style={{
                      padding: '3px 8px', borderRadius: 6, border: 'none', fontSize: 11,
                      background: showResult ? 'rgba(99,102,241,0.2)' : 'var(--surface2)',
                      color: showResult ? '#818cf8' : 'var(--text-muted)', cursor: 'pointer',
                    }}
                  >Result</button>
                </div>
              )}
            </div>

            <div style={{
              borderRadius: 8,
              overflow: 'hidden',
              height: 140,
              background: showResult && resultUrl
                ? 'repeating-conic-gradient(#1e1e3a 0% 25%, #252550 0% 50%) 0 0 / 20px 20px'
                : 'var(--surface2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {loading ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, animation: 'spin-slow 2s linear infinite', display: 'inline-block' }}>✨</div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>AI is processing…</p>
                </div>
              ) : (
                <img
                  src={showResult && resultUrl ? resultUrl : preview}
                  style={{ maxHeight: 138, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }}
                  alt="preview"
                />
              )}
            </div>
          </div>

          {/* Options */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>AI Options</label>

            {[
              { label: 'Alpha Matting', desc: 'Better edge detection for hair/fur', val: alphaMatting, set: setAlphaMatting },
              { label: 'Post Processing', desc: 'Clean up mask artifacts', val: postProcess, set: setPostProcess },
            ].map((opt) => (
              <div
                key={opt.label}
                onClick={() => opt.set(!opt.val)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 10px', borderRadius: 8, background: 'var(--surface2)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{opt.desc}</div>
                </div>
                {/* Toggle switch */}
                <div style={{
                  width: 36, height: 20, borderRadius: 10, position: 'relative',
                  background: opt.val ? 'var(--primary)' : 'var(--border)',
                  transition: 'background 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: opt.val ? 18 : 2,
                    width: 16, height: 16, borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {!backendOnline && (
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12, color: '#f87171',
            }}>⚠️ Backend server is offline.</div>
          )}

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!backendOnline || loading}
            onClick={handleRemove}
          >
            {loading ? (
              <><span style={{ display: 'inline-block', animation: 'spin-slow 2s linear infinite' }}>✨</span> AI Processing…</>
            ) : (
              <>✂️ Remove Background</>
            )}
          </button>

          {loading && (
            <div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '45%' }} /></div>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                First run downloads the AI model (~170 MB)
              </p>
            </div>
          )}

          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12, color: '#f87171',
            }}>❌ {error}</div>
          )}

          {result && resultUrl && (
            <div className="card" style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#34d399' }}>Background removed!</span>
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleDownload}
              >
                ⬇️ Download PNG (transparent)
              </button>
            </div>
          )}
        </>
      )}

      {!file && (
        <div style={{
          padding: '14px', borderRadius: 10,
          background: 'rgba(99,102,241,0.05)',
          border: '1px solid rgba(99,102,241,0.1)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#818cf8' }}>🤖 Powered by U2Net AI</p>
          <ul style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <li>Runs 100% offline on your machine</li>
            <li>High-quality edge detection</li>
            <li>Alpha matting for hair & fine details</li>
            <li>Outputs transparent PNG</li>
          </ul>
        </div>
      )}
    </div>
  )
}
