import { describe, expect, it } from 'vitest'
import { createItem, createZone } from '../../../shared/models'
import { moveCanvasItem, moveCanvasZone, resizeCanvasZone, rotateCanvasItem } from '../canvasViewModel'

describe('canvas module', () => {
  it('moves and rotates the requested item without changing other items', () => {
    const first = createItem('monitor')
    const second = createItem('keyboard')
    const moved = moveCanvasItem([first, second], first.id, 320, 180)
    const rotated = rotateCanvasItem(moved, first.id, -15)
    expect(rotated[0]).toMatchObject({ x: 320, y: 180, rotation: 345 })
    expect(rotated[1]).toEqual(second)
  })

  it('moves the requested zone without touching other zones', () => {
    const first = createZone('cable')
    const second = createZone('forbidden')
    const moved = moveCanvasZone([first, second], first.id, 80, 90)
    expect(moved[0]).toMatchObject({ x: 80, y: 90 })
    expect(moved[1]).toEqual(second)
  })

  it('resizes from the south-east handle keeping the north-west corner fixed', () => {
    const zone = { ...createZone('forbidden'), x: 100, y: 100, widthMm: 300, heightMm: 200 }
    const [resized] = resizeCanvasZone([zone], zone.id, 'se', 480, 360)
    expect(resized).toMatchObject({ x: 100, y: 100, widthMm: 380, heightMm: 260 })
  })

  it('normalizes the rectangle when dragging the north-west handle past the fixed corner', () => {
    const zone = { ...createZone('cable'), x: 100, y: 100, widthMm: 300, heightMm: 200 }
    const [resized] = resizeCanvasZone([zone], zone.id, 'nw', 320, 240)
    expect(resized).toMatchObject({ x: 320, y: 240, widthMm: 80, heightMm: 60 })
  })
})
