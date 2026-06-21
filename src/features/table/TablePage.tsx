import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { IconCopy, IconEdit, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import { useApplications, useSettings } from '@/hooks/useData'
import { repo } from '@/db/repository'
import { migrateLegacy } from '@/db/migrate-legacy'
import { StatusBadge } from '@/components/StatusBadge'
import { StatsCards } from './StatsCards'
import { EntryForm } from '@/features/entry/EntryForm'
import { formatDate, formatSalary } from '@/lib/format'
import { TIMEOUT_COLORS, timeoutLevel } from '@/domain/timeout'
import { STATUS_LABEL_ZH, STATUS_ORDER, type Status } from '@/domain/enums'
import type { Application } from '@/domain/types'

const columnHelper = createColumnHelper<Application>()

export function TablePage() {
  const apps = useApplications()
  const settings = useSettings()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Application | undefined>()
  const [initial, setInitial] = useState<Partial<Application> | undefined>()
  const [importMsg, setImportMsg] = useState('')

  const data = useMemo(
    () => (statusFilter ? apps.filter((a) => a.status === statusFilter) : apps),
    [apps, statusFilter],
  )

  function onAdd() {
    setEditing(undefined)
    setInitial(undefined)
    setFormOpen(true)
  }
  function onCopyLast() {
    const last = apps[0]
    setEditing(undefined)
    setInitial(
      last
        ? {
            jobType: last.jobType,
            channel: last.channel,
            location: last.location,
            salaryMin: last.salaryMin,
            salaryMax: last.salaryMax,
            salaryMonths: last.salaryMonths,
            salaryPeriod: last.salaryPeriod,
          }
        : undefined,
    )
    setFormOpen(true)
  }
  function onEdit(app: Application) {
    setEditing(app)
    setInitial(undefined)
    setFormOpen(true)
  }
  async function onDelete(app: Application) {
    if (!confirm(`确认删除「${app.company} · ${app.position}」?`)) return
    await repo.softDeleteApplication(app.id)
  }
  async function onImport() {
    const res = await migrateLegacy()
    setImportMsg(res.found === 0 ? '未发现旧版数据' : `导入 ${res.imported}/${res.found} 条`)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('company', {
        header: '公司',
        cell: (i) => <span className="font-medium">{i.getValue()}</span>,
      }),
      columnHelper.accessor('position', { header: '岗位' }),
      columnHelper.accessor('jobType', { header: '类型', cell: (i) => i.getValue() ?? '—' }),
      columnHelper.accessor('channel', { header: '渠道', cell: (i) => i.getValue() ?? '—' }),
      columnHelper.accessor('status', {
        header: '状态',
        cell: (i) => <StatusBadge status={i.getValue()} />,
      }),
      columnHelper.display({ id: 'salary', header: '薪资', cell: ({ row }) => formatSalary(row.original) }),
      columnHelper.accessor('location', { header: '地点', cell: (i) => i.getValue() ?? '—' }),
      columnHelper.accessor('appliedAt', { header: '投递', cell: (i) => formatDate(i.getValue()) }),
      columnHelper.accessor('nextFollowUpAt', {
        header: '下次跟进',
        cell: (i) => {
          const v = i.getValue()
          if (!v) return '—'
          const label = i.row.original.nextActionLabel
          return (
            <div>
              <div>{formatDate(v)}</div>
              {label && (
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </div>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('notes', {
        header: '备注',
        cell: (i) => (
          <span className="line-clamp-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {i.getValue() ?? ''}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => onEdit(row.original)}
              className="rounded p-1"
              style={{ color: 'var(--text-muted)' }}
              aria-label="编辑"
            >
              <IconEdit size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(row.original)}
              className="rounded p-1"
              style={{ color: 'var(--text-muted)' }}
              aria-label="删除"
            >
              <IconTrash size={16} />
            </button>
          </div>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-4">
      <StatsCards apps={apps} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <IconSearch
            size={15}
            className="absolute left-2 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="搜索公司 / 岗位 / 备注…"
            className="rounded-md border py-1.5 pl-7 pr-3 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | '')}
          className="rounded-md border px-2 py-1.5 text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <option value="">全部状态</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL_ZH[s]}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onImport}
            className="rounded-md border px-3 py-1.5 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            导入旧版
          </button>
          <button
            type="button"
            onClick={onCopyLast}
            className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            <IconCopy size={15} />
            复制上一条
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}
          >
            <IconPlus size={15} />
            新增投递
          </button>
        </div>
      </div>
      {importMsg && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {importMsg}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg)' }}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className="select-none px-3 py-2 text-left text-xs font-medium uppercase tracking-wide"
                    style={{
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      cursor: h.column.getCanSort() ? 'pointer' : 'default',
                    }}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const level = timeoutLevel(row.original, settings)
              return (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    borderLeft: `3px solid ${TIMEOUT_COLORS[level]}`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-12 text-center text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  暂无记录,点击「新增投递」开始记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {formOpen && <EntryForm editing={editing} initial={initial} onClose={() => setFormOpen(false)} />}
    </div>
  )
}
