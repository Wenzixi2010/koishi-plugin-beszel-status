import type { SystemStatus } from './types'

const STATUS_LABEL: Record<SystemStatus, string> = {
  up: '在线',
  down: '离线',
  paused: '暂停',
  pending: '待定'
}

/** 状态展示顺序：有问题的排前面 */
const STATUS_ORDER: Record<SystemStatus, number> = {
  down: 0,
  pending: 1,
  paused: 2,
  up: 3
}

export function statusLabel (status: string): string {
  return STATUS_LABEL[status as SystemStatus] ?? status
}

export function statusOrder (status: string): number {
  return STATUS_ORDER[status as SystemStatus] ?? 9
}

export type Tone = 'ok' | 'warn' | 'danger' | 'none'

/** 按百分比给出配色档位 */
export function tone (value?: number, warn = 75, danger = 90): Tone {
  const n = Number(value)
  if (!Number.isFinite(n)) return 'none'
  if (n >= danger) return 'danger'
  if (n >= warn) return 'warn'
  return 'ok'
}

export function formatPercent (value?: number, digits = 0): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '--'
  return `${n.toFixed(digits)}%`
}

export function clampPercent (value?: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

export function formatUptime (seconds?: number): string {
  const n = Number(seconds)
  if (!Number.isFinite(n) || n <= 0) return ''
  const days = Math.floor(n / 86400)
  const hours = Math.floor((n % 86400) / 3600)
  const minutes = Math.floor((n % 3600) / 60)
  if (days > 0) return `${days} 天 ${hours} 小时`
  if (hours > 0) return `${hours} 小时 ${minutes} 分`
  return `${minutes} 分钟`
}

export function formatBytes (value?: number): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let size = n
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  const digits = index === 0 || size >= 100 ? 0 : 1
  return `${size.toFixed(digits)} ${units[index]}`
}

export function formatDateTime (date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 系统类型枚举转名称，未知时回退为原始值 */
const OS_NAMES: Record<number, string> = {
  1: 'Linux',
  2: 'Windows',
  3: 'macOS',
  4: 'FreeBSD'
}

export function osName (value?: number): string {
  if (value === undefined || value === null) return ''
  return OS_NAMES[value] ?? `#${value}`
}