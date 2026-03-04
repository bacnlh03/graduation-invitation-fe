import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'

interface Props {
  onClose: () => void
  onSubmit: (names: string[]) => void
}

export function ModalAddGuest({ onClose, onSubmit }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!input.trim()) return
    setLoading(true)
    const names = input.split('\n').map(n => n.trim()).filter(Boolean)
    await onSubmit(names)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">Thêm khách mời</h3>
          <p className="text-slate-500 text-sm mt-1">Nhập tên khách mời, mỗi tên một dòng</p>
        </div>
        <div className="p-6">
          <textarea 
            className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none font-mono text-sm"
            placeholder="Nguyen Van A&#10;Tran Thi B&#10;..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Hủy</button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            Thêm danh sách
          </button>
        </div>
      </div>
    </div>
  )
}
