import { describe, expect, it } from 'vitest'
import { createPlan, createItem, createZone } from '../../../shared/models'
import { analyzeLayout, getItemBounds, normalizeRotation } from '../../../shared/layoutRules'

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

  it('flags items that enter forbidden zones or cover cable zones', () => {
    const plan = createPlan('test', false)
    const onForbidden = { ...createItem('monitor'), x: 100, y: 100, widthMm: 300, heightMm: 200 }
    const onCable = { ...createItem('keyboard'), x: 900, y: 60, widthMm: 400, heightMm: 150 }
    const onDeviceZone = { ...createItem('lamp'), x: 100, y: 500 }
    const forbidden = { ...createZone('forbidden'), x: 150, y: 150, widthMm: 300, heightMm: 200 }
    const cable = { ...createZone('cable'), x: 850, y: 40, widthMm: 600, heightMm: 120 }
    const deviceZone = { ...createZone('device'), x: 60, y: 460, widthMm: 400, heightMm: 300 }
    const analysis = analyzeLayout({ ...plan, items: [onForbidden, onCable, onDeviceZone], zones: [forbidden, cable, deviceZone] })
    expect(analysis.zoneConflictIds).toEqual(expect.arrayContaining([onForbidden.id, onCable.id]))
    expect(analysis.zoneConflictIds).not.toContain(onDeviceZone.id)
    expect(analysis.status).toBe('attention')
  })

  it('ignores zones that no item touches', () => {
    const plan = createPlan('test', false)
    const item = { ...createItem('monitor'), x: 100, y: 400 }
    const forbidden = { ...createZone('forbidden'), x: 1000, y: 100, widthMm: 300, heightMm: 200 }
    const analysis = analyzeLayout({ ...plan, items: [item], zones: [forbidden] })
    expect(analysis.zoneConflictIds).toHaveLength(0)
    expect(analysis.status).toBe('clear')
  })
})
