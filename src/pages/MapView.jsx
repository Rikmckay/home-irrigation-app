import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { Filter, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react'

const DEFAULT_CENTER = [48.4284, -123.3656]
const DEFAULT_ZOOM = 14

// ─── Marker icon factory ───────────────────────────────────────────────
function makeIcon(color, label, sizePx) {
  const html = `<div style="
    width:${sizePx}px;
    height:${sizePx}px;
    background:${color};
    border-radius:50%;
    border:2.5px solid white;
    display:flex;
    align-items:center;
    justify-content:center;
    color:white;
    font-weight:700;
    font-size:${Math.floor(sizePx * 0.42)}px;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
    font-family:system-ui,sans-serif;
    line-height:1;
  ">${label}</div>`

  return L.divIcon({
    className: '',
    html,
    iconSize: [sizePx, sizePx],
    iconAnchor: [sizePx / 2, sizePx / 2],
    popupAnchor: [0, -(sizePx / 2) - 2],
  })
}

const HEAD_LETTER = { Rotor: 'R', Popup: 'P', Mister: 'M', Drip: 'D', Other: 'O' }

const icons = {
  controller: (dim) => makeIcon(dim ? '#1d4ed8' : '#93c5fd', '⚡', 36),
  valveBox:   (dim) => makeIcon(dim ? '#f97316' : '#fdba74', 'VB', 28),
  connBox:    (dim) => makeIcon(dim ? '#ca8a04' : '#fde047', 'CB', 28),
  head:       (type, dim) => makeIcon(dim ? '#15803d' : '#86efac', HEAD_LETTER[type] || 'H', 22),
}

// ─── FlyTo: responds to filter changes ────────────────────────────────
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    if (target.bounds && target.bounds.length >= 2) {
      map.fitBounds(target.bounds, { padding: [70, 70], maxZoom: 20 })
    } else if (target.bounds && target.bounds.length === 1) {
      map.setView(target.bounds[0], 19)
    } else if (target.center) {
      map.setView(target.center, target.zoom || 17)
    }
  }, [target, map])
  return null
}

// ─── Main component ───────────────────────────────────────────────────
export default function MapView() {
  const [all, setAll] = useState({
    controllers: [],
    valveBoxes: [],
    connBoxes: [],
    valves: [],
    heads: [],
  })
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedCtrl, setSelectedCtrl] = useState('')
  const [selectedValve, setSelectedValve] = useState('')
  const [flyTarget, setFlyTarget] = useState(null)

  // ── Fetch all data ──────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [c, vb, cb, v, h] = await Promise.all([
      supabase.from('controllers').select('*').order('name'),
      supabase.from('valve_boxes').select('*').order('name'),
      supabase.from('connection_boxes').select('*').order('name'),
      supabase.from('valves').select('*').order('name'),
      supabase.from('watering_heads').select('*').order('name'),
    ])
    setAll({
      controllers: c.data || [],
      valveBoxes: vb.data || [],
      connBoxes: cb.data || [],
      valves: v.data || [],
      heads: h.data || [],
    })
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Derived sets for filtering ──────────────────────────────────────
  const ctrlValves = selectedCtrl
    ? all.valves.filter(v => v.controller_id === selectedCtrl)
    : all.valves

  const activeValveIds = new Set(
    selectedValve ? [selectedValve] : ctrlValves.map(v => v.id)
  )

  const activeHeads = all.heads.filter(h => activeValveIds.has(h.valve_id))

  const activeVBIds = new Set(
    ctrlValves
      .filter(v => !selectedValve || v.id === selectedValve)
      .map(v => v.valve_box_id)
      .filter(Boolean)
  )

  const activeCBIds = new Set(activeHeads.map(h => h.connection_box_id).filter(Boolean))

  const isFiltered = !!(selectedCtrl || selectedValve)

  // ── Compute fly target when filter changes ──────────────────────────
  useEffect(() => {
    if (!isFiltered) { setFlyTarget(null); return }

    const points = []
    if (selectedValve) {
      const v = all.valves.find(x => x.id === selectedValve)
      if (v?.lat && v?.lng) points.push([v.lat, v.lng])
      activeHeads.forEach(h => { if (h.lat && h.lng) points.push([h.lat, h.lng]) })
    } else if (selectedCtrl) {
      const ctrl = all.controllers.find(x => x.id === selectedCtrl)
      if (ctrl?.lat && ctrl?.lng) points.push([ctrl.lat, ctrl.lng])
      ctrlValves.forEach(v => { if (v.lat && v.lng) points.push([v.lat, v.lng]) })
      activeHeads.forEach(h => { if (h.lat && h.lng) points.push([h.lat, h.lng]) })
    }

    setFlyTarget(points.length > 0 ? { bounds: points } : null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCtrl, selectedValve])

  // ── Dimming helpers ─────────────────────────────────────────────────
  const ctrlDim  = (c)  => isFiltered && c.id !== selectedCtrl
  const vbDim    = (vb) => isFiltered && !activeVBIds.has(vb.id)
  const cbDim    = (cb) => isFiltered && !activeCBIds.has(cb.id)
  const headDim  = (h)  => isFiltered && !activeValveIds.has(h.valve_id)

  // show valve boxes: unfiltered = all; filtered = only relevant ones
  const visibleVBs = isFiltered
    ? all.valveBoxes.filter(vb => activeVBIds.has(vb.id))
    : all.valveBoxes

  const visibleCBs = isFiltered
    ? all.connBoxes.filter(cb => activeCBIds.has(cb.id))
    : all.connBoxes

  return (
    <div className="relative w-full h-full">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div
        className={`absolute left-0 top-0 z-[1000] h-full transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="relative bg-white shadow-2xl w-64 h-full flex flex-col overflow-hidden">
          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <Filter size={14} /> Filter
              </h2>
              <button
                onClick={fetchAll}
                title="Refresh"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Controller filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Controller
              </label>
              <select
                className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                value={selectedCtrl}
                onChange={e => { setSelectedCtrl(e.target.value); setSelectedValve('') }}
              >
                <option value="">All Controllers</option>
                {all.controllers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Valve filter — only shown when a controller is selected */}
            {selectedCtrl && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Valve
                </label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  value={selectedValve}
                  onChange={e => setSelectedValve(e.target.value)}
                >
                  <option value="">All Valves</option>
                  {all.valves
                    .filter(v => v.controller_id === selectedCtrl)
                    .map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name}{v.zone_name ? ` — ${v.zone_name}` : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Clear filter */}
            {isFiltered && (
              <button
                onClick={() => { setSelectedCtrl(''); setSelectedValve(''); setFlyTarget(null) }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                <X size={12} /> Clear filter
              </button>
            )}

            {/* Stats */}
            {isFiltered && (
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                <p className="font-semibold">Showing:</p>
                <p>{ctrlValves.length} valve{ctrlValves.length !== 1 ? 's' : ''}</p>
                <p>{activeHeads.length} watering head{activeHeads.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>

          {/* Legend — pinned to bottom */}
          <div className="border-t border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Legend</p>
            <div className="space-y-2">
              {[
                { color: '#1d4ed8', label: 'Controller', size: 16 },
                { color: '#f97316', label: 'Valve Box', size: 13 },
                { color: '#ca8a04', label: 'Connection Box', size: 13 },
                { color: '#15803d', label: 'Watering Head', size: 11 },
              ].map(({ color, label, size }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                  <div style={{
                    width: size, height: size,
                    background: color,
                    borderRadius: '50%',
                    border: '1.5px solid white',
                    flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                  {label}
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">
                Head letters: <strong>R</strong>=Rotor <strong>P</strong>=Popup <strong>M</strong>=Mister <strong>D</strong>=Drip <strong>O</strong>=Other
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar toggle tab */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="absolute -right-7 top-6 bg-white border border-l-0 border-gray-200 rounded-r-lg shadow-md p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Sidebar open button when closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute left-0 top-6 z-[1000] bg-white border border-gray-200 rounded-r-lg shadow-md p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* ── Map ─────────────────────────────────────────────────────── */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo target={flyTarget} />

        {/* Controllers */}
        {all.controllers
          .filter(c => c.lat && c.lng)
          .map(c => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={icons.controller(ctrlDim(c))}>
              <Popup>
                <div className="text-sm min-w-[140px]">
                  <p className="font-bold text-blue-800 mb-0.5">⚡ Controller</p>
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  {c.notes && <p className="text-gray-500 text-xs mt-1">{c.notes}</p>}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Valve Boxes */}
        {visibleVBs
          .filter(vb => vb.lat && vb.lng)
          .map(vb => (
            <Marker key={vb.id} position={[vb.lat, vb.lng]} icon={icons.valveBox(vbDim(vb))}>
              <Popup>
                <div className="text-sm min-w-[140px]">
                  <p className="font-bold text-orange-700 mb-0.5">📦 Valve Box</p>
                  <p className="font-semibold text-gray-900">{vb.name}</p>
                  {vb.notes && <p className="text-gray-500 text-xs mt-1">{vb.notes}</p>}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Connection Boxes */}
        {visibleCBs
          .filter(cb => cb.lat && cb.lng)
          .map(cb => (
            <Marker key={cb.id} position={[cb.lat, cb.lng]} icon={icons.connBox(cbDim(cb))}>
              <Popup>
                <div className="text-sm min-w-[140px]">
                  <p className="font-bold text-yellow-700 mb-0.5">🔌 Connection Box</p>
                  <p className="font-semibold text-gray-900">{cb.name}</p>
                  {cb.notes && <p className="text-gray-500 text-xs mt-1">{cb.notes}</p>}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Watering Heads */}
        {activeHeads
          .filter(h => h.lat && h.lng)
          .map(h => (
            <Marker key={h.id} position={[h.lat, h.lng]} icon={icons.head(h.head_type, headDim(h))}>
              <Popup>
                <div className="text-sm min-w-[160px]">
                  <p className="font-bold text-green-800 mb-0.5">💧 {h.head_type || 'Head'}</p>
                  <p className="font-semibold text-gray-900">{h.name}</p>
                  {h.area_description && (
                    <p className="text-gray-600 text-xs mt-0.5">{h.area_description}</p>
                  )}
                  {h.notes && <p className="text-gray-400 text-xs mt-1">{h.notes}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  )
}
