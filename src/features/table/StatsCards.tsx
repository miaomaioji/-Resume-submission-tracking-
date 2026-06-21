import dayjs from 'dayjs'
import { IconCalendarEvent, IconCircleCheck, IconLoader, IconSend } from '@tabler/icons-react'
import { ACTIVE_STATUSES } from '@/domain/enums'
import type { Application } from '@/domain/types'

const ICON_COLORS: Record<string, { bg: string; fg: string }> = {
  blue: { bg: '#e6f1fb', fg: '#185fa5' },
  amber: { bg: '#faeeda', fg: '#854f0b' },
  teal: { bg: '#e1f5ee', fg: '#0f6e56' },
  green: { bg: '#eaf3de', fg: '#3b6d11' },
}

export function StatsCards({ apps }: { apps: Application[] }) {
  const today = dayjs().startOf('day')
  const total = apps.length
  const active = apps.filter((a) => ACTIVE_STATUSES.includes(a.status)).length
  const offers = apps.filter((a) => a.status === 'offer').length
  const upcoming = apps.filter(
    (a) =>
      a.nextFollowUpAt &&
      !dayjs(a.nextFollowUpAt).isBefore(today) &&
      ACTIVE_STATUSES.includes(a.status),
  ).length

  const cards = [
    { label: '总投递', value: total, Icon: IconSend, color: 'blue' },
    { label: '进行中', value: active, Icon: IconLoader, color: 'amber' },
    { label: '待跟进', value: upcoming, Icon: IconCalendarEvent, color: 'teal' },
    { label: '已 OC', value: offers, Icon: IconCircleCheck, color: 'green' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ label, value, Icon, color }) => {
        const c = ICON_COLORS[color]
        return (
          <div
            key={label}
            className="flex flex-col gap-1.5 rounded-lg p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {label}
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: c.bg, color: c.fg }}
              >
                <Icon size={16} />
              </span>
            </div>
            <span className="text-2xl font-medium leading-none">{value}</span>
          </div>
        )
      })}
    </div>
  )
}
