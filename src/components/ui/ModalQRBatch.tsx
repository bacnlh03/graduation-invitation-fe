import { QRCodeSVG } from 'qrcode.react'
import { X, Printer } from 'lucide-react'
import type { Guest } from '@/types'

interface Props {
  guests: Guest[]
  onClose: () => void
}

export function ModalQRBatch({ guests, onClose }: Props) {
  const invitationBaseUrl = window.location.origin + '/invitation'

  const handlePrint = () => window.print()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
             <h2 className="text-xl font-bold text-slate-900">Mã QR Khách mời</h2>
             <p className="text-slate-500 text-sm mt-1">Tổng cộng: {guests.length} khách đã chọn</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="In">
              <Printer size={20}/>
            </button>
            <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X size={24}/>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 print:grid-cols-3">
             {guests.map(guest => (
               <div key={guest.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-3 print:border-none print:shadow-none break-inside-avoid">
                 <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                   <QRCodeSVG 
                     value={`${invitationBaseUrl}?id=${guest.id}`}
                     size={140}
                     level="H"
                   />
                 </div>
                 <div className="text-center w-full">
                   <p className="font-bold text-slate-900 text-sm truncate w-full">{guest.full_name}</p>
                   <p className="text-[10px] text-slate-400 font-mono mt-1 opacity-50">{guest.id.slice(0, 8)}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 bg-white">
           <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg">Đóng</button>
        </div>
      </div>
    </div>
  )
}
