import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null

  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (username, password) => {
        set({ loading: true, error: null })
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          })
          const data = await res.json()
          if (res.ok && data.token) {
            set({ token: data.token, isAuthenticated: true, loading: false })
            return true
          }
          set({ error: data.error ?? 'Đăng nhập thất bại', loading: false })
          return false
        } catch {
          set({ error: 'Không kết nối được server', loading: false })
          return false
        }
      },

      logout: () => {
        set({ token: null, isAuthenticated: false, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
