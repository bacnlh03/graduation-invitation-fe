import { useState } from 'react'
import { CheckCircle, XCircle, Send, Pencil, Save, X, Trash2, Loader2, Link2, Check } from 'lucide-react'
import type { Guest } from '@/types'
import clsx from 'clsx'

interface Props {
  guests: Guest[]
  loading: boolean
  onUpdateName: (id: string, name: string) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: number) => void
}

export function GuestTable({ guests, loading, onUpdateName, onDelete, onUpdateStatus }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNameModel, setEditNameModel] = useState('')
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyUrl = (id: string) => {
    const url = `${window.location.origin}/invitation?id=${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const startEdit = (guest: Guest) => {
    setEditingId(guest.id)
    setEditNameModel(guest.full_name)
  }

  const saveEdit = (guest: Guest) => {
    if (editNameModel !== guest.full_name && editNameModel.trim()) {
      onUpdateName(guest.id, editNameModel)
    }
    setEditingId(null)
  }
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--/-- --:--'
    const d = new Date(dateStr)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto relative scroll-smooth">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="p-4 w-[5%] text-center bg-slate-50">#</th>
            <th className="p-4 w-[45%] bg-slate-50">Họ và Tên</th>
            <th className="p-4 w-[20%] bg-slate-50">Trạng thái</th>
            <th className="p-4 w-[20%] bg-slate-50">Cập nhật lúc</th>
            <th className="p-4 text-right bg-slate-50">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          
          {loading && (
            <tr>
              <td colSpan={5} className="py-12 text-center text-slate-400">
                <div className="flex justify-center items-center gap-2">
                  <Loader2 className="animate-spin" /> Đang tải...
                </div>
              </td>
            </tr>
          )}
          
          {!loading && guests.length === 0 && (
            <tr>
              <td colSpan={5} className="py-12 text-center text-slate-400 italic">Không có dữ liệu.</td>
            </tr>
          )}
          
          {guests.map((guest, idx) => (
            <tr key={guest.id} 
              className="hover:bg-slate-50 transition group h-16"
            >
              <td className="p-4 text-center text-slate-400 font-mono text-sm">{idx + 1}</td>
              
              <td className="p-4 font-medium text-slate-900 text-lg">
                {editingId === guest.id ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      value={editNameModel}
                      onChange={(e) => setEditNameModel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(guest)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="w-full px-2 py-1 border-2 border-emerald-500 rounded bg-white outline-none"
                    />
                  </div>
                ) : (
                  <div onDoubleClick={() => startEdit(guest)} className="cursor-pointer select-none" title="Double click để sửa">
                    {guest.full_name}
                  </div>
                )}
              </td>

              <td className="p-4">
                <div className="relative">
                  {/* Status badge — click to open dropdown */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setStatusDropdownId(statusDropdownId === guest.id ? null : guest.id) }}
                    className={clsx(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border select-none cursor-pointer transition-all hover:scale-105 hover:shadow-md active:scale-95",
                      guest.status === 2 && 'bg-green-100 text-green-700 border-green-200',
                      guest.status === 1 && 'bg-blue-100 text-blue-700 border-blue-200',
                      guest.status === 0 && 'bg-slate-100 text-slate-500 border-slate-200',
                    )}
                  >
                    {guest.status === 2 && <><CheckCircle size={14} />XÁC NHẬN</>}
                    {guest.status === 1 && <><Send size={14} />ĐÃ GỬI</>}
                    {guest.status === 0 && <><XCircle size={14} />CHƯA GỬI</>}
                  </button>

                  {/* Dropdown */}
                  {statusDropdownId === guest.id && (
                    <>
                      {/* Backdrop to close on outside click */}
                      <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownId(null)} />
                      <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[140px] animate-in fade-in slide-in-from-top-1">
                        {[
                          { value: 0, label: 'Chưa gửi',  icon: <XCircle size={14} />,     cls: 'text-slate-500' },
                          { value: 1, label: 'Đã gửi',    icon: <Send size={14} />,          cls: 'text-blue-600' },
                          { value: 2, label: 'Xác nhận',  icon: <CheckCircle size={14} />,  cls: 'text-green-600' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { onUpdateStatus(guest.id, opt.value); setStatusDropdownId(null) }}
                            className={clsx(
                              "w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors",
                              opt.cls,
                              guest.status === opt.value && 'bg-slate-50'
                            )}
                          >
                            {opt.icon}
                            {opt.label}
                            {guest.status === opt.value && <span className="ml-auto text-slate-400">✓</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </td>
              
              <td className="p-4 text-sm text-slate-500 font-mono">{formatDate(guest.updated_at)}</td>
              
              <td className="p-4 text-right">
                {editingId === guest.id ? (
                  <div className="flex justify-end gap-1">
                    <button onClick={() => saveEdit(guest)} className="p-2 bg-emerald-500 text-white rounded shadow hover:bg-emerald-600"><Save size={16}/></button>
                    <button onClick={() => setEditingId(null)} className="p-2 text-slate-500 hover:bg-slate-200 rounded"><X size={16}/></button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyUrl(guest.id)}
                      title="Copy link mời"
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                    >
                      {copiedId === guest.id ? <Check size={16} className="text-emerald-500" /> : <Link2 size={16} />}
                    </button>
                    <button onClick={() => startEdit(guest)} className="p-2 text-slate-400 hover:text-emerald-600 rounded"><Pencil size={16}/></button>
                    <button onClick={() => onDelete(guest.id)} className="p-2 text-slate-400 hover:text-red-600 rounded"><Trash2 size={16}/></button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
