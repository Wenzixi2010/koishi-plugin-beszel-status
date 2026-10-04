import React from 'react'
import { clampPercent, formatPercent, statusLabel, tone } from '../format'

export function StatusPill ({ status }: { status: string }) {
  return (
    <span className={`pill pill-${status}`}>
      <span className={`dot dot-${status}`} />
      {statusLabel(status)}
    </span>
  )
}

export function MetricBar ({ label, value }: { label: string; value?: number }) {
  const level = tone(value)
  const width = clampPercent(value)
  return (
    <div className="metric">
      <div className="m-head">
        <span>{label}</span>
        <span className="m-val">{formatPercent(value)}</span>
      </div>
      <div className={`bar bar-${level}`}>
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export function Chip ({ children, level }: { children: React.ReactNode; level?: 'warn' | 'danger' }) {
  return <span className={`chip${level ? ` chip-${level}` : ''}`}>{children}</span>
}

export function MetaItem ({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <span>
      {label} <b>{value}</b>
    </span>
  )
}