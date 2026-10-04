import { describe, expect, it } from 'vitest'
import { LocalWorkspaceRepository } from '../workspaceRepository'
import type { StorageService } from '../storageService'
import { createInitialDocument } from '../../../shared/models'

function memoryStorage(initial: string | null = null): StorageService {
  let value = initial
  return { read: async () => value, write: async (next) => { value = next } }
}

describe('local workspace repository', () => {
  it('round trips a document', async () => {
    const repository = new LocalWorkspaceRepository(memoryStorage())
    const document = createInitialDocument()
    await repository.save(document)
    await expect(repository.load()).resolves.toEqual(document)
  })

  it('falls back when stored JSON is damaged', async () => {
    const repository = new LocalWorkspaceRepository(memoryStorage('{broken'))
    await expect(repository.load()).resolves.toBeNull()
  })

  it('migrates plans saved before functional zones existed', async () => {
    const initial = createInitialDocument()
    const legacy: unknown = {
      ...initial,
      plans: initial.plans.map((plan) => ({ ...plan })),
    }
    delete (legacy as { plans?: Array<Record<string, unknown>> }).plans?.[0]?.zones
    const storage = memoryStorage(JSON.stringify(legacy))
    const repository = new LocalWorkspaceRepository(storage)
    const loaded = await repository.load()
    expect(loaded?.plans[0].zones).toEqual([])
  })

  it('keeps valid zones during migration and repairs broken entries', async () => {
    const initial = createInitialDocument()
    const withZones: unknown = {
      ...initial,
      plans: [{
        ...initial.plans[0],
        zones: [
          ...initial.plans[0].zones,
          { id: 'zone-bad', type: 'mystery', name: '??', color: 0, widthMm: 'x', heightMm: 10, x: 5, y: 5 },
        ],
      }],
    }
    const storage = memoryStorage(JSON.stringify(withZones))
    const repository = new LocalWorkspaceRepository(storage)
    const loaded = await repository.load()
    expect(loaded?.plans[0].zones.length).toBe(initial.plans[0].zones.length)
  })
})
