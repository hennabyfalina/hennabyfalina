import { useEffect } from 'react'
import { useAdminThemeStore } from '@/store/theme.store'

export function useThemeObserver() {
  const { theme } = useAdminThemeStore()

  useEffect(() => {
    // 🚨 ENTERPRISE RUNTIME SECURITY: Intercept and neutralize global console API
    if (process.env.NODE_ENV === 'production') {
      const dummyFunc = () => {}
      window.console.log = dummyFunc
      window.console.warn = dummyFunc
      window.console.error = dummyFunc
      window.console.info = dummyFunc
      window.console.debug = dummyFunc
      window.console.dir = dummyFunc
      window.console.table = dummyFunc
    }

    // Apply to html element for Tailwind dark mode
    if (theme === 'light') {
      document.documentElement.classList.remove('dark', 'admin-theme-dark')
      document.documentElement.classList.add('admin-theme-light')
      document.body.classList.remove('admin-theme-dark')
      document.body.classList.add('admin-theme-light')
    } else {
      document.documentElement.classList.add('dark', 'admin-theme-dark')
      document.documentElement.classList.remove('admin-theme-light')
      document.body.classList.add('admin-theme-dark')
      document.body.classList.remove('admin-theme-light')
    }
    
    // Force a repaint to ensure CSS variables apply
    document.body.style.display = 'none'
    document.body.offsetHeight // force reflow
    document.body.style.display = ''
  }, [theme])
}