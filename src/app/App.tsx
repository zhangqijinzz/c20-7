import { Check, Cloud, FileCheck2, Layers, PanelTop, TriangleAlert } from 'lucide-react'
import { DEVICE_DEFINITIONS, ZONE_DEFINITIONS } from '../shared/models'
import { CanvasStage } from '../features/canvas/components/CanvasStage'
import { DevicePalette } from '../features/materials/components/DevicePalette'
import { InspectorPanel } from '../features/inspection/components/InspectorPanel'
import { PreviewOverlay } from '../features/inspection/components/PreviewOverlay'
import { PlanSidebar } from '../features/workbench/components/PlanSidebar'
import { useWorkspaceViewModel } from '../features/workbench/workbenchViewModel'

export function App() {
  const viewModel = useWorkspaceViewModel()
  const { document, activePlan, selectedItem, selectedZone, analysis, issueCount } = viewModel

  if (!document || !activePlan) {
    return <main className="loading-screen"><span className="loading-orb" /><p>正在打开 FocusDesk…</p></main>
  }

  return (
    <main className="app-shell">
      <PlanSidebar plans={document.plans} activePlanId={document.activePlanId} onSelect={viewModel.selectPlan} onCreate={viewModel.createNewPlan} onDuplicate={viewModel.duplicatePlan} onDelete={viewModel.deleteCurrentPlan} />
      <section className="app-main">
        <header className="topbar">
          <div className="breadcrumb"><span>工作台</span><span>/</span><strong>{activePlan.name}</strong></div>
          <div className="topbar-actions"><span className={`save-state ${viewModel.status === 'error' ? 'save-error' : ''}`}><Cloud size={15} /> {viewModel.status === 'saving' ? '保存中…' : viewModel.status === 'error' ? '保存异常' : '已保存到本地'}</span><button className="preview-button" onClick={viewModel.openPreview} type="button"><PanelTop size={16} /> 预览方案</button><span className="avatar">FD</span></div>
        </header>
        <div className="workspace-content">
          <div className="page-heading"><div><span className="eyebrow">DESK PLANNER / {new Date().getFullYear()}</span><h1>把桌面，变成一张清晰的地图。</h1><p>先放置，再调整。每个尺寸、间距与功能分区都在你的掌控之中。</p></div><div className="feedback-chip"><span className={viewModel.status === 'error' ? 'feedback-icon error' : 'feedback-icon'}>{viewModel.status === 'error' ? <TriangleAlert size={14} /> : <Check size={14} />}</span>{viewModel.feedback}</div></div>
          <div className="metrics-row"><div className="metric-card"><span>桌面尺寸</span><strong>{activePlan.deskWidthMm} <i>×</i> {activePlan.deskHeightMm}<small>mm</small></strong><em>可用面积</em></div><div className="metric-card"><span>已放置设备 / 分区</span><strong>{activePlan.items.length}<small>件</small><i className="metric-sep">/</i>{activePlan.zones.length}<small>区</small></strong><em>{selectedItem ? '已选中：设备' : selectedZone ? '已选中：分区' : '点击对象可编辑'}</em></div><div className={`metric-card ${analysis.status === 'attention' ? 'metric-warning' : ''}`}><span>空间检查</span><strong>{issueCount === 0 ? '通过' : `${issueCount} 个问题`}</strong><em>{issueCount === 0 ? '布局目前很舒展' : '重叠 / 越界 / 分区冲突'}</em></div><div className="coverage-card"><div><span>占用率</span><strong>{analysis.coveragePercent}%</strong></div><div className="coverage-bar"><span style={{ width: `${Math.max(4, analysis.coveragePercent)}%` }} /></div><small>设备投影面积 / 桌面面积</small></div></div>
          <div className="editor-grid"><DevicePalette devices={DEVICE_DEFINITIONS} zones={ZONE_DEFINITIONS} onAddDevice={viewModel.addItem} onAddZone={viewModel.addZone} /><section className="stage-panel"><div className="stage-header"><div><span className="eyebrow">LIVE CANVAS</span><h2>{activePlan.name}</h2></div><div className={`status-pill ${analysis.status === 'attention' ? 'status-attention' : ''}`}>{analysis.status === 'attention' ? <TriangleAlert size={14} /> : <FileCheck2 size={14} />}{analysis.status === 'attention' ? '需要调整' : '布局健康'}</div></div><CanvasStage plan={activePlan} selected={viewModel.selection} analysis={analysis} onSelect={viewModel.selectObject} onMoveItem={viewModel.moveItem} onMoveZone={viewModel.moveZone} onResizeZone={viewModel.resizeZone} /></section><InspectorPanel plan={activePlan} selectedItem={selectedItem} selectedZone={selectedZone} analysis={analysis} onUpdateDesk={viewModel.updateDesk} onUpdateItem={viewModel.updateItem} onUpdateZone={viewModel.updateZone} onRotate={viewModel.rotateItem} onDeleteItem={viewModel.removeItem} onDeleteZone={viewModel.removeZone} /></div>
          <div className="zone-summary">
            <span className="zone-summary-title"><Layers size={13} /> 分区检查口径</span>
            <span><i className="legend-dot forbidden-dot" /> 禁放区：设备落入即计 1 个问题</span>
            <span><i className="legend-dot cable-dot" /> 走线区：设备压住即计 1 个问题</span>
            <span><i className="legend-dot device-dot" /> 设备区：仅做摆放提示，不参与检查</span>
          </div>
        </div>
      </section>
      {viewModel.isPreviewOpen && <PreviewOverlay plan={activePlan} analysis={analysis} issueCount={issueCount} onClose={viewModel.closePreview} />}
    </main>
  )
}
