import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import LocationPicker from '../components/LocationPicker'
import { Plus, Pencil, Trash2, MapPin, Save, X, Zap, ChevronDown, ChevronRight } from 'lucide-react'

const EMPTY = {
  controller_id: '',
  valve_box_id: '',
  name: '',
  zone_name: '',
  notes: '',
  lat: null,
  lng: null,
}

export default function Valves() {
  const [valves, setValves] = useState([])
  const [controllers, setControllers] = useState([])
  const [valveBoxes, setValveBoxes] = useState([])
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
    const [v, c, vb] = await Promise.all([
      supabase.from('valves').select('*').order('name'),
      supabase.from('controllers').select('*').order('name'),
      supabase.from('valve_boxes').select('*').order('name'),
    ])
    if (v.error) toast('Failed to load valves', 'error')
    setValves(v.data || [])
    setControllers(c.data || [])
    setValveBoxes(vb.data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditId(null)
    setForm({ ...EMPTY, controller_id: controllers[0]?.id || '' })
    setShowForm(true)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  function openEdit(valve) {
    setEditId(valve.id)
    setForm({
      controller_id: valve.controller_id || '',
      valve_box_id: valve.valve_box_id || '',
      name: valve.name,
      zone_name: valve.zone_name || '',
      notes: valve.notes || '',
      lat: valve.lat,
      lng: valve.lng,
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
    if (!form.controller_id) { toast('Controller is required', 'error'); return }
    setSaving(true)
    const payload = {
      controller_id: form.controller_id,
      valve_box_id: form.valve_box_id || null,
      name: form.name.trim(),
      zone_name: form.zone_name.trim() || null,
      notes: form.notes.trim() || null,
      lat: form.lat,
      lng: form.lng,
    }
    const { error } = editId
      ? await supabase.from('valves').update(payload).eq('id', editId)
      : await supabase.from('valves').insert(payload)
    setSaving(false)
    if (error) { toast(`Save failed: ${error.message}`, 'error'); return }
    toast(editId ? 'Valve updated' : 'Valve added')
    cancel()
    loadAll()
  }

  async function del(valve) {
    const ok = await confirm(
      `Delete valve "${valve.name}"? All watering heads on this valve will also be deleted.`
    )
    if (!ok) return
    const { error } = await supabase.from('valves').delete().eq('id', valve.id)
    if (error) toast(`Delete failed: ${error.message}`, 'error')
    else { toast('Valve deleted'); loadAll() }
  }

  function toggleCollapse(ctrlId) {
    setCollapsed(prev => ({ ...prev, [ctrlId]: !prev[ctrlId] }))
  }

  // Group valves by controller
  const grouped = controllers.map(ctrl => ({
    ctrl,
    valves: valves.filter(v => v.controller_id === ctrl.id),
  }))
  // Valves with no controller (shouldn't happen but handle gracefully)
  const orphans = valves.filter(v => !v.controller_id || !controllers.find(c => c.id === v.controller_id))

  const ctrlName = (id) => controllers.find(c => c.id === id)?.name || '—'
  const vbName   = (id) => valveBoxes.find(v => v.id === id)?.name || '—'

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-5">
        {Dialog}

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Zap size={20} className="text-yellow-500" /> Valves
          </h1>
          {!showForm && (
            <button
              onClick={openAdd}
              disabled={controllers.length === 0}
              title={controllers.length === 0 ? 'Add a controller first' : ''}
              className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm active:bg-violet-800 touch-manipulation"
            >
              <Plus size={16} /> Add Valve
            </button>
          )}
        </div>

        {controllers.length === 0 && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Add at least one controller before adding valves.
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-base">
              {editId ? 'Edit Valve' : 'New Valve'}
            </h2>

            {/* Controller + Valve Box — stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Controller *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  value={form.controller_id}
                  onChange={e => setForm(f => ({ ...f, controller_id: e.target.value }))}
                >
                  <option value="">Select controller…</option>
                  {controllers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valve Box</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  value={form.valve_box_id}
                  onChange={e => setForm(f => ({ ...f, valve_box_id: e.target.value }))}
                >
                  <option value="">None</option>
                  {valveBoxes.map(vb => (
                    <option key={vb.id} value={vb.id}>{vb.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Valve Name + Zone Name — stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valve Name *</label>
                <input
                  type="text"
                  inputMode="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Valve 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  inputMode="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  value={form.zone_name}
                  onChange={e => setForm(f => ({ ...f, zone_name: e.target.value }))}
                  placeholder="e.g. Back Lawn"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Flow rate, pipe size, any issues..."
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
        ) : valves.length === 0 ? (
          <div className="text-center text-gray-400 py-16 space-y-2">
            <Zap size={40} className="mx-auto opacity-30" />
            <p className="text-sm">No valves yet. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ ctrl, valves: cValves }) =>
              cValves.length === 0 ? null : (
                <div key={ctrl.id} className="space-y-2">
                  <button
                    onClick={() => toggleCollapse(ctrl.id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-blue-50 rounded-lg text-sm font-semibold text-blue-800 hover:bg-blue-100 transition-colors touch-manipulation"
                  >
                    {collapsed[ctrl.id]
                      ? <ChevronRight size={16} />
                      : <ChevronDown size={16} />}
                    <span>{ctrl.name}</span>
                    <span className="ml-auto text-blue-500 font-normal text-xs">
                      {cValves.length} valve{cValves.length !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {!collapsed[ctrl.id] && cValves.map(valve => (
                    <ValveCard
                      key={valve.id}
                      valve={valve}
                      vbName={vbName(valve.valve_box_id)}
                      onEdit={() => openEdit(valve)}
                      onDelete={() => del(valve)}
                    />
                  ))}
                </div>
              )
            )}

            {orphans.length > 0 && (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Unknown Controller
                </div>
                {orphans.map(valve => (
                  <ValveCard
                    key={valve.id}
                    valve={valve}
                    vbName={vbName(valve.valve_box_id)}
                    ctrlName={ctrlName(valve.controller_id)}
                    onEdit={() => openEdit(valve)}
                    onDelete={() => del(valve)}
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

function ValveCard({ valve, vbName, onEdit, onDelete }) {
  return (
    /* Reduced indent on mobile: ml-2 instead of ml-4 */
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3 shadow-sm hover:shadow-md transition-shadow ml-2 sm:ml-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{valve.name}</span>
          {valve.zone_name && (
            <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">
              {valve.zone_name}
            </span>
          )}
          {valve.lat && valve.lng ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
              <MapPin size={10} /> Located
            </span>
          ) : (
            <span className="text-xs text-gray-400">No location</span>
          )}
        </div>
        {valve.valve_box_id && (
          <p className="text-xs text-gray-500 mt-0.5">Box: {vbName}</p>
        )}
        {valve.notes && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{valve.notes}</p>
        )}
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
