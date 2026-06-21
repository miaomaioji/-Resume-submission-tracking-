import { STATUS_COLORS, STATUS_LABEL_ZH, type Status } from '@/domain/enums'

export function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_COLORS[status]
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg, opacity: 0.6 }} />
      {STATUS_LABEL_ZH[status]}
    </span>
  )
}
