export type DeviceType = 'monitor' | 'keyboard' | 'lamp' | 'speaker' | 'stand'

export type ZoneType = 'cable' | 'device' | 'forbidden'

export type WorkspaceStatus = 'loading' | 'ready' | 'saving' | 'error'

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
  type: ZoneType
  name: string
  color: string
  widthMm: number
  heightMm: number
  x: number
  y: number
}

export type CanvasSelection =
  | { kind: 'item'; id: string }
  | { kind: 'zone'; id: string }

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

export type ZoneIssueKind = 'forbidden' | 'cable'

export interface ZoneViolation {
  zoneId: string
  kind: ZoneIssueKind
  itemIds: string[]
}

export interface LayoutAnalysis {
  overlapIds: string[]
  outOfBoundsIds: string[]
  forbiddenItemIds: string[]
  cableItemIds: string[]
  zoneViolations: ZoneViolation[]
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

export interface ZoneDefinition {
  type: ZoneType
  label: string
  defaultName: string
  color: string
  hint: string
}

export const DEVICE_DEFINITIONS: DeviceDefinition[] = [
  { type: 'monitor', label: '显示器', shortLabel: 'MON', widthMm: 540, heightMm: 210, color: '#93b7ff', hint: '主屏 / 副屏' },
  { type: 'keyboard', label: '键盘', shortLabel: 'KEY', widthMm: 440, heightMm: 150, color: '#b5ead7', hint: '全尺寸 / 75%' },
  { type: 'lamp', label: '桌面灯', shortLabel: 'LAMP', widthMm: 180, heightMm: 180, color: '#ffd58e', hint: '灯座占用' },
  { type: 'speaker', label: '音箱', shortLabel: 'SPK', widthMm: 150, heightMm: 150, color: '#f4b7d4', hint: '左右声道' },
  { type: 'stand', label: '支架', shortLabel: 'STAND', widthMm: 260, heightMm: 180, color: '#cbb7f7', hint: '支架 / 坞站' },
]

export const ZONE_DEFINITIONS: ZoneDefinition[] = [
  { type: 'cable', label: '走线区', defaultName: '走线区', color: '#6fa8e8', hint: '理线槽 / 电源线' },
  { type: 'device', label: '设备区', defaultName: '设备摆放区', color: '#5fbb8d', hint: '设备集中摆放' },
  { type: 'forbidden', label: '禁放区', defaultName: '禁放区', color: '#e8806f', hint: '散热 / 留空区域' },
]

export const DEFAULT_DESK = { widthMm: 1600, heightMm: 800 }

export function getDeviceDefinition(type: DeviceType): DeviceDefinition {
  return DEVICE_DEFINITIONS.find((device) => device.type === type) ?? DEVICE_DEFINITIONS[0]
}

export function getZoneDefinition(type: ZoneType): ZoneDefinition {
  return ZONE_DEFINITIONS.find((zone) => zone.type === type) ?? ZONE_DEFINITIONS[0]
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

export function createZone(type: ZoneType, index = 0, deskWidthMm = DEFAULT_DESK.widthMm, deskHeightMm = DEFAULT_DESK.heightMm): DeskZone {
  const definition = getZoneDefinition(type)
  const widthMm = Math.min(500, Math.max(120, deskWidthMm - 60))
  const heightMm = Math.min(150, Math.max(100, deskHeightMm - 60))
  const presets: Record<ZoneType, { x: number; y: number }> = {
    cable: { x: (deskWidthMm - widthMm) / 2, y: 24 },
    device: { x: (deskWidthMm - widthMm) / 2, y: (deskHeightMm - heightMm) / 2 },
    forbidden: { x: Math.max(20, deskWidthMm - widthMm - 30), y: 24 + (index % 2) * 40 },
  }
  return {
    id: createId('zone'),
    type,
    name: definition.defaultName,
    color: definition.color,
    widthMm,
    heightMm,
    x: Math.round(presets[type].x),
    y: Math.round(presets[type].y),
  }
}

export function createPlan(name = '我的工作台', withDemo = true): WorkspacePlan {
  const items = withDemo ? [createItem('monitor', 0), createItem('keyboard', 1)] : []
  const zones: DeskZone[] = []
  if (withDemo) {
    items[0].x = 530
    items[0].y = 105
    items[1].x = 580
    items[1].y = 470
    zones.push({
      id: createId('zone'),
      type: 'cable',
      name: '显示器走线槽',
      color: getZoneDefinition('cable').color,
      x: 500,
      y: 20,
      widthMm: 600,
      heightMm: 70,
    })
    zones.push({
      id: createId('zone'),
      type: 'forbidden',
      name: '右侧散热留空',
      color: getZoneDefinition('forbidden').color,
      x: 1450,
      y: 640,
      widthMm: 120,
      heightMm: 120,
    })
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
