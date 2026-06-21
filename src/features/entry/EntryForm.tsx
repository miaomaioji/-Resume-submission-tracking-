import { type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import dayjs from 'dayjs'
import { Modal } from '@/components/Modal'
import { repo } from '@/db/repository'
import { useChannels } from '@/hooks/useData'
import { JOB_TYPES, STATUS_LABEL_ZH, STATUS_ORDER, type JobType, type Status } from '@/domain/enums'
import type { Application } from '@/domain/types'

interface FormValues {
  company: string
  position: string
  jobType: string
  channel: string
  status: Status
  salaryMin: string
  salaryMax: string
  salaryMonths: string
  salaryPeriod: 'monthly' | 'yearly'
  location: string
  appliedAt: string
  lastContactAt: string
  nextFollowUpAt: string
  nextActionLabel: string
  interviewAt: string
  sourceUrl: string
  notes: string
}

const numOrUndef = (s: string) => {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : undefined
}
const dateToIso = (d: string) => (d ? dayjs(d).toISOString() : undefined)
const isoToDate = (iso?: string) => (iso ? dayjs(iso).format('YYYY-MM-DD') : '')
const isoToDt = (iso?: string) => (iso ? dayjs(iso).format('YYYY-MM-DDTHH:mm') : '')

function toForm(app?: Application, initial?: Partial<Application>): FormValues {
  const s = app ?? initial ?? {}
  return {
    company: s.company ?? '',
    position: s.position ?? '',
    jobType: s.jobType ?? '',
    channel: s.channel ?? '',
    status: s.status ?? 'applied',
    salaryMin: s.salaryMin?.toString() ?? '',
    salaryMax: s.salaryMax?.toString() ?? '',
    salaryMonths: s.salaryMonths?.toString() ?? '',
    salaryPeriod: s.salaryPeriod ?? 'monthly',
    location: s.location ?? '',
    appliedAt: isoToDate(s.appliedAt),
    lastContactAt: isoToDate(s.lastContactAt),
    nextFollowUpAt: isoToDate(s.nextFollowUpAt),
    nextActionLabel: s.nextActionLabel ?? '',
    interviewAt: isoToDt(s.interviewAt),
    sourceUrl: s.sourceUrl ?? '',
    notes: s.notes ?? '',
  }
}

const FIELD = 'w-full rounded-md border px-2 py-1.5 text-sm'
const fieldStyle = { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }

function L({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs" style={{ color: 'var(--alert)' }}>
          {error}
        </span>
      )}
    </label>
  )
}

export function EntryForm({
  editing,
  initial,
  onClose,
}: {
  editing?: Application
  initial?: Partial<Application>
  onClose: () => void
}) {
  const channels = useChannels()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: toForm(editing, initial) })

  async function onSubmit(v: FormValues) {
    const patch: Partial<Application> = {
      company: v.company.trim(),
      position: v.position.trim(),
      jobType: v.jobType ? (v.jobType as JobType) : undefined,
      channel: v.channel || undefined,
      salaryMin: numOrUndef(v.salaryMin),
      salaryMax: numOrUndef(v.salaryMax),
      salaryMonths: numOrUndef(v.salaryMonths),
      salaryPeriod: v.salaryPeriod,
      salaryCurrency: 'CNY',
      location: v.location || undefined,
      appliedAt: dateToIso(v.appliedAt),
      lastContactAt: dateToIso(v.lastContactAt),
      nextFollowUpAt: dateToIso(v.nextFollowUpAt),
      nextActionLabel: v.nextActionLabel || undefined,
      interviewAt: dateToIso(v.interviewAt),
      sourceUrl: v.sourceUrl || undefined,
      notes: v.notes || undefined,
    }
    if (editing) {
      if (v.status !== editing.status) await repo.changeStatus(editing.id, v.status)
      await repo.updateApplication(editing.id, patch)
    } else {
      await repo.createApplication({
        ...patch,
        company: v.company.trim(),
        position: v.position.trim(),
        status: v.status,
      })
    }
    onClose()
  }

  return (
    <Modal
      title={editing ? '编辑投递' : '新增投递'}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-1.5 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            取消
          </button>
          <button
            type="submit"
            form="entry-form"
            disabled={isSubmitting}
            className="rounded-md px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--primary)' }}
          >
            保存
          </button>
        </>
      }
    >
      <form id="entry-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <L label="公司名称 *" error={errors.company?.message}>
            <input
              className={FIELD}
              style={fieldStyle}
              placeholder="如:乐鑫科技"
              {...register('company', { required: '必填' })}
            />
          </L>
          <L label="岗位 *" error={errors.position?.message}>
            <input
              className={FIELD}
              style={fieldStyle}
              placeholder="如:PCB 设计工程师"
              {...register('position', { required: '必填' })}
            />
          </L>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <L label="类型">
            <select className={FIELD} style={fieldStyle} {...register('jobType')}>
              <option value="">—</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </L>
          <L label="渠道">
            <select className={FIELD} style={fieldStyle} {...register('channel')}>
              <option value="">—</option>
              {channels.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </L>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <L label="状态">
            <select className={FIELD} style={fieldStyle} {...register('status')}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL_ZH[s]}
                </option>
              ))}
            </select>
          </L>
          <L label="工作地点">
            <input className={FIELD} style={fieldStyle} placeholder="如:上海" {...register('location')} />
          </L>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <L label="薪资下限">
            <input className={FIELD} style={fieldStyle} type="number" placeholder="15000" {...register('salaryMin')} />
          </L>
          <L label="薪资上限">
            <input className={FIELD} style={fieldStyle} type="number" placeholder="25000" {...register('salaryMax')} />
          </L>
          <L label="几薪">
            <input className={FIELD} style={fieldStyle} type="number" placeholder="14" {...register('salaryMonths')} />
          </L>
          <L label="周期">
            <select className={FIELD} style={fieldStyle} {...register('salaryPeriod')}>
              <option value="monthly">月</option>
              <option value="yearly">年</option>
            </select>
          </L>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <L label="投递日期">
            <input className={FIELD} style={fieldStyle} type="date" {...register('appliedAt')} />
          </L>
          <L label="最近沟通">
            <input className={FIELD} style={fieldStyle} type="date" {...register('lastContactAt')} />
          </L>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <L label="下次跟进日期">
            <input className={FIELD} style={fieldStyle} type="date" {...register('nextFollowUpAt')} />
          </L>
          <L label="下次节点说明">
            <input
              className={FIELD}
              style={fieldStyle}
              placeholder="如:技术一面、笔试截止"
              {...register('nextActionLabel')}
            />
          </L>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <L label="面试时间">
            <input className={FIELD} style={fieldStyle} type="datetime-local" {...register('interviewAt')} />
          </L>
          <L label="招聘链接">
            <input className={FIELD} style={fieldStyle} type="url" placeholder="https://…" {...register('sourceUrl')} />
          </L>
        </div>

        <L label="备注">
          <textarea
            className={FIELD}
            style={{ ...fieldStyle, minHeight: 64, resize: 'vertical' }}
            placeholder="面试感受、薪资细节、注意事项…"
            {...register('notes')}
          />
        </L>
      </form>
    </Modal>
  )
}
