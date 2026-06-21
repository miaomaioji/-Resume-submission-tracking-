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
