import { create } from 'zustand'
import { DEFAULT_CONFIG } from '@/types/design'
import type { DesignConfig, DesignElement } from '@/types/design'
import { useToastStore } from '@/stores/useGuestStore'
import { useAuthStore } from '@/stores/useAuthStore'

// For dev: Proxy is expected to handle /api/v1/config/invitation
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const CONFIG_API_URL = `${API_URL}/config/invitation`

// Helper to normalize URLs (ensure they use the API domain if relative)
export const normalizeUrl = (url?: string) => {
  if (!url || url === '') return undefined
  if (url.startsWith('http') || url.startsWith('data:')) return url
  
  // Only auto-prefix if it looks like an upload path from the backend
  if (!url.startsWith('/uploads/')) return url

  // Extract base origin from API_URL (e.g. https://api.onrender.com from https://api.onrender.com/api/v1)
  try {
    const urlObj = new URL(API_URL, window.location.origin)
    return `${urlObj.origin}${url}`
  } catch {
    return url
  }
}

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

interface DesignState {
  config: DesignConfig
  selectedElementId: string | null
  loading: boolean
  
  // Clipboard
  clipboard: DesignElement | null
  copyElement: () => void
  pasteElement: () => void

  // Actions
  fetchConfig: () => Promise<void>
  saveConfig: () => Promise<boolean>
  
  // History
  past: DesignConfig[]
  future: DesignConfig[]
  undo: () => void
  redo: () => void
  pushToHistory: () => void
  pushStateToHistory: (state: DesignConfig) => void

  // Editor Actions
  selectElement: (id: string | null) => void
  updateElement: (id: string, updates: Partial<DesignElement>, pushHistory?: boolean) => void
  addElement: (element: DesignElement) => void
  removeElement: (id: string) => void
  updateBackground: (bg: Partial<DesignConfig['background']>) => void
  updateMusic: (music: Partial<DesignConfig['music']>, pushHistory?: boolean) => void
  moveElement: (id: string, x: number, y: number) => void
  
  // Layering
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  bringForward: (id: string) => void
  sendBackward: (id: string) => void
  uploadFile: (file: File) => Promise<string | null | undefined>
}

export const useDesignStore = create<DesignState>((set, get) => ({
  config: DEFAULT_CONFIG,
  selectedElementId: null,
  loading: false,
  clipboard: null,

  fetchConfig: async () => {
    set({ loading: true })
    try {
      const res = await fetch(CONFIG_API_URL)
      if (res.ok) {
        const data = await res.json()
        // If data is empty object, use default
        if (data && Object.keys(data).length > 0) {
            // Normalize URLs in config
            if (data.music?.url) data.music.url = normalizeUrl(data.music.url)
            if (data.background?.image) data.background.image = normalizeUrl(data.background.image)
            if (data.elements) {
              data.elements = data.elements.map((el: DesignElement) => {
                if (el.type === 'image' && el.content) {
                  return { ...el, content: normalizeUrl(el.content) }
                }
                return el
              })
            }
            set({ config: data })
        } else {
            console.log('No config found, using default')
        }
      }
    } catch (err) {
      console.error(err)
      useToastStore.getState().showToast('Lỗi tải cấu hình thiết kế', 'error')
    } finally {
      set({ loading: false })
    }
  },

  saveConfig: async () => {
    try {
      const { config } = get()
      const res = await authFetch(CONFIG_API_URL, {
        method: 'PUT',
        body: JSON.stringify(config),
      })
      if (res.ok) {
        useToastStore.getState().showToast('Đã lưu thiết kế mới!')
        return true
      }
    } catch (err) {
      console.error(err)
    }
    useToastStore.getState().showToast('Lỗi khi lưu thiết kế', 'error')
    return false
  },

  past: [],
  future: [],

  pushToHistory: () => {
      set(state => {
          const newPast = [...state.past, state.config]
          if (newPast.length > 20) newPast.shift()
          return {
              past: newPast,
              future: []
          }
      })
  },

  pushStateToHistory: (configState) => {
      set(state => {
          const newPast = [...state.past, configState]
          if (newPast.length > 20) newPast.shift()
          return {
              past: newPast,
              future: []
          }
      })
  },

  undo: () => {
      set(state => {
          if (state.past.length === 0) return {}
          const previous = state.past[state.past.length - 1]
          const newPast = state.past.slice(0, -1)
          return {
              past: newPast,
              config: previous,
              future: [state.config, ...state.future]
          }
      })
  },

  redo: () => {
      set(state => {
          if (state.future.length === 0) return {}
          const next = state.future[0]
          const newFuture = state.future.slice(1)
          return {
              past: [...state.past, state.config],
              config: next,
              future: newFuture
          }
      })
  },

  selectElement: (id) => set({ selectedElementId: id }),

  updateElement: (id, updates, pushHistory = true) => {
    if (pushHistory) get().pushToHistory()
    set((state) => ({
      config: {
        ...state.config,
        elements: state.config.elements.map((el) => 
          el.id === id ? { ...el, ...updates } : el
        )
      }
    }))
  },

  moveElement: (id, x, y) => {
    // moveElement usually happens frequently (drag), so we assume history pushed before drag start
    set((state) => ({
      config: {
        ...state.config,
        elements: state.config.elements.map((el) => 
          el.id === id ? { ...el, x, y } : el
        )
      }
    }))
  },

  addElement: (element) => {
    get().pushToHistory()
    set((state) => ({
      config: {
        ...state.config,
        elements: [...state.config.elements, element]
      },
      selectedElementId: element.id
    }))
  },

  removeElement: (id) => {
    get().pushToHistory()
    set((state) => ({
      config: {
        ...state.config,
        elements: state.config.elements.filter((el) => el.id !== id)
      },
      selectedElementId: null
    }))
  },

  updateBackground: (bg) => {
    get().pushToHistory()
    set((state) => ({
      config: {
        ...state.config,
        background: { ...state.config.background, ...bg }
      }
    }))
  },

  updateMusic: (musicUpdates, pushHistory = true) => {
    if (pushHistory) get().pushToHistory()
    set((state) => ({
      config: {
        ...state.config,
        music: state.config.music 
          ? { ...state.config.music, ...musicUpdates }
          : { url: '', enabled: true, ...musicUpdates }
      }
    }))
  },

  // Layering
  bringToFront: (id) => {
      get().pushToHistory()
      set(state => {
          const elIndex = state.config.elements.findIndex(e => e.id === id)
          if (elIndex < 0 || elIndex === state.config.elements.length - 1) return {}
          const newEls = [...state.config.elements]
          const [el] = newEls.splice(elIndex, 1)
          newEls.push(el)
          return { config: { ...state.config, elements: newEls } }
      })
  },

  sendToBack: (id) => {
      get().pushToHistory()
      set(state => {
          const elIndex = state.config.elements.findIndex(e => e.id === id)
          if (elIndex <= 0) return {}
          const newEls = [...state.config.elements]
          const [el] = newEls.splice(elIndex, 1)
          newEls.unshift(el)
          return { config: { ...state.config, elements: newEls } }
      })
  },

  bringForward: (id) => {
      get().pushToHistory()
      set(state => {
          const elIndex = state.config.elements.findIndex(e => e.id === id)
          if (elIndex < 0 || elIndex === state.config.elements.length - 1) return {}
          const newEls = [...state.config.elements]
          const [el] = newEls.splice(elIndex, 1)
          newEls.splice(elIndex + 1, 0, el)
          return { config: { ...state.config, elements: newEls } }
      })
  },

  sendBackward: (id) => {
      get().pushToHistory()
      set(state => {
          const elIndex = state.config.elements.findIndex(e => e.id === id)
          if (elIndex <= 0) return {}
          const newEls = [...state.config.elements]
          const [el] = newEls.splice(elIndex, 1)
          newEls.splice(elIndex - 1, 0, el)
          return { config: { ...state.config, elements: newEls } }
      })
  },

  copyElement: () => {
      const state = get()
      const { config, selectedElementId } = state
      if (!selectedElementId) return
      
      const el = config.elements.find(e => e.id === selectedElementId)
      if (el) {
          set({ clipboard: JSON.parse(JSON.stringify(el)) })
          useToastStore.getState().showToast('Đã sao chép')
      }
  },

  pasteElement: () => {
      const state = get()
      const { clipboard } = state
      if (!clipboard) return

      get().pushToHistory()
      
      const newId = `${clipboard.type}_${Date.now()}`
      const newElement: DesignElement = {
          ...clipboard,
          id: newId,
          x: clipboard.x + 20,
          y: clipboard.y + 20
      }

      set(state => ({
          config: {
              ...state.config,
              elements: [...state.config.elements, newElement]
          },
          selectedElementId: newId
      }))
      useToastStore.getState().showToast('Đã dán')
  },

  uploadFile: async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const token = useAuthStore.getState().token
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
             ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })
      
      if (res.ok) {
        const data = await res.json()
        return normalizeUrl(data.url)
      }
    } catch (err) {
      console.error('Upload failed:', err)
    }
    useToastStore.getState().showToast('Lỗi khi tải file lên', 'error')
    return null
  }
}))
