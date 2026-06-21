import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  IconCalendarEvent,
  IconDeviceDesktop,
  IconLayoutKanban,
  IconMoon,
  IconSettings,
  IconSun,
  IconTable,
} from '@tabler/icons-react'
import { useSettings } from '@/hooks/useData'
import { repo } from '@/db/repository'
import { ReminderBell } from '@/components/ReminderBell'
import type { Settings } from '@/domain/types'

const NAV = [
  { to: '/table', key: 'table', Icon: IconTable },
  { to: '/kanban', key: 'kanban', Icon: IconLayoutKanban },
  { to: '/calendar', key: 'calendar', Icon: IconCalendarEvent },
  { to: '/settings', key: 'settings', Icon: IconSettings },
] as const

const THEMES: Settings['theme'][] = ['system', 'light', 'dark']
const THEME_ICON = { system: IconDeviceDesktop, light: IconSun, dark: IconMoon }
const THEME_LABEL = { system: '跟随系统', light: '浅色', dark: '深色' }

export function Layout() {
  const { t } = useTranslation()
  const settings = useSettings()
  const theme = settings.theme

  useEffect(() => {
    const root = document.documentElement
    const apply = (mode: 'light' | 'dark') => {
      root.dataset.theme = mode
    }
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches ? 'dark' : 'light')
      const h = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', h)
      return () => mq.removeEventListener('change', h)
    }
    apply(theme)
  }, [theme])

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
    void repo.saveSettings({ theme: next })
  }
  const ThemeIcon = THEME_ICON[theme]

  return (
    <div className="flex h-full flex-col">
      <header
        className="flex items-center justify-between gap-2 border-b px-4 py-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h1 className="text-sm font-semibold">{t('app.title')}</h1>
        <div className="flex items-center gap-1">
          <nav className="flex gap-1">
            {NAV.map(({ to, key, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm"
                style={({ isActive }) => ({
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'var(--bg)' : 'var(--text-muted)',
                })}
              >
                <Icon size={16} />
                {t(`nav.${key}`)}
              </NavLink>
            ))}
          </nav>
          <ReminderBell />
          <button
            type="button"
            onClick={cycleTheme}
            className="rounded-md p-1.5"
            style={{ color: 'var(--text-muted)' }}
            aria-label="切换主题"
            title={`主题:${THEME_LABEL[theme]}`}
          >
            <ThemeIcon size={18} />
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
