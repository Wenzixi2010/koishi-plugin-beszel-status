import React from 'react'
import type { ChartMetric, HeartbeatState } from '../types'
import { METRIC_LABEL } from '../history'
import { clampPercent, formatPercent } from '../format'

const SVG_W = 100
const SVG_H = 36

/** Uptime-Kuma 式心跳条：一排色块表示各时间段的在线情况 */
export function Heartbeat ({ states, rangeLabel }: { states: HeartbeatState[]; rangeLabel: string }) {
  if (states.length === 0) return null
  return (
    <div className="hb">
      <div className="hb-head">
        <span className="hb-range">{rangeLabel}</span>
      </div>
      <div className="hb-bars">
        {states.map((state, index) => <i key={index} className={`hb-${state}`} />)}
      </div>
    </div>
  )
}

/** 指标折线迷你图，取值区间固定 0-100% */
export function Sparkline ({ metric, values, showValue = true }: { metric: ChartMetric; values: number[]; showValue?: boolean }) {
  if (values.length === 0) return null

  const points = values.map((value, index) => {
    const x = values.length === 1 ? SVG_W : (index / (values.length - 1)) * SVG_W
    const y = SVG_H - (clampPercent(value) / 100) * SVG_H
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) }
  })

  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `M${points[0].x},${SVG_H} ` + points.map((point) => `L${point.x},${point.y}`).join(' ') + ` L${points[points.length - 1].x},${SVG_H} Z`
  const latest = values[values.length - 1]

  return (
    <div className="spark">
      <div className="spark-head">
        <span>{METRIC_LABEL[metric]}</span>
        {showValue && <b>{formatPercent(latest)}</b>}
      </div>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="none">
        <path className="spark-area" d={area} />
        <polyline className="spark-line" points={line} />
      </svg>
    </div>
  )
}