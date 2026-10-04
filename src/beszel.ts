import type { BeszelStatRecord, BeszelSystem } from './types'

export class BeszelError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'BeszelError'
  }
}

export interface BeszelAuth {
  hubUrl: string
  identity: string
  password: string
  timeout: number
}

interface TokenCache {
  token: string
  expireAt: number
}

/** 按 hub + 账号缓存 token，避免每次指令都重新登录 */
const tokenCache = new Map<string, TokenCache>()
const TOKEN_TTL = 30 * 60 * 1000

function normalizeUrl (url: string): string {
  return String(url || '').trim().replace(/\/+$/, '')
}

function cacheKey (auth: BeszelAuth): string {
  return `${normalizeUrl(auth.hubUrl)}::${auth.identity}`
}

async function request (url: string, init: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new BeszelError(`请求超时（${timeout}ms）`)
    throw new BeszelError(`无法连接到 Beszel Hub：${error?.message ?? error}`)
  } finally {
    clearTimeout(timer)
  }
}

async function authenticate (auth: BeszelAuth): Promise<string> {
  const base = normalizeUrl(auth.hubUrl)
  if (!base) throw new BeszelError('未配置 Beszel Hub 地址')
  if (!auth.identity || !auth.password) throw new BeszelError('未配置登录邮箱或密码')

  const response = await request(`${base}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: auth.identity, password: auth.password })
  }, auth.timeout)

  if (!response.ok) {
    const detail = await safeText(response)
    throw new BeszelError(`登录失败（HTTP ${response.status}${detail ? `：${detail}` : ''}）`)
  }

  const data: any = await response.json().catch(() => null)
  if (!data?.token) throw new BeszelError('登录响应缺少 token')

  tokenCache.set(cacheKey(auth), { token: data.token, expireAt: Date.now() + TOKEN_TTL })
  return data.token
}

async function getToken (auth: BeszelAuth): Promise<string> {
  const cached = tokenCache.get(cacheKey(auth))
  if (cached && cached.expireAt > Date.now()) return cached.token
  return authenticate(auth)
}

async function safeText (response: Response): Promise<string> {
  try {
    const data: any = await response.json()
    return data?.message ?? ''
  } catch {
    return ''
  }
}

/** info 字段正常情况下是对象，个别版本会返回 JSON 字符串，这里统一成对象 */
function normalizeInfo (value: any): any {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

/** 带 token 的 GET，token 失效时清缓存重登一次 */
async function authedGet (auth: BeszelAuth, url: string): Promise<Response> {
  let token = await getToken(auth)
  let response = await request(url, { headers: { Authorization: token } }, auth.timeout)

  if (response.status === 401) {
    tokenCache.delete(cacheKey(auth))
    token = await authenticate(auth)
    response = await request(url, { headers: { Authorization: token } }, auth.timeout)
  }

  return response
}

export async function fetchSystems (auth: BeszelAuth): Promise<BeszelSystem[]> {
  const base = normalizeUrl(auth.hubUrl)
  const url = `${base}/api/collections/systems/records?perPage=200&sort=name`
  const response = await authedGet(auth, url)

  if (!response.ok) {
    throw new BeszelError(`获取服务器列表失败（HTTP ${response.status}）`)
  }

  const data: any = await response.json().catch(() => null)
  const items: any[] = Array.isArray(data?.items) ? data.items : []
  return items.map((item) => ({ ...item, info: normalizeInfo(item?.info) })) as BeszelSystem[]
}

/**
 * 拉取单台服务器的 system_stats 历史。
 * type 同时决定聚合粒度与保留时长：1m≈1h / 10m≈12h / 20m≈24h / 120m≈7d / 480m≈30d。
 * 结果按 created 升序，便于直接分桶与连线。
 */
export async function fetchSystemStats (auth: BeszelAuth, systemId: string, type: string, perPage = 200): Promise<BeszelStatRecord[]> {
  const base = normalizeUrl(auth.hubUrl)
  const filter = encodeURIComponent(`(system="${systemId}"&&type="${type}")`)
  const url = `${base}/api/collections/system_stats/records?filter=${filter}&sort=-created&perPage=${perPage}`
  const response = await authedGet(auth, url)

  if (!response.ok) {
    throw new BeszelError(`获取历史数据失败（HTTP ${response.status}）`)
  }

  const data: any = await response.json().catch(() => null)
  const items: any[] = Array.isArray(data?.items) ? data.items : []
  return items
    .map((item) => ({ ...item, stats: normalizeInfo(item?.stats) }))
    .filter((item) => item && item.created)
    .reverse() as BeszelStatRecord[]
}

export function clearTokenCache (): void {
  tokenCache.clear()
}