export type DeviceType = 'monitor' | 'keyboard' | 'lamp' | 'speaker' | 'stand'

export type ZoneKind = 'cable' | 'device' | 'forbidden'

export type WorkspaceStatus = 'loading' | 'ready' | 'saving' | 'error'

export type CanvasSelection = { type: 'item'; id: string } | { type: 'zone'; id: string }

export interface DeskItem {
  id: string
  type: DeviceType
  widthMm: number
  heightMm: number
  x: number
  y: number
  rotation: number
}

export interface DeskZone {
  id: string
  kind: ZoneKind
  name: string
  color: string
  widthMm: number
  heightMm: number
  x: number
  y: number
}

export interface WorkspacePlan {
  id: string
  name: string
  deskWidthMm: number
  deskHeightMm: number
  items: DeskItem[]
  zones: DeskZone[]
  updatedAt: string
}

export interface WorkspaceDocument {
  version: 1
  plans: WorkspacePlan[]
  activePlanId: string
}

export interface ItemBounds {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface LayoutAnalysis {
  overlapIds: string[]
  outOfBoundsIds: string[]
  zoneConflictIds: string[]
  coveragePercent: number
  status: 'clear' | 'attention'
}

export interface DeviceDefinition {
  type: DeviceType
  label: string
  shortLabel: string
  widthMm: number
  heightMm: number
  color: string
  hint: string
}

export interface ZoneKindDefinition {
  kind: ZoneKind
  label: string
  color: string
  hint: string
  blocksItems: boolean
}

export const ZONE_KIND_DEFINITIONS: ZoneKindDefinition[] = [
  { kind: 'cable', label: '走线区', color: '#7fb2d9', hint: '线缆通道，需保持畅通', blocksItems: true },
  { kind: 'device', label: '设备区', color: '#9bcfb7', hint: '推荐摆放设备的范围', blocksItems: false },
  { kind: 'forbidden', label: '禁放区', color: '#e89a9a', hint: '禁止放置任何设备', blocksItems: true },
]

export function getZoneKindDefinition(kind: ZoneKind): ZoneKindDefinition {
  return ZONE_KIND_DEFINITIONS.find((zone) => zone.kind === kind) ?? ZONE_KIND_DEFINITIONS[0]
}

export const DEVICE_DEFINITIONS: DeviceDefinition[] = [
  { type: 'monitor', label: '显示器', shortLabel: 'MON', widthMm: 540, heightMm: 210, color: '#93b7ff', hint: '主屏 / 副屏' },
  { type: 'keyboard', label: '键盘', shortLabel: 'KEY', widthMm: 440, heightMm: 150, color: '#b5ead7', hint: '全尺寸 / 75%' },
  { type: 'lamp', label: '桌面灯', shortLabel: 'LAMP', widthMm: 180, heightMm: 180, color: '#ffd58e', hint: '灯座占用' },
  { type: 'speaker', label: '音箱', shortLabel: 'SPK', widthMm: 150, heightMm: 150, color: '#f4b7d4', hint: '左右声道' },
  { type: 'stand', label: '支架', shortLabel: 'STAND', widthMm: 260, heightMm: 180, color: '#cbb7f7', hint: '支架 / 坞站' },
]

export const DEFAULT_DESK = { widthMm: 1600, heightMm: 800 }

export function getDeviceDefinition(type: DeviceType): DeviceDefinition {
  return DEVICE_DEFINITIONS.find((device) => device.type === type) ?? DEVICE_DEFINITIONS[0]
}

export function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createItem(type: DeviceType, index = 0): DeskItem {
  const definition = getDeviceDefinition(type)
  const columns = 3
  const x = 80 + (index % columns) * 280
  const y = 90 + Math.floor(index / columns) * 240
  return {
    id: createId('item'),
    type,
    widthMm: definition.widthMm,
    heightMm: definition.heightMm,
    x,
    y,
    rotation: 0,
  }
}

export function createZone(kind: ZoneKind, index = 0): DeskZone {
  const definition = getZoneKindDefinition(kind)
  const columns = 2
  return {
    id: createId('zone'),
    kind,
    name: `${definition.label} ${index + 1}`,
    color: definition.color,
    widthMm: kind === 'cable' ? 900 : 420,
    heightMm: kind === 'cable' ? 120 : 300,
    x: 120 + (index % columns) * 360,
    y: 60 + Math.floor(index / columns) * 220,
  }
}

export function createPlan(name = '我的工作台', withDemo = true): WorkspacePlan {
  const items = withDemo ? [createItem('monitor', 0), createItem('keyboard', 1)] : []
  const zones = withDemo ? [createZone('cable', 0)] : []
  if (withDemo) {
    items[0].x = 530
    items[0].y = 105
    items[1].x = 580
    items[1].y = 470
    zones[0].x = 350
    zones[0].y = 10
    zones[0].heightMm = 80
  }
  return {
    id: createId('plan'),
    name,
    deskWidthMm: DEFAULT_DESK.widthMm,
    deskHeightMm: DEFAULT_DESK.heightMm,
    items,
    zones,
    updatedAt: new Date().toISOString(),
  }
}

export function createInitialDocument(): WorkspaceDocument {
  const plan = createPlan('我的工作台', true)
  return { version: 1, plans: [plan], activePlanId: plan.id }
}
