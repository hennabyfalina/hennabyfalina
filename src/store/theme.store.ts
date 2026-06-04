// src/store/theme.store.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme, broadcast?: boolean) => void
  toggleTheme: () => void
}

// Use requestAnimationFrame for smooth theme switching
const applyTheme = (theme: Theme) => {
  // Use requestAnimationFrame to avoid layout thrashing
  requestAnimationFrame(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark', 'admin-theme-dark')
      document.documentElement.classList.add('admin-theme-light')
      document.body.style.backgroundColor = 'var(--admin-bg-primary)'
    } else {
      document.documentElement.classList.add('dark', 'admin-theme-dark')
      document.documentElement.classList.remove('admin-theme-light')
      document.body.style.backgroundColor = 'var(--admin-bg-primary)'
    }
    
    // Force a repaint for smooth transition
    document.body.offsetHeight
  })
}

export const useAdminThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      let broadcastChannel: BroadcastChannel | null = null
      let isApplyingTheme = false
      
      if (typeof window !== 'undefined') {
        broadcastChannel = new BroadcastChannel('admin-theme-sync')
        
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'THEME_CHANGE' && event.data.theme !== get().theme && !isApplyingTheme) {
            isApplyingTheme = true
            set({ theme: event.data.theme })
            applyTheme(event.data.theme)
            setTimeout(() => { isApplyingTheme = false }, 50)
          }
        }
      }
      
      return {
        theme: 'light',
        setTheme: (theme, broadcast = true) => {
          if (theme === get().theme) return
          
          set({ theme })
          applyTheme(theme)
          
          if (broadcast && broadcastChannel && typeof window !== 'undefined') {
            broadcastChannel.postMessage({ type: 'THEME_CHANGE', theme })
          }
        },
        toggleTheme: () => {
          const newTheme = get().theme === 'dark' ? 'light' : 'dark'
          get().setTheme(newTheme)
        },
      }
    },
    {
      name: 'admin-theme-preference',
    }
  )
)