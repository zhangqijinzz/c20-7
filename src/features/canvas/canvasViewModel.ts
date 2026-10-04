import { normalizeRotation } from '../../shared/layoutRules'
import type { DeskItem, DeskZone } from '../../shared/models'

function updateCanvasItem(items: DeskItem[], id: string, updater: (item: DeskItem) => DeskItem): DeskItem[] {
  return items.map((item) => item.id === id ? updater(item) : item)
}

export function moveCanvasItem(items: DeskItem[], id: string, x: number, y: number): DeskItem[] {
  return updateCanvasItem(items, id, (item) => ({ ...item, x, y }))
}

export function rotateCanvasItem(items: DeskItem[], id: string, delta: number): DeskItem[] {
  return updateCanvasItem(items, id, (item) => ({ ...item, rotation: normalizeRotation(item.rotation + delta) }))
}

export type ZoneResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

export function moveCanvasZone(zones: DeskZone[], id: string, x: number, y: number): DeskZone[] {
  return zones.map((zone) => zone.id === id ? { ...zone, x, y } : zone)
}

/**
 * 通过拖拽手柄调整分区范围。被拖手柄的对角点保持不动，
 * 根据当前指针位置重新计算左上角与宽高；指针越过对角时自动翻转。
 */
export function resizeCanvasZone(
  zones: DeskZone[],
  id: string,
  handle: ZoneResizeHandle,
  pointerX: number,
  pointerY: number,
): DeskZone[] {
  return zones.map((zone) => {
    if (zone.id !== id) return zone
    const anchorWest = handle === 'ne' || handle === 'se'
    const anchorNorth = handle === 'sw' || handle === 'se'
    const fixedX = anchorWest ? zone.x : zone.x + zone.widthMm
    const fixedY = anchorNorth ? zone.y : zone.y + zone.heightMm
    const left = Math.min(fixedX, pointerX)
    const top = Math.min(fixedY, pointerY)
    return {
      ...zone,
      x: left,
      y: top,
      widthMm: Math.abs(pointerX - fixedX),
      heightMm: Math.abs(pointerY - fixedY),
    }
  })
}
