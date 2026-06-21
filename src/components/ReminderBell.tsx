import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBell } from '@tabler/icons-react'
import { useApplications, useSettings } from '@/hooks/useData'
import { useUiStore } from '@/app/uiStore'
import { computeReminders, type Reminder } from '@/domain/reminders'

const DOT: Record<Reminder['kind'], string> = {
  interview: 'var(--info)',
  followup: 'var(--warn)',
  timeout: 'var(--alert)',
}

export function ReminderBell() {
  const apps = useApplications()
  const settings = useSettings()
  const navigate = useNavigate()
  const setFocus = useUiStore((s) => s.setFocusAppId)
  const [open, setOpen] = useState(false)
  const reminders = computeReminders(apps, settings)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-1.5"
        style={{ color: 'var(--text-muted)' }}
        aria-label="提醒"
      >
        <IconBell size={18} />
        {reminders.length > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium text-white"
            style={{ background: 'var(--alert)' }}
          >
            {reminders.length}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-50 mt-1 w-64 rounded-lg border p-2 shadow-lg"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="mb-1 px-1 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              提醒({reminders.length})
            </div>
            {reminders.length === 0 && (
              <p className="px-1 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                暂无待办
              </p>
            )}
            {reminders.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setFocus(r.appId)
                  navigate('/table')
                  setOpen(false)
                }}
                className="block w-full rounded px-2 py-1.5 text-left text-sm hover:opacity-80"
                style={{ color: 'var(--text)' }}
              >
                <span
                  className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                  style={{ background: DOT[r.kind] }}
                />
                {r.text}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
