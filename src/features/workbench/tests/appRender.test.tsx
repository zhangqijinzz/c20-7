// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { App } from '../../../app/App'
import { createInitialDocument } from '../../../shared/models'
import { STORAGE_KEY } from '../storageService'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function mountedApp(): Promise<string> {
  await act(async () => {
    createRoot(document.body.appendChild(document.createElement('div'))).render(<App />)
    await new Promise((resolve) => setTimeout(resolve, 60))
  })
  return document.body.innerHTML
}

describe('workbench app', () => {
  it('renders functional zones alongside devices after loading a saved document', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createInitialDocument()))
    const html = await mountedApp()
    expect(html).toContain('功能分区')
    expect(html).toContain('分区检查口径')
    expect(html).toContain('显示器走线槽')
    expect(html).toContain('件设备')
  })
})
