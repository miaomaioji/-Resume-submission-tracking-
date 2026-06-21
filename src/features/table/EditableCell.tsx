import { type FocusEvent, type KeyboardEvent, useCallback, useRef } from 'react'
import dayjs from 'dayjs'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate } from '@/lib/format'
import { JOB_TYPES, STATUS_LABEL_ZH, STATUS_ORDER } from '@/domain/enums'
import type { Application } from '@/domain/types'
import { useGrid, type EditType } from './grid'

const FIELD = 'w-full rounded border px-1.5 py-1 text-sm outline-none'
const fieldStyle = { borderColor: 'var(--info)', background: 'var(--surface)', color: 'var(--text)' }

function currentRaw(app: Application, field: string, type: EditType): string {
  const v = (app as unknown as Record<string, unknown>)[field]
  if (v == null) return ''
  if (type === 'date') return dayjs(v as string).format('YYYY-MM-DD')
  return String(v)
}

function Display({ app, field, type }: { app: Application; field: string; type: EditType }) {
  if (type === 'status') return <StatusBadge status={app.status} />
  const v = (app as unknown as Record<string, unknown>)[field]
  if (type === 'date') {
    return v ? <>{formatDate(v as string)}</> : <span style={{ color: 'var(--text-muted)' }}>—</span>
  }
  if (field === 'company') return <span className="font-medium">{app.company}</span>
  if (field === 'notes') {
    return (
      <span className="line-clamp-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        {app.notes ?? ''}
      </span>
    )
  }
  if (v == null || v === '') return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return <>{String(v)}</>
}

export function EditableCell({
  app,
  field,
  type,
}: {
  app: Application
  field: string
  type: EditType
}) {
  const g = useGrid()
  const editing = g.edit?.rowId === app.id && g.edit?.colId === field
  const skipBlur = useRef(false)

  const focusRef = useCallback((el: HTMLInputElement | HTMLSelectElement | null) => {
    if (!el) return
    el.focus()
    if (el instanceof HTMLInputElement) el.select()
  }, [])

  if (!editing) {
    return (
      <div className="min-h-[1.5rem] cursor-text" onClick={() => g.startEdit(app.id, field)}>
        <Display app={app} field={field} type={type} />
      </div>
    )
  }

  const initial = currentRaw(app, field, type)

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      skipBlur.current = true
      g.commitMove(app, field, type, e.currentTarget.value, 'down')
    } else if (e.key === 'Escape') {
      e.preventDefault()
      skipBlur.current = true
      g.cancel()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      skipBlur.current = true
      g.commitMove(app, field, type, e.currentTarget.value, e.shiftKey ? 'shiftTab' : 'tab')
    }
  }

  const onBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (skipBlur.current) {
      skipBlur.current = false
      return
    }
    g.commitMove(app, field, type, e.currentTarget.value, 'none')
  }

  if (type === 'status' || type === 'jobType' || type === 'channel') {
    return (
      <select
        ref={focusRef}
        className={FIELD}
        style={fieldStyle}
        defaultValue={initial}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        {type !== 'status' && <option value="">—</option>}
        {type === 'status' &&
          STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL_ZH[s]}
            </option>
          ))}
        {type === 'jobType' &&
          JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        {type === 'channel' &&
          g.channels.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
      </select>
    )
  }

  return (
    <input
      ref={focusRef}
      className={FIELD}
      style={fieldStyle}
      type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
      defaultValue={initial}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  )
}
