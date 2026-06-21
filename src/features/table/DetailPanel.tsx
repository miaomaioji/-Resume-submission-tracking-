import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import { repo } from '@/db/repository'
import { useContacts, useEvents } from '@/hooks/useData'
import { formatDateTime } from '@/lib/format'
import { STATUS_LABEL_ZH, type Status } from '@/domain/enums'
import type { Application } from '@/domain/types'

const inputCls = 'rounded border px-2 py-1 text-sm'
const inputStyle = { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }
const emptyContact = { name: '', role: '', wechat: '', phone: '', email: '' }

export function DetailPanel({ app }: { app: Application }) {
  const events = useEvents(app.id)
  const contacts = useContacts(app.id)
  const [note, setNote] = useState('')
  const [c, setC] = useState(emptyContact)

  const lastChange = [...events].reverse().find((e) => e.type === 'status_change')
  const since = lastChange?.at ?? app.createdAt
  const days = Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000)

  async function addNote() {
    const v = note.trim()
    if (!v) return
    await repo.addNote(app.id, v)
    setNote('')
  }
  async function addContact() {
    if (!c.name.trim() && !c.wechat.trim() && !c.phone.trim() && !c.email.trim()) return
    await repo.addContact({
      applicationId: app.id,
      name: c.name.trim() || undefined,
      role: c.role.trim() || undefined,
      wechat: c.wechat.trim() || undefined,
      phone: c.phone.trim() || undefined,
      email: c.email.trim() || undefined,
    })
    setC(emptyContact)
  }

  return (
    <div className="grid gap-6 p-4 md:grid-cols-2" style={{ background: 'var(--bg)' }}>
      <div>
        <h4
          className="mb-2 text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          时间线 · 当前节点已停留 {days} 天
        </h4>
        <ol className="space-y-1.5">
          {events.map((e) => (
            <li key={e.id} className="flex gap-2 text-sm">
              <span className="shrink-0" style={{ color: 'var(--text-muted)' }}>
                {formatDateTime(e.at)}
              </span>
              <span>
                {e.type === 'status_change'
                  ? `${e.fromStatus ? STATUS_LABEL_ZH[e.fromStatus as Status] : '—'} → ${
                      e.toStatus ? STATUS_LABEL_ZH[e.toStatus as Status] : '—'
                    }`
                  : e.label || e.note}
              </span>
            </li>
          ))}
          {events.length === 0 && (
            <li className="text-sm" style={{ color: 'var(--text-muted)' }}>
              暂无记录
            </li>
          )}
        </ol>
        <div className="mt-2 flex gap-2">
          <input
            className={`${inputCls} flex-1`}
            style={inputStyle}
            placeholder="添加备注事件…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addNote()
            }}
          />
          <button
            type="button"
            onClick={addNote}
            className="rounded border px-3 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            添加
          </button>
        </div>
      </div>

      <div>
        <h4
          className="mb-2 text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          联系人
        </h4>
        <ul className="space-y-1">
          {contacts.map((ct) => (
            <li key={ct.id} className="flex items-center gap-2 text-sm">
              <span className="font-medium">{ct.name || '—'}</span>
              {ct.role && <span style={{ color: 'var(--text-muted)' }}>{ct.role}</span>}
              <span style={{ color: 'var(--text-muted)' }}>
                {[ct.wechat, ct.phone, ct.email].filter(Boolean).join(' · ')}
              </span>
              <button
                type="button"
                onClick={() => repo.deleteContact(ct.id)}
                className="ml-auto"
                style={{ color: 'var(--text-muted)' }}
                aria-label="删除联系人"
              >
                <IconTrash size={14} />
              </button>
            </li>
          ))}
          {contacts.length === 0 && (
            <li className="text-sm" style={{ color: 'var(--text-muted)' }}>
              暂无联系人
            </li>
          )}
        </ul>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input className={inputCls} style={inputStyle} placeholder="姓名" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
          <input className={inputCls} style={inputStyle} placeholder="角色(HR/面试官)" value={c.role} onChange={(e) => setC({ ...c, role: e.target.value })} />
          <input className={inputCls} style={inputStyle} placeholder="微信" value={c.wechat} onChange={(e) => setC({ ...c, wechat: e.target.value })} />
          <input className={inputCls} style={inputStyle} placeholder="电话" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
          <input className={`${inputCls} col-span-2`} style={inputStyle} placeholder="邮箱" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} />
        </div>
        <button
          type="button"
          onClick={addContact}
          className="mt-2 rounded border px-3 py-1 text-sm"
          style={{ borderColor: 'var(--border)' }}
        >
          添加联系人
        </button>
      </div>
    </div>
  )
}
