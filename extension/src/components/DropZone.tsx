import { useState, useCallback, useRef } from 'react'
import { formatBytes } from '../api'

interface DropZoneProps {
  onFile: (file: File) => void
  accept?: string
  file?: File | null
  label?: string
  sublabel?: string
}

export default function DropZone({ onFile, accept, file, label, sublabel }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onFile(f)
  }

  return (
    <div
      className={`dropzone ${isDragOver ? 'active' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      style={{
        padding: file ? '12px' : '24px 16px',
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
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onClick={(e) => {
          e.stopPropagation()
          ;(e.target as HTMLInputElement).value = ''
        }}
        onChange={handleChange}
      />

      {file ? (
        <>
          <div style={{
            width: 36, height: 36,
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {file.type.includes('pdf') ? '📄' : '🖼️'}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              {file.name.length > 28 ? file.name.slice(0, 25) + '…' : file.name}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {formatBytes(file.size)} · Click or drop to change
            </p>
          </div>
        </>
      ) : (
        <>
          <div style={{
            width: 44, height: 44,
            borderRadius: 12,
            background: isDragOver ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            transition: 'transform 0.2s ease',
            transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
          }}>
            📂
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: isDragOver ? '#818cf8' : 'var(--text)' }}>
              {isDragOver ? 'Drop file to upload' : (label || 'Drop file here or click to browse')}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {sublabel || 'PNG, JPG, JPEG, WEBP supported'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
