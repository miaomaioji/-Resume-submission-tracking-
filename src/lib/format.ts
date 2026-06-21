import dayjs from 'dayjs'
import type { Application } from '@/domain/types'

export function formatDate(iso?: string): string {
  return iso ? dayjs(iso).format('MM-DD') : '—'
}

export function formatDateFull(iso?: string): string {
  return iso ? dayjs(iso).format('YYYY-MM-DD') : ''
}

export function formatDateTime(iso?: string): string {
  return iso ? dayjs(iso).format('MM-DD HH:mm') : '—'
}

type SalaryFields = Pick<
  Application,
  'salaryMin' | 'salaryMax' | 'salaryPeriod' | 'salaryMonths'
>

/** 把结构化薪资格式化为 “15–25K·14薪” 之类。 */
export function formatSalary(a: SalaryFields): string {
  const { salaryMin, salaryMax, salaryMonths, salaryPeriod } = a
  if (salaryMin == null && salaryMax == null) return '—'
  const k = (n?: number) => (n == null ? '' : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n))
  const range =
    salaryMin != null && salaryMax != null ? `${k(salaryMin)}–${k(salaryMax)}` : k(salaryMin ?? salaryMax)
  const period = salaryPeriod === 'yearly' ? '/年' : ''
  const months = salaryMonths ? `·${salaryMonths}薪` : ''
  return `${range}${period}${months}`
}
