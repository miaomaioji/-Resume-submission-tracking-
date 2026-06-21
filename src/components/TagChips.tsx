import type { Tag } from '@/domain/types'

export const TAG_PALETTE = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
]

export function pickTagColor(seed: number): string {
  return TAG_PALETTE[seed % TAG_PALETTE.length]
}

export function TagChips({
  tagIds,
  tags,
  onRemove,
}: {
  tagIds: string[]
  tags: Tag[]
  onRemove?: (id: string) => void
}) {
  const byId = new Map(tags.map((t) => [t.id, t]))
  const items = tagIds.map((id) => byId.get(id)).filter((t): t is Tag => Boolean(t))
  if (items.length === 0) {
    return onRemove ? null : <span style={{ color: 'var(--text-muted)' }}>—</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: t.color + '22', color: t.color }}
        >
          {t.name}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(t.id)}
              className="opacity-60 hover:opacity-100"
              aria-label="移除标签"
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  )
}
