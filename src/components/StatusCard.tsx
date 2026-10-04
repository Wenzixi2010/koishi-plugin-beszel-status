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
      <header className="board-head">
        <div className="brand-text">
          <div className="eyebrow">服务器状态</div>
          <div className="title">{title}</div>
          {subtitle ? <div className="sub">{subtitle}</div> : null}
        </div>
        <div className="head-time">
          <span>更新于</span>
          <b>{formatDateTime(new Date())}</b>
        </div>
      </header>

      {fields.overview && summary.total > 0 && (
        <section className="overview" aria-label="服务器状态总览">
          <div className="overview-lead">
            <div className="overview-total"><b>{summary.total}</b><span>台服务器</span></div>
            <div className="overview-rate">
              <div className="ring" style={{ background: ringGradient(summary, theme) }}>
                <div className="ring-hole">
                  <span className="ring-value">{online}<small>%</small></span>
                </div>
              </div>
              <span className="ring-label">在线率</span>
            </div>
          </div>
          <div className="legend">
            {LEGEND.map((key) => (
              <div className="legend-item" key={key}>
                <span className={`dot dot-${key}`} />
                <span>{statusLabel(key)}</span>
                <b>{summary[key]}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="systems">
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
      </main>

      {fields.footer && footer ? (
        <footer className="footer">
          <span>{footer}</span>
          <span>koishi-plugin-beszel-status</span>
        </footer>
      ) : null}
    </div>
  )
}
