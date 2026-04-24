import type { EditorSyncStatus } from '../types'

interface Props {
  data: EditorSyncStatus[]
}

type CellStatus = 'synced' | 'not-synced' | 'conflict'

function getCellStatus(item: { synced: boolean; targetPath: string | null }): CellStatus {
  if (item.synced) return 'synced'
  if (item.targetPath !== null) return 'conflict'
  return 'not-synced'
}

const statusIcon: Record<CellStatus, string> = {
  synced: '✅',
  'not-synced': '⬜',
  conflict: '⚠️',
}

export default function StatusTab({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400">暂无同步状态数据，请先配置中心仓库。</p>
  }

  // Collect all unique rule/skill names
  const ruleNames = [...new Set(data.flatMap((d) => d.rules.map((r) => r.name)))].sort()
  const skillNames = [...new Set(data.flatMap((d) => d.skills.map((s) => s.name)))].sort()
  const allNames = [...ruleNames, ...skillNames]
  const isRule = (name: string) => ruleNames.includes(name)

  // Build lookup: name → editorId → item
  const lookup = new Map<string, Map<string, { synced: boolean; targetPath: string | null }>>()
  for (const d of data) {
    for (const item of [...d.rules, ...d.skills]) {
      if (!lookup.has(item.name)) lookup.set(item.name, new Map())
      lookup.get(item.name)!.set(d.editor.id, item)
    }
  }

  const editors = data.map((d) => d.editor)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-600 sticky left-0 bg-gray-50">
              名称
            </th>
            {editors.map((e) => (
              <th key={e.id} className="py-2 px-3 font-medium text-gray-600 text-center whitespace-nowrap">
                {e.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allNames.map((name) => (
            <tr key={name} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3 font-mono text-xs text-gray-700 sticky left-0 bg-white">
                <span className="mr-1 text-gray-400">{isRule(name) ? '📄' : '📁'}</span>
                {name}
              </td>
              {editors.map((e) => {
                const item = lookup.get(name)?.get(e.id)
                const status = item ? getCellStatus(item) : 'not-synced'
                return (
                  <td key={e.id} className="py-2 px-3 text-center text-lg" title={`${name} → ${e.name}: ${status}`}>
                    {statusIcon[status]}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
