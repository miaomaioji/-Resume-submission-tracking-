import { useLiveQuery } from 'dexie-react-hooks'
import { repo, SETTINGS_DEFAULT } from '@/db/repository'

/** 全部未删除投递(响应式)。 */
export function useApplications() {
  return useLiveQuery(() => repo.listApplications(), [], [])
}

/** 设置(响应式),未初始化时返回默认值。 */
export function useSettings() {
  return useLiveQuery(() => repo.getSettings(), [], SETTINGS_DEFAULT)
}

/** 渠道列表(响应式)。 */
export function useChannels() {
  return useLiveQuery(() => repo.listChannels(), [], [])
}

/** 某条投递的时间线事件(按时间升序)。 */
export function useEvents(appId: string) {
  return useLiveQuery(() => repo.listEvents(appId), [appId], [])
}

/** 某条投递的联系人。 */
export function useContacts(appId: string) {
  return useLiveQuery(() => repo.listContacts(appId), [appId], [])
}
