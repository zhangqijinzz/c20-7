import { describe, expect, it } from 'vitest'
import { createItem, createZone } from '../../../shared/models'
import { moveCanvasItem, moveCanvasZone, rotateCanvasItem } from '../canvasViewModel'

describe('canvas module', () => {
  it('moves and rotates the requested item without changing other items', () => {
    const first = createItem('monitor')
    const second = createItem('keyboard')
    const moved = moveCanvasItem([first, second], first.id, 320, 180)
    const rotated = rotateCanvasItem(moved, first.id, -15)
    expect(rotated[0]).toMatchObject({ x: 320, y: 180, rotation: 345 })
    expect(rotated[1]).toEqual(second)
  })

  it('moves only the requested zone', () => {
    const first = createZone('cable', 0)
    const second = createZone('forbidden', 1)
    const moved = moveCanvasZone([first, second], second.id, 640, 120)
    expect(moved[1]).toMatchObject({ x: 640, y: 120 })
    expect(moved[0]).toEqual(first)
  })
})
