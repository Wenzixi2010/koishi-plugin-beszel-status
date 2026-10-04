import React from 'react'
import type { BeszelInfo, BeszelSystem, CardFields } from '../types'
import { formatBytes, formatPercent, formatUptime, osName } from '../format'
import { Chip, MetaItem, MetricBar, StatusPill } from './parts'

interface Props {
  system: BeszelSystem
  fields: CardFields
}

/** 单个服务器的状态卡片 */
export function SystemCard ({ system, fields }: Props) {
  const info: BeszelInfo = system.info ?? {}
  const status = system.status ?? 'pending'

  const showMetrics = fields.cpu || fields.memory || fields.disk
  const metrics: React.ReactNode[] = []
  if (fields.cpu) metrics.push(<MetricBar key="cpu" label="CPU" value={info.cpu} />)
  if (fields.memory) metrics.push(<MetricBar key="mem" label="内存" value={info.mp} />)
  if (fields.disk) metrics.push(<MetricBar key="disk" label="磁盘" value={info.dp} />)

  const loadAvg = Array.isArray(info.la) && info.la.length >= 3
    ? info.la.slice(0, 3).map((n) => Number(n).toFixed(2)).join(' / ')
    : ''

  const meta: React.ReactNode[] = []
  if (fields.loadAvg && loadAvg) meta.push(<MetaItem key="la" label="负载" value={loadAvg} />)
  if (fields.uptime) meta.push(<MetaItem key="uptime" label="运行" value={formatUptime(info.u)} />)
  if (fields.cpuModel && info.m) meta.push(<MetaItem key="model" label="CPU" value={info.m} />)
  if (fields.kernel && info.k) meta.push(<MetaItem key="kernel" label="内核" value={info.k} />)
  if (fields.os && info.os !== undefined) meta.push(<MetaItem key="os" label="系统" value={osName(info.os)} />)
  if (fields.connType && info.ct) meta.push(<MetaItem key="ct" label="连接" value={info.ct} />)
  if (fields.net && info.bb) meta.push(<MetaItem key="net" label="带宽" value={info.b || formatBytes(info.bb)} />)

  const chips: React.ReactNode[] = []
  if (fields.gpu && info.g !== undefined) {
    chips.push(<Chip key="gpu">GPU <b>{formatPercent(info.g)}</b></Chip>)
  }
  if (fields.temp && info.dt !== undefined) {
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

  return (
    <div className="sys">
      <div className="sys-head">
        <span className="sys-name">{system.name}</span>
        {fields.host && <span className="sys-host">{system.host}{system.port ? `:${system.port}` : ''}</span>}
        <StatusPill status={status} />
      </div>

      {showMetrics && metrics.length > 0 && <div className="metrics">{metrics}</div>}
      {meta.length > 0 && <div className="meta">{meta}</div>}
      {chips.length > 0 && <div className="chips">{chips}</div>}
    </div>
  )
}