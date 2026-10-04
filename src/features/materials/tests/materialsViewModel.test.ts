import { describe, expect, it } from 'vitest'
import { createMaterialDraft, createZoneDraft } from '../materialsViewModel'

describe('materials module', () => {
  it('creates a device draft with catalog dimensions and feedback', () => {
    const draft = createMaterialDraft('lamp', 2)
    expect(draft.item.type).toBe('lamp')
    expect(draft.item.widthMm).toBe(180)
    expect(draft.feedback).toBe('桌面灯已添加')
  })

  it('creates a zone draft with its type color and feedback', () => {
    const draft = createZoneDraft('forbidden', 0, 1600, 800)
    expect(draft.item.type).toBe('forbidden')
    expect(draft.item.widthMm).toBeGreaterThanOrEqual(60)
    expect(draft.feedback).toBe('禁放区已绘制到桌面')
  })
})
