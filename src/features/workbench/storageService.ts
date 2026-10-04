import type { DeskZone, WorkspaceDocument, WorkspacePlan, ZoneType } from '../../shared/models'
import { getZoneDefinition } from '../../shared/models'

export const STORAGE_KEY = 'focusdesk.document.v1'
const DATABASE_NAME = 'focusdesk-db'
const STORE_NAME = 'workspace'
const ZONE_TYPES: ZoneType[] = ['cable', 'device', 'forbidden']

export interface StorageService {
  read(): Promise<string | null>
  write(value: string): Promise<void>
}

export class BrowserStorageService implements StorageService {
  async read(): Promise<string | null> {
    try {
      const database = await openDatabase()
      const value = await readFromDatabase(database)
      database.close()
      return typeof value === 'string' ? value : window.localStorage.getItem(STORAGE_KEY)
    } catch {
      return window.localStorage.getItem(STORAGE_KEY)
    }
  }

  async write(value: string): Promise<void> {
    try {
      const database = await openDatabase()
      await writeToDatabase(database, value)
      database.close()
    } catch {
      window.localStorage.setItem(STORAGE_KEY, value)
    }
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

function readFromDatabase(database: IDBDatabase): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(STORAGE_KEY)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'))
  })
}

function writeToDatabase(database: IDBDatabase, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, STORAGE_KEY)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('IndexedDB write failed'))
  })
}

export function isWorkspaceDocument(value: unknown): value is WorkspaceDocument {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<WorkspaceDocument>
  return candidate.version === 1 && Array.isArray(candidate.plans) && typeof candidate.activePlanId === 'string'
}

/** 兼容功能分区上线前保存的旧文档：补齐 zones 字段并过滤异常数据。 */
export function migrateDocument(value: WorkspaceDocument): WorkspaceDocument {
  return {
    ...value,
    plans: value.plans.map(migratePlan),
  }
}

function migratePlan(plan: WorkspacePlan): WorkspacePlan {
  const rawZones = Array.isArray((plan as { zones?: unknown }).zones) ? (plan as { zones: unknown[] }).zones : []
  const zones = rawZones.flatMap<DeskZone>((entry, index) => {
    if (!entry || typeof entry !== 'object') return []
    const zone = entry as Record<string, unknown>
    if (typeof zone.id !== 'string' || !ZONE_TYPES.includes(zone.type as ZoneType)) return []
    const definition = getZoneDefinition(zone.type as ZoneType)
    return [{
      id: zone.id,
      type: zone.type as ZoneType,
      name: typeof zone.name === 'string' && zone.name.trim() ? zone.name.slice(0, 12) : `${definition.defaultName} ${index + 1}`,
      color: typeof zone.color === 'string' ? zone.color : definition.color,
      widthMm: toFiniteNumber(zone.widthMm, 300),
      heightMm: toFiniteNumber(zone.heightMm, 120),
      x: toFiniteNumber(zone.x, 20),
      y: toFiniteNumber(zone.y, 20),
    }]
  })
  return { ...plan, zones }
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
