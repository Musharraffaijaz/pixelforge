import { useState, useEffect } from 'react'
import { checkBackendHealth } from './api'
import Header from './components/Header'
import TabBar from './components/TabBar'
import ConvertTab from './components/tabs/ConvertTab'
import CompressTab from './components/tabs/CompressTab'
import RemoveBgTab from './components/tabs/RemoveBgTab'
import BatchTab from './components/tabs/BatchTab'
import ServerStatus from './components/ServerStatus'

export type Tab = 'convert' | 'compress' | 'removebg' | 'batch'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('convert')
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      const online = await checkBackendHealth()
      setBackendOnline(online)
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [])

  // Prevent browser from navigating away if a file is dropped outside the drop zone
  useEffect(() => {
    const preventDragDropNav = (e: DragEvent) => {
      e.preventDefault()
    }
    window.addEventListener('dragover', preventDragDropNav)
    window.addEventListener('drop', preventDragDropNav)
    return () => {
      window.removeEventListener('dragover', preventDragDropNav)
      window.removeEventListener('drop', preventDragDropNav)
    }
  }, [])

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
      }}
    >
      {/* Background gradient orbs */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 200, height: 200,
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, left: -40,
        width: 160, height: 160,
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <Header />
      <ServerStatus online={backendOnline} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 14px 14px',
      }}>
        {activeTab === 'convert' && <ConvertTab backendOnline={!!backendOnline} />}
        {activeTab === 'compress' && <CompressTab backendOnline={!!backendOnline} />}
        {activeTab === 'removebg' && <RemoveBgTab backendOnline={!!backendOnline} />}
        {activeTab === 'batch' && <BatchTab backendOnline={!!backendOnline} />}
      </div>
    </div>
  )
}
