import { Loader2 } from 'lucide-react'

interface Props {
  loading: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
}

export function ModalConfirm({ loading, onClose, onConfirm, title, message }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title || 'Xác nhận xóa?'}</h3>
        <p className="text-slate-500 mb-6">{message || 'Bạn có chắc muốn xóa khách mời này không? Hành động này không thể hoàn tác.'}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Hủy</button>
          <button 
            onClick={onConfirm} 
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}
