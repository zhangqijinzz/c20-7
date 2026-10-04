import { createItem, createZone, getDeviceDefinition, getZoneDefinition, type DeskItem, type DeviceType, type DeskZone, type ZoneType } from '../../shared/models'

export interface MaterialDraft<T> {
  item: T
  feedback: string
}

export function createMaterialDraft(type: DeviceType, currentItemCount: number): MaterialDraft<DeskItem> {
  return {
    item: createItem(type, currentItemCount),
    feedback: `${getDeviceDefinition(type).label}已添加`,
  }
}

export function createZoneDraft(type: ZoneType, currentZoneCount: number, deskWidthMm: number, deskHeightMm: number): MaterialDraft<DeskZone> {
  return {
    item: createZone(type, currentZoneCount, deskWidthMm, deskHeightMm),
    feedback: `${getZoneDefinition(type).label}已绘制到桌面`,
  }
}
