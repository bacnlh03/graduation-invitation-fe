import { useToastStore } from '@/stores/useGuestStore'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import clsx from 'clsx'

export function ToastNotification() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-10 fade-in duration-300 min-w-[300px]",
            toast.type === 'success' && "bg-white border-emerald-100 text-slate-800",
            toast.type === 'error' && "bg-red-50 border-red-100 text-red-800",
            toast.type === 'info' && "bg-blue-50 border-blue-100 text-blue-800"
          )}
        >
          {toast.type === 'success' && <CheckCircle className="text-emerald-500" size={20} />}
          {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
          {toast.type === 'info' && <Info className="text-blue-500" size={20} />}
          
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          
          <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
