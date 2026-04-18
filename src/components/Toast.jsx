import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/*
        On mobile: bottom-20 clears the fixed bottom tab bar (80px clearance).
        On md+: bottom-4 as before.
        right-2 on mobile avoids edge clipping on 390px screens.
      */}
      <div className="fixed bottom-20 right-2 md:bottom-4 md:right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-1rem)]">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium
              ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {toast.type === 'success'
              ? <CheckCircle size={16} className="flex-shrink-0" />
              : <AlertCircle size={16} className="flex-shrink-0" />}
            <span className="flex-1 min-w-0">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="ml-2 opacity-75 hover:opacity-100 flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
