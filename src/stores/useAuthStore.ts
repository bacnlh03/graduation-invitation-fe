import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  isAuthenticated: boolean
  loading: boolean
  initialized: boolean
  error: string | null

  initialize: () => () => void
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthenticated: false,
  loading: false,
  initialized: false,
  error: null,

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        isAuthenticated: !!session,
        initialized: true,
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        isAuthenticated: !!session,
        initialized: true,
      })
    })

    return () => subscription.unsubscribe()
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      set({
        error: error.message === 'Invalid login credentials'
          ? 'Email hoặc mật khẩu không đúng'
          : error.message,
        loading: false,
      })
      return false
    }
    set({
      session: data.session,
      isAuthenticated: true,
      loading: false,
    })
    return true
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, isAuthenticated: false, error: null })
  },

  clearError: () => set({ error: null }),
}))
