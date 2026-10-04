/** Beszel 服务器记录（来自 PocketBase 的 systems 集合） */
export interface BeszelSystem {
  id: string
  name: string
  host: string
  port?: string
  status: SystemStatus
  info?: BeszelInfo
  /** 拉取到的历史数据，用于心跳图与折线图 */
  history?: SystemHistory
  updated?: string
  created?: string
  [key: string]: any
}

export type SystemStatus = 'up' | 'down' | 'paused' | 'pending'

/** Beszel 的 Info 结构，为压缩体积使用短键存储 */
export interface BeszelInfo {
  /** 主机名 */
  h?: string
  /** 内核版本 */
  k?: string
  /** CPU 核心数 */
  c?: number
  /** CPU 线程数 */
  t?: number
  /** CPU 型号 */
  m?: string
  /** 运行时长（秒） */
  u?: number
  /** CPU 占用率 */
  cpu?: number
  /** 内存占用率 */
  mp?: number
  /** 磁盘占用率 */
  dp?: number
  /** 带宽（字符串描述） */
  b?: string
  /** Agent 版本 */
  v?: string
  /** GPU 占用率 */
  g?: number
  /** 仪表盘温度 */
  dt?: number
  /** 系统类型枚举 */
  os?: number
  /** 带宽字节数 */
  bb?: number
  /** 1 / 5 / 15 分钟负载 */
  la?: number[]
  /** 连接类型 */
  ct?: string
  /** 额外分区占用率 */
  efs?: Record<string, number>
  /** [服务总数, 异常服务数] */
  sv?: number[]
  /** [电量百分比, 充电状态] */
  bat?: number[]
  /** 根分区名称 */
  rdn?: string
  /** [可更新数, 安全更新数] */
  pu?: number[]
  /** WiFi 名称 */
  wf?: string
  [key: string]: any
}

/** 主机地址的显示方式 */
export type HostDisplay = 'show' | 'mask' | 'hide'

/** 折线图可选的指标 */
export type ChartMetric = 'cpu' | 'memory' | 'disk'

/** 心跳图单个区间的状态，none 表示该区间还没有任何上报 */
export type HeartbeatState = 'up' | 'down' | 'none'

/** 心跳图 / 折线图使用的历史聚合粒度，同时也是保留时长 */
export type HeartbeatRange = '1m' | '10m' | '20m' | '120m' | '480m'

/** system_stats 里的指标快照，短键与 agent 上报一致 */
export interface BeszelStatPoint {
  /** CPU 占用率 */
  cpu?: number
  /** 内存占用率 */
  mp?: number
  /** 磁盘占用率 */
  dp?: number
  [key: string]: any
}

/** system_stats 集合的一条历史记录 */
export interface BeszelStatRecord {
  id: string
  system: string
  type: string
  stats?: BeszelStatPoint
  created: string
  updated?: string
}

/** 单台服务器的历史数据 */
export interface SystemHistory {
  /** 各时间桶是否在线 */
  heartbeat: HeartbeatState[]
  /** 各指标的时间序列，按时间升序，最新在末尾 */
  series: Partial<Record<ChartMetric, number[]>>
}

export type ThemeMode = 'light' | 'dark'

export type ImageFormat = 'png' | 'jpeg' | 'webp'

/** 卡片背景样式 */
export type BackgroundType = 'plain' | 'aurora' | 'grid' | 'dots' | 'image'

/** 卡片上各项内容的显示开关 */
export interface CardFields {
  overview: boolean
  cpu: boolean
  memory: boolean
  disk: boolean
  extraFs: boolean
  loadAvg: boolean
  uptime: boolean
  cpuModel: boolean
  kernel: boolean
  os: boolean
  connType: boolean
  gpu: boolean
  temp: boolean
  services: boolean
  updates: boolean
  battery: boolean
  net: boolean
  heartbeat: boolean
  footer: boolean
}

export interface CardTheme {
  mode: ThemeMode
  accent: string
  width: number
  /** 背景样式 */
  background: BackgroundType
  /** 已解析成可直接使用的地址（URL / data URI），仅 background 为 image 时生效 */
  backgroundImage: string
  /** 背景模糊强度（像素） */
  backgroundBlur: number
  /** 背景压暗程度（0-100） */
  backgroundDim: number
}

/** 渲染（截图）相关参数 */
export interface RenderOptions {
  format: ImageFormat
  quality: number
  deviceScaleFactor: number
  timeout: number
}

export interface StatusSummary {
  total: number
  up: number
  down: number
  paused: number
  pending: number
}

/** 交给 React 组件的完整数据 */
export interface CardData {
  title: string
  subtitle?: string
  systems: BeszelSystem[]
  summary: StatusSummary
  footer: string
  fields: CardFields
  /** 主机地址显示方式 */
  hostDisplay: HostDisplay
  /** 需要绘制折线图的指标 */
  charts: ChartMetric[]
  /** 心跳图所在的历史区间，用于图例文案 */
  heartbeatRange: HeartbeatRange
  theme: CardTheme
}