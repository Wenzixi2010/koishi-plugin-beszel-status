import type { CardTheme, StatusSummary } from './types'

function hexToRgb (hex: string) {
  let value = String(hex || '').trim().replace(/^#/, '')
  if (value.length === 3) value = value.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(value)) value = '4f8cff'
  const num = parseInt(value, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

/** 把 HEX 转成带透明度的 rgba() */
export function rgba (hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

/** 旋转色相，给极光背景生成第二抹配色 */
function shiftHue (hex: string, deg: number): string {
  const { r, g, b } = hexToRgb(hex)
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d > 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
    else if (max === gn) h = ((bn - rn) / d + 2) * 60
    else h = ((rn - gn) / d + 4) * 60
  }
  h = (h + deg + 360) % 360

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let rgb: [number, number, number]
  if (h < 60) rgb = [c, x, 0]
  else if (h < 120) rgb = [x, c, 0]
  else if (h < 180) rgb = [0, c, x]
  else if (h < 240) rgb = [0, x, c]
  else if (h < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${to(rgb[0])}${to(rgb[1])}${to(rgb[2])}`
}

/** 状态色，卡片与总览环形图共用 */
export function statusColors (theme: CardTheme) {
  const dark = theme.mode === 'dark'
  return {
    ok: dark ? '#55bd87' : '#27835a',
    warn: dark ? '#d8a74e' : '#986714',
    danger: dark ? '#df7377' : '#ad343b',
    sub: dark ? '#96989e' : '#777a80'
  }
}

/** 用 conic-gradient 画一张状态占比环 */
export function ringGradient (summary: StatusSummary, theme: CardTheme): string {
  const { ok, warn, danger, sub } = statusColors(theme)
  const total = Math.max(1, summary.total)
  const parts: string[] = []
  let done = 0
  const push = (count: number, color: string) => {
    if (count <= 0) return
    const from = (done / total) * 100
    done += count
    parts.push(`${color} ${from.toFixed(2)}% ${((done / total) * 100).toFixed(2)}%`)
  }
  push(summary.up, ok)
  push(summary.down, danger)
  push(summary.paused, sub)
  push(summary.pending, warn)
  if (parts.length === 0) parts.push(`${sub} 0% 100%`)
  return `conic-gradient(${parts.join(', ')})`
}

/** 生成卡片主题与布局样式 */
export function buildCss (theme: CardTheme): string {
  const dark = theme.mode === 'dark'
  const accent = theme.accent
  const accentAlt = shiftHue(accent, dark ? 46 : -42)
  const bg = dark ? '#17191c' : '#f4f3ef'
  const surface = dark ? '#202327' : '#fffefa'
  const surfaceSecondary = dark ? '#272b30' : '#f8f7f3'
  const surfaceTertiary = dark ? '#30353b' : '#efeee8'
  const border = dark ? 'rgba(255,255,255,.12)' : 'rgba(36,38,34,.13)'
  const borderSoft = dark ? 'rgba(255,255,255,.08)' : 'rgba(36,38,34,.08)'
  const text = dark ? '#f0f0eb' : '#292b28'
  const sub = dark ? '#a6aaa9' : '#747770'
  const shadow = dark ? '0 18px 48px rgba(0,0,0,.28)' : '0 18px 48px rgba(47,43,32,.09)'
  const { ok, warn, danger } = statusColors(theme)
  const useImage = theme.background === 'image' && !!theme.backgroundImage
  const glass = theme.background !== 'plain'
  const boardBg = glass ? rgba(surface, useImage ? 0.88 : 0.91) : surface
  const backdrop = glass ? 'backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);' : ''
  const appPad = useImage ? 20 : glass ? 16 : 12

  let bgLayer = ''
  if (useImage) {
    const blur = theme.backgroundBlur > 0
      ? `filter: blur(${theme.backgroundBlur}px); transform: scale(1.08);`
      : ''
    bgLayer = `
#app::before {
  content: ''; position: absolute; inset: 0; z-index: 0;
  background-image: url("${theme.backgroundImage}"); background-size: cover; background-position: center;
  ${blur}
}
#app::after {
  content: ''; position: absolute; inset: 0; z-index: 0;
  background: rgba(0,0,0,${(theme.backgroundDim / 100).toFixed(2)});
}`
  } else if (theme.background === 'aurora') {
    bgLayer = `
#app { background-image: radial-gradient(900px 480px at 5% -12%, ${rgba(accent, dark ? 0.22 : 0.20)}, transparent 68%), radial-gradient(760px 440px at 108% 4%, ${rgba(accentAlt, dark ? 0.15 : 0.13)}, transparent 68%); }`
  } else if (theme.background === 'grid') {
    bgLayer = `
#app { background-image: linear-gradient(${borderSoft} 1px, transparent 1px), linear-gradient(90deg, ${borderSoft} 1px, transparent 1px); background-size: 28px 28px; }`
  } else if (theme.background === 'dots') {
    bgLayer = `
#app { background-image: radial-gradient(${border} 1px, transparent 1px); background-size: 20px 20px; }`
  }

  return `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: ${bg}; }
body { font-family: "HarmonyOS Sans SC", "HarmonyOSHans-Regular", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; line-height: 1.55; color: ${text}; -webkit-font-smoothing: antialiased; }
#app { position: relative; width: ${theme.width}px; padding: ${appPad}px; background-color: ${bg}; }
${bgLayer}
.board { position: relative; z-index: 1; overflow: hidden; border: 1px solid ${border}; border-radius: 16px; background: ${boardBg}; box-shadow: ${shadow}; ${backdrop} }
.board-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 25px 30px 22px; border-bottom: 1px solid ${borderSoft}; }
.brand-text { min-width: 0; }
.eyebrow { margin-bottom: 5px; color: ${sub}; font-size: 10px; font-weight: 700; letter-spacing: .12em; }
.title { font-size: 20px; font-weight: 650; letter-spacing: -.025em; overflow-wrap: anywhere; }
.sub { margin-top: 4px; color: ${sub}; font-size: 12px; overflow-wrap: anywhere; }
.head-time { flex: 0 0 auto; text-align: right; color: ${sub}; font-size: 10px; }
.head-time b { display: block; margin-top: 2px; color: ${text}; font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums; }
.overview { display: grid; grid-template-columns: minmax(170px, .8fr) minmax(0, 1.2fr); align-items: center; gap: 22px; margin: 0 30px; padding: 19px 0; border-bottom: 1px solid ${borderSoft}; }
.overview-lead { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.overview-total b { display: block; font-size: 26px; line-height: 1.1; font-weight: 650; font-variant-numeric: tabular-nums; }
.overview-total span { display: block; margin-top: 5px; color: ${sub}; font-size: 11px; }
.overview-rate { display: flex; align-items: center; gap: 9px; }
.ring { position: relative; width: 38px; height: 38px; flex: 0 0 auto; border-radius: 50%; }
.ring-hole { position: absolute; inset: 4px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: ${surface}; }
.ring-value { font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ring-value small { font-size: 8px; }
.ring-label { color: ${sub}; font-size: 11px; }
.legend { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px 18px; }
.legend-item { display: flex; align-items: center; gap: 7px; min-width: 0; color: ${sub}; font-size: 11px; }
.legend-item b { margin-left: auto; color: ${text}; font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }
.dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; }
.dot-up { background: ${ok}; } .dot-down { background: ${danger}; } .dot-paused { background: ${sub}; } .dot-pending { background: ${warn}; }
.systems { display: flex; flex-direction: column; padding: 3px 30px 8px; }
.sys { position: relative; padding: 19px 0 20px; border-bottom: 1px solid ${borderSoft}; }
.sys:last-child { border-bottom: 0; }
.sys-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.sys-identity { display: flex; align-items: flex-start; gap: 9px; min-width: 0; }
.sys-mark { width: 8px; height: 8px; flex: 0 0 auto; margin-top: 6px; border-radius: 50%; background: ${sub}; }
.sys-mark-up { background: ${ok}; } .sys-mark-down { background: ${danger}; } .sys-mark-paused { background: ${sub}; } .sys-mark-pending { background: ${warn}; }
.sys-labels { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; min-width: 0; }
.sys-name { font-size: 14px; font-weight: 650; letter-spacing: -.01em; overflow-wrap: anywhere; }
.sys-host { color: ${sub}; font-size: 10px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.pill { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; padding: 3px 0 3px 8px; color: ${sub}; font-size: 10px; font-weight: 600; }
.pill-up { color: ${ok}; } .pill-down { color: ${danger}; } .pill-paused { color: ${sub}; } .pill-pending { color: ${warn}; }
.pill .dot { width: 6px; height: 6px; }
.metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 15px 0 0 17px; }
.m-head { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; margin-bottom: 6px; color: ${sub}; font-size: 10px; }
.m-val { color: ${text}; font-size: 11px; font-weight: 650; font-variant-numeric: tabular-nums; }
.bar { height: 3px; overflow: hidden; border-radius: 2px; background: ${border}; }
.bar > i { display: block; height: 100%; border-radius: inherit; }
.bar-ok > i { background: ${ok}; } .bar-warn > i { background: ${warn}; } .bar-danger > i { background: ${danger}; } .bar-none > i { background: transparent; }
.sys-details { margin: 13px 0 0 17px; padding-top: 11px; border-top: 1px solid ${borderSoft}; }
.meta { display: flex; flex-wrap: wrap; gap: 4px 17px; color: ${sub}; font-size: 10px; }
.meta b { color: ${text}; font-weight: 550; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.chips { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 9px; }
.chip { color: ${sub}; font-size: 10px; overflow-wrap: anywhere; }
.chip b { color: ${text}; font-weight: 600; font-variant-numeric: tabular-nums; }
.chip-warn, .chip-warn b { color: ${warn}; } .chip-danger, .chip-danger b { color: ${danger}; }
.history { display: flex; flex-direction: column; gap: 10px; margin: 14px 0 0 17px; }
.hb-head { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 6px; color: ${sub}; font-size: 10px; }
.hb-range { color: ${sub}; }
.hb-bars { display: flex; gap: 2px; height: 14px; }
.hb-bars > i { flex: 1 1 0; min-width: 1px; border-radius: 2px; background: ${surfaceTertiary}; }
.hb-bars > i.hb-up { background: ${ok}; } .hb-bars > i.hb-down { background: ${danger}; } .hb-bars > i.hb-none { background: ${border}; }
.charts { display: grid; gap: 9px; }
.spark { min-width: 0; padding: 8px 10px 5px; border: 1px solid ${borderSoft}; border-radius: 7px; background: ${surfaceSecondary}; }
.spark-head { display: flex; justify-content: space-between; gap: 8px; color: ${sub}; font-size: 10px; }
.spark-head b { color: ${text}; font-weight: 600; font-variant-numeric: tabular-nums; }
.spark svg { display: block; width: 100%; height: 32px; margin-top: 4px; }
.spark-area { fill: ${rgba(accent, dark ? 0.17 : 0.13)}; stroke: none; }
.spark-line { fill: none; stroke: ${accent}; stroke-width: 1.6; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 30px 16px; border-top: 1px solid ${borderSoft}; color: ${sub}; font-size: 10px; overflow-wrap: anywhere; }
.empty { padding: 30px 0; color: ${sub}; text-align: center; font-size: 12px; }
@media (max-width: 520px) {
  .board-head { padding: 20px 18px 17px; gap: 12px; }
  .title { font-size: 17px; }
  .overview { grid-template-columns: 1fr; gap: 15px; margin: 0 18px; }
  .overview-lead { justify-content: flex-start; gap: 24px; }
  .systems { padding-right: 18px; padding-left: 18px; }
  .metrics { gap: 9px; margin-left: 17px; }
  .sys-details, .history { margin-left: 0; }
  .footer { padding-right: 18px; padding-left: 18px; }
}
`.trim()
}
