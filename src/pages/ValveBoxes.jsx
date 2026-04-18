import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import LocationPicker from '../components/LocationPicker'
import { Plus, Pencil, Trash2, MapPin, Save, X, Box } from 'lucide-react'

const EMPTY = { name: '', notes: '', lat: null, lng: null }

export default function ValveBoxes() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const { confirm, Dialog } = useConfirm()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('valve_boxes')
      .select('*')
      .order('created_at')
    if (error) toast('Failed to load valve boxes', 'error')
    else setItems(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditId(null)
    setForm(EMPTY)
    setShowForm(true)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  function openEdit(item) {
    setEditId(item.id)
    setForm({ name: item.name, notes: item.notes || '', lat: item.lat, lng: item.lng })
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
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      notes: form.notes.trim() || null,
      lat: form.lat,
      lng: form.lng,
    }
    const { error } = editId
      ? await supabase.from('valve_boxes').update(payload).eq('id', editId)
      : await supabase.from('valve_boxes').insert(payload)
    setSaving(false)
    if (error) { toast(`Save failed: ${error.message}`, 'error'); return }
    toast(editId ? 'Valve box updated' : 'Valve box added')
    cancel()
    load()
  }

  async function del(item) {
    const ok = await confirm(
      `Delete valve box "${item.name}"? Valves assigned to this box will have their box association cleared.`
    )
    if (!ok) return
    const { error } = await supabase.from('valve_boxes').delete().eq('id', item.id)
    if (error) toast(`Delete failed: ${error.message}`, 'error')
    else { toast('Valve box deleted'); load() }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-5">
        {Dialog}

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Box size={20} className="text-orange-500" /> Valve Boxes
          </h1>
          {!showForm && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm active:bg-orange-700 touch-manipulation"
            >
              <Plus size={16} /> Add Valve Box
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-base">
              {editId ? 'Edit Valve Box' : 'New Valve Box'}
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                inputMode="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Front Left Valve Box"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Description, contents, access notes..."
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
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-16 space-y-2">
            <Box size={40} className="mx-auto opacity-30" />
            <p className="text-sm">No valve boxes yet. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{item.name}</span>
                    {item.lat && item.lng ? (
                      <span className="inline-flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                        <MapPin size={10} /> Located
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No location</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.notes}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => del(item)}
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
