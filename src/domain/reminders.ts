import { ACTIVE_STATUSES } from './enums'
import { timeoutLevel } from './timeout'
import type { Application, Settings } from './types'

export interface Reminder {
  appId: string
  kind: 'interview' | 'followup' | 'timeout'
  text: string
}

const DAY = 24 * 60 * 60 * 1000

/** 聚合「面试临近(48h 内)/ 跟进到期 / 超时未回」三类待办。 */
export function computeReminders(
  apps: Application[],
  settings: Settings,
  now: Date = new Date(),
): Reminder[] {
  const t = now.getTime()
  const out: Reminder[] = []
  for (const a of apps) {
    if (a.interviewAt) {
      const diff = new Date(a.interviewAt).getTime() - t
      if (diff > 0 && diff <= 2 * DAY) {
        out.push({ appId: a.id, kind: 'interview', text: `面试临近 · ${a.company}` })
      }
    }
    if (
      a.nextFollowUpAt &&
      ACTIVE_STATUSES.includes(a.status) &&
      new Date(a.nextFollowUpAt).getTime() <= t
    ) {
      out.push({ appId: a.id, kind: 'followup', text: `跟进到期 · ${a.company}` })
    }
    const lvl = timeoutLevel(a, settings, now)
    if (lvl === 'warn' || lvl === 'alert') {
      out.push({
        appId: a.id,
        kind: 'timeout',
        text: `${lvl === 'alert' ? '严重超时' : '超时'}未回 · ${a.company}`,
      })
    }
  }
  return out
}
