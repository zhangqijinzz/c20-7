import { describe, expect, it } from 'vitest'
import { createMaterialDraft, createZoneDraft } from '../materialsViewModel'

describe('materials module', () => {
  it('creates a device draft with catalog dimensions and feedback', () => {
    const draft = createMaterialDraft('lamp', 2)
    expect(draft.item.type).toBe('lamp')
    expect(draft.item.widthMm).toBe(180)
    expect(draft.feedback).toBe('桌面灯已添加')
  })

  it('creates a zone draft with kind color, name and feedback', () => {
    const draft = createZoneDraft('forbidden', 1)
    expect(draft.zone.kind).toBe('forbidden')
    expect(draft.zone.name).toBe('禁放区 2')
    expect(draft.zone.color).toBe('#e89a9a')
    expect(draft.feedback).toContain('禁放区已添加')
  })
})
