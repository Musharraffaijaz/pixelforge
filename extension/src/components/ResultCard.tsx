interface ResultCardProps {
  originalSize: number
  resultSize: number
  resultBlob: Blob
  filename: string
  onDownload: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function ResultCard({ originalSize, resultSize, filename, onDownload }: ResultCardProps) {
  const saved = originalSize - resultSize
  const pct = Math.round((saved / originalSize) * 100)
  const isSmaller = saved > 0

  return (
    <div className="card" style={{
      background: 'rgba(16, 185, 129, 0.05)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#34d399' }}>Done! Ready to download</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{
          flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Original</p>
          <p style={{ fontSize: 14, fontWeight: 700 }}>{formatBytes(originalSize)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>→</div>
        <div style={{
          flex: 1, background: isSmaller ? 'rgba(16,185,129,0.1)' : 'var(--surface2)',
          border: isSmaller ? '1px solid rgba(16,185,129,0.25)' : 'none',
          borderRadius: 8, padding: '8px 10px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Result</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: isSmaller ? '#34d399' : 'var(--text)' }}>
            {formatBytes(resultSize)}
          </p>
        </div>
      </div>

      {isSmaller && (
        <p style={{ fontSize: 11, color: '#34d399', marginBottom: 10, textAlign: 'center' }}>
          🎉 Saved {formatBytes(saved)} ({pct}% smaller)
        </p>
      )}

      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onDownload}>
        ⬇️ Download {filename}
      </button>
    </div>
  )
}
