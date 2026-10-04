import { Context, Schema, segment } from 'koishi'
import { promises as fs } from 'fs'
import { extname } from 'path'
import { BeszelError, fetchSystems } from './beszel'
import { renderStatusImage } from './render'
import { statusOrder } from './format'
import type { BackgroundType, BeszelSystem, CardData, CardFields, StatusSummary } from './types'

export const name = 'beszel-status'

export const inject = {
  optional: ['puppeteer']
}

export interface Config {
  hubUrl: string
  identity: string
  password: string
  timeout: number

  commandName: string
  commandAliases: string[]
  debug: boolean

  title: string
  subtitle: string
  footerText: string
  theme: 'light' | 'dark'
  accent: string
  background: BackgroundType
  backgroundImage: string
  backgroundBlur: number
  backgroundDim: number
  width: number
  deviceScaleFactor: number
  format: 'png' | 'jpeg' | 'webp'
  quality: number
  maxSystems: number
  sortBy: 'default' | 'name' | 'status' | 'cpu' | 'memory' | 'disk'
  hidePaused: boolean

  fields: CardFields

  errorTemplate: string
  emptyTemplate: string
}

const FIELDS: CardFields = {
  overview: true,
  host: true,
  cpu: true,
  memory: true,
  disk: true,
  extraFs: true,
  loadAvg: true,
  uptime: true,
  cpuModel: false,
  kernel: false,
  os: false,
  connType: false,
  gpu: true,
  temp: true,
  services: true,
  updates: true,
  battery: true,
  net: false,
  footer: true
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    hubUrl: Schema.string().required()
      .description('Beszel Hub 地址，例如 https://beszel.example.com'),
    identity: Schema.string().required()
      .description('登录邮箱（PocketBase users 集合的 identity）'),
    password: Schema.string().role('secret')
      .description('登录密码'),
    timeout: Schema.natural().default(10000)
      .description('请求超时时间（毫秒）')
  }).description('连接设置'),

  Schema.object({
    commandName: Schema.string().default('beszel')
      .description('触发指令的名称'),
    commandAliases: Schema.array(Schema.string()).default(['服务器状态', 'bsz'])
      .description('指令别名，可留空'),
    debug: Schema.boolean().default(false)
      .description('在日志中输出调试信息')
  }).description('指令设置'),

  Schema.object({
    title: Schema.string().default('Beszel 服务器状态')
      .description('卡片标题'),
    subtitle: Schema.string().default('')
      .description('卡片副标题，留空则不显示'),
    footerText: Schema.string().default('Beszel 状态监控')
      .description('卡片底部文字'),
    theme: Schema.union([
      Schema.const('dark').description('深色'),
      Schema.const('light').description('浅色')
    ]).default('dark').description('卡片主题'),
    accent: Schema.string().default('#4f8cff')
      .description('主题强调色（HEX，例如 #4f8cff）'),
    background: Schema.union([
      Schema.const('aurora').description('极光（强调色柔光，推荐）'),
      Schema.const('plain').description('纯色'),
      Schema.const('grid').description('网格'),
      Schema.const('dots').description('点阵'),
      Schema.const('image').description('自定义图片')
    ]).default('aurora').description('背景样式'),
    backgroundImage: Schema.string().default('')
      .description('自定义背景图：URL、data URI 或服务器上的本地文件路径（仅背景样式为「自定义图片」时生效）'),
    backgroundBlur: Schema.natural().default(0).max(60)
      .description('背景模糊强度（像素）'),
    backgroundDim: Schema.natural().default(25).max(100)
      .description('背景压暗程度（0-100，越大越暗，便于看清文字）'),
    width: Schema.natural().default(760).min(320).max(1400)
      .description('卡片宽度（像素）'),
    deviceScaleFactor: Schema.number().default(2).min(1).max(4)
      .description('截图缩放倍数，越大越清晰、体积越大'),
    format: Schema.union([
      Schema.const('png').description('PNG'),
      Schema.const('jpeg').description('JPEG'),
      Schema.const('webp').description('WebP')
    ]).default('png').description('图片格式'),
    quality: Schema.natural().default(92).min(1).max(100)
      .description('图片质量（仅 JPEG / WebP 生效）'),
    maxSystems: Schema.natural().default(12).min(1).max(200)
      .description('单张卡片最多显示的服务器数量'),
    sortBy: Schema.union([
      Schema.const('default').description('状态优先（异常靠前）'),
      Schema.const('name').description('按名称'),
      Schema.const('status').description('按状态'),
      Schema.const('cpu').description('按 CPU 占用'),
      Schema.const('memory').description('按内存占用'),
      Schema.const('disk').description('按磁盘占用')
    ]).default('default').description('服务器排序方式'),
    hidePaused: Schema.boolean().default(false)
      .description('隐藏处于「暂停」状态的服务器')
  }).description('卡片外观'),

  Schema.object({
    fields: Schema.object({
      overview: Schema.boolean().default(FIELDS.overview).description('顶部状态总览'),
      host: Schema.boolean().default(FIELDS.host).description('主机地址与端口'),
      cpu: Schema.boolean().default(FIELDS.cpu).description('CPU 占用率'),
      memory: Schema.boolean().default(FIELDS.memory).description('内存占用率'),
      disk: Schema.boolean().default(FIELDS.disk).description('磁盘占用率'),
      extraFs: Schema.boolean().default(FIELDS.extraFs).description('额外分区占用率'),
      loadAvg: Schema.boolean().default(FIELDS.loadAvg).description('系统负载'),
      uptime: Schema.boolean().default(FIELDS.uptime).description('运行时长'),
      cpuModel: Schema.boolean().default(FIELDS.cpuModel).description('CPU 型号'),
      kernel: Schema.boolean().default(FIELDS.kernel).description('内核版本'),
      os: Schema.boolean().default(FIELDS.os).description('操作系统类型'),
      connType: Schema.boolean().default(FIELDS.connType).description('连接类型'),
      gpu: Schema.boolean().default(FIELDS.gpu).description('GPU 占用率'),
      temp: Schema.boolean().default(FIELDS.temp).description('温度'),
      services: Schema.boolean().default(FIELDS.services).description('系统服务状态'),
      updates: Schema.boolean().default(FIELDS.updates).description('可用更新'),
      battery: Schema.boolean().default(FIELDS.battery).description('电池电量'),
      net: Schema.boolean().default(FIELDS.net).description('带宽'),
      footer: Schema.boolean().default(FIELDS.footer).description('底部信息栏')
    }).description('卡片显示项')
  }).description('卡片显示项'),

  Schema.object({
    errorTemplate: Schema.string().default('获取 Beszel 状态失败：{error}')
      .description('出错时回复的文本，{error} 会被替换为具体原因'),
    emptyTemplate: Schema.string().default('没有可显示的服务器')
      .description('没有服务器时回复的文本')
  }).description('提示文案')
])

export const usage = `
## 用法

配置好 Hub 地址、登录邮箱和密码后，在聊天里发送指令即可：

| 指令 | 作用 |
| --- | --- |
| \`beszel\` | 渲染全部服务器状态卡片 |
| \`beszel <名称>\` | 只渲染指定服务器 |

指令名称和别名都可以在配置里改。插件会把卡片渲染成图片，直接发到触发指令的会话中。

## 依赖

需要安装并启用浏览器渲染服务（\`koishi-plugin-puppeteer\` 或 \`puppeteer-without-canvas\`）。
`

function num (value: any): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : -1
}

function summarize (systems: BeszelSystem[]): StatusSummary {
  const summary: StatusSummary = { total: systems.length, up: 0, down: 0, paused: 0, pending: 0 }
  for (const system of systems) {
    if (system.status === 'up') summary.up++
    else if (system.status === 'down') summary.down++
    else if (system.status === 'paused') summary.paused++
    else summary.pending++
  }
  return summary
}

function sortSystems (systems: BeszelSystem[], sortBy: Config['sortBy']): BeszelSystem[] {
  const list = [...systems]
  const byName = (a: BeszelSystem, b: BeszelSystem) => a.name.localeCompare(b.name, 'zh-Hans-CN')
  switch (sortBy) {
    case 'name':
      return list.sort(byName)
    case 'status':
      return list.sort((a, b) => statusOrder(a.status) - statusOrder(b.status))
    case 'cpu':
      return list.sort((a, b) => num(b.info?.cpu) - num(a.info?.cpu))
    case 'memory':
      return list.sort((a, b) => num(b.info?.mp) - num(a.info?.mp))
    case 'disk':
      return list.sort((a, b) => num(b.info?.dp) - num(a.info?.dp))
    default:
      return list.sort((a, b) => statusOrder(a.status) - statusOrder(b.status) || byName(a, b))
  }
}

const IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml'
}

const backgroundCache = new Map<string, string>()

/** 本地图片读成 data URI，HTTP(S) 与 data URI 直接放行；按 mtime 缓存避免重复读盘 */
async function resolveBackground (source: string): Promise<string> {
  const src = (source || '').trim()
  if (!src) return ''
  if (/^(https?:|data:)/i.test(src)) return src
  try {
    const stat = await fs.stat(src)
    if (!stat.isFile() || stat.size > 8 * 1024 * 1024) return ''
    const key = `${src}::${stat.mtimeMs}::${stat.size}`
    const cached = backgroundCache.get(key)
    if (cached) return cached
    const buffer = await fs.readFile(src)
    const uri = `data:${IMAGE_MIME[extname(src).toLowerCase()] || 'image/png'};base64,${buffer.toString('base64')}`
    backgroundCache.clear()
    backgroundCache.set(key, uri)
    return uri
  } catch {
    return ''
  }
}

export function apply (ctx: Context, config: Config) {
  const logger = ctx.logger('beszel-status')
  const commandName = (config.commandName || 'beszel').trim() || 'beszel'

  const command = ctx.command(`${commandName} [target:string]`, '查看 Beszel 服务器状态')
  if (Array.isArray(config.commandAliases) && config.commandAliases.length > 0) {
    const aliases = config.commandAliases.map((alias) => String(alias).trim()).filter(Boolean)
    if (aliases.length > 0) command.alias(...aliases)
  }

  command.action(async ({ session }, target) => {
    if (!session) return
    if (!config.hubUrl) return '尚未配置 Beszel Hub 地址。'

    try {
      const all = await fetchSystems({
        hubUrl: config.hubUrl,
        identity: config.identity,
        password: config.password,
        timeout: config.timeout
      })

      let shown = all
      if (config.hidePaused) shown = shown.filter((system) => system.status !== 'paused')
      if (target) {
        const keyword = target.trim().toLowerCase()
        shown = shown.filter((system) => system.name?.toLowerCase() === keyword || system.id === target)
        if (shown.length === 0) return `未找到服务器：${target}`
      }

      if (shown.length === 0) return config.emptyTemplate

      shown = sortSystems(shown, config.sortBy).slice(0, config.maxSystems)

      const fields: CardFields = { ...FIELDS, ...config.fields }
      // 指定单台服务器时隐藏总览，避免出现一排无意义的 0
      if (target) fields.overview = false

      let background: BackgroundType = config.background || 'aurora'
      let backgroundImage = ''
      if (background === 'image') {
        backgroundImage = await resolveBackground(config.backgroundImage || '')
        // 图片缺失或读取失败时退回极光，避免出现一片空白底
        if (!backgroundImage) background = 'aurora'
      }

      const data: CardData = {
        title: config.title || 'Beszel 服务器状态',
        subtitle: config.subtitle || '',
        systems: shown,
        summary: summarize(shown),
        footer: config.footerText || '',
        fields,
        theme: {
          mode: config.theme === 'light' ? 'light' : 'dark',
          accent: config.accent || '#4f8cff',
          width: config.width || 760,
          background,
          backgroundImage,
          backgroundBlur: config.backgroundBlur ?? 0,
          backgroundDim: config.backgroundDim ?? 30
        }
      }

      const image = await renderStatusImage(ctx, data, {
        format: config.format || 'png',
        quality: config.quality || 92,
        deviceScaleFactor: config.deviceScaleFactor || 2,
        timeout: config.timeout || 10000
      })

      const mime = config.format === 'jpeg' ? 'image/jpeg' : config.format === 'webp' ? 'image/webp' : 'image/png'
      return segment.image(image, mime)
    } catch (error: any) {
      const message = error instanceof BeszelError ? error.message : (error?.message ?? String(error))
      logger.warn(message)
      if (config.debug) logger.debug(error)
      return (config.errorTemplate || '{error}').replace('{error}', message)
    }
  })
}