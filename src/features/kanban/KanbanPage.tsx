import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useApplications, useSettings } from '@/hooks/useData'
import { repo } from '@/db/repository'
import { KANBAN_COLUMNS, STATUS_COLORS, STATUS_LABEL_ZH, type Status } from '@/domain/enums'
import { TIMEOUT_COLORS, timeoutLevel } from '@/domain/timeout'
import { formatSalary } from '@/lib/format'
import type { Application, Settings } from '@/domain/types'

function Card({ app, settings }: { app: Application; settings: Settings }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id })
  const level = timeoutLevel(app, settings)
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="cursor-grab rounded-md p-2 text-sm active:cursor-grabbing"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${TIMEOUT_COLORS[level]}`,
        opacity: isDragging ? 0.4 : 1,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      }}
    >
      <div className="font-medium">{app.company}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {app.position}
      </div>
      <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        {formatSalary(app)}
        {app.channel ? ` · ${app.channel}` : ''}
      </div>
    </div>
  )
}

function Column({ status, apps, settings }: { status: Status; apps: Application[]; settings: Settings }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const c = STATUS_COLORS[status]
  return (
    <div
      ref={setNodeRef}
      className="flex w-56 flex-shrink-0 flex-col rounded-lg p-2"
      style={{
        background: isOver ? c.bg : 'var(--bg)',
        border: `1px solid ${isOver ? c.fg : 'var(--border)'}`,
      }}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-medium" style={{ color: c.fg }}>
          {STATUS_LABEL_ZH[status]}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {apps.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {apps.map((a) => (
          <Card key={a.id} app={a} settings={settings} />
        ))}
      </div>
    </div>
  )
}

export function KanbanPage() {
  const apps = useApplications()
  const settings = useSettings()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function onDragEnd(e: DragEndEvent) {
    const appId = String(e.active.id)
    const toStatus = e.over?.id as Status | undefined
    if (!toStatus) return
    const app = apps.find((a) => a.id === appId)
    if (app && app.status !== toStatus) void repo.changeStatus(appId, toStatus)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((s) => (
          <Column key={s} status={s} apps={apps.filter((a) => a.status === s)} settings={settings} />
        ))}
      </div>
    </DndContext>
  )
}
