import { describe, expect, it } from 'vitest'
import { createItem, createPlan, createZone } from '../../../shared/models'
import { analyzeLayout, getItemBounds, getZoneBounds, normalizeRotation } from '../../../shared/layoutRules'

describe('workspace rules', () => {
  it('normalizes rotation and calculates rotated bounds around the item center', () => {
    const item = { ...createItem('monitor'), x: 100, y: 100, widthMm: 400, heightMm: 200, rotation: 90 }
    const bounds = getItemBounds(item)
    expect(normalizeRotation(-15)).toBe(345)
    expect(Math.round(bounds.width)).toBe(200)
    expect(Math.round(bounds.height)).toBe(400)
    expect(Math.round(bounds.left)).toBe(200)
  })

  it('detects overlap and out-of-bounds items', () => {
    const plan = createPlan('test', false)
    const first = { ...createItem('monitor'), x: 100, y: 100, widthMm: 400, heightMm: 200 }
    const second = { ...createItem('keyboard'), x: 300, y: 150, widthMm: 400, heightMm: 200 }
    const outside = { ...createItem('lamp'), x: 1500, y: 700 }
    const analysis = analyzeLayout({ ...plan, items: [first, second, outside] })
    expect(analysis.overlapIds).toEqual(expect.arrayContaining([first.id, second.id]))
    expect(analysis.outOfBoundsIds).toContain(outside.id)
    expect(analysis.status).toBe('attention')
  })

  it('returns a healthy state for separated items', () => {
    const plan = createPlan('test', false)
    const first = { ...createItem('monitor'), x: 100, y: 100 }
    const second = { ...createItem('keyboard'), x: 800, y: 500 }
    const analysis = analyzeLayout({ ...plan, items: [first, second] })
    expect(analysis.status).toBe('clear')
    expect(analysis.coveragePercent).toBeGreaterThan(0)
  })

  it('flags an item inside a forbidden zone', () => {
    const plan = createPlan('zone-test', false)
    const item = { ...createItem('speaker'), x: 200, y: 200, widthMm: 150, heightMm: 150 }
    const forbidden = { ...createZone('forbidden', 0, plan.deskWidthMm, plan.deskHeightMm), x: 100, y: 100, widthMm: 300, heightMm: 300 }
    const analysis = analyzeLayout({ ...plan, items: [item], zones: [forbidden] })
    expect(analysis.forbiddenItemIds).toContain(item.id)
    expect(analysis.zoneViolations).toEqual([{ zoneId: forbidden.id, kind: 'forbidden', itemIds: [item.id] }])
    expect(analysis.status).toBe('attention')
  })

  it('flags an item overlapping a cable zone but never flags device zones', () => {
    const plan = createPlan('zone-test', false)
    const item = { ...createItem('lamp'), x: 200, y: 120, widthMm: 180, heightMm: 180 }
    const cable = { ...createZone('cable', 0, plan.deskWidthMm, plan.deskHeightMm), x: 100, y: 260, widthMm: 400, heightMm: 80 }
    const device = { ...createZone('device', 0, plan.deskWidthMm, plan.deskHeightMm), x: 0, y: 0, widthMm: 800, heightMm: 800 }
    const analysis = analyzeLayout({ ...plan, items: [item], zones: [cable, device] })
    expect(analysis.cableItemIds).toContain(item.id)
    expect(analysis.zoneViolations.map((violation) => violation.zoneId)).toContain(cable.id)
    expect(analysis.zoneViolations.map((violation) => violation.zoneId)).not.toContain(device.id)
  })

  it('does not flag an item that merely touches a zone edge', () => {
    const zone = { ...createZone('forbidden'), x: 100, y: 100, widthMm: 300, heightMm: 200 }
    const item = { ...createItem('lamp'), x: 400, y: 100 }
    const plan = createPlan('edge-test', false)
    const analysis = analyzeLayout({ ...plan, items: [item], zones: [zone] })
    expect(analysis.forbiddenItemIds).toEqual([])
    expect(analysis.status).toBe('clear')
  })

  it('computes zone bounds from its top-left corner', () => {
    const zone = createZone('cable', 0, 1600, 800)
    const bounds = getZoneBounds(zone)
    expect(bounds.left).toBe(zone.x)
    expect(bounds.right).toBe(zone.x + zone.widthMm)
  })
})
