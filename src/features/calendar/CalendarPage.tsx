import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { Calendar, type Event, dayjsLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useApplications } from '@/hooks/useData'
import { useUiStore } from '@/app/uiStore'
import { findInterviewConflicts } from '@/domain/conflicts'
import { buildInterviewIcs, downloadIcs } from '@/lib/ics'
import { IconDownload } from '@tabler/icons-react'

dayjs.extend(localizedFormat)
const localizer = dayjsLocalizer(dayjs)

interface CalEvent extends Event {
  appId: string
  kind: 'interview' | 'follow'
}

const messages = {
  today: '今天',
  previous: '上一页',
  next: '下一页',
  month: '月',
  week: '周',
  day: '日',
  agenda: '列表',
  date: '日期',
  time: '时间',
  event: '事项',
  noEventsInRange: '此范围内暂无安排',
  showMore: (n: number) => `+${n} 更多`,
}

export function CalendarPage() {
  const apps = useApplications()
  const navigate = useNavigate()
  const setFocus = useUiStore((s) => s.setFocusAppId)

  const events = useMemo<CalEvent[]>(() => {
    const list: CalEvent[] = []
    for (const a of apps) {
      if (a.interviewAt) {
        const start = new Date(a.interviewAt)
        list.push({
          title: `面试 · ${a.company}`,
          start,
          end: dayjs(start).add(1, 'hour').toDate(),
          appId: a.id,
          kind: 'interview',
        })
      }
      if (a.nextFollowUpAt) {
        const d = new Date(a.nextFollowUpAt)
        list.push({
          title: `跟进 · ${a.company}${a.nextActionLabel ? ` (${a.nextActionLabel})` : ''}`,
          start: d,
          end: d,
          allDay: true,
          appId: a.id,
          kind: 'follow',
        })
      }
    }
    return list
  }, [apps])

  const conflicts = useMemo(() => findInterviewConflicts(apps), [apps])

  function onExportIcs() {
    const ics = buildInterviewIcs(apps)
    if (!ics) {
      alert('暂无可导出的面试时间')
      return
    }
    downloadIcs(ics)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onExportIcs}
          className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: 'var(--border)' }}
        >
          <IconDownload size={15} />
          导出 .ics
        </button>
      </div>
      {conflicts.length > 0 && (
        <div
          className="rounded-md border p-2 text-sm"
          style={{ borderColor: 'var(--alert)', color: 'var(--alert)', background: 'var(--surface)' }}
        >
          ⚠️ 发现 {conflicts.length} 处面试时间冲突:
          {conflicts.map(([a, b], i) => (
            <span key={i}>
              {' '}
              {a.company} 与 {b.company}({dayjs(a.interviewAt).format('MM-DD HH:mm')});
            </span>
          ))}
        </div>
      )}
      <div style={{ height: 620 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          messages={messages}
          popup
          views={['month', 'week', 'day', 'agenda']}
          eventPropGetter={(e) => ({
            style: {
              background: (e as CalEvent).kind === 'interview' ? 'var(--info)' : 'var(--accent)',
              border: 'none',
              color: '#fff',
            },
          })}
          onSelectEvent={(e) => {
            setFocus((e as CalEvent).appId)
            navigate('/table')
          }}
        />
      </div>
    </div>
  )
}
