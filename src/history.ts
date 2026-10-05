import type { BeszelStatRecord, ChartMetric, HeartbeatRange, HeartbeatState, SystemHistory } from './types'

/** 各聚合粒度对应的保留时长（毫秒），与 Beszel 的上报间隔一致 */
export const RANGE_MS: Record<HeartbeatRange, number> = {
  '1m': 60 * 60 * 1000,
  '10m': 12 * 60 * 60 * 1000,
  '20m': 24 * 60 * 60 * 1000,
  '120m': 7 * 24 * 60 * 60 * 1000,
  '480m': 30 * 24 * 60 * 60 * 1000
}

/** 各聚合粒度对应的上报间隔（毫秒） */
export const INTERVAL_MS: Record<HeartbeatRange, number> = {
  '1m': 60 * 1000,
  '10m': 10 * 60 * 1000,
  '20m': 20 * 60 * 1000,
  '120m': 120 * 60 * 1000,
  '480m': 480 * 60 * 1000
}

/** 图表上展示的区间文案 */
export const RANGE_LABEL: Record<HeartbeatRange, string> = {
  '1m': '最近 1 小时',
  '10m': '最近 12 小时',
  '20m': '最近 24 小时',
  '120m': '最近 7 天',
  '480m': '最近 30 天'
}

export const METRIC_LABEL: Record<ChartMetric, string> = {
  cpu: 'CPU',
  memory: '内存'
}

const METRIC_KEY: Record<ChartMetric, string> = {
  cpu: 'cpu',
  memory: 'mp'
}

/**
 * 把历史记录切成若干时间桶，得到 Uptime-Kuma 式心跳条。
 * 桶内有记录即在线；首个记录之前视为无数据，之后缺失视为离线。
 */
export function buildHeartbeat (records: BeszelStatRecord[], range: HeartbeatRange, buckets: number, now = Date.now()): HeartbeatState[] {
  const windowMs = RANGE_MS[range] ?? RANGE_MS['20m']
  // 桶不能比上报间隔还密，否则每个桶都可能空着，被误判成离线
  const density = Math.max(1, Math.floor(windowMs / (INTERVAL_MS[range] ?? INTERVAL_MS['20m'])))
  const count = Math.max(1, Math.min(Math.floor(buckets), density))
  const states: HeartbeatState[] = new Array(count).fill('none')
  if (records.length === 0) return states

  const width = windowMs / count
  const start = now - windowMs

  const times = records
    .map((record) => Date.parse(record.created))
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b)
  if (times.length === 0) return states

  // 用就近取整而不是向下取整，抵消上报时间的轻微抖动
  for (const time of times) {
    const index = Math.round((time - start) / width)
    if (index >= 0 && index < count) states[index] = 'up'
  }

  const firstIndex = Math.max(0, Math.round((times[0] - start) / width))
  const last = times[times.length - 1]
  for (let i = firstIndex; i < count; i++) {
    if (states[i] === 'up') continue
    // 当前这个桶可能还没走完，最近仍有上报就不算离线
    states[i] = i === count - 1 && now - last < width * 2 ? 'up' : 'down'
  }

  return states
}

/** 按时间升序取出某个指标，并等距抽样到最多 max 个点 */
export function buildSeries (records: BeszelStatRecord[], metric: ChartMetric, max = 48): number[] {
  const key = METRIC_KEY[metric]
  const values: number[] = []
  for (const record of records) {
    const value = Number(record.stats?.[key])
    if (Number.isFinite(value)) values.push(value)
  }
  if (values.length <= max) return values

  const step = values.length / max
  const sampled: number[] = []
  for (let i = 0; i < max; i++) sampled.push(values[Math.floor(i * step)])
  return sampled
}

/** 汇总一台服务器的历史数据 */
export function buildHistory (records: BeszelStatRecord[], range: HeartbeatRange, buckets: number, charts: ChartMetric[]): SystemHistory {
  const series: SystemHistory['series'] = {}
  for (const metric of charts) series[metric] = buildSeries(records, metric)
  const end = Date.now()
  const windowMs = RANGE_MS[range] ?? RANGE_MS['20m']
  return {
    heartbeat: buildHeartbeat(records, range, buckets, end),
    heartbeatWindow: { start: end - windowMs, end },
    series
  }
}