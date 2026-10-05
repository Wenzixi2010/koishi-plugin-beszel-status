import React from 'react'
import type { ChartMetric, HeartbeatState } from '../types'
import { METRIC_LABEL } from '../history'
import { clampPercent, formatPercent } from '../format'

const SVG_W = 100
const SVG_H = 36

/** Uptime-Kuma 式心跳条：一排色块表示各时间段的在线情况 */
export function Heartbeat ({ states, rangeLabel, window }: { states: HeartbeatState[]; rangeLabel: string; window?: { start: number; end: number } }) {
  if (states.length === 0) return null
  const labels = window
    ? [window.start, window.start + (window.end - window.start) / 2, window.end].map((time) => {
      const date = new Date(time)
      const pad = (value: number) => String(value).padStart(2, '0')
      const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`
      return window.end - window.start < 24 * 60 * 60 * 1000
        ? clock
        : `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${clock}`
    })
    : undefined
  return (
    <div className="hb">
      <div className="hb-head">
        <span className="hb-range">{rangeLabel}</span>
      </div>
      <div className="hb-bars">
        {states.map((state, index) => <i key={index} className={`hb-${state}`} />)}
      </div>
      {labels && <div className="hb-times"><span>{labels[0]}</span><span>{labels[1]}</span><span>{labels[2]}</span></div>}
    </div>
  )
}

/** 指标折线迷你图，取值区间固定 0-100% */
export function Sparkline ({ metric, values, current, showValue = true }: { metric: ChartMetric; values: number[]; current?: number; showValue?: boolean }) {
  if (values.length === 0) return null

  const points = values.map((value, index) => {
    const x = values.length === 1 ? SVG_W : (index / (values.length - 1)) * SVG_W
    const y = SVG_H - (clampPercent(value) / 100) * SVG_H
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) }
  })

  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `M${points[0].x},${SVG_H} ` + points.map((point) => `L${point.x},${point.y}`).join(' ') + ` L${points[points.length - 1].x},${SVG_H} Z`
  // 优先用实时值，保证和上方进度条显示的数字一致
  const latest = Number(current)
  const shown = Number.isFinite(latest) ? latest : values[values.length - 1]

  return (
    <div className="spark">
      <div className="spark-head">
        <span>{METRIC_LABEL[metric]}</span>
        {showValue && <b>{formatPercent(shown)}</b>}
      </div>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="none">
        <path className="spark-area" d={area} />
        <polyline className="spark-line" points={line} />
      </svg>
    </div>
  )
}