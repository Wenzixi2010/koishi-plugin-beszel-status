import React from 'react'
import type { CardData, StatusSummary } from '../types'
import { formatDateTime, statusLabel } from '../format'
import { ringGradient } from '../styles'
import { SystemCard } from './SystemCard'

const LEGEND: Array<keyof StatusSummary> = ['up', 'down', 'paused', 'pending']

export function StatusCard ({ data }: { data: CardData }) {
  const { systems, summary, fields, title, subtitle, footer, theme, hostDisplay, charts, heartbeatRange } = data
  const online = summary.total > 0 ? Math.round((summary.up / summary.total) * 100) : 0

  return (
    <div className="board">
      <div className="board-head">
        <div className="brand">
          <div className="brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="7" rx="2" />
              <rect x="3" y="13" width="18" height="7" rx="2" />
              <line x1="7" y1="7.5" x2="7.01" y2="7.5" />
              <line x1="7" y1="16.5" x2="7.01" y2="16.5" />
            </svg>
          </div>
          <div className="brand-text">
            <div className="title">{title}</div>
            {subtitle ? <div className="sub">{subtitle}</div> : null}
          </div>
        </div>
        <div className="head-time">
          <b>{summary.total} 台服务器</b>
          {formatDateTime(new Date())}
        </div>
      </div>

      {fields.overview && summary.total > 0 && (
        <div className="overview">
          <div className="ring" style={{ background: ringGradient(summary, theme) }}>
            <div className="ring-hole">
              <span className="ring-value">{online}%</span>
              <span className="ring-label">在线率</span>
            </div>
          </div>
          <div className="legend">
            {LEGEND.map((key) => (
              <div className="legend-item" key={key}>
                <span className={`dot dot-${key}`} />
                {statusLabel(key)}
                <b>{summary[key]}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="systems">
        {systems.length > 0
          ? systems.map((system) => (
            <SystemCard
              key={system.id}
              system={system}
              fields={fields}
              hostDisplay={hostDisplay}
              charts={charts}
              heartbeatRange={heartbeatRange}
            />
          ))
          : <div className="empty">没有可显示的服务器</div>}
      </div>

      {fields.footer && footer ? (
        <div className="footer">
          <span>{footer}</span>
          <span>koishi-plugin-beszel-status</span>
        </div>
      ) : null}
    </div>
  )
}