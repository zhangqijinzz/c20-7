import { describe, expect, it } from 'vitest'
import { createItem, createPlan, createZone } from '../../../shared/models'
import { inspectPlan } from '../inspectionViewModel'

describe('inspection module', () => {
  it('turns layout analysis into a user-facing issue summary', () => {
    const plan = createPlan('检查', false)
    const first = { ...createItem('monitor'), x: 0, y: 0 }
    const second = { ...createItem('keyboard'), x: 100, y: 80 }
    const result = inspectPlan({ ...plan, items: [first, second] })
    expect(result.issueCount).toBe(2)
    expect(result.issueIds).toEqual(expect.arrayContaining([first.id, second.id]))
  })

  it('counts a device once even when it triggers several rule types', () => {
    const plan = createPlan('检查', false)
    const item = { ...createItem('monitor'), x: 0, y: 0, widthMm: 400, heightMm: 200 }
    const cable = { ...createZone('cable'), x: 0, y: 0, widthMm: 400, heightMm: 100 }
    const forbidden = { ...createZone('forbidden'), x: 350, y: 150, widthMm: 400, heightMm: 400 }
    const result = inspectPlan({ ...plan, items: [item], zones: [cable, forbidden] })
    expect(result.issueCount).toBe(1)
    expect(result.issueIds).toEqual([item.id])
  })
})
