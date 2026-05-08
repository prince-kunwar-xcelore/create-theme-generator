export type Theme = 'dark' | 'light'

export const useTheme = () => {
  const theme = useState<Theme>('theme', () => 'dark')

  function apply(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('theme-pref', t)
  }

  function init() {
    if (!import.meta.client) return
    const stored = localStorage.getItem('theme-pref') as Theme | null
    const sys: Theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    const t = stored ?? sys
    theme.value = t
    apply(t)
  }

  function toggle() {
    const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
    theme.value = next
    apply(next)
  }

  return { theme, init, toggle }
}
