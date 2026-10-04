import { AlertTriangle, Crosshair, Layers, RotateCcw, RotateCw, Ruler, Trash2 } from 'lucide-react'
import type { DeskItem, DeskZone, LayoutAnalysis, WorkspacePlan } from '../../../shared/models'
import { getDeviceDefinition, getZoneDefinition } from '../../../shared/models'

interface InspectorPanelProps {
  plan: WorkspacePlan
  selectedItem: DeskItem | null
  selectedZone: DeskZone | null
  analysis: LayoutAnalysis
  onUpdateDesk: (field: 'deskWidthMm' | 'deskHeightMm', value: number) => void
  onUpdateItem: (id: string, patch: Partial<Pick<DeskItem, 'widthMm' | 'heightMm' | 'x' | 'y'>>) => void
  onUpdateZone: (id: string, patch: Partial<Pick<DeskZone, 'name' | 'color' | 'widthMm' | 'heightMm' | 'x' | 'y'>>) => void
  onRotate: (id: string, delta: number) => void
  onDeleteItem: (id: string) => void
  onDeleteZone: (id: string) => void
}

const ZONE_COLOR_SWATCHES = ['#6fa8e8', '#5fbb8d', '#e8806f', '#b08ce0', '#e3b24f', '#5fb8c9']

function NumericField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="numeric-field"><span>{label}</span><input type="number" value={value} min={40} onChange={(event) => onChange(event.currentTarget.valueAsNumber)} /><em>mm</em></label>
}

export function InspectorPanel({ plan, selectedItem, selectedZone, analysis, onUpdateDesk, onUpdateItem, onUpdateZone, onRotate, onDeleteItem, onDeleteZone }: InspectorPanelProps) {
  return (
    <aside className="inspector-panel">
      <div className="module-heading">
        <div><span className="eyebrow">02 / 检查</span><h2>尺寸检查</h2></div>
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
      {selectedItem ? (
        <ItemEditor item={selectedItem} analysis={analysis} onUpdateItem={onUpdateItem} onRotate={onRotate} onDelete={onDeleteItem} />
      ) : selectedZone ? (
        <ZoneEditor zone={selectedZone} analysis={analysis} onUpdateZone={onUpdateZone} onDelete={onDeleteZone} />
      ) : (
        <div className="empty-inspector"><span className="empty-illustration">⌖</span><strong>选择一个对象</strong><p>点击画布上的设备或功能分区，查看尺寸、范围和检查结果。</p></div>
      )}
    </aside>
  )
}

function ItemEditor({ item, analysis, onUpdateItem, onRotate, onDelete }: {
  item: DeskItem
  analysis: LayoutAnalysis
  onUpdateItem: InspectorPanelProps['onUpdateItem']
  onRotate: InspectorPanelProps['onRotate']
  onDelete: (id: string) => void
}) {
  const inForbidden = analysis.forbiddenItemIds.includes(item.id)
  const inCable = analysis.cableItemIds.includes(item.id)
  const overlapOrBounds = analysis.overlapIds.includes(item.id) || analysis.outOfBoundsIds.includes(item.id)
  const isIssue = inForbidden || inCable || overlapOrBounds
  const definition = getDeviceDefinition(item.type)
  const issueText = inForbidden ? '设备落入了禁放区，请移出或调整分区范围' : inCable ? '设备压住了走线区，请移开或缩小走线范围' : '设备与其他元素重叠或超出桌面边界'
  return (
    <div className="item-editor">
      <div className="selected-item-heading"><span className="selected-kind-tag kind-item">设备</span><span className="selected-swatch" style={{ backgroundColor: definition.color }} /> <div><strong>{definition.label}</strong><small>{definition.hint}</small></div><span className="item-code">{definition.shortLabel}</span></div>
      {isIssue && <div className="issue-callout"><AlertTriangle size={16} /><span>{issueText}</span></div>}
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
      <button className="remove-item-button" onClick={() => onDelete(item.id)} type="button"><Trash2 size={15} /> 移除这个设备</button>
    </div>
  )
}

function ZoneEditor({ zone, analysis, onUpdateZone, onDelete }: {
  zone: DeskZone
  analysis: LayoutAnalysis
  onUpdateZone: InspectorPanelProps['onUpdateZone']
  onDelete: (id: string) => void
}) {
  const violation = analysis.zoneViolations.find((entry) => entry.zoneId === zone.id)
  const definition = getZoneDefinition(zone.type)
  const code = zone.type === 'cable' ? 'CABLE' : zone.type === 'device' ? 'AREA' : 'KEEP-OUT'
  return (
    <div className="item-editor zone-editor">
      <div className="selected-item-heading"><span className="selected-kind-tag kind-zone">分区</span><span className="selected-swatch" style={{ backgroundColor: zone.color }} /> <div><strong>{definition.label}</strong><small>{definition.hint}</small></div><span className="item-code">{code}</span></div>
      {violation && <div className="issue-callout"><AlertTriangle size={16} /><span>{violation.kind === 'forbidden' ? '有设备落入这个禁放区' : '有设备压住这个走线区'}（{violation.itemIds.length} 件）</span></div>}
      <div className="field-heading"><span>分区名称</span><span className="field-status">可自定义</span></div>
      <input
        className="zone-name-input"
        value={zone.name}
        maxLength={12}
        aria-label="分区名称"
        onChange={(event) => onUpdateZone(zone.id, { name: event.currentTarget.value })}
      />
      <div className="field-heading zone-color-heading"><span>分区颜色</span></div>
      <div className="zone-color-row">
        {ZONE_COLOR_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`使用颜色 ${color}`}
            className={`zone-color-swatch ${zone.color.toLowerCase() === color ? 'is-active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onUpdateZone(zone.id, { color })}
          />
        ))}
      </div>
      <div className="field-heading"><span>分区范围</span><span className="unit-label">单位：毫米</span></div>
      <div className="two-column-fields">
        <NumericField label="宽度" value={Math.round(zone.widthMm)} onChange={(value) => onUpdateZone(zone.id, { widthMm: value })} />
        <NumericField label="深度" value={Math.round(zone.heightMm)} onChange={(value) => onUpdateZone(zone.id, { heightMm: value })} />
      </div>
      <div className="field-heading position-heading"><span>位置</span><span className="unit-label">左上角坐标</span></div>
      <div className="two-column-fields">
        <NumericField label="X" value={Math.round(zone.x)} onChange={(value) => onUpdateZone(zone.id, { x: value })} />
        <NumericField label="Y" value={Math.round(zone.y)} onChange={(value) => onUpdateZone(zone.id, { y: value })} />
      </div>
      <p className="helper-text zone-helper"><Layers size={11} /> 也可以直接在画布上拖动分区，或拖四角调整范围</p>
      <button className="remove-item-button remove-zone-button" onClick={() => onDelete(zone.id)} type="button"><Trash2 size={15} /> 删除这个分区</button>
    </div>
  )
}
