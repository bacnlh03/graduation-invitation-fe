import { useState } from 'react'
import { RefreshCw, Search, CheckCircle, XCircle, Send, ChevronDown } from 'lucide-react'
import type { GuestFilter } from '@/types'
import clsx from 'clsx'

interface Props {
  filter: GuestFilter
  loading: boolean
  onFilterChange: (filter: Partial<GuestFilter>) => void
  onRefresh: () => void
}

const STATUS_OPTIONS = [
  { value: 'all',  label: 'Tất cả',    icon: null,                      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200' },
  { value: '0',    label: 'Chưa gửi',  icon: <XCircle size={13} />,     badgeClass: 'bg-slate-100 text-slate-500 border-slate-200' },
  { value: '1',    label: 'Đã gửi',    icon: <Send size={13} />,         badgeClass: 'bg-blue-100 text-blue-600 border-blue-200' },
  { value: '2',    label: 'Xác nhận',  icon: <CheckCircle size={13} />, badgeClass: 'bg-green-100 text-green-600 border-green-200' },
]

export function GuestToolbar({ filter, loading, onFilterChange, onRefresh }: Props) {
  const [open, setOpen] = useState(false)
  const current = STATUS_OPTIONS.find(o => o.value === filter.status) ?? STATUS_OPTIONS[0]

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Tìm kiếm khách mời..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          value={filter.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">

        {/* Custom Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className={clsx(
              "flex items-center gap-2 pl-3 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white hover:border-slate-300 transition-all text-sm font-medium text-slate-700 min-w-[140px] justify-between",
              open && "border-emerald-400 ring-2 ring-emerald-100 bg-white"
            )}
          >
            <span className={clsx(
              "inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full border",
              current.value !== 'all' ? current.badgeClass : 'text-slate-500'
            )}>
              {current.icon}
              {current.label}
            </span>
            <ChevronDown size={16} className={clsx("text-slate-400 transition-transform duration-200", open && "rotate-180")} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 min-w-[160px] animate-in fade-in slide-in-from-top-1">
                <p className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase text-slate-400">Trạng thái</p>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { onFilterChange({ status: opt.value }); setOpen(false) }}
                    className={clsx(
                      "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition-colors",
                      filter.status === opt.value && 'bg-slate-50'
                    )}
                  >
                    <span className={clsx(
                      "inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-full border",
                      opt.value !== 'all' ? opt.badgeClass : 'text-slate-400 border-transparent'
                    )}>
                      {opt.icon ?? <span className="w-[13px]" />}
                      {opt.label}
                    </span>
                    {filter.status === opt.value && <span className="ml-auto text-emerald-500">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button 
          onClick={onRefresh}
          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          title="Làm mới"
        >
          <RefreshCw size={20} className={clsx({ 'animate-spin': loading })} />
        </button>
      </div>
    </div>
  )
}
