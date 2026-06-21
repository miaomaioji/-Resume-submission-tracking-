import { db } from './schema'
import { DEFAULT_CHANNELS, DEFAULT_TIMEOUT, type Status } from '@/domain/enums'
import { nowIso, uid } from '@/domain/id'
import type { Application, Channel, Contact, Settings, Tag, TimelineEvent } from '@/domain/types'

/**
 * 数据访问抽象。MVP 用本地(Dexie)实现;未来自建后端时新增远端实现,UI/领域层不变。
 */
export interface Repository {
  listApplications(): Promise<Application[]>
  getApplication(id: string): Promise<Application | undefined>
  createApplication(
    input: Partial<Application> & { company: string; position: string },
  ): Promise<Application>
  updateApplication(id: string, patch: Partial<Application>): Promise<void>
  changeStatus(id: string, to: Status, label?: string): Promise<void>
  softDeleteApplication(id: string): Promise<void>
  listEvents(applicationId: string): Promise<TimelineEvent[]>
  getSettings(): Promise<Settings>
  saveSettings(patch: Partial<Settings>): Promise<void>
  listChannels(): Promise<Channel[]>
  addChannel(name: string): Promise<void>
  deleteChannel(id: string): Promise<void>
  listContacts(applicationId: string): Promise<Contact[]>
  addContact(c: Omit<Contact, 'id'>): Promise<void>
  deleteContact(id: string): Promise<void>
  addNote(applicationId: string, note: string): Promise<void>
  listTags(): Promise<Tag[]>
  createTag(name: string, color: string): Promise<Tag>
  deleteTag(id: string): Promise<void>
  addTagToApplication(appId: string, tagId: string): Promise<void>
  removeTagFromApplication(appId: string, tagId: string): Promise<void>
  bulkSetStatus(ids: string[], status: Status): Promise<void>
  bulkAddTag(ids: string[], tagId: string): Promise<void>
  bulkSoftDelete(ids: string[]): Promise<void>
}

export const SETTINGS_DEFAULT: Settings = {
  id: 'singleton',
  language: 'zh-CN',
  theme: 'system',
  timeout: { default: { ...DEFAULT_TIMEOUT }, byChannel: {} },
  reminders: { interviewDayBefore: true, interviewHoursBefore: 2, followUpDue: true, idleTimeout: true },
  table: { columnOrder: [], hiddenColumns: [], columnWidths: {} },
}

class LocalRepository implements Repository {
  listApplications() {
    return db.applications.filter((a) => !a.deletedAt).toArray()
  }

  getApplication(id: string) {
    return db.applications.get(id)
  }

  async createApplication(
    input: Partial<Application> & { company: string; position: string },
  ): Promise<Application> {
    const ts = nowIso()
    const app: Application = {
      ...input,
      id: uid(),
      company: input.company,
      position: input.position,
      status: input.status ?? 'created',
      tagIds: input.tagIds ?? [],
      createdAt: ts,
      updatedAt: ts,
      version: 1,
      deletedAt: null,
    }
    await db.applications.add(app)
    return app
  }

  async updateApplication(id: string, patch: Partial<Application>) {
    const cur = await db.applications.get(id)
    if (!cur) return
    await db.applications.update(id, { ...patch, updatedAt: nowIso(), version: cur.version + 1 })
  }

  async changeStatus(id: string, to: Status, label?: string) {
    const cur = await db.applications.get(id)
    if (!cur || cur.status === to) return
    const ts = nowIso()
    const event: TimelineEvent = {
      id: uid(),
      applicationId: id,
      type: 'status_change',
      at: ts,
      fromStatus: cur.status,
      toStatus: to,
      label,
      createdAt: ts,
    }
    await db.transaction('rw', db.applications, db.events, async () => {
      await db.applications.update(id, { status: to, updatedAt: ts, version: cur.version + 1 })
      await db.events.add(event)
    })
  }

  async softDeleteApplication(id: string) {
    await db.applications.update(id, { deletedAt: nowIso() })
  }

  listEvents(applicationId: string) {
    return db.events.where('applicationId').equals(applicationId).sortBy('at')
  }

  async getSettings() {
    const s = await db.settings.get('singleton')
    return s ?? SETTINGS_DEFAULT
  }

  async saveSettings(patch: Partial<Settings>) {
    const cur = await this.getSettings()
    await db.settings.put({ ...cur, ...patch, id: 'singleton' })
  }

  listChannels() {
    return db.channels.orderBy('order').toArray()
  }

  async addChannel(name: string) {
    const count = await db.channels.count()
    await db.channels.add({ id: uid(), name, order: count })
  }

  async deleteChannel(id: string) {
    await db.channels.delete(id)
  }

  listContacts(applicationId: string) {
    return db.contacts.where('applicationId').equals(applicationId).toArray()
  }

  async addContact(c: Omit<Contact, 'id'>) {
    await db.contacts.add({ ...c, id: uid() })
  }

  async deleteContact(id: string) {
    await db.contacts.delete(id)
  }

  async addNote(applicationId: string, note: string) {
    const ts = nowIso()
    await db.events.add({ id: uid(), applicationId, type: 'note', at: ts, note, createdAt: ts })
  }

  listTags() {
    return db.tags.toArray()
  }

  async createTag(name: string, color: string) {
    const tag: Tag = { id: uid(), name, color }
    await db.tags.add(tag)
    return tag
  }

  async deleteTag(id: string) {
    await db.transaction('rw', db.tags, db.applications, async () => {
      await db.tags.delete(id)
      const affected = await db.applications.filter((a) => a.tagIds?.includes(id)).toArray()
      for (const a of affected) {
        await db.applications.update(a.id, { tagIds: a.tagIds.filter((t) => t !== id), updatedAt: nowIso() })
      }
    })
  }

  async addTagToApplication(appId: string, tagId: string) {
    const a = await db.applications.get(appId)
    if (!a || a.tagIds.includes(tagId)) return
    await db.applications.update(appId, {
      tagIds: [...a.tagIds, tagId],
      updatedAt: nowIso(),
      version: a.version + 1,
    })
  }

  async removeTagFromApplication(appId: string, tagId: string) {
    const a = await db.applications.get(appId)
    if (!a) return
    await db.applications.update(appId, {
      tagIds: a.tagIds.filter((t) => t !== tagId),
      updatedAt: nowIso(),
      version: a.version + 1,
    })
  }

  async bulkSetStatus(ids: string[], status: Status) {
    await db.transaction('rw', db.applications, db.events, async () => {
      for (const id of ids) {
        const a = await db.applications.get(id)
        if (!a || a.status === status) continue
        const ts = nowIso()
        await db.applications.update(id, { status, updatedAt: ts, version: a.version + 1 })
        await db.events.add({
          id: uid(),
          applicationId: id,
          type: 'status_change',
          at: ts,
          fromStatus: a.status,
          toStatus: status,
          createdAt: ts,
        })
      }
    })
  }

  async bulkAddTag(ids: string[], tagId: string) {
    await db.transaction('rw', db.applications, async () => {
      for (const id of ids) {
        const a = await db.applications.get(id)
        if (!a || a.tagIds.includes(tagId)) continue
        await db.applications.update(id, {
          tagIds: [...a.tagIds, tagId],
          updatedAt: nowIso(),
          version: a.version + 1,
        })
      }
    })
  }

  async bulkSoftDelete(ids: string[]) {
    const ts = nowIso()
    await db.transaction('rw', db.applications, async () => {
      for (const id of ids) await db.applications.update(id, { deletedAt: ts })
    })
  }
}

export const repo: Repository = new LocalRepository()

/** 首次启动播种默认渠道与设置(幂等)。 */
export async function initDb(): Promise<void> {
  try {
    if ((await db.channels.count()) === 0) {
      await db.channels.bulkAdd(DEFAULT_CHANNELS.map((name, order) => ({ id: uid(), name, order })))
    }
    if (!(await db.settings.get('singleton'))) {
      await db.settings.put(SETTINGS_DEFAULT)
    }
  } catch (err) {
    console.error('[initDb] 初始化失败', err)
  }
}
