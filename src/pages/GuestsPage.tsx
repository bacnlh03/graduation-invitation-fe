import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useGuestStore } from '@/stores/useGuestStore'
import { useShallow } from 'zustand/react/shallow'
import { ModalConfirm } from '@/components/ui/ModalConfirm'
import { ModalAddGuest } from '@/components/ui/ModalAddGuest'
// import { ModalQRBatch } from '@/components/ui/ModalQRBatch'
import { GuestToolbar } from '@/components/guest/GuestToolbar'
import { GuestTable } from '@/components/guest/GuestTable'

export function GuestsPage() {
  const { 
    guests, 
    loading, 
    filter, 
    // selectedIds,
  } = useGuestStore(useShallow(state => ({
    guests: state.guests,
    loading: state.loading,
    filter: state.filter,
    // selectedIds: state.selectedIds,
  })))

  const fetchGuests = useGuestStore(state => state.fetchGuests)
  const setFilter = useGuestStore(state => state.setFilter)
  const updateName = useGuestStore(state => state.updateName)
  const updateStatus = useGuestStore(state => state.updateStatus)
  const deleteGuest = useGuestStore(state => state.deleteGuest)
  const createGuests = useGuestStore(state => state.createGuests)

  const [showAdd, setShowAdd] = useState(false)
  // const [showQR, setShowQR] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  const handleDelete = async () => {
    if (deleteId) {
      await deleteGuest(deleteId)
      setDeleteId(null)
    }
  }

  const handleCreate = async (names: string[]) => {
    const success = await createGuests(names)
    if (success) setShowAdd(false)
  }

  // const selectedGuests = guests.filter(g => selectedIds.has(g.id))

  return (
    <div className="h-full flex flex-col p-4 md:p-8">
      
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Khách mời</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* QR batch — tạm thời tắt
          {selectedIds.size > 0 && (
            <button 
              onClick={() => setShowQR(true)} 
              className="bg-white text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-emerald-50 flex items-center gap-2 transition-all animate-in fade-in slide-in-from-right-4"
            >
              <QrCode size={18}/> Tạo QR ({selectedIds.size})
            </button>
          )}
          */}
          <button onClick={() => setShowAdd(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg hover:bg-emerald-700 flex items-center gap-2">
            <UserPlus size={18}/> Thêm danh sách
          </button>
        </div>
      </div>

      <div className="mb-6 shrink-0 flex flex-col gap-4">
        <GuestToolbar 
          filter={filter} 
          loading={loading} 
          onFilterChange={setFilter} 
          onRefresh={fetchGuests}
        />
      </div>

      <div className="flex-1 min-h-0">
        <GuestTable 
          guests={guests} 
          loading={loading} 
          onUpdateName={updateName} 
          onDelete={setDeleteId}
          onUpdateStatus={updateStatus}
        />
      </div>

      {showAdd && <ModalAddGuest onClose={() => setShowAdd(false)} onSubmit={handleCreate} />}
      {deleteId && (() => {
        const guestToDelete = guests.find(g => g.id === deleteId)
        const isConfirmed = guestToDelete?.status === 2
        return (
          <ModalConfirm 
            loading={loading} 
            onClose={() => setDeleteId(null)} 
            onConfirm={handleDelete}
            title={isConfirmed ? "Cảnh báo xóa khách tham dự" : undefined}
            message={isConfirmed ? `Khách mời "${guestToDelete?.full_name}" đã xác nhận tham dự. Bạn có chắc chắn muốn xóa không?` : undefined}
          />
        )
      })()}
      {/* QR Modal — tạm thời tắt
      {showQR && <ModalQRBatch guests={selectedGuests} onClose={() => setShowQR(false)} />}
      */}
    </div>
  )
}
