import { create } from 'zustand'

export interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: (token: string, user: User) => {
    // Store in localStorage
    localStorage.setItem('auth-storage', JSON.stringify({
      token,
      user,
      isAuthenticated: true,
    }))
    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    })
  },
  logout: () => {
    // Remove from localStorage
    localStorage.removeItem('auth-storage')
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  initializeAuth: () => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.token && parsed.user) {
          set({
            token: parsed.token,
            user: parsed.user,
            isAuthenticated: true,
          })
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      localStorage.removeItem('auth-storage')
    }
  },
}))