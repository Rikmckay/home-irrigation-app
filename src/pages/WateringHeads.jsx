import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import LocationPicker from '../components/LocationPicker'
import { Plus, Pencil, Trash2, MapPin, Save, X, Droplets, ChevronDown, ChevronRight } from 'lucide-react'

const HEAD_TYPES = ['Rotor', 'Popup', 'Mister', 'Drip', 'Other']

const TYPE_COLORS = {
  Rotor:  'bg-blue-100 text-blue-800',
  Popup:  'bg-green-100 text-green-800',
  Mister: 'bg-teal-100 text-teal-800',
  Drip:   'bg-orange-100 text-orange-800',
  Other:  'bg-gray-100 text-gray-700',
}

const EMPTY = {
  valve_id: '',
  connection_box_id: '',
  name: '',
  head_type: 'Rotor',
  area_description: '',
  notes: '',
  lat: null,
  lng: null,
}

export default function WateringHeads() {
  const [heads, setHeads] = useState([])
  const [valves, setValves] = useState([])
  const [controllers, setControllers] = useState([])
  const [connBoxes, setConnBoxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const toast = useToast()
  const { confirm, Dialog } = useConfirm()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [h, v, c, cb] = await Promise.all([
      supabase.from('watering_heads').select('*').order('name'),
      supabase.from('valves').select('*').order('name'),
      supabase.from('controllers').select('*').order('name'),
      supabase.from('connection_boxes').select('*').order('name'),
    ])
    if (h.error) toast('Failed to load watering heads', 'error')
    setHeads(h.data || [])
    setValves(v.data || [])
    setControllers(c.data || [])
    setConnBoxes(cb.data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditId(null)
    setForm({ ...EMPTY, valve_id: valves[0]?.id || '' })
    setShowForm(true)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  function openEdit(head) {
    setEditId(head.id)
    setForm({
      valve_id: head.valve_id || '',
      connection_box_id: head.connection_box_id || '',
      name: head.name,
      head_type: head.head_type || 'Rotor',
      area_description: head.area_description || '',
      notes: head.notes || '',
      lat: head.lat,
      lng: head.lng,
    })
    setShowForm(true)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  function cancel() {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY)
  }

  async function save() {
    if (!form.name.trim()) { toast('Name is required', 'error'); return }
    if (!form.valve_id) { toast('Valve is required', 'error'); return }
    setSaving(true)
    const payload = {
      valve_id: form.valve_id,
      connection_box_id: form.connection_box_id || null,
      name: form.name.trim(),
      head_type: form.head_type || null,
      area_description: form.area_description.trim() || null,
      notes: form.notes.trim() || null,
      lat: form.lat,
      lng: form.lng,
    }
    const { error } = editId
      ? await supabase.from('watering_heads').update(payload).eq('id', editId)
      : await supabase.from('watering_heads').insert(payload)
    setSaving(false)
    if (error) { toast(`Save failed: ${error.message}`, 'error'); return }
    toast(editId ? 'Watering head updated' : 'Watering head added')
    cancel()
    loadAll()
  }

  async function del(head) {
    const ok = await confirm(`Delete "${head.name}"?`)
    if (!ok) return
    const { error } = await supabase.from('watering_heads').delete().eq('id', head.id)
    if (error) toast(`Delete failed: ${error.message}`, 'error')
    else { toast('Watering head deleted'); loadAll() }
  }

  function toggleCollapse(valveId) {
    setCollapsed(prev => ({ ...prev, [valveId]: !prev[valveId] }))
  }

  const ctrlName = (id) => controllers.find(c => c.id === id)?.name
  const cbName   = (id) => connBoxes.find(cb => cb.id === id)?.name

  const grouped = valves.map(valve => ({
    valve,
    ctrl: controllers.find(c => c.id === valve.controller_id),
    heads: heads.filter(h => h.valve_id === valve.id),
  })).filter(g => g.heads.length > 0)

  const orphanHeads = heads.filter(h => !valves.find(v => v.id === h.valve_id))

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-5">
        {Dialog}

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Droplets size={20} className="text-green-600" /> Watering Heads
          </h1>
          {!showForm && (
            <button
              onClick={openAdd}
              disabled={valves.length === 0}
              title={valves.length === 0 ? 'Add a valve first' : ''}
              className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm active:bg-green-800 touch-manipulation"
            >
              <Plus size={16} /> Add Head
            </button>
          )}
        </div>

        {valves.length === 0 && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Add at least one valve before adding watering heads.
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-base">
              {editId ? 'Edit Watering Head' : 'New Watering Head'}
            </h2>

            {/* Valve + Head Type — stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valve *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                  value={form.valve_id}
                  onChange={e => setForm(f => ({ ...f, valve_id: e.target.value }))}
                >
                  <option value="">Select valve…</option>
                  {controllers.map(ctrl => {
                    const ctrlValves = valves.filter(v => v.controller_id === ctrl.id)
                    if (ctrlValves.length === 0) return null
                    return (
                      <optgroup key={ctrl.id} label={ctrl.name}>
                        {ctrlValves.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name}{v.zone_name ? ` — ${v.zone_name}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Head Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                  value={form.head_type}
                  onChange={e => setForm(f => ({ ...f, head_type: e.target.value }))}
                >
                  {HEAD_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Name + Connection Box — stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  inputMode="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Front Lawn Rotor 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection Box</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                  value={form.connection_box_id}
                  onChange={e => setForm(f => ({ ...f, connection_box_id: e.target.value }))}
                >
                  <option value="">None</option>
                  {connBoxes.map(cb => (
                    <option key={cb.id} value={cb.id}>{cb.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area Description</label>
              <input
                type="text"
                inputMode="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                value={form.area_description}
                onChange={e => setForm(f => ({ ...f, area_description: e.target.value }))}
                placeholder="e.g. Waters the front lawn, east half"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Brand, radius, issues..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <LocationPicker
                lat={form.lat}
                lng={form.lng}
                onChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={save}
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-green-600 text-white px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors active:bg-green-800 touch-manipulation"
              >
                <Save size={15} /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={cancel}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-gray-600 bg-gray-100 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors touch-manipulation"
              >
                <X size={15} /> Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
        ) : heads.length === 0 ? (
          <div className="text-center text-gray-400 py-16 space-y-2">
            <Droplets size={40} className="mx-auto opacity-30" />
            <p className="text-sm">No watering heads yet. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ valve, ctrl, heads: vHeads }) => (
              <div key={valve.id} className="space-y-2">
                <button
                  onClick={() => toggleCollapse(valve.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-green-50 rounded-lg text-sm font-semibold text-green-900 hover:bg-green-100 transition-colors touch-manipulation"
                >
                  {collapsed[valve.id]
                    ? <ChevronRight size={16} />
                    : <ChevronDown size={16} />}
                  <span>
                    {valve.name}
                    {valve.zone_name ? ` — ${valve.zone_name}` : ''}
                  </span>
                  {ctrl && (
                    <span className="text-green-600 font-normal text-xs">({ctrl.name})</span>
                  )}
                  <span className="ml-auto text-green-600 font-normal text-xs">
                    {vHeads.length} head{vHeads.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {!collapsed[valve.id] && vHeads.map(head => (
                  <HeadCard
                    key={head.id}
                    head={head}
                    cbName={cbName(head.connection_box_id)}
                    onEdit={() => openEdit(head)}
                    onDelete={() => del(head)}
                  />
                ))}
              </div>
            ))}

            {orphanHeads.length > 0 && (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Unknown Valve
                </div>
                {orphanHeads.map(head => (
                  <HeadCard
                    key={head.id}
                    head={head}
                    cbName={cbName(head.connection_box_id)}
                    onEdit={() => openEdit(head)}
                    onDelete={() => del(head)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function HeadCard({ head, cbName, onEdit, onDelete }) {
  const typeClass = TYPE_COLORS[head.head_type] || TYPE_COLORS.Other
  return (
    /* Reduced indent on mobile */
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3 shadow-sm hover:shadow-md transition-shadow ml-2 sm:ml-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{head.name}</span>
          {head.head_type && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${typeClass}`}>
              {head.head_type}
            </span>
          )}
          {head.lat && head.lng ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
              <MapPin size={10} /> Located
            </span>
          ) : (
            <span className="text-xs text-gray-400">No location</span>
          )}
        </div>
        {head.area_description && (
          <p className="text-sm text-gray-600 mt-0.5">{head.area_description}</p>
        )}
        <div className="flex items-center gap-3 mt-0.5">
          {head.connection_box_id && cbName && (
            <p className="text-xs text-gray-400">Box: {cbName}</p>
          )}
          {head.notes && (
            <p className="text-xs text-gray-400 truncate">{head.notes}</p>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
          title="Edit"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
