import { create } from 'zustand'
import { DEFAULT_CONFIG } from '@/types/design'
import type { DesignConfig, DesignElement } from '@/types/design'
import { useToastStore } from '@/stores/useGuestStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase, INVITATION_ASSETS_BUCKET } from '@/lib/supabase'

const CONFIG_ROW_ID = 'default'

export const normalizeUrl = (url?: string) => {
  if (!url || url === '') return undefined
  if (url.startsWith('http') || url.startsWith('data:')) return url
  return url
}

function requireAuth(): boolean {
  if (!useAuthStore.getState().isAuthenticated) {
    window.location.href = '/login'
    return false
  }
  return true
}

function normalizeConfigUrls(data: DesignConfig): DesignConfig {
  if (data.music?.url) data.music.url = normalizeUrl(data.music.url) ?? data.music.url
  if (data.background?.image) {
    data.background.image = normalizeUrl(data.background.image) ?? data.background.image
  }
  if (data.elements) {
    data.elements = data.elements.map((el: DesignElement) => {
      if (el.type === 'image' && el.content) {
        return { ...el, content: normalizeUrl(el.content) ?? el.content }
      }
      return el
    })
  }
  return data
}

interface DesignState {
  config: DesignConfig
  selectedElementId: string | null
  loading: boolean

  clipboard: DesignElement | null
  copyElement: () => void
  pasteElement: () => void

  fetchConfig: () => Promise<void>
  saveConfig: () => Promise<boolean>

  past: DesignConfig[]
  future: DesignConfig[]
  undo: () => void
  redo: () => void
  pushToHistory: () => void
  pushStateToHistory: (state: DesignConfig) => void

  selectElement: (id: string | null) => void
  updateElement: (id: string, updates: Partial<DesignElement>, pushHistory?: boolean) => void
  addElement: (element: DesignElement) => void
  removeElement: (id: string) => void
  updateBackground: (bg: Partial<DesignConfig['background']>) => void
  updateMusic: (music: Partial<DesignConfig['music']>, pushHistory?: boolean) => void
  moveElement: (id: string, x: number, y: number) => void

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
      const { data, error } = await supabase
        .from('invitation_config')
        .select('config')
        .eq('id', CONFIG_ROW_ID)
        .maybeSingle()

      if (error) throw error

      const config = data?.config as DesignConfig | undefined
      if (config && Object.keys(config).length > 0) {
        set({ config: normalizeConfigUrls(config) })
      }
    } catch (err) {
      console.error(err)
      useToastStore.getState().showToast('Lỗi tải cấu hình thiết kế', 'error')
    } finally {
      set({ loading: false })
    }
  },

  saveConfig: async () => {
    if (!requireAuth()) return false
    try {
      const { config } = get()
      const { error } = await supabase.from('invitation_config').upsert({
        id: CONFIG_ROW_ID,
        config,
      })
      if (error) throw error
      useToastStore.getState().showToast('Đã lưu thiết kế mới!')
      return true
    } catch (err) {
      console.error(err)
    }
    useToastStore.getState().showToast('Lỗi khi lưu thiết kế', 'error')
    return false
  },

  past: [],
  future: [],

  pushToHistory: () => {
    set((state) => {
      const newPast = [...state.past, state.config]
      if (newPast.length > 20) newPast.shift()
      return { past: newPast, future: [] }
    })
  },

  pushStateToHistory: (configState) => {
    set((state) => {
      const newPast = [...state.past, configState]
      if (newPast.length > 20) newPast.shift()
      return { past: newPast, future: [] }
    })
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return {}
      const previous = state.past[state.past.length - 1]
      const newPast = state.past.slice(0, -1)
      return {
        past: newPast,
        config: previous,
        future: [state.config, ...state.future],
      }
    })
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return {}
      const next = state.future[0]
      const newFuture = state.future.slice(1)
      return {
        past: [...state.past, state.config],
        config: next,
        future: newFuture,
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
        ),
      },
    }))
  },

  moveElement: (id, x, y) => {
    set((state) => ({
      config: {
        ...state.config,
        elements: state.config.elements.map((el) =>
          el.id === id ? { ...el, x, y } : el
        ),
      },
    }))
  },

  addElement: (element) => {
    get().pushToHistory()
    set((state) => ({
      config: {
        ...state.config,
        elements: [...state.config.elements, element],
      },
      selectedElementId: element.id,
    }))
  },

  removeElement: (id) => {
    get().pushToHistory()
    set((state) => ({
      config: {
        ...state.config,
        elements: state.config.elements.filter((el) => el.id !== id),
      },
      selectedElementId: null,
    }))
  },

  updateBackground: (bg) => {
    get().pushToHistory()
    set((state) => ({
      config: {
        ...state.config,
        background: { ...state.config.background, ...bg },
      },
    }))
  },

  updateMusic: (musicUpdates, pushHistory = true) => {
    if (pushHistory) get().pushToHistory()
    set((state) => ({
      config: {
        ...state.config,
        music: state.config.music
          ? { ...state.config.music, ...musicUpdates }
          : { url: '', enabled: true, ...musicUpdates },
      },
    }))
  },

  bringToFront: (id) => {
    get().pushToHistory()
    set((state) => {
      const elIndex = state.config.elements.findIndex((e) => e.id === id)
      if (elIndex < 0 || elIndex === state.config.elements.length - 1) return {}
      const newEls = [...state.config.elements]
      const [el] = newEls.splice(elIndex, 1)
      newEls.push(el)
      return { config: { ...state.config, elements: newEls } }
    })
  },

  sendToBack: (id) => {
    get().pushToHistory()
    set((state) => {
      const elIndex = state.config.elements.findIndex((e) => e.id === id)
      if (elIndex <= 0) return {}
      const newEls = [...state.config.elements]
      const [el] = newEls.splice(elIndex, 1)
      newEls.unshift(el)
      return { config: { ...state.config, elements: newEls } }
    })
  },

  bringForward: (id) => {
    get().pushToHistory()
    set((state) => {
      const elIndex = state.config.elements.findIndex((e) => e.id === id)
      if (elIndex < 0 || elIndex === state.config.elements.length - 1) return {}
      const newEls = [...state.config.elements]
      const [el] = newEls.splice(elIndex, 1)
      newEls.splice(elIndex + 1, 0, el)
      return { config: { ...state.config, elements: newEls } }
    })
  },

  sendBackward: (id) => {
    get().pushToHistory()
    set((state) => {
      const elIndex = state.config.elements.findIndex((e) => e.id === id)
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

    const el = config.elements.find((e) => e.id === selectedElementId)
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
      y: clipboard.y + 20,
    }

    set((state) => ({
      config: {
        ...state.config,
        elements: [...state.config.elements, newElement],
      },
      selectedElementId: newId,
    }))
    useToastStore.getState().showToast('Đã dán')
  },

  uploadFile: async (file: File) => {
    if (!requireAuth()) return null
    try {
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

      const { error } = await supabase.storage
        .from(INVITATION_ASSETS_BUCKET)
        .upload(path, file, { upsert: false })

      if (error) throw error

      const { data } = supabase.storage
        .from(INVITATION_ASSETS_BUCKET)
        .getPublicUrl(path)

      return data.publicUrl
    } catch (err) {
      console.error('Upload failed:', err)
    }
    useToastStore.getState().showToast('Lỗi khi tải file lên', 'error')
    return null
  },
}))
