import { createEvents, type EventAttributes } from 'ics'
import dayjs from 'dayjs'
import type { Application } from '@/domain/types'

/** 把所有有面试时间的投递生成 ICS 文本(无可导出时返回 null)。 */
export function buildInterviewIcs(apps: Application[]): string | null {
  const events: EventAttributes[] = apps
    .filter((a) => a.interviewAt)
    .map((a) => {
      const d = dayjs(a.interviewAt)
      return {
        title: `面试:${a.company} · ${a.position}`,
        start: [d.year(), d.month() + 1, d.date(), d.hour(), d.minute()],
        duration: { hours: 1 },
        description: [a.position, a.notes].filter(Boolean).join(' | '),
        location: a.location,
      }
    })
  if (events.length === 0) return null
  const { error, value } = createEvents(events)
  if (error || !value) return null
  return value
}

export function downloadIcs(content: string, filename = 'interviews.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
