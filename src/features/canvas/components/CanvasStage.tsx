import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Move, RotateCw } from 'lucide-react'
import type { CanvasSelection, DeskItem, DeskZone, LayoutAnalysis, WorkspacePlan, ZoneType } from '../../../shared/models'
import { getDeviceDefinition, getZoneDefinition } from '../../../shared/models'
import { getItemBounds } from '../../../shared/layoutRules'
import { type ZoneResizeHandle } from '../canvasViewModel'

interface CanvasStageProps {
  plan: WorkspacePlan
  selected: CanvasSelection | null
  analysis: LayoutAnalysis
  readOnly?: boolean
  onSelect: (selection: CanvasSelection | null) => void
  onMoveItem: (id: string, x: number, y: number) => void
  onMoveZone: (id: string, x: number, y: number) => void
  onResizeZone: (id: string, handle: ZoneResizeHandle, pointerX: number, pointerY: number) => void
}

type DragState =
  | { kind: 'item'; id: string; offsetX: number; offsetY: number }
  | { kind: 'zone'; id: string; offsetX: number; offsetY: number }
  | { kind: 'zone-resize'; id: string; handle: ZoneResizeHandle }

const RESIZE_HANDLES: ZoneResizeHandle[] = ['nw', 'ne', 'sw', 'se']
const HANDLE_SIZE = 26

function isZoneType(value: string): value is ZoneType {
  return value === 'cable' || value === 'device' || value === 'forbidden'
}

function zonePattern(zone: DeskZone): string {
  return isZoneType(zone.type) ? `zone-pattern-${zone.type}` : ''
}

export function CanvasStage({ plan, selected, analysis, readOnly = false, onSelect, onMoveItem, onMoveZone, onResizeZone }: CanvasStageProps) {
  const stageRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const scaleToMm = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: ((clientX - rect.left) / rect.width) * plan.deskWidthMm, y: ((clientY - rect.top) / rect.height) * plan.deskHeightMm }
  }, [plan.deskHeightMm, plan.deskWidthMm])

  useEffect(() => {
    if (!drag) return
    const handleMove = (event: PointerEvent) => {
      const point = scaleToMm(event.clientX, event.clientY)
      if (!point) return
      if (drag.kind === 'item') onMoveItem(drag.id, point.x - drag.offsetX, point.y - drag.offsetY)
      else if (drag.kind === 'zone') onMoveZone(drag.id, point.x - drag.offsetX, point.y - drag.offsetY)
      else onResizeZone(drag.id, drag.handle, point.x, point.y)
    }
    const handleUp = () => setDrag(null)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => { window.removeEventListener('pointermove', handleMove); window.removeEventListener('pointerup', handleUp) }
  }, [drag, onMoveItem, onMoveZone, onResizeZone, scaleToMm])

  const startItemDrag = (event: ReactPointerEvent<SVGGElement>, item: DeskItem) => {
    if (readOnly) return
    event.stopPropagation()
    const point = scaleToMm(event.clientX, event.clientY)
    if (!point) return
    onSelect({ kind: 'item', id: item.id })
    setDrag({ kind: 'item', id: item.id, offsetX: point.x - item.x, offsetY: point.y - item.y })
  }

  const startZoneDrag = (event: ReactPointerEvent<SVGGElement>, zone: DeskZone) => {
    if (readOnly) return
    event.stopPropagation()
    const point = scaleToMm(event.clientX, event.clientY)
    if (!point) return
    onSelect({ kind: 'zone', id: zone.id })
    setDrag({ kind: 'zone', id: zone.id, offsetX: point.x - zone.x, offsetY: point.y - zone.y })
  }

  const startZoneResize = (event: ReactPointerEvent<SVGRectElement>, zone: DeskZone, handle: ZoneResizeHandle) => {
    if (readOnly) return
    event.stopPropagation()
    onSelect({ kind: 'zone', id: zone.id })
    setDrag({ kind: 'zone-resize', id: zone.id, handle })
  }

  const selectedZone = selected?.kind === 'zone' ? plan.zones.find((zone) => zone.id === selected.id) ?? null : null

  return (
    <div className="canvas-wrap">
      <div className="canvas-toolbar"><span><Move size={14} /> 拖动设备或分区调整位置</span><span><RotateCw size={14} /> {readOnly ? '预览模式' : '选中分区可拖四角改范围'}</span></div>
      <svg ref={stageRef} className="desk-canvas" viewBox={`0 0 ${plan.deskWidthMm} ${plan.deskHeightMm}`} role="img" aria-label={`桌面布局画布，${plan.deskWidthMm}乘${plan.deskHeightMm}毫米`} onPointerDown={() => !readOnly && onSelect(null)}>
        <defs>
          <pattern id="desk-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d8e1ed" strokeWidth="1" /></pattern>
          <filter id="item-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#20304a" floodOpacity=".12" /></filter>
          <pattern id="zone-pattern-cable" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="26" stroke="#6fa8e8" strokeWidth="6" strokeOpacity=".28" /></pattern>
          <pattern id="zone-pattern-device" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.2" fill="#5fbb8d" fillOpacity=".3" /></pattern>
          <pattern id="zone-pattern-forbidden" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 0 22 L 22 0" stroke="#e8806f" strokeWidth="4" strokeOpacity=".3" /></pattern>
        </defs>
        <rect width={plan.deskWidthMm} height={plan.deskHeightMm} rx="22" fill="#f8fafc" />
        <rect width={plan.deskWidthMm} height={plan.deskHeightMm} rx="22" fill="url(#desk-grid)" />
        <text x="34" y="48" fill="#a0aec0" fontSize="20" letterSpacing="3">FOCUS ZONE / {plan.deskWidthMm} × {plan.deskHeightMm} MM</text>

        {plan.zones.map((zone) => {
          const isSelected = selected?.kind === 'zone' && selected.id === zone.id
          const hasViolation = analysis.zoneViolations.some((violation) => violation.zoneId === zone.id)
          const labelWidth = Math.max(110, zone.name.length * 24 + 44)
          return (
            <g
              className={`desk-zone ${isSelected ? 'is-selected' : ''} ${hasViolation ? 'has-issue' : ''} zone-${zone.type}`}
              key={zone.id}
              onPointerDown={(event) => startZoneDrag(event, zone)}
              role="button"
              tabIndex={0}
              aria-label={`${getZoneDefinition(zone.type).label}：${zone.name}，${zone.widthMm}乘${zone.heightMm}毫米${hasViolation ? '，存在设备冲突' : ''}`}
            >
              <rect x={zone.x} y={zone.y} width={zone.widthMm} height={zone.heightMm} rx="16" fill={zone.color} fillOpacity=".13" />
              <rect x={zone.x} y={zone.y} width={zone.widthMm} height={zone.heightMm} rx="16" fill={`url(#${zonePattern(zone)})`} />
              <rect className="zone-border" x={zone.x} y={zone.y} width={zone.widthMm} height={zone.heightMm} rx="16" fill="none" stroke={zone.color} />
              <g className="zone-label" transform={`translate(${zone.x + 14} ${zone.y + 12})`} pointerEvents="none">
                <rect width={labelWidth} height="34" rx="17" fill={zone.color} fillOpacity=".92" />
                <text x="16" y="23" fill="#ffffff" fontSize="19" fontWeight="700">{zone.name}</text>
              </g>
            </g>
          )
        })}

        {plan.items.map((item) => {
          const definition = getDeviceDefinition(item.type)
          const isSelected = selected?.kind === 'item' && selected.id === item.id
          const hasIssue = analysis.overlapIds.includes(item.id)
            || analysis.outOfBoundsIds.includes(item.id)
            || analysis.forbiddenItemIds.includes(item.id)
            || analysis.cableItemIds.includes(item.id)
          const inForbidden = analysis.forbiddenItemIds.includes(item.id)
          const inCable = analysis.cableItemIds.includes(item.id)
          const cx = item.x + item.widthMm / 2
          const cy = item.y + item.heightMm / 2
          const issueTitle = inForbidden ? '设备落入禁放区' : inCable ? '设备压住走线区' : '设备与其他元素重叠或越界'
          return <g className={`desk-item ${isSelected ? 'is-selected' : ''} ${hasIssue ? 'has-issue' : ''}`} key={item.id} onPointerDown={(event) => startItemDrag(event, item)} role="button" tabIndex={0} aria-label={`${definition.label}，${item.widthMm}乘${item.heightMm}毫米${hasIssue ? `，${issueTitle}` : ''}`}>
            <g transform={`translate(${cx} ${cy}) rotate(${item.rotation})`}>
              <rect x={-item.widthMm / 2} y={-item.heightMm / 2} width={item.widthMm} height={item.heightMm} rx={Math.min(24, item.heightMm / 5)} fill={definition.color} filter="url(#item-shadow)" />
              <rect className="item-inner-line" x={-item.widthMm / 2 + 12} y={-item.heightMm / 2 + 12} width={Math.max(0, item.widthMm - 24)} height={Math.max(0, item.heightMm - 24)} rx={12} fill="none" />
              <text x="0" y="5" textAnchor="middle" fill="#1f2e44" fontWeight="700" fontSize={Math.max(18, Math.min(32, item.widthMm / 16))}>{definition.shortLabel}</text>
              <text x="0" y="30" textAnchor="middle" fill="#44546b" fontSize="16">{item.widthMm} × {item.heightMm}</text>
            </g>
            {isSelected && <rect className="selection-box" x={getItemBounds(item).left - 8} y={getItemBounds(item).top - 8} width={getItemBounds(item).width + 16} height={getItemBounds(item).height + 16} rx="12" fill="none" />}
            {hasIssue && <g className="issue-badge" transform={`translate(${Math.max(18, getItemBounds(item).right - 4)} ${Math.max(18, getItemBounds(item).top - 4)})`}><circle r="18" fill="#ef6a6a" /><text textAnchor="middle" y="7" fill="white" fontSize="22" fontWeight="700">!</text><title>{issueTitle}</title></g>}
          </g>
        })}

        {selectedZone && (
          <g className="zone-overlay" pointerEvents={readOnly ? 'none' : 'auto'}>
            <rect className="selection-box zone-selection-box" x={selectedZone.x - 7} y={selectedZone.y - 7} width={selectedZone.widthMm + 14} height={selectedZone.heightMm + 14} rx="14" fill="none" pointerEvents="none" />
            {!readOnly && RESIZE_HANDLES.map((handle) => {
              const hx = handle === 'nw' || handle === 'sw' ? selectedZone.x : selectedZone.x + selectedZone.widthMm
              const hy = handle === 'nw' || handle === 'ne' ? selectedZone.y : selectedZone.y + selectedZone.heightMm
              return <rect
                key={handle}
                className="zone-resize-handle"
                x={hx - HANDLE_SIZE / 2}
                y={hy - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                rx={6}
                onPointerDown={(event) => startZoneResize(event, selectedZone, handle)}
              />
            })}
          </g>
        )}

        {analysis.zoneViolations.map((violation) => {
          const zone = plan.zones.find((candidate) => candidate.id === violation.zoneId)
          if (!zone) return null
          return <g className="zone-issue-badge" key={`${violation.zoneId}-${violation.kind}`} transform={`translate(${zone.x + zone.widthMm - 6} ${zone.y - 4})`} pointerEvents="none">
            <circle r="18" fill="#ef6a6a" />
            <text textAnchor="middle" y="7" fill="white" fontSize="22" fontWeight="700">!</text>
            <title>{violation.kind === 'forbidden' ? '有设备落入禁放区' : '有设备压住走线区'}</title>
          </g>
        })}

        {plan.items.length === 0 && plan.zones.length === 0 && <g><circle cx={plan.deskWidthMm / 2} cy={plan.deskHeightMm / 2 - 12} r="32" fill="#e8eef6" /><text x={plan.deskWidthMm / 2} y={plan.deskHeightMm / 2 + 2} textAnchor="middle" fill="#8493a8" fontSize="22">+</text><text x={plan.deskWidthMm / 2} y={plan.deskHeightMm / 2 + 48} textAnchor="middle" fill="#8493a8" fontSize="22">从左侧添加第一件设备或功能分区</text></g>}
      </svg>
      <div className="canvas-legend">
        <span><i className="legend-dot cable-dot" /> 走线区</span>
        <span><i className="legend-dot device-dot" /> 设备区</span>
        <span><i className="legend-dot forbidden-dot" /> 禁放区</span>
        <span><i className="legend-dot issue-dot" /> 冲突 / 越界</span>
        <span className="canvas-scale">网格：50 mm</span>
      </div>
    </div>
  )
}
