import { create } from 'zustand'
import type { Guest, GuestFilter } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

function requireAuth(): boolean {
  if (!useAuthStore.getState().isAuthenticated) {
    window.location.href = '/login'
    return false
  }
  return true
}

interface ToastState {
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[]
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

interface GuestState {
  guests: Guest[]
  loading: boolean
  filter: GuestFilter
  selectedIds: Set<string>
  isAllSelected: boolean

  fetchGuests: () => Promise<void>
  setFilter: (filter: Partial<GuestFilter>) => void
  createGuests: (names: string[]) => Promise<boolean>
  updateName: (id: string, name: string) => Promise<boolean>
  updateStatus: (id: string, status: number) => Promise<boolean>
  deleteGuest: (id: string) => Promise<boolean>
  getGuestById: (id: string) => Promise<Guest | null>
  confirmAttendance: (id: string) => Promise<boolean>

  toggleSelection: (id: string) => void
  toggleSelectAll: () => void
  deselectAll: () => void
}

export const useGuestStore = create<GuestState>((set, get) => ({
  guests: [],
  loading: false,
  filter: { search: '', status: 'all' },
  selectedIds: new Set(),
  isAllSelected: false,

  fetchGuests: async () => {
    if (!requireAuth()) return
    const { filter } = get()
    set({ loading: true })
    try {
      let query = supabase
        .from('guests')
        .select('*')
        .order('updated_at', { ascending: false })

      if (filter.search) {
        query = query.ilike('full_name', `%${filter.search}%`)
      }
      if (filter.status !== 'all') {
        query = query.eq('status', Number(filter.status))
      }

      const { data, error } = await query
      if (error) throw error

      set({ guests: data ?? [] })

      const { selectedIds, guests } = get()
      set({
        isAllSelected: guests.length > 0 && guests.every((g) => selectedIds.has(g.id)),
      })
    } catch {
      useToastStore.getState().showToast('Lỗi tải danh sách', 'error')
    } finally {
      set({ loading: false })
    }
  },

  setFilter: (newFilter) => {
    set((state) => ({ filter: { ...state.filter, ...newFilter } }))
  },

  createGuests: async (names) => {
    if (!requireAuth()) return false
    try {
      const rows = names.map((full_name) => ({ full_name }))
      const { error } = await supabase.from('guests').insert(rows)
      if (error) throw error
      useToastStore.getState().showToast(`Thêm thành công ${names.length} khách!`)
      await get().fetchGuests()
      return true
    } catch (err) {
      console.error(err)
    }
    useToastStore.getState().showToast('Lỗi khi thêm danh sách', 'error')
    return false
  },

  updateName: async (id, name) => {
    if (!requireAuth()) return false
    try {
      const { error } = await supabase
        .from('guests')
        .update({ full_name: name })
        .eq('id', id)
      if (error) throw error
      useToastStore.getState().showToast('Cập nhật tên thành công!')
      await get().fetchGuests()
      return true
    } catch (err) {
      console.error(err)
    }
    useToastStore.getState().showToast('Lỗi cập nhật tên', 'error')
    return false
  },

  updateStatus: async (id, status) => {
    if (!requireAuth()) return false
    const now = new Date().toISOString()
    set((state) => ({
      guests: state.guests.map((g) =>
        g.id === id ? { ...g, status, updated_at: now } : g
      ),
    }))
    try {
      const { error } = await supabase
        .from('guests')
        .update({ status })
        .eq('id', id)
      if (error) throw error
      const labels = ['Chưa gửi', 'Đã gửi', 'Xác nhận']
      useToastStore.getState().showToast(`Đã đổi thành: ${labels[status]}`)
      return true
    } catch (err) {
      console.error(err)
    }
    await get().fetchGuests()
    useToastStore.getState().showToast('Lỗi cập nhật trạng thái', 'error')
    return false
  },

  deleteGuest: async (id) => {
    if (!requireAuth()) return false
    try {
      const { error } = await supabase.from('guests').delete().eq('id', id)
      if (error) throw error
      useToastStore.getState().showToast('Đã xóa khách mời!')
      await get().fetchGuests()
      return true
    } catch (err) {
      console.error(err)
    }
    useToastStore.getState().showToast('Lỗi khi xóa khách', 'error')
    return false
  },

  getGuestById: async (id) => {
    try {
      const { data, error } = await supabase.rpc('get_guest_public', {
        guest_id: id,
      })
      if (error) throw error
      const row = data?.[0]
      return row ? (row as Guest) : null
    } catch (err) {
      console.error(err)
    }
    return null
  },

  confirmAttendance: async (id) => {
    try {
      const { error } = await supabase.rpc('confirm_guest_attendance', {
        guest_id: id,
      })
      if (error) throw error
      useToastStore.getState().showToast('Xác nhận tham dự thành công!')
      return true
    } catch (err) {
      console.error(err)
    }
    useToastStore.getState().showToast('Lỗi xác nhận tham dự', 'error')
    return false
  },

  toggleSelection: (id) => {
    set((state) => {
      const newSet = new Set(state.selectedIds)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      const isAllSelected =
        state.guests.length > 0 && state.guests.every((g) => newSet.has(g.id))
      return { selectedIds: newSet, isAllSelected }
    })
  },

  toggleSelectAll: () => {
    set((state) => {
      if (state.isAllSelected) {
        return { selectedIds: new Set(), isAllSelected: false }
      }
      const newSet = new Set(state.guests.map((g) => g.id))
      return { selectedIds: newSet, isAllSelected: true }
    })
  },

  deselectAll: () => {
    set({ selectedIds: new Set(), isAllSelected: false })
  },
}))
