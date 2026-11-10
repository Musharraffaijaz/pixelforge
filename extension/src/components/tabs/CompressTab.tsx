import { useState } from 'react'
import DropZone from '../DropZone'
import ResultCard from '../ResultCard'
import { compressImage, compressPDF, downloadBlob } from '../../api'

interface Props { backendOnline: boolean }

type Mode = 'image' | 'pdf'

const PDF_LEVELS = [
  { value: 1, label: 'Low', desc: 'Minimal compression, best quality' },
  { value: 2, label: 'Medium', desc: 'Balanced size & quality' },
  { value: 3, label: 'High', desc: 'Maximum compression' },
]

export default function CompressTab({ backendOnline }: Props) {
  const [mode, setMode] = useState<Mode>('image')
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(75)
  const [pdfLevel, setPdfLevel] = useState(2)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompress = async () => {
    if (!file) return
    setLoading(true); setError(null); setResult(null)
    try {
      let blob: Blob
      if (mode === 'image') {
        blob = await compressImage(file, quality)
      } else {
        blob = await compressPDF(file, pdfLevel)
      }
      setResult(blob)
    } catch (e: any) {
      setError(e.message || 'Compression failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result || !file) return
    const ext = mode === 'pdf' ? 'pdf' : 'webp'
    const filename = file.name.replace(/\.[^.]+$/, '') + `_compressed.${ext}`
    downloadBlob(result, filename)
  }

  const handleModeChange = (m: Mode) => {
    setMode(m); setFile(null); setResult(null); setError(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Compress Files</h2>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Reduce file size without sacrificing quality
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{
        display: 'flex', background: 'var(--surface2)', borderRadius: 10,
        padding: 3, gap: 3,
      }}>
        {(['image', 'pdf'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none',
              background: mode === m ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              color: mode === m ? 'white' : 'var(--text-muted)',
              fontSize: 13, fontWeight: mode === m ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            {m === 'image' ? '🖼️' : '📄'} {m === 'image' ? 'Image' : 'PDF'}
          </button>
        ))}
      </div>

      <DropZone
        file={file}
        onFile={setFile}
        accept={mode === 'image' ? 'image/*' : 'application/pdf'}
        sublabel={mode === 'image' ? 'PNG, JPG, JPEG, WEBP' : 'PDF files only'}
      />

      {file && (
        <>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mode === 'image' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Compression Quality</label>
                  <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 600 }}>{quality}%</span>
                </div>
                <input
                  type="range" min={1} max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Max Compression</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Best Quality</span>
                </div>
                <div style={{
                  marginTop: 10, padding: '6px 10px', borderRadius: 6,
                  background: 'rgba(99,102,241,0.08)', fontSize: 11, color: 'var(--text-muted)',
                }}>
                  💡 Output will be in WebP format for best compression ratio
                </div>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
                  Compression Level
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {PDF_LEVELS.map((lvl) => (
                    <button
                      key={lvl.value}
                      onClick={() => setPdfLevel(lvl.value)}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: 'none',
                        background: pdfLevel === lvl.value ? 'rgba(99,102,241,0.15)' : 'var(--surface2)',
                        outline: pdfLevel === lvl.value ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                        color: 'var(--text)', cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        textAlign: 'left', transition: 'all 0.15s',
                      } as any}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: pdfLevel === lvl.value ? 600 : 400 }}>
                          {lvl.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lvl.desc}</div>
                      </div>
                      {pdfLevel === lvl.value && (
                        <span style={{ color: '#818cf8', fontSize: 16 }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!backendOnline && (
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12, color: '#f87171',
            }}>
              ⚠️ Backend server is offline.
            </div>
          )}

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!backendOnline || loading}
            onClick={handleCompress}
          >
            {loading ? (
              <><span className="animate-spin-slow" style={{ display: 'inline-block' }}>⚙️</span> Compressing…</>
            ) : (
              <>🗜️ Compress {mode === 'image' ? 'Image' : 'PDF'}</>
            )}
          </button>

          {loading && (
            <div><div className="progress-bar"><div className="progress-fill" style={{ width: '60%' }} /></div></div>
          )}

          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12, color: '#f87171',
            }}>❌ {error}</div>
          )}

          {result && (
            <ResultCard
              originalSize={file.size}
              resultSize={result.size}
              resultBlob={result}
              filename={file.name.replace(/\.[^.]+$/, '') + `_compressed.${mode === 'pdf' ? 'pdf' : 'webp'}`}
              onDownload={handleDownload}
            />
          )}
        </>
      )}
    </div>
  )
}
