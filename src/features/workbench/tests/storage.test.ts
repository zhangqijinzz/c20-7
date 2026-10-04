import { describe, expect, it } from 'vitest'
import { LocalWorkspaceRepository } from '../workspaceRepository'
import type { StorageService } from '../storageService'
import { createInitialDocument, createZone } from '../../../shared/models'

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

  it('round trips plans together with their zones', async () => {
    const repository = new LocalWorkspaceRepository(memoryStorage())
    const document = createInitialDocument()
    document.plans[0].zones = [{ ...createZone('forbidden', 0), x: 200, y: 300 }]
    await repository.save(document)
    const loaded = await repository.load()
    expect(loaded?.plans[0].zones).toHaveLength(1)
    expect(loaded?.plans[0].zones[0]).toMatchObject({ kind: 'forbidden', x: 200, y: 300 })
  })

  it('backfills an empty zone list for legacy plans', async () => {
    const legacy = createInitialDocument() as unknown as { plans: Record<string, unknown>[] }
    delete legacy.plans[0].zones
    const repository = new LocalWorkspaceRepository(memoryStorage(JSON.stringify(legacy)))
    const loaded = await repository.load()
    expect(loaded?.plans[0].zones).toEqual([])
  })

  it('falls back when stored JSON is damaged', async () => {
    const repository = new LocalWorkspaceRepository(memoryStorage('{broken'))
    await expect(repository.load()).resolves.toBeNull()
  })
})
