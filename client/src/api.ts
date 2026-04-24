import type { Config, Editor, ScanResult, EditorSyncStatus, SyncRequest, SyncResult } from './types'

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const api = {
  getConfig: () => request<Config>('/config'),

  updateRepo: (centralRepo: string) =>
    request<{ status: string }>('/config/repo', {
      method: 'PUT',
      body: JSON.stringify({ centralRepo }),
    }),

  getEditors: () => request<Editor[]>('/editors'),

  addEditor: (editor: Partial<Editor>) =>
    request<{ status: string; editor: Editor }>('/editors', {
      method: 'POST',
      body: JSON.stringify(editor),
    }),

  updateEditor: (id: string, data: Partial<Editor>) =>
    request<{ status: string }>(`/editors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteEditor: (id: string) =>
    request<{ status: string }>(`/editors/${id}`, { method: 'DELETE' }),

  scan: () => request<ScanResult>('/scan'),

  getStatus: () => request<EditorSyncStatus[]>('/status'),

  sync: (data: SyncRequest) =>
    request<SyncResult>('/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  unsync: (data: SyncRequest) =>
    request<SyncResult>('/unsync', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
