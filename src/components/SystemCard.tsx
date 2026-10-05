import React from 'react'
import type { BeszelInfo, BeszelSystem, CardFields, ChartMetric, HeartbeatRange, HostDisplay } from '../types'
import { RANGE_LABEL } from '../history'
import { formatBytes, formatPercent, formatUptime, maskHost, osName } from '../format'
import { Chip, MetaItem, MetricBar, StatusPill } from './parts'
import { Heartbeat, Sparkline } from './History'

interface Props {
  system: BeszelSystem
  fields: CardFields
  hostDisplay: HostDisplay
  charts: ChartMetric[]
  chartValue: boolean
  heartbeatRange: HeartbeatRange
}

/** 单个服务器的状态卡片 */
export function SystemCard ({ system, fields, hostDisplay, charts, chartValue, heartbeatRange }: Props) {
  const info: BeszelInfo = system.info ?? {}
  const status = system.status ?? 'pending'
  const history = system.history

  const metrics: React.ReactNode[] = []
  // 离线或未上报的机器没有数据，缺值的项直接不画
  const pushMetric = (key: string, label: string, value?: number) => {
    if (!Number.isFinite(Number(value))) return
    metrics.push(<MetricBar key={key} label={label} value={value} />)
  }
  if (fields.cpu) pushMetric('cpu', 'CPU', info.cpu)
  if (fields.memory) pushMetric('mem', '内存', info.mp)
  if (fields.disk) pushMetric('disk', '磁盘', info.dp)

  const loadAvg = Array.isArray(info.la) && info.la.length >= 3
    ? info.la.slice(0, 3).map((n) => Number(n).toFixed(2)).join(' / ')
    : ''

  const meta: React.ReactNode[] = []
  if (fields.loadAvg && loadAvg) meta.push(<MetaItem key="la" label="负载" value={loadAvg} />)
  if (fields.uptime) meta.push(<MetaItem key="uptime" label="运行" value={formatUptime(info.u)} />)
  if (fields.cpuModel && info.m) meta.push(<MetaItem key="model" label="CPU" value={info.m} />)
  if (fields.kernel && info.k) meta.push(<MetaItem key="kernel" label="内核" value={info.k} />)
  const osLabel = fields.os ? osName(info.os) : ''
  if (osLabel) meta.push(<MetaItem key="os" label="系统" value={osLabel} />)
  if (fields.connType && info.ct) meta.push(<MetaItem key="ct" label="连接" value={info.ct} />)
  if (fields.net && info.bb) meta.push(<MetaItem key="net" label="带宽" value={info.b || formatBytes(info.bb)} />)

  const chips: React.ReactNode[] = []
  if (fields.gpu && info.g !== undefined) {
    chips.push(<Chip key="gpu">GPU <b>{formatPercent(info.g)}</b></Chip>)
  }
  // 没有温度传感器时 dt 会上报 0，这种情况不显示
  if (fields.temp && Number(info.dt) > 0) {
    chips.push(<Chip key="temp">温度 <b>{Number(info.dt).toFixed(0)}°C</b></Chip>)
  }
  if (fields.services && Array.isArray(info.sv)) {
    const [total, failed] = info.sv
    const level = Number(failed) > 0 ? 'danger' : undefined
    chips.push(<Chip key="svc" level={level}>服务 <b>{Number(total) - Number(failed)}</b>/{Number(total)}</Chip>)
  }
  if (fields.updates && Array.isArray(info.pu)) {
    const [total, security] = info.pu
    const level = Number(security) > 0 ? 'warn' : undefined
    chips.push(<Chip key="upd" level={level}>更新 <b>{Number(total)}</b>{Number(security) > 0 ? `（安全 ${Number(security)}）` : ''}</Chip>)
  }
  if (fields.battery && Array.isArray(info.bat)) {
    chips.push(<Chip key="bat">电量 <b>{formatPercent(info.bat[0])}</b></Chip>)
  }
  if (fields.extraFs && info.efs && typeof info.efs === 'object') {
    for (const [mount, percent] of Object.entries(info.efs).slice(0, 4)) {
      chips.push(<Chip key={`fs-${mount}`}>{mount} <b>{formatPercent(Number(percent))}</b></Chip>)
    }
  }

  const host = system.host ? (hostDisplay === 'mask' ? maskHost(system.host) : system.host) : ''
  const showHost = hostDisplay !== 'hide' && !!host

  const plots = charts.filter((metric) => (history?.series?.[metric]?.length ?? 0) > 1)
  const showHeartbeat = fields.heartbeat && (history?.heartbeat?.length ?? 0) > 0
  // 折线图右上角的数值取实时值，和进度条保持一致
  const liveValue: Partial<Record<ChartMetric, number>> = { cpu: info.cpu, memory: info.mp }

  return (
    <article className={`sys sys-${status}`}>
      <header className="sys-head">
        <div className="sys-identity">
          <span className={`sys-mark sys-mark-${status}`} />
          <div className="sys-labels">
            <span className="sys-name">{system.name}</span>
            {showHost && <span className="sys-host">{host}{system.port ? `:${system.port}` : ''}</span>}
          </div>
        </div>
        <StatusPill status={status} />
      </header>

      {metrics.length > 0 && <div className="metrics">{metrics}</div>}

      {(showHeartbeat || plots.length > 0) && (
        <div className="history">
          {showHeartbeat && <Heartbeat states={history.heartbeat} rangeLabel={RANGE_LABEL[heartbeatRange]} window={history.heartbeatWindow} />}
          {plots.length > 0 && (
            <div className="charts" style={{ gridTemplateColumns: `repeat(${plots.length}, 1fr)` }}>
              {plots.map((metric) => <Sparkline key={metric} metric={metric} values={history.series[metric] ?? []} current={liveValue[metric]} showValue={chartValue} />)}
            </div>
          )}
        </div>
      )}

      {(meta.length > 0 || chips.length > 0) && (
        <div className="sys-details">
          {meta.length > 0 && <div className="meta">{meta}</div>}
          {chips.length > 0 && <div className="chips">{chips}</div>}
        </div>
      )}
    </article>
  )
}