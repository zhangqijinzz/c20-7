import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createId,
  createInitialDocument,
  createPlan,
  type CanvasSelection,
  type DeskItem,
  type DeskZone,
  type DeviceType,
  type LayoutAnalysis,
  type WorkspaceDocument,
  type WorkspacePlan,
  type WorkspaceStatus,
  type ZoneType,
} from '../../shared/models'
import { clampDeskSize, clampItemDimension, clampZoneDimension } from '../../shared/layoutRules'
import { moveCanvasItem, moveCanvasZone, resizeCanvasZone, rotateCanvasItem, type ZoneResizeHandle } from '../canvas/canvasViewModel'
import { createMaterialDraft, createZoneDraft } from '../materials/materialsViewModel'
import { inspectPlan } from '../inspection/inspectionViewModel'
import { LocalWorkspaceRepository, type WorkspaceRepository } from './workspaceRepository'

export interface WorkspaceViewModel {
  status: WorkspaceStatus
  document: WorkspaceDocument | null
  activePlan: WorkspacePlan | null
  selection: CanvasSelection | null
  selectedItem: DeskItem | null
  selectedZone: DeskZone | null
  analysis: LayoutAnalysis
  issueIds: string[]
  issueCount: number
  feedback: string
  isPreviewOpen: boolean
  selectObject: (selection: CanvasSelection | null) => void
  addItem: (type: DeviceType) => void
  addZone: (type: ZoneType) => void
  removeItem: (id: string) => void
  removeZone: (id: string) => void
  moveItem: (id: string, x: number, y: number) => void
  moveZone: (id: string, x: number, y: number) => void
  resizeZone: (id: string, handle: ZoneResizeHandle, pointerX: number, pointerY: number) => void
  rotateItem: (id: string, delta: number) => void
  updateItem: (id: string, patch: Partial<Pick<DeskItem, 'widthMm' | 'heightMm' | 'x' | 'y'>>) => void
  updateZone: (id: string, patch: Partial<Pick<DeskZone, 'name' | 'color' | 'widthMm' | 'heightMm' | 'x' | 'y'>>) => void
  updateDesk: (field: 'deskWidthMm' | 'deskHeightMm', value: number) => void
  createNewPlan: () => void
  duplicatePlan: () => void
  selectPlan: (id: string) => void
  deleteCurrentPlan: () => void
  openPreview: () => void
  closePreview: () => void
}

const emptyInspection = {
  analysis: {
    overlapIds: [], outOfBoundsIds: [], forbiddenItemIds: [], cableItemIds: [], zoneViolations: [],
    coveragePercent: 0, status: 'clear' as const,
  },
  issueIds: [] as string[],
  issueCount: 0,
}

export function useWorkspaceViewModel(repository?: WorkspaceRepository): WorkspaceViewModel {
  const repositoryRef = useRef(repository ?? new LocalWorkspaceRepository())
  const [status, setStatus] = useState<WorkspaceStatus>('loading')
  const [document, setDocument] = useState<WorkspaceDocument | null>(null)
  const [selection, setSelection] = useState<CanvasSelection | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [feedback, setFeedback] = useState('正在准备你的工作台…')

  useEffect(() => {
    let active = true
    void repositoryRef.current.load().then((loaded) => {
      if (!active) return
      const nextDocument = loaded ?? createInitialDocument()
      setDocument(nextDocument)
      setStatus('ready')
      setFeedback(loaded ? '已恢复上次编辑状态' : '已创建示例工作台，可以直接拖动设备或分区')
    }).catch(() => {
      if (!active) return
      setDocument(createInitialDocument())
      setStatus('error')
      setFeedback('本地数据读取失败，当前使用临时工作台')
    })
    return () => { active = false }
  }, [])

  const activePlan = useMemo(
    () => document?.plans.find((plan) => plan.id === document.activePlanId) ?? null,
    [document],
  )
  const selectedItem = selection?.kind === 'item'
    ? activePlan?.items.find((item) => item.id === selection.id) ?? null
    : null
  const selectedZone = selection?.kind === 'zone'
    ? activePlan?.zones.find((zone) => zone.id === selection.id) ?? null
    : null
  const inspection = useMemo(() => activePlan ? inspectPlan(activePlan) : emptyInspection, [activePlan])
  const { analysis, issueIds, issueCount } = inspection

  const persist = useCallback(async (nextDocument: WorkspaceDocument, message: string) => {
    setDocument(nextDocument)
    setStatus('saving')
    setFeedback(message)
    try {
      await repositoryRef.current.save(nextDocument)
      setStatus('ready')
    } catch {
      setStatus('error')
      setFeedback('自动保存失败，请检查浏览器本地存储权限')
    }
  }, [])

  const updateActivePlan = useCallback((updater: (plan: WorkspacePlan) => WorkspacePlan, message: string) => {
    if (!document || !activePlan) return
    const nextPlan = { ...updater(activePlan), updatedAt: new Date().toISOString() }
    const nextDocument = { ...document, plans: document.plans.map((plan) => plan.id === nextPlan.id ? nextPlan : plan) }
    void persist(nextDocument, message)
  }, [activePlan, document, persist])

  const selectObject = useCallback((next: CanvasSelection | null) => setSelection(next), [])

  const addItem = useCallback((type: DeviceType) => {
    if (!activePlan) return
    const draft = createMaterialDraft(type, activePlan.items.length)
    updateActivePlan((plan) => ({ ...plan, items: [...plan.items, draft.item] }), draft.feedback)
    setSelection({ kind: 'item', id: draft.item.id })
  }, [activePlan, updateActivePlan])

  const addZone = useCallback((type: ZoneType) => {
    if (!activePlan) return
    const draft = createZoneDraft(type, activePlan.zones.length, activePlan.deskWidthMm, activePlan.deskHeightMm)
    updateActivePlan((plan) => ({ ...plan, zones: [...plan.zones, draft.item] }), draft.feedback)
    setSelection({ kind: 'zone', id: draft.item.id })
  }, [activePlan, updateActivePlan])

  const removeItem = useCallback((id: string) => {
    updateActivePlan((plan) => ({ ...plan, items: plan.items.filter((item) => item.id !== id) }), '设备已移除')
    setSelection((current) => current?.kind === 'item' && current.id === id ? null : current)
  }, [updateActivePlan])

  const removeZone = useCallback((id: string) => {
    updateActivePlan((plan) => ({ ...plan, zones: plan.zones.filter((zone) => zone.id !== id) }), '分区已删除')
    setSelection((current) => current?.kind === 'zone' && current.id === id ? null : current)
  }, [updateActivePlan])

  const moveItem = useCallback((id: string, x: number, y: number) => {
    updateActivePlan((plan) => ({ ...plan, items: moveCanvasItem(plan.items, id, x, y) }), '位置已更新')
  }, [updateActivePlan])

  const moveZone = useCallback((id: string, x: number, y: number) => {
    updateActivePlan((plan) => ({ ...plan, zones: moveCanvasZone(plan.zones, id, x, y) }), '分区位置已更新')
  }, [updateActivePlan])

  const resizeZone = useCallback((id: string, handle: ZoneResizeHandle, pointerX: number, pointerY: number) => {
    updateActivePlan((plan) => {
      const resized = resizeCanvasZone(plan.zones, id, handle, pointerX, pointerY)
      const zones = resized.map((zone) => zone.id === id
        ? { ...zone, widthMm: clampZoneDimension(zone.widthMm, zone.widthMm), heightMm: clampZoneDimension(zone.heightMm, zone.heightMm) }
        : zone)
      return { ...plan, zones }
    }, '分区范围已更新')
  }, [updateActivePlan])

  const rotateItem = useCallback((id: string, delta: number) => {
    updateActivePlan((plan) => ({ ...plan, items: rotateCanvasItem(plan.items, id, delta) }), '角度已更新')
  }, [updateActivePlan])

  const updateItem = useCallback((id: string, patch: Partial<Pick<DeskItem, 'widthMm' | 'heightMm' | 'x' | 'y'>>) => {
    updateActivePlan((plan) => ({
      ...plan,
      items: plan.items.map((item) => item.id === id ? {
        ...item,
        ...patch,
        widthMm: patch.widthMm === undefined ? item.widthMm : clampItemDimension(patch.widthMm, item.widthMm),
        heightMm: patch.heightMm === undefined ? item.heightMm : clampItemDimension(patch.heightMm, item.heightMm),
      } : item),
    }), '尺寸参数已更新')
  }, [updateActivePlan])

  const updateZone = useCallback((id: string, patch: Partial<Pick<DeskZone, 'name' | 'color' | 'widthMm' | 'heightMm' | 'x' | 'y'>>) => {
    updateActivePlan((plan) => ({
      ...plan,
      zones: plan.zones.map((zone) => zone.id === id ? {
        ...zone,
        ...patch,
        name: patch.name !== undefined ? patch.name.slice(0, 12) : zone.name,
        widthMm: patch.widthMm === undefined ? zone.widthMm : clampZoneDimension(patch.widthMm, zone.widthMm),
        heightMm: patch.heightMm === undefined ? zone.heightMm : clampZoneDimension(patch.heightMm, zone.heightMm),
      } : zone),
    }), '分区属性已更新')
  }, [updateActivePlan])

  const updateDesk = useCallback((field: 'deskWidthMm' | 'deskHeightMm', value: number) => {
    if (!activePlan) return
    updateActivePlan((plan) => ({ ...plan, [field]: clampDeskSize(value, plan[field]) }), '桌面尺寸已更新')
  }, [activePlan, updateActivePlan])

  const createNewPlan = useCallback(() => {
    if (!document) return
    const plan = createPlan(`工作台 ${document.plans.length + 1}`, false)
    void persist({ ...document, plans: [...document.plans, plan], activePlanId: plan.id }, '已创建空白方案')
    setSelection(null)
  }, [document, persist])

  const duplicatePlan = useCallback(() => {
    if (!document || !activePlan) return
    const copy: WorkspacePlan = {
      ...activePlan,
      id: createId('plan'),
      name: `${activePlan.name} · 副本`,
      items: activePlan.items.map((item) => ({ ...item, id: createId('item') })),
      zones: activePlan.zones.map((zone) => ({ ...zone, id: createId('zone') })),
      updatedAt: new Date().toISOString(),
    }
    void persist({ ...document, plans: [...document.plans, copy], activePlanId: copy.id }, '方案已复制（含功能分区）')
    setSelection(null)
  }, [activePlan, document, persist])

  const selectPlan = useCallback((id: string) => {
    if (!document || !document.plans.some((plan) => plan.id === id)) return
    void persist({ ...document, activePlanId: id }, '已切换方案')
    setSelection(null)
  }, [document, persist])

  const deleteCurrentPlan = useCallback(() => {
    if (!document || !activePlan || document.plans.length <= 1) {
      setFeedback('至少保留一个工作台方案')
      return
    }
    const remaining = document.plans.filter((plan) => plan.id !== activePlan.id)
    void persist({ ...document, plans: remaining, activePlanId: remaining[0].id }, '方案已删除')
    setSelection(null)
  }, [activePlan, document, persist])

  const openPreview = useCallback(() => setIsPreviewOpen(true), [])
  const closePreview = useCallback(() => setIsPreviewOpen(false), [])

  return {
    status,
    document,
    activePlan,
    selection,
    selectedItem,
    selectedZone,
    analysis,
    issueIds,
    issueCount,
    feedback,
    isPreviewOpen,
    selectObject,
    addItem,
    addZone,
    removeItem,
    removeZone,
    moveZone,
    moveItem,
    resizeZone,
    rotateItem,
    updateItem,
    updateZone,
    updateDesk,
    createNewPlan,
    duplicatePlan,
    selectPlan,
    deleteCurrentPlan,
    openPreview,
    closePreview,
  }
}
