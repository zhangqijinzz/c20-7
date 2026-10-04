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

  it('counts zone conflicts alongside overlap and out-of-bounds issues', () => {
    const plan = createPlan('检查', false)
    const overlappingA = { ...createItem('monitor'), x: 0, y: 0 }
    const overlappingB = { ...createItem('keyboard'), x: 100, y: 80 }
    const inForbidden = { ...createItem('lamp'), x: 1000, y: 500 }
    const forbidden = { ...createZone('forbidden'), x: 950, y: 450, widthMm: 400, heightMm: 300 }
    const result = inspectPlan({ ...plan, items: [overlappingA, overlappingB, inForbidden], zones: [forbidden] })
    expect(result.issueCount).toBe(3)
    expect(result.issueIds).toContain(inForbidden.id)
    expect(result.analysis.zoneConflictIds).toEqual([inForbidden.id])
  })
})
