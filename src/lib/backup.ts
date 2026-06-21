import { db } from '@/db/schema'
import { nowIso } from '@/domain/id'
import type { Application, Channel, Contact, Settings, Tag, TimelineEvent } from '@/domain/types'

export interface Backup {
  app: 'resume-tracker'
  version: number
  exportedAt: string
  data: {
    applications: Application[]
    events: TimelineEvent[]
    contacts: Contact[]
    tags: Tag[]
    channels: Channel[]
    settings?: Settings
  }
}

export async function exportBackup(): Promise<Backup> {
  const [applications, events, contacts, tags, channels, settings] = await Promise.all([
    db.applications.toArray(),
    db.events.toArray(),
    db.contacts.toArray(),
    db.tags.toArray(),
    db.channels.toArray(),
    db.settings.get('singleton'),
  ])
  return {
    app: 'resume-tracker',
    version: 1,
    exportedAt: nowIso(),
    data: { applications, events, contacts, tags, channels, settings },
  }
}

export function downloadBackup(b: Backup): void {
  const blob = new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `resume-tracker-${b.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface ImportResult {
  applications: number
  mode: 'merge' | 'replace'
}

/** 导入备份。merge=按 id 覆盖/新增;replace=先清空再写入。 */
export async function importBackup(json: string, mode: 'merge' | 'replace'): Promise<ImportResult> {
  const parsed = JSON.parse(json) as Backup
  if (parsed?.app !== 'resume-tracker' || !parsed.data) {
    throw new Error('不是有效的备份文件')
  }
  const d = parsed.data
  await db.transaction(
    'rw',
    [db.applications, db.events, db.contacts, db.tags, db.channels, db.settings],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.applications.clear(),
          db.events.clear(),
          db.contacts.clear(),
          db.tags.clear(),
        ])
      }
      await db.applications.bulkPut(d.applications ?? [])
      await db.events.bulkPut(d.events ?? [])
      await db.contacts.bulkPut(d.contacts ?? [])
      await db.tags.bulkPut(d.tags ?? [])
      if (d.channels?.length) await db.channels.bulkPut(d.channels)
      if (d.settings) await db.settings.put(d.settings)
    },
  )
  return { applications: d.applications?.length ?? 0, mode }
}
