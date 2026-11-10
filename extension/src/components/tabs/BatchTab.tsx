import { useState, useRef } from 'react'
import { convertImage, compressImage, compressPDF, removeBackground, downloadBlob, formatBytes } from '../../api'

interface Props { backendOnline: boolean }

type Operation = 'convert' | 'compress' | 'removebg'
type Status = 'pending' | 'processing' | 'done' | 'error'

interface BatchItem {
  id: string
  file: File
  status: Status
  error?: string
  result?: Blob
}

export default function BatchTab({ backendOnline }: Props) {
  const [items, setItems] = useState<BatchItem[]>([])
  const [operation, setOperation] = useState<Operation>('compress')
  const [format, setFormat] = useState('png')
  const [quality, setQuality] = useState(75)
  const [running, setRunning] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const newItems: BatchItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      status: 'pending',
    }))
    setItems((prev) => [...prev, ...newItems])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateItem = (id: string, patch: Partial<BatchItem>) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i))
  }

  const processOne = async (item: BatchItem): Promise<void> => {
    updateItem(item.id, { status: 'processing' })
    try {
      let blob: Blob
      const isPdf = item.file.type.includes('pdf') || item.file.name.toLowerCase().endsWith('.pdf')
      if (operation === 'convert') {
        blob = await convertImage(item.file, format, quality)
      } else if (operation === 'compress') {
        if (isPdf) {
          blob = await compressPDF(item.file, 2)
        } else {
          blob = await compressImage(item.file, quality)
        }
      } else {
        blob = await removeBackground(item.file, true, true)
      }
      updateItem(item.id, { status: 'done', result: blob })
    } catch (e: any) {
      updateItem(item.id, { status: 'error', error: e.message || 'Failed' })
    }
  }

  const handleRunAll = async () => {
    const pending = items.filter((i) => i.status === 'pending' || i.status === 'error')
    if (pending.length === 0) return
    setRunning(true)
    for (const item of pending) {
      await processOne(item)
    }
    setRunning(false)
  }

  const downloadAll = () => {
    items.filter((i) => i.status === 'done' && i.result).forEach((i, idx) => {
      const isPdf = i.file.type.includes('pdf') || i.file.name.toLowerCase().endsWith('.pdf')
      const ext = operation === 'convert' ? format : operation === 'compress' ? (isPdf ? 'pdf' : 'webp') : 'png'
      const suffix = operation === 'removebg' ? '_no_bg' : operation === 'compress' ? '_compressed' : ''
      const filename = i.file.name.replace(/\.[^.]+$/, '') + `${suffix}.${ext}`
      setTimeout(() => {
        downloadBlob(i.result!, filename)
      }, idx * 150)
    })
  }

  const doneCount = items.filter((i) => i.status === 'done').length
  const errorCount = items.filter((i) => i.status === 'error').length

  const STATUS_ICON: Record<Status, string> = {
    pending: '⏳',
    processing: '⚙️',
    done: '✅',
    error: '❌',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Batch Processing</h2>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Process multiple files at once
        </p>
      </div>

      {/* Operation selector */}
      <div style={{ display: 'flex', gap: 5 }}>
        {([['convert', '🔄 Convert'], ['compress', '🗜️ Compress'], ['removebg', '✂️ Remove BG']] as [Operation, string][]).map(([op, label]) => (
          <button
            key={op}
            onClick={() => setOperation(op)}
            style={{
              flex: 1, padding: '7px 4px', borderRadius: 8,
              border: operation === op ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--border)',
              background: operation === op ? 'rgba(99,102,241,0.15)' : 'var(--surface2)',
              color: operation === op ? '#818cf8' : 'var(--text-muted)',
              fontSize: 11, fontWeight: operation === op ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Options */}
      {operation !== 'removebg' && (
        <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {operation === 'convert' && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ width: '100%', marginTop: 4 }}>
                {['png', 'jpg', 'webp'].map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quality</label>
              <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 600 }}>{quality}%</span>
            </div>
            <input
              type="range" min={1} max={100}
              value={quality} onChange={(e) => setQuality(Number(e.target.value))}
              style={{ marginTop: 6 }}
            />
          </div>
        </div>
      )}

      {/* File picker / drop area */}
      {items.length === 0 ? (
        <div
          className={`dropzone ${isDragOver ? 'active' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(false)
            addFiles(e.dataTransfer.files)
          }}
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: isDragOver ? 'var(--primary)' : 'var(--border)',
            backgroundColor: isDragOver ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: 44, height: 44,
            borderRadius: 12,
            background: isDragOver ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            📂
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: isDragOver ? '#818cf8' : 'var(--text)' }}>
              {isDragOver ? 'Drop files to add' : 'Drop multiple files here or click to browse'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {operation === 'removebg' ? 'Select multiple images' : 'Images (PNG, JPG, WEBP) & PDFs'}
            </p>
          </div>
        </div>
      ) : (
        <button
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
          onClick={() => inputRef.current?.click()}
        >
          ➕ Add More Files
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={operation === 'removebg' ? 'image/*' : 'image/*,application/pdf'}
        style={{ display: 'none' }}
        onClick={(e) => {
          e.stopPropagation()
          ;(e.target as HTMLInputElement).value = ''
        }}
        onChange={(e) => addFiles(e.target.files)}
      />

      {/* File list */}
      {items.length > 0 && (
        <div style={{
          maxHeight: 180,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 8,
                background: item.status === 'done' ? 'rgba(16,185,129,0.06)' :
                  item.status === 'error' ? 'rgba(239,68,68,0.06)' : 'var(--surface2)',
                border: item.status === 'done' ? '1px solid rgba(16,185,129,0.15)' :
                  item.status === 'error' ? '1px solid rgba(239,68,68,0.15)' : '1px solid transparent',
              }}
            >
              <span style={{
                fontSize: 14,
                animation: item.status === 'processing' ? 'spin-slow 1.5s linear infinite' : 'none',
                display: 'inline-block',
              }}>
                {STATUS_ICON[item.status]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 12, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.file.name}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {formatBytes(item.file.size)}
                  {item.status === 'done' && item.result && (
                    <span style={{ color: '#34d399', marginLeft: 6 }}>
                      → {formatBytes(item.result.size)}
                    </span>
                  )}
                  {item.error && <span style={{ color: '#f87171', marginLeft: 6 }}>{item.error}</span>}
                </p>
              </div>
              {!running && item.status !== 'processing' && (
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14,
                    padding: '0 2px', flexShrink: 0,
                  }}
                >×</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats bar */}
      {items.length > 0 && (
        <div style={{
          display: 'flex', gap: 8,
          padding: '7px 10px', borderRadius: 8, background: 'var(--surface2)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Total: <strong style={{ color: 'var(--text)' }}>{items.length}</strong>
          </span>
          <span style={{ fontSize: 11, color: '#34d399' }}>
            ✅ {doneCount}
          </span>
          {errorCount > 0 && (
            <span style={{ fontSize: 11, color: '#f87171' }}>❌ {errorCount}</span>
          )}
          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>
            {items.filter((i) => i.status === 'pending').length} pending
          </span>
        </div>
      )}

      {!backendOnline && items.length > 0 && (
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          fontSize: 12, color: '#f87171',
        }}>⚠️ Backend server is offline.</div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn-primary"
          style={{ flex: 2, justifyContent: 'center' }}
          disabled={items.length === 0 || !backendOnline || running}
          onClick={handleRunAll}
        >
          {running ? (
            <><span style={{ display: 'inline-block', animation: 'spin-slow 1.5s linear infinite' }}>⚙️</span> Processing…</>
          ) : (
            <>▶ Run All ({items.filter((i) => i.status === 'pending' || i.status === 'error').length})</>
          )}
        </button>

        {doneCount > 0 && (
          <button
            className="btn-ghost"
            style={{ flex: 1 }}
            onClick={downloadAll}
          >
            ⬇️ Download All
          </button>
        )}
      </div>
    </div>
  )
}
