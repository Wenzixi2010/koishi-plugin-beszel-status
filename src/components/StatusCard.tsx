import React from 'react'
import type { CardData, StatusSummary } from '../types'
import { formatDateTime, statusLabel } from '../format'
import { SystemCard } from './SystemCard'

function Stat ({ status, value }: { status: keyof StatusSummary; value: number }) {
  return (
    <div className="stat">
      <div className="stat-label">
        <span className={`dot dot-${status}`} />
        {statusLabel(status)}
      </div>
      <div className="stat-value">{value}</div>
    </div>
  )
}

export function StatusCard ({ data }: { data: CardData }) {
  const { systems, summary, fields, title, subtitle, footer } = data

  return (
    <div className="board">
      <div className="board-head">
        <div className="brand">
          <div className="brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {fields.overview && (
        <div className="overview">
          <Stat status="up" value={summary.up} />
          <Stat status="down" value={summary.down} />
          <Stat status="paused" value={summary.paused} />
          <Stat status="pending" value={summary.pending} />
        </div>
      )}

      <div className="systems">
        {systems.length > 0
          ? systems.map((system) => <SystemCard key={system.id} system={system} fields={fields} />)
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