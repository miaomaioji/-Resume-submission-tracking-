import { useState } from 'react'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useChannels, useSettings } from '@/hooks/useData'
import { repo } from '@/db/repository'
import type { TimeoutRule } from '@/domain/types'

const numCls = 'w-16 rounded border px-2 py-1 text-sm'
const numStyle = { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }

const RULE_FIELDS: { key: keyof TimeoutRule; label: string; color: string }[] = [
  { key: 'attentionDays', label: '关注', color: 'var(--info)' },
  { key: 'warnDays', label: '警告', color: 'var(--warn)' },
  { key: 'alertDays', label: '警示', color: 'var(--alert)' },
]

export function SettingsPage() {
  const settings = useSettings()
  const channels = useChannels()
  const [newChannel, setNewChannel] = useState('')
  const timeout = settings.timeout

  function save(next: typeof timeout) {
    void repo.saveSettings({ timeout: next })
  }
  function setDefault(key: keyof TimeoutRule, val: number) {
    save({ ...timeout, default: { ...timeout.default, [key]: val } })
  }
  function toggleChannel(name: string, on: boolean) {
    const byChannel = { ...timeout.byChannel }
    if (on) byChannel[name] = { ...timeout.default }
    else delete byChannel[name]
    save({ ...timeout, byChannel })
  }
  function setChannelRule(name: string, key: keyof TimeoutRule, val: number) {
    const cur = timeout.byChannel[name] ?? timeout.default
    save({ ...timeout, byChannel: { ...timeout.byChannel, [name]: { ...cur, [key]: val } } })
  }
  async function addChannel() {
    const name = newChannel.trim()
    if (!name || channels.some((c) => c.name === name)) return
    await repo.addChannel(name)
    setNewChannel('')
  }
  async function deleteChannel(id: string, name: string) {
    if (!confirm(`删除渠道「${name}」?(已有记录中的渠道文字不会被清除)`)) return
    await repo.deleteChannel(id)
    if (timeout.byChannel[name]) {
      const byChannel = { ...timeout.byChannel }
      delete byChannel[name]
      save({ ...timeout, byChannel })
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <section>
        <h2 className="text-base font-semibold">超时变色阈值</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          投递后(以最近沟通时间为准)无响应超过对应天数,主表格行左侧按颜色提示。
        </p>
        <div
          className="mt-3 flex flex-wrap items-center gap-4 rounded-lg border p-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-sm font-medium">全局默认</span>
          {RULE_FIELDS.map((f) => (
            <label key={f.key} className="flex items-center gap-1 text-sm">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: f.color }} />
              {f.label}
              <input
                type="number"
                min={0}
                className={numCls}
                style={numStyle}
                value={timeout.default[f.key]}
                onChange={(e) => setDefault(f.key, Number(e.target.value))}
              />
              天
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">渠道管理</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          勾选「自定义超时」可为单个渠道设置独立阈值(决策 #14);否则沿用全局默认。
        </p>
        <div className="mt-3 space-y-2">
          {channels.map((c) => {
            const rule = timeout.byChannel[c.name]
            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="w-24 text-sm font-medium">{c.name}</span>
                <label className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    style={{ accentColor: 'var(--primary)' }}
                    checked={!!rule}
                    onChange={(e) => toggleChannel(c.name, e.target.checked)}
                  />
                  自定义超时
                </label>
                {rule &&
                  RULE_FIELDS.map((f) => (
                    <label key={f.key} className="flex items-center gap-1 text-sm">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: f.color }} />
                      {f.label}
                      <input
                        type="number"
                        min={0}
                        className={numCls}
                        style={numStyle}
                        value={rule[f.key]}
                        onChange={(e) => setChannelRule(c.name, f.key, Number(e.target.value))}
                      />
                      天
                    </label>
                  ))}
                <button
                  type="button"
                  onClick={() => deleteChannel(c.id, c.name)}
                  className="ml-auto rounded p-1"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="删除渠道"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            )
          })}
          {channels.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              暂无渠道
            </p>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="rounded border px-2 py-1.5 text-sm"
            style={numStyle}
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void addChannel()
            }}
            placeholder="新渠道名称"
          />
          <button
            type="button"
            onClick={addChannel}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}
          >
            <IconPlus size={15} />
            添加渠道
          </button>
        </div>
      </section>
    </div>
  )
}
