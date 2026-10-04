import { Check, X } from 'lucide-react'
import type { LayoutAnalysis, WorkspacePlan } from '../../../shared/models'
import { getZoneDefinition } from '../../../shared/models'
import { CanvasStage } from '../../canvas/components/CanvasStage'

interface PreviewOverlayProps {
  plan: WorkspacePlan
  analysis: LayoutAnalysis
  issueCount: number
  onClose: () => void
}

export function PreviewOverlay({ plan, analysis, issueCount, onClose }: PreviewOverlayProps) {
  const unique = (ids: string[]) => new Set(ids).size
  const categories = [
    { label: '设备重叠', count: unique(analysis.overlapIds) },
    { label: '超出桌面', count: unique(analysis.outOfBoundsIds) },
    { label: '落入禁放区', count: unique(analysis.forbiddenItemIds) },
    { label: '压住走线区', count: unique(analysis.cableItemIds) },
  ].filter((category) => category.count > 0)
  return (
    <div className="preview-backdrop" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      <section className="preview-modal">
        <header className="preview-modal-header">
          <div>
            <span className="eyebrow">LAYOUT PREVIEW</span>
            <h2 id="preview-title">{plan.name}</h2>
            <p>{plan.deskWidthMm} × {plan.deskHeightMm} mm · {plan.items.length} 件设备 · {plan.zones.length} 个分区</p>
            {plan.zones.length > 0 && (
              <ul className="preview-zone-list">
                {plan.zones.map((zone) => (
                  <li key={zone.id}><i style={{ backgroundColor: zone.color }} />{zone.name}<small>{getZoneDefinition(zone.type).label}</small></li>
                ))}
              </ul>
            )}
          </div>
          <button className="close-preview" aria-label="关闭预览" onClick={onClose} type="button"><X size={18} /></button>
        </header>
        <div className="preview-canvas">
          <CanvasStage plan={plan} selected={null} analysis={analysis} readOnly onSelect={() => undefined} onMoveItem={() => undefined} onMoveZone={() => undefined} onResizeZone={() => undefined} />        </div>
        <footer className="preview-footer">
          <span className="preview-check">
            <Check size={15} />
            {issueCount === 0
              ? '布局检查通过，可开始搭建'
              : <span className="preview-issue-break">还有 {issueCount} 个位置需要调整：{categories.map((category) => `${category.label} ${category.count}`).join('、')}</span>}
          </span>
          <button className="preview-done" onClick={onClose} type="button">返回编辑</button>
        </footer>
      </section>
    </div>
  )
}
