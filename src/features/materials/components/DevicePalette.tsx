import { Keyboard, LampDesk, Monitor, Route, ShieldBan, Speaker, SquareDashed, TabletSmartphone } from 'lucide-react'
import type { DeviceDefinition, DeviceType, ZoneDefinition, ZoneType } from '../../../shared/models'

interface DevicePaletteProps {
  devices: DeviceDefinition[]
  zones: ZoneDefinition[]
  onAddDevice: (type: DeviceType) => void
  onAddZone: (type: ZoneType) => void
}

const deviceIcons = { monitor: Monitor, keyboard: Keyboard, lamp: LampDesk, speaker: Speaker, stand: TabletSmartphone }
const zoneIcons = { cable: Route, device: SquareDashed, forbidden: ShieldBan }

export function DevicePalette({ devices, zones, onAddDevice, onAddZone }: DevicePaletteProps) {
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
          const Icon = deviceIcons[device.type]
          return (
            <button className="device-card" key={device.type} onClick={() => onAddDevice(device.type)} type="button">
              <span className="device-icon" style={{ backgroundColor: device.color }}><Icon size={20} strokeWidth={1.8} /></span>
              <span className="device-copy"><strong>{device.label}</strong><small>{device.hint}</small></span>
              <span className="add-mark">+</span>
            </button>
          )
        })}
      </div>
      <div className="module-heading palette-subheading">
        <div>
          <span className="eyebrow">FUNCTION ZONES</span>
          <h2>功能分区</h2>
        </div>
        <span className="module-count">{zones.length}</span>
      </div>
      <p className="panel-description">分区画在设备下层，点按即可添加后在画布里框选范围。</p>
      <div className="device-list">
        {zones.map((zone) => {
          const Icon = zoneIcons[zone.type]
          return (
            <button className="device-card zone-card" key={zone.type} onClick={() => onAddZone(zone.type)} type="button">
              <span className="device-icon zone-icon" style={{ backgroundColor: `${zone.color}2e`, color: zone.color }}><Icon size={18} strokeWidth={1.9} /></span>
              <span className="device-copy"><strong>{zone.label}</strong><small>{zone.hint}</small></span>
              <span className="add-mark">+</span>
            </button>
          )
        })}
      </div>
      <div className="palette-tip"><span>⌘</span><span>设备压进禁放区或走线区会出现在检查结果里</span></div>
    </section>
  )
}
