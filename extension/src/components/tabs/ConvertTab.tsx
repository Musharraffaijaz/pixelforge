import { useState } from 'react'
import DropZone from '../DropZone'
import ResultCard from '../ResultCard'
import { convertImage, downloadBlob } from '../../api'

const FORMATS = ['PNG', 'JPG', 'JPEG', 'WEBP']

interface Props { backendOnline: boolean }

export default function ConvertTab({ backendOnline }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState('PNG')
  const [quality, setQuality] = useState(92)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const blob = await convertImage(file, format.toLowerCase(), quality)
      setResult(blob)
    } catch (e: any) {
      setError(e.message || 'Conversion failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    const ext = format.toLowerCase() === 'jpeg' ? 'jpg' : format.toLowerCase()
    const filename = file.name.replace(/\.[^.]+$/, '') + `.${ext}`
    downloadBlob(result, filename)
  }

  const needsQuality = ['JPG', 'JPEG', 'WEBP'].includes(format)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Convert Image</h2>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Convert between PNG, JPG, JPEG, and WebP formats
        </p>
      </div>

      <DropZone
        file={file}
        onFile={setFile}
        accept="image/*"
        sublabel="PNG, JPG, JPEG, WEBP supported"
      />

      {file && (
        <>
          {/* Format selector */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              Output Format
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: format === f ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: format === f ? 'rgba(99,102,241,0.15)' : 'var(--surface2)',
                    color: format === f ? '#818cf8' : 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: format === f ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {needsQuality && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quality</label>
                  <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 600 }}>{quality}%</span>
                </div>
                <input
                  type="range"
                  min={1} max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Smaller</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Higher Quality</span>
                </div>
              </div>
            )}
          </div>

          {!backendOnline && (
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12, color: '#f87171',
            }}>
              ⚠️ Backend server is offline. Start <code>backend/start.sh</code> first.
            </div>
          )}

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!backendOnline || loading}
            onClick={handleConvert}
          >
            {loading ? (
              <>
                <span className="animate-spin-slow" style={{ display: 'inline-block' }}>⚙️</span>
                Converting…
              </>
            ) : (
              <>🔄 Convert to {format}</>
            )}
          </button>

          {loading && (
            <div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '70%' }} /></div>
            </div>
          )}

          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12, color: '#f87171',
            }}>
              ❌ {error}
            </div>
          )}

          {result && (
            <ResultCard
              originalSize={file.size}
              resultSize={result.size}
              resultBlob={result}
              filename={file.name.replace(/\.[^.]+$/, '') + `.${format.toLowerCase() === 'jpeg' ? 'jpg' : format.toLowerCase()}`}
              onDownload={handleDownload}
            />
          )}
        </>
      )}
    </div>
  )
}
