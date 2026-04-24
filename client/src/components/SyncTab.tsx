import { useState } from 'react'
import type { ScanItem, Editor, SyncResult } from '../types'
import { api } from '../api'

type TabType = 'rules' | 'skills'

interface Props {
  type: TabType
  items: ScanItem[]
  editors: Editor[]
  onDone: () => void
}

export default function SyncTab({ type, items, editors, onDone }: Props) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedEditors, setSelectedEditors] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  const enabledEditors = editors.filter((e) => e.enabled)
  const label = type === 'rules' ? 'Rules' : 'Skills'
  const dirKey = type === 'rules' ? 'rulesDir' : 'skillsDir'

  const toggleItem = (name: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const toggleEditor = (id: string) => {
    setSelectedEditors((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAllItems = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map((i) => i.name)))
    }
  }

  const selectAllEditors = () => {
    if (selectedEditors.size === enabledEditors.length) {
      setSelectedEditors(new Set())
    } else {
      setSelectedEditors(new Set(enabledEditors.map((e) => e.id)))
    }
  }

  const doSync = async (action: 'sync' | 'unsync') => {
    setLoading(true)
    setResult(null)
    try {
      const body = {
        editorIds: Array.from(selectedEditors),
        rules: type === 'rules' ? Array.from(selectedItems) : [],
        skills: type === 'skills' ? Array.from(selectedItems) : [],
      }
      const res = action === 'sync' ? await api.sync(body) : await api.unsync(body)
      setResult(res)
      onDone()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const hasConflicts = result && Object.values(result.results).some((r) => {
    const items = type === 'rules' ? r.rules : r.skills
    return items?.some((i) => i.status === 'conflict')
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        {/* Left: items */}
        <div className="flex-1 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
            <button onClick={selectAllItems} className="text-xs text-indigo-600 hover:text-indigo-800">
              {selectedItems.size === items.length ? '取消全选' : '全选'}
            </button>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400">暂无{label}</p>
          ) : (
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li key={item.name}>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.name)}
                      onChange={() => toggleItem(item.name)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-mono text-xs">{item.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: editors */}
        <div className="flex-1 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">编辑器</h3>
            <button onClick={selectAllEditors} className="text-xs text-indigo-600 hover:text-indigo-800">
              {selectedEditors.size === enabledEditors.length ? '取消全选' : '全选'}
            </button>
          </div>
          {enabledEditors.length === 0 ? (
            <p className="text-sm text-gray-400">暂无编辑器</p>
          ) : (
            <ul className="space-y-1.5">
              {enabledEditors.map((editor) => (
                <li key={editor.id}>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEditors.has(editor.id)}
                      onChange={() => toggleEditor(editor.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{editor.name}</span>
                    {!editor[dirKey] && (
                      <span className="text-xs text-amber-500">(未配置路径)</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => doSync('sync')}
          disabled={loading || selectedItems.size === 0 || selectedEditors.size === 0}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '执行中...' : '同步选中'}
        </button>
        <button
          onClick={() => doSync('unsync')}
          disabled={loading || selectedItems.size === 0 || selectedEditors.size === 0}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '执行中...' : '取消同步'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-md p-3 text-sm ${hasConflicts ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
          {Object.entries(result.results).map(([editorId, r]) => {
            const items = type === 'rules' ? r.rules : r.skills
            if (!items) return null
            return (
              <div key={editorId} className="mb-1 last:mb-0">
                <span className="font-medium">{editorId}</span>：
                {items.map((i) => (
                  <span key={i.name} className="ml-2">
                    {i.name}({i.status === 'ok' ? '✅' : i.status === 'conflict' ? '⚠️' : i.status === 'skipped' ? '⏭️' : '❌'})
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
