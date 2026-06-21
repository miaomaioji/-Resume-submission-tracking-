import { createContext, useContext } from 'react'
import type { Application, Channel } from '@/domain/types'

export type EditType = 'text' | 'number' | 'date' | 'jobType' | 'channel' | 'status'
export type Move = 'none' | 'tab' | 'shiftTab' | 'down'

export interface EditPos {
  rowId: string
  colId: string
}

export interface GridApi {
  edit: EditPos | null
  channels: Channel[]
  startEdit: (rowId: string, colId: string) => void
  cancel: () => void
  commitMove: (app: Application, field: string, type: EditType, value: string, move: Move) => void
}

export const GridContext = createContext<GridApi | null>(null)

export function useGrid(): GridApi {
  const g = useContext(GridContext)
  if (!g) throw new Error('GridContext is missing')
  return g
}

// 可内联编辑的列(顺序决定 Tab 导航顺序;salary / actions 不在内)
export const EDITABLE_IDS = [
  'company',
  'position',
  'jobType',
  'channel',
  'status',
  'location',
  'appliedAt',
  'nextFollowUpAt',
  'notes',
]
