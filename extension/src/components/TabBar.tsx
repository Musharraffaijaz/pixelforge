import type { Tab } from '../App'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'convert',  label: 'Convert',  icon: '🔄' },
  { id: 'compress', label: 'Compress', icon: '🗜️' },
  { id: 'removebg', label: 'Remove BG', icon: '✂️' },
  { id: 'batch',    label: 'Batch',    icon: '📦' },
]

interface TabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div style={{
      display: 'flex',
      padding: '8px 12px 0',
      gap: 4,
      borderBottom: '1px solid var(--border)',
      position: 'relative',
      zIndex: 1,
    }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              padding: '7px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.15s ease',
              marginBottom: -1,
            }}
          >
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
