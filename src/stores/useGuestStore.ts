import { create } from 'zustand'
import type { Guest, GuestFilter } from '@/types'
import { useAuthStore } from '@/stores/useAuthStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Authenticated fetch — attaches JWT, handles 401 logout
async function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = useAuthStore.getState().token
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers as object),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(input, { ...init, headers })
  if (res.status === 401) {
    useAuthStore.getState().logout()
    window.location.href = '/login'
  }
  return res
}

interface ToastState {
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[]
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

// Temporary internal toast store, ideally moved to a separate store
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
  
  // Actions
  fetchGuests: () => Promise<void>
  setFilter: (filter: Partial<GuestFilter>) => void
  createGuests: (names: string[]) => Promise<boolean>
  updateName: (id: string, name: string) => Promise<boolean>
  updateStatus: (id: string, status: number) => Promise<boolean>
  deleteGuest: (id: string) => Promise<boolean>
  getGuestById: (id: string) => Promise<Guest | null>
  confirmAttendance: (id: string) => Promise<boolean>
  
  // Selection
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
    const { filter } = get()
    set({ loading: true })
    try {
      const params = new URLSearchParams()
      if (filter.search) params.append('search', filter.search)
      if (filter.status !== 'all') params.append('status', filter.status)

      const res = await authFetch(`${API_URL}/guests?${params.toString()}`)
      const data = await res.json()
      set({ guests: Array.isArray(data) ? data : [] })
      
      // Update selection state after fetch
      const { selectedIds, guests } = get()
      set({
        isAllSelected: guests.length > 0 && guests.every(g => selectedIds.has(g.id))
      })
      
    } catch {
      useToastStore.getState().showToast('Lỗi tải danh sách', 'error')
    } finally {
      set({ loading: false })
    }
  },

  setFilter: (newFilter) => {
    set((state) => ({ filter: { ...state.filter, ...newFilter } }))
    // Debounce fetch is handled in the component via useEffect or useDebounce hook
    // But for simplicity in migration, we can trigger fetch here directly with debounce?
    // Actually Zustand doesn't have built-in watch. 
    // We'll expose fetchGuests and let the component call it on filter change.
  },

  createGuests: async (names) => {
    try {
      const res = await authFetch(`${API_URL}/guests/bulk`, {
        method: 'POST',
        body: JSON.stringify({ guests: names.map((n) => ({ name: n })) }),
      })
      if (res.ok) {
        useToastStore.getState().showToast(`Thêm thành công ${names.length} khách!`)
        await get().fetchGuests()
        return true
      }
    } catch (err) {
      console.error(err)
    }
    useToastStore.getState().showToast('Lỗi khi thêm danh sách', 'error')
    return false
  },

  updateName: async (id, name) => {
    try {
      const res = await authFetch(`${API_URL}/guests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        useToastStore.getState().showToast('Cập nhật tên thành công!')
        await get().fetchGuests()
        return true
      }
    } catch (err) {
      console.error(err)
    }
    useToastStore.getState().showToast('Lỗi cập nhật tên', 'error')
    return false
  },

  updateStatus: async (id, status) => {
    // Optimistic update (status + timestamp)
    const now = new Date().toISOString()
    set((state) => ({
      guests: state.guests.map((g) => g.id === id ? { ...g, status, updated_at: now } : g)
    }))
    try {
      const res = await authFetch(`${API_URL}/guests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const labels = ['Chưa gửi', 'Đã gửi', 'Xác nhận']
        useToastStore.getState().showToast(`Đã đổi thành: ${labels[status]}`)
        return true
      }
    } catch (err) {
      console.error(err)
    }
    // Rollback: re-fetch on error
    await get().fetchGuests()
    useToastStore.getState().showToast('Lỗi cập nhật trạng thái', 'error')
    return false
  },

  deleteGuest: async (id) => {
    try {
      const res = await authFetch(`${API_URL}/guests/${id}`, { method: 'DELETE' })
      if (res.ok) {
        useToastStore.getState().showToast('Đã xóa khách mời!')
        await get().fetchGuests()
        return true
      }
    } catch (err) {
      console.error(err)
    }
    useToastStore.getState().showToast('Lỗi khi xóa khách', 'error')
    return false
  },

  getGuestById: async (id) => {
    try {
      const res = await fetch(`${API_URL}/guests/${id}`)
      if (res.ok) {
        return await res.json() as Guest
      }
    } catch (err) {
      console.error(err)
    }
    return null
  },

  confirmAttendance: async (id) => {
    try {
      const res = await fetch(`${API_URL}/guests/${id}/confirm`, {
        method: 'POST',
      })
      if (res.ok) {
        useToastStore.getState().showToast('Xác nhận tham dự thành công!')
        return true
      }
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
      
      const isAllSelected = state.guests.length > 0 && state.guests.every(g => newSet.has(g.id))
      return { selectedIds: newSet, isAllSelected }
    })
  },

  toggleSelectAll: () => {
    set((state) => {
      if (state.isAllSelected) {
        return { selectedIds: new Set(), isAllSelected: false }
      } else {
        const newSet = new Set(state.guests.map(g => g.id))
        return { selectedIds: newSet, isAllSelected: true }
      }
    })
  },

  deselectAll: () => {
    set({ selectedIds: new Set(), isAllSelected: false })
  }
}))
