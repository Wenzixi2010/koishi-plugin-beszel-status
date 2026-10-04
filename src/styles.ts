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
    ok: dark ? '#45d18d' : '#2eb87a',
    warn: dark ? '#efb03e' : '#d99b2b',
    danger: dark ? '#e5484d' : '#d93843',
    sub: dark ? '#a4a4ab' : '#737379'
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

/**
 * 配色对齐 kkk（HeroUI 那套 token）：中性灰做表面分层，强调色只用于点缀。
 * 这里用十六进制而非 oklch，兼容老版本 Chromium。
 */
export function buildCss (theme: CardTheme): string {
  const dark = theme.mode === 'dark'
  const accent = theme.accent
  const accentAlt = shiftHue(accent, dark ? 46 : -42)

  const bg = dark ? '#1b1b1e' : '#f6f6f8'
  const surface = dark ? '#2b2b2f' : '#ffffff'
  const surfaceSecondary = dark ? '#35353a' : '#f1f1f3'
  const surfaceTertiary = dark ? '#3d3d43' : '#e9e9ec'
  const border = dark ? 'rgba(255,255,255,.10)' : 'rgba(24,24,28,.10)'
  const borderSoft = dark ? 'rgba(255,255,255,.06)' : 'rgba(24,24,28,.06)'
  const text = dark ? '#fafafa' : '#1e1e21'
  const sub = dark ? '#a4a4ab' : '#737379'
  const shadow = dark ? '0 24px 60px rgba(0,0,0,.5)' : '0 24px 60px rgba(24,24,28,.10)'
  const { ok, warn, danger } = statusColors(theme)

  // 非纯色背景时整块板做成半透明玻璃，让背景从留白处透出来
  const useImage = theme.background === 'image' && !!theme.backgroundImage
  const glass = theme.background !== 'plain'
  const boardBg = glass ? rgba(surface, useImage ? 0.62 : 0.72) : surface
  const backdrop = glass
    ? 'backdrop-filter: blur(24px) saturate(140%); -webkit-backdrop-filter: blur(24px) saturate(140%);'
    : ''
  const appPad = useImage ? 22 : glass ? 18 : 16

  let bgLayer = ''
  if (useImage) {
    const blur = theme.backgroundBlur > 0
      ? `filter: blur(${theme.backgroundBlur}px); transform: scale(1.08);`
      : ''
    bgLayer = `
#app::before {
  content: ''; position: absolute; inset: 0; z-index: 0;
  background-image: url("${theme.backgroundImage}");
  background-size: cover; background-position: center;
  ${blur}
}
#app::after {
  content: ''; position: absolute; inset: 0; z-index: 0;
  background: rgba(0,0,0,${(theme.backgroundDim / 100).toFixed(2)});
}`
  } else if (theme.background === 'aurora') {
    bgLayer = `
#app {
  background-image:
    radial-gradient(1100px 520px at 6% -16%, ${rgba(accent, dark ? 0.30 : 0.34)}, transparent 62%),
    radial-gradient(900px 480px at 112% -8%, ${rgba(accentAlt, dark ? 0.24 : 0.26)}, transparent 64%),
    radial-gradient(1000px 640px at 44% 124%, ${rgba(accentAlt, dark ? 0.16 : 0.18)}, transparent 68%);
}`
  } else if (theme.background === 'grid') {
    bgLayer = `
#app {
  background-image:
    radial-gradient(1000px 560px at 8% -14%, ${rgba(accent, dark ? 0.22 : 0.24)}, transparent 66%),
    linear-gradient(${borderSoft} 1px, transparent 1px),
    linear-gradient(90deg, ${borderSoft} 1px, transparent 1px);
  background-size: 100% 100%, 30px 30px, 30px 30px;
}`
  } else if (theme.background === 'dots') {
    bgLayer = `
#app {
  background-image:
    radial-gradient(1000px 560px at 92% -14%, ${rgba(accentAlt, dark ? 0.22 : 0.24)}, transparent 66%),
    radial-gradient(${border} 1.3px, transparent 1.3px);
  background-size: 100% 100%, 22px 22px;
}`
  }

  return `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: ${bg}; }
body {
  font-family: "HarmonyOS Sans SC", "HarmonyOSHans-Regular", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  line-height: 1.6;
  color: ${text};
  -webkit-font-smoothing: antialiased;
}
#app {
  position: relative;
  width: ${theme.width}px;
  padding: ${appPad}px;
  background-color: ${bg};
}
${bgLayer}

.board {
  position: relative; z-index: 1;
  border-radius: 40px;
  background: ${boardBg};
  border: 1px solid ${border};
  box-shadow: ${shadow};
  overflow: hidden;
  ${backdrop}
}

/* 头部：纯平色 + 分割线，不用渐变 */
.board-head {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 24px 32px 20px;
  border-bottom: 1px solid ${borderSoft};
}
.brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.brand-logo {
  width: 44px; height: 44px; border-radius: 16px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: ${rgba(accent, dark ? 0.18 : 0.12)};
  color: ${accent};
}
.brand-text { min-width: 0; }
.title { font-size: 19px; font-weight: 650; letter-spacing: -.01em; }
.sub { margin-top: 3px; font-size: 12.5px; color: ${sub}; }
.head-time { flex-shrink: 0; text-align: right; font-size: 11.5px; color: ${sub}; line-height: 1.6; }
.head-time b { display: block; font-size: 13px; font-weight: 600; color: ${text}; }

/* 总览：状态占比环 + 图例 */
.overview {
  display: flex; align-items: center; gap: 30px;
  margin: 20px 32px 2px;
  padding: 18px 26px;
  background: ${surfaceSecondary};
  border: 1px solid ${borderSoft};
  border-radius: 22px;
}
.ring { position: relative; width: 104px; height: 104px; flex-shrink: 0; border-radius: 50%; }
.ring-hole {
  position: absolute; inset: 13px; border-radius: 50%;
  background: ${surfaceSecondary};
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.ring-value { font-size: 25px; font-weight: 800; line-height: 1; letter-spacing: -.02em; }
.ring-label { margin-top: 3px; font-size: 11px; color: ${sub}; }
.legend { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 13px 26px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: ${sub}; }
.legend-item b {
  margin-left: auto; font-size: 15px; font-weight: 700; color: ${text};
  font-variant-numeric: tabular-nums;
}

.dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dot-up { background: ${ok}; }
.dot-down { background: ${danger}; }
.dot-paused { background: ${sub}; }
.dot-pending { background: ${warn}; }
.legend-item .dot { width: 8px; height: 8px; }

.systems { display: flex; flex-direction: column; gap: 10px; padding: 20px 32px 24px; }
.sys {
  position: relative; overflow: hidden;
  background: ${surfaceSecondary}; border: 1px solid ${borderSoft};
  border-radius: 22px; padding: 16px 18px;
}
/* 左侧状态色条，方便一眼扫出异常机器 */
.sys::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
.sys-up::before { background: ${ok}; }
.sys-down::before { background: ${danger}; }
.sys-paused::before { background: ${sub}; }
.sys-pending::before { background: ${warn}; }

.sys-head { display: flex; align-items: center; gap: 10px; }
.sys-name { font-size: 15px; font-weight: 600; letter-spacing: -.01em; }
.sys-host { font-size: 12px; color: ${sub}; font-variant-numeric: tabular-nums; }
.pill {
  margin-left: auto; display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 999px;
}
.pill-up { color: ${ok}; background: ${rgba(ok, 0.13)}; }
.pill-down { color: ${danger}; background: ${rgba(danger, 0.13)}; }
.pill-paused { color: ${sub}; background: ${rgba(sub, 0.14)}; }
.pill-pending { color: ${warn}; background: ${rgba(warn, 0.14)}; }
.pill .dot { width: 6px; height: 6px; }

.metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 14px; }
.m-head { display: flex; align-items: baseline; justify-content: space-between; font-size: 12px; color: ${sub}; margin-bottom: 7px; }
.m-val { color: ${text}; font-weight: 600; font-variant-numeric: tabular-nums; }
.bar { height: 6px; border-radius: 999px; background: ${border}; overflow: hidden; }
.bar > i { display: block; height: 100%; border-radius: 999px; }
.bar-ok > i { background: ${ok}; }
.bar-warn > i { background: ${warn}; }
.bar-danger > i { background: ${danger}; }
.bar-none > i { background: transparent; }

.meta { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 13px; font-size: 12px; color: ${sub}; }
.meta b { color: ${text}; font-weight: 600; font-variant-numeric: tabular-nums; }

.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.chip {
  font-size: 11.5px; padding: 4px 10px; border-radius: 12px;
  background: ${surfaceTertiary}; color: ${sub};
}
.chip b { color: ${text}; font-weight: 600; font-variant-numeric: tabular-nums; }
.chip-warn { color: ${warn}; background: ${rgba(warn, 0.13)}; }
.chip-danger { color: ${danger}; background: ${rgba(danger, 0.13)}; }

.footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 32px 20px; font-size: 11.5px; color: ${sub};
  border-top: 1px solid ${borderSoft};
}
.empty { padding: 40px; text-align: center; color: ${sub}; font-size: 13px; }
`.trim()
}