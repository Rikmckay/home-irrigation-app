import { useState, useCallback, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Returns { confirm, Dialog }.
 * Usage:
 *   const { confirm, Dialog } = useConfirm()
 *   // render {Dialog} somewhere in JSX
 *   const ok = await confirm('Are you sure you want to delete this?')
 *   if (ok) { ... }
 */
export function useConfirm() {
  const [state, setState] = useState({ open: false, message: '' })
  const resolveRef = useRef(null)

  const confirm = useCallback((message) => {
    setState({ open: true, message })
    return new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const respond = (result) => {
    setState({ open: false, message: '' })
    resolveRef.current?.(result)
  }

  const Dialog = state.open ? (
    <div className="fixed inset-0 z-[9998] bg-black/50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      {/* Sheet slides up from bottom on mobile; centered modal on sm+ */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Confirm Delete</h3>
            <p className="text-sm text-gray-600 mt-1">{state.message}</p>
          </div>
        </div>
        {/* Full-width stacked buttons on mobile */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            onClick={() => respond(false)}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-3 min-h-[48px] text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors touch-manipulation"
          >
            Cancel
          </button>
          <button
            onClick={() => respond(true)}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-3 min-h-[48px] text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors touch-manipulation"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  ) : null

  return { confirm, Dialog }
}
