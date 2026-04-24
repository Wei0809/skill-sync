import { useState } from 'react'
import type { Editor } from '../types'
import { api } from '../api'

interface Props {
  editors: Editor[]
  onRefresh: () => void
}

export default function EditorsTab({ editors, onRefresh }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Editor>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', rulesDir: '', skillsDir: '' })
  const [loading, setLoading] = useState(false)

  const startEdit = (editor: Editor) => {
    setEditing(editor.id)
    setForm({ name: editor.name, rulesDir: editor.rulesDir, skillsDir: editor.skillsDir, enabled: editor.enabled })
  }

  const cancelEdit = () => {
    setEditing(null)
    setForm({})
  }

  const saveEdit = async (id: string) => {
    setLoading(true)
    try {
      await api.updateEditor(id, form)
      setEditing(null)
      setForm({})
      onRefresh()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此编辑器？')) return
    setLoading(true)
    try {
      await api.deleteEditor(id)
      onRefresh()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!addForm.name.trim()) return
    setLoading(true)
    try {
      await api.addEditor(addForm)
      setShowAdd(false)
      setAddForm({ name: '', rulesDir: '', skillsDir: '' })
      onRefresh()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {editors.map((editor) => (
        <div key={editor.id} className="border rounded-lg p-4">
          {editing === editor.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">名称</label>
                  <input
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enabled ?? true}
                      onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    启用
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rules 目录</label>
                  <input
                    value={form.rulesDir || ''}
                    onChange={(e) => setForm({ ...form, rulesDir: e.target.value })}
                    placeholder="~/.claude/rules"
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Skills 目录</label>
                  <input
                    value={form.skillsDir || ''}
                    onChange={(e) => setForm({ ...form, skillsDir: e.target.value })}
                    placeholder="~/.claude/commands"
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(editor.id)}
                  disabled={loading}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  保存
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`inline-block w-2 h-2 rounded-full ${editor.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="font-medium text-gray-900">{editor.name}</span>
                <span className="text-xs text-gray-400 font-mono">{editor.id}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{editor.rulesDir || <span className="text-gray-300">rules: —</span>}</span>
                <span>{editor.skillsDir || <span className="text-gray-300">skills: —</span>}</span>
                <button onClick={() => startEdit(editor)} className="text-indigo-600 hover:text-indigo-800">
                  编辑
                </button>
                <button onClick={() => handleDelete(editor.id)} className="text-red-500 hover:text-red-700">
                  删除
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add editor */}
      {showAdd ? (
        <div className="border rounded-lg p-4 border-dashed border-indigo-300 bg-indigo-50/30">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">名称 *</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="My Editor"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Rules 目录</label>
                <input
                  value={addForm.rulesDir}
                  onChange={(e) => setAddForm({ ...addForm, rulesDir: e.target.value })}
                  placeholder="~/.my-editor/rules"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Skills 目录</label>
                <input
                  value={addForm.skillsDir}
                  onChange={(e) => setAddForm({ ...addForm, skillsDir: e.target.value })}
                  placeholder="~/.my-editor/skills"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={loading || !addForm.name.trim()}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                添加
              </button>
              <button
                onClick={() => { setShowAdd(false); setAddForm({ name: '', rulesDir: '', skillsDir: '' }) }}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          + 添加编辑器
        </button>
      )}
    </div>
  )
}
