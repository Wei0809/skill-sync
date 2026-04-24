import { useState } from 'react'
import { api } from '../api'

interface Props {
  value: string
  onSaved: () => void
}

export default function RepoSetting({ value, onSaved }: Props) {
  const [path, setPath] = useState(value)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateRepo(path)
      onSaved()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700 shrink-0">中心仓库</label>
      <input
        type="text"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="D:/code/central-skills"
        className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
      />
      <button
        onClick={handleSave}
        disabled={saving || path === value}
        className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  )
}
