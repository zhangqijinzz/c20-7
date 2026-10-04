import { createItem, createZone, getDeviceDefinition, getZoneKindDefinition, type DeskItem, type DeskZone, type DeviceType, type ZoneKind } from '../../shared/models'

export interface MaterialDraft {
  item: DeskItem
  feedback: string
}

export interface ZoneDraft {
  zone: DeskZone
  feedback: string
}

export function createMaterialDraft(type: DeviceType, currentItemCount: number): MaterialDraft {
  return {
    item: createItem(type, currentItemCount),
    feedback: `${getDeviceDefinition(type).label}已添加`,
  }
}

export function createZoneDraft(kind: ZoneKind, currentZoneCount: number): ZoneDraft {
  return {
    zone: createZone(kind, currentZoneCount),
    feedback: `${getZoneKindDefinition(kind).label}已添加，可拖动调整范围`,
  }
}
