import { Ban, Cable, Keyboard, LampDesk, LayoutGrid, Monitor, Speaker, TabletSmartphone } from 'lucide-react'
import type { DeviceDefinition, DeviceType, ZoneKind, ZoneKindDefinition } from '../../../shared/models'

interface DevicePaletteProps {
  devices: DeviceDefinition[]
  zoneKinds: ZoneKindDefinition[]
  onAdd: (type: DeviceType) => void
  onAddZone: (kind: ZoneKind) => void
}

const icons = { monitor: Monitor, keyboard: Keyboard, lamp: LampDesk, speaker: Speaker, stand: TabletSmartphone }
const zoneIcons = { cable: Cable, device: LayoutGrid, forbidden: Ban }

export function DevicePalette({ devices, zoneKinds, onAdd, onAddZone }: DevicePaletteProps) {
  return (
    <section className="module-panel palette-panel" aria-labelledby="palette-title">
      <div className="module-heading">
        <div>
          <span className="eyebrow">01 / 素材</span>
          <h2 id="palette-title">设备素材</h2>
        </div>
        <span className="module-count">{devices.length}</span>
      </div>
      <p className="panel-description">点击添加到桌面，尺寸可在右侧调整。</p>
      <div className="device-list">
        {devices.map((device) => {
          const Icon = icons[device.type]
          return (
            <button className="device-card" key={device.type} onClick={() => onAdd(device.type)} type="button">
              <span className="device-icon" style={{ backgroundColor: device.color }}><Icon size={20} strokeWidth={1.8} /></span>
              <span className="device-copy"><strong>{device.label}</strong><small>{device.hint}</small></span>
              <span className="add-mark">+</span>
            </button>
          )
        })}
      </div>
      <div className="module-heading zone-heading">
        <div>
          <span className="eyebrow">02 / 分区</span>
          <h2>功能分区</h2>
        </div>
        <span className="module-count">{zoneKinds.length}</span>
      </div>
      <p className="panel-description">在设备下层画出走线、设备、禁放区域。</p>
      <div className="device-list">
        {zoneKinds.map((zoneKind) => {
          const Icon = zoneIcons[zoneKind.kind]
          return (
            <button className="device-card" key={zoneKind.kind} onClick={() => onAddZone(zoneKind.kind)} type="button">
              <span className="device-icon zone-icon" style={{ backgroundColor: zoneKind.color }}><Icon size={20} strokeWidth={1.8} /></span>
              <span className="device-copy"><strong>{zoneKind.label}</strong><small>{zoneKind.hint}</small></span>
              <span className="add-mark">+</span>
            </button>
          )
        })}
      </div>
      <div className="palette-tip"><span>⌘</span><span>可先放置，再用尺寸检查微调</span></div>
    </section>
  )
}
