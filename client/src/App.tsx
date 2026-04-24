import { useState, useEffect, useCallback } from 'react'
import type { Config, ScanResult, EditorSyncStatus } from './types'
import { api } from './api'
import RepoSetting from './components/RepoSetting'
import SyncTab from './components/SyncTab'
import StatusTab from './components/StatusTab'
import EditorsTab from './components/EditorsTab'

type Tab = 'rules' | 'skills' | 'status' | 'editors'

const tabs: { key: Tab; label: string }[] = [
  { key: 'rules', label: 'Rules' },
  { key: 'skills', label: 'Skills' },
  { key: 'status', label: 'Status' },
  { key: 'editors', label: 'Editors' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('rules')
  const [config, setConfig] = useState<Config | null>(null)
  const [scan, setScan] = useState<ScanResult>({ rules: [], skills: [] })
  const [status, setStatus] = useState<EditorSyncStatus[]>([])

  const fetchConfig = useCallback(async () => {
    const c = await api.getConfig()
    setConfig(c)
  }, [])

  const fetchScan = useCallback(async () => {
    if (!config?.centralRepo) {
      setScan({ rules: [], skills: [] })
      return
    }
    const s = await api.scan()
    setScan(s)
  }, [config?.centralRepo])

  const fetchStatus = useCallback(async () => {
    if (!config?.centralRepo) {
      setStatus([])
      return
    }
    const s = await api.getStatus()
    setStatus(s)
  }, [config?.centralRepo])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  useEffect(() => {
    fetchScan()
    fetchStatus()
  }, [fetchScan, fetchStatus])

  const refreshAll = useCallback(() => {
    fetchConfig()
    fetchScan()
    fetchStatus()
  }, [fetchConfig, fetchScan, fetchStatus])

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        加载中...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Skill Sync</h1>
          <p className="text-sm text-gray-500 mt-0.5">中心仓库管理编码助手的 Rules & Skills，通过 symlink 同步到各编辑器</p>
        </div>

        {/* Repo Setting */}
        <div className="bg-white rounded-lg border p-4">
          <RepoSetting value={config.centralRepo} onSaved={refreshAll} />
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border p-5">
          {!config.centralRepo ? (
            <p className="text-sm text-gray-400 text-center py-8">请先设置中心仓库路径</p>
          ) : (
            <>
              {activeTab === 'rules' && (
                <SyncTab
                  type="rules"
                  items={scan.rules}
                  editors={config.editors}
                  onDone={refreshAll}
                />
              )}
              {activeTab === 'skills' && (
                <SyncTab
                  type="skills"
                  items={scan.skills}
                  editors={config.editors}
                  onDone={refreshAll}
                />
              )}
              {activeTab === 'status' && <StatusTab data={status} />}
              {activeTab === 'editors' && (
                <EditorsTab editors={config.editors} onRefresh={refreshAll} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
