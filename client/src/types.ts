export interface Editor {
  id: string
  name: string
  rulesDir: string
  skillsDir: string
  enabled: boolean
}

export interface Config {
  centralRepo: string
  editors: Editor[]
}

export interface ScanItem {
  name: string
  path: string
}

export interface ScanResult {
  rules: ScanItem[]
  skills: ScanItem[]
}

export interface SyncStatusItem extends ScanItem {
  synced: boolean
  targetPath: string | null
}

export interface EditorSyncStatus {
  editor: { id: string; name: string }
  rules: SyncStatusItem[]
  skills: SyncStatusItem[]
}

export interface SyncRequest {
  editorIds: string[]
  rules: string[]
  skills: string[]
}

export interface SyncResultItem {
  name: string
  status: string
  message: string
}

export interface SyncResult {
  status: string
  results: Record<string, {
    rules?: SyncResultItem[]
    skills?: SyncResultItem[]
  }>
}
