interface ServerStatusProps {
  online: boolean | null
}

export default function ServerStatus({ online }: ServerStatusProps) {
  const isChecking = online === null
  const color = isChecking ? '#94a3b8' : online ? '#34d399' : '#f87171'
  const label = isChecking ? 'Connecting…' : online ? 'Backend Online' : 'Backend Offline'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 16px',
      background: online === false ? 'rgba(239,68,68,0.06)' : 'transparent',
      borderBottom: online === false ? '1px solid rgba(239,68,68,0.15)' : '1px solid transparent',
    }}>
      {/* Pulsing dot */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {online && (
          <div style={{
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            opacity: 0.4,
            animation: 'pulse-ring 1.5s ease-out infinite',
          }} />
        )}
        <div style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }} />
      </div>

      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>

      {online === false && (
        <span style={{ fontSize: 10, color: '#f87171', marginLeft: 4 }}>
          → Run <code style={{ background: 'rgba(248,113,113,0.1)', padding: '1px 4px', borderRadius: 3 }}>backend/start.sh</code>
        </span>
      )}
    </div>
  )
}
