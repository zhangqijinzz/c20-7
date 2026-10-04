import { AlertTriangle, Crosshair, RotateCcw, RotateCw, Ruler, Trash2 } from 'lucide-react'
import type { DeskItem, DeskZone, WorkspacePlan } from '../../../shared/models'
import { getDeviceDefinition, getZoneKindDefinition } from '../../../shared/models'

interface InspectorPanelProps {
  plan: WorkspacePlan
  item: DeskItem | null
  zone: DeskZone | null
  issueIds: string[]
  onUpdateDesk: (field: 'deskWidthMm' | 'deskHeightMm', value: number) => void
  onUpdateItem: (id: string, patch: Partial<Pick<DeskItem, 'widthMm' | 'heightMm' | 'x' | 'y'>>) => void
  onRotate: (id: string, delta: number) => void
  onDeleteItem: (id: string) => void
  onUpdateZone: (id: string, patch: Partial<Pick<DeskZone, 'widthMm' | 'heightMm' | 'x' | 'y' | 'name'>>) => void
  onDeleteZone: (id: string) => void
}

function NumericField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="numeric-field"><span>{label}</span><input type="number" value={value} min={40} onChange={(event) => onChange(event.currentTarget.valueAsNumber)} /><em>mm</em></label>
}

export function InspectorPanel({ plan, item, zone, issueIds, onUpdateDesk, onUpdateItem, onRotate, onDeleteItem, onUpdateZone, onDeleteZone }: InspectorPanelProps) {
  const isIssue = item ? issueIds.includes(item.id) : false
  const definition = item ? getDeviceDefinition(item.type) : null
  const zoneDefinition = zone ? getZoneKindDefinition(zone.kind) : null
  return (
    <aside className="inspector-panel">
      <div className="module-heading">
        <div><span className="eyebrow">03 / 检查</span><h2>尺寸检查</h2></div>
        <Ruler size={18} className="muted-icon" />
      </div>
      <div className="desk-size-card">
        <div className="field-heading"><span>桌面画布</span><span className="field-status">实时</span></div>
        <div className="desk-size-fields">
          <NumericField label="宽度" value={plan.deskWidthMm} onChange={(value) => onUpdateDesk('deskWidthMm', value)} />
          <NumericField label="深度" value={plan.deskHeightMm} onChange={(value) => onUpdateDesk('deskHeightMm', value)} />
        </div>
        <p className="helper-text">建议保留 40 mm 走线缓冲空间</p>
      </div>
      {item && definition ? (
        <div className="item-editor">
          <div className="selected-item-heading"><span className="selected-swatch" style={{ backgroundColor: definition.color }} /> <div><strong>{definition.label}</strong><small>{definition.hint}</small></div><span className="item-code">{definition.shortLabel}</span></div>
          {isIssue && <div className="issue-callout"><AlertTriangle size={16} /><span>设备与其他元素重叠、超出桌面边界，或压住了走线区 / 禁放区</span></div>}
          <div className="field-heading"><span>实际尺寸</span><span className="unit-label">单位：毫米</span></div>
          <div className="two-column-fields">
            <NumericField label="宽度" value={item.widthMm} onChange={(value) => onUpdateItem(item.id, { widthMm: value })} />
            <NumericField label="深度" value={item.heightMm} onChange={(value) => onUpdateItem(item.id, { heightMm: value })} />
          </div>
          <div className="field-heading position-heading"><span>位置</span><span className="unit-label">左上角坐标</span></div>
          <div className="two-column-fields">
            <NumericField label="X" value={Math.round(item.x)} onChange={(value) => onUpdateItem(item.id, { x: value })} />
            <NumericField label="Y" value={Math.round(item.y)} onChange={(value) => onUpdateItem(item.id, { y: value })} />
          </div>
          <div className="rotation-row"><span><Crosshair size={15} /> 旋转角度 <strong>{Math.round(item.rotation)}°</strong></span><div className="rotation-actions"><button aria-label="逆时针旋转 15 度" onClick={() => onRotate(item.id, -15)} type="button"><RotateCcw size={15} /></button><button aria-label="顺时针旋转 15 度" onClick={() => onRotate(item.id, 15)} type="button"><RotateCw size={15} /></button></div></div>
          <button className="remove-item-button" onClick={() => onDeleteItem(item.id)} type="button"><Trash2 size={15} /> 移除这个设备</button>
        </div>
      ) : zone && zoneDefinition ? (
        <div className="item-editor">
          <div className="selected-item-heading"><span className="selected-swatch zone-swatch" style={{ backgroundColor: zone.color }} /> <div><strong>{zoneDefinition.label}</strong><small>{zoneDefinition.hint}</small></div><span className="item-code">ZONE</span></div>
          <div className="zone-callout"><span>{zoneDefinition.blocksItems ? '设备落入此分区会被计为布局问题' : '此分区仅作规划参考，不参与问题统计'}</span></div>
          <div className="field-heading"><span>分区名称</span><span className="unit-label">显示在画布上</span></div>
          <label className="text-field"><input type="text" value={zone.name} maxLength={20} onChange={(event) => onUpdateZone(zone.id, { name: event.currentTarget.value })} /></label>
          <div className="field-heading position-heading"><span>分区范围</span><span className="unit-label">单位：毫米</span></div>
          <div className="two-column-fields">
            <NumericField label="宽度" value={zone.widthMm} onChange={(value) => onUpdateZone(zone.id, { widthMm: value })} />
            <NumericField label="深度" value={zone.heightMm} onChange={(value) => onUpdateZone(zone.id, { heightMm: value })} />
          </div>
          <div className="field-heading position-heading"><span>位置</span><span className="unit-label">左上角坐标</span></div>
          <div className="two-column-fields">
            <NumericField label="X" value={Math.round(zone.x)} onChange={(value) => onUpdateZone(zone.id, { x: value })} />
            <NumericField label="Y" value={Math.round(zone.y)} onChange={(value) => onUpdateZone(zone.id, { y: value })} />
          </div>
          <button className="remove-item-button" onClick={() => onDeleteZone(zone.id)} type="button"><Trash2 size={15} /> 移除这个分区</button>
        </div>
      ) : (
        <div className="empty-inspector"><span className="empty-illustration">⌖</span><strong>选择一个设备或分区</strong><p>点击画布上的设备查看尺寸、位置和旋转控制；点击分区可调整名称与范围。</p></div>
      )}
    </aside>
  )
}
