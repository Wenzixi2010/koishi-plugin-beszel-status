import type { CardTheme } from './types'

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

/** 与目标色混合，用于生成渐变第二色 */
function mix (hex: string, target: string, amount: number): string {
  const a = hexToRgb(hex)
  const b = hexToRgb(target)
  const r = Math.round(a.r + (b.r - a.r) * amount)
  const g = Math.round(a.g + (b.g - a.g) * amount)
  const bl = Math.round(a.b + (b.b - a.b) * amount)
  return `rgb(${r},${g},${bl})`
}

export function buildCss (theme: CardTheme): string {
  const dark = theme.mode === 'dark'
  const accent = theme.accent
  const accent2 = mix(accent, '#ffffff', dark ? 0.18 : 0.3)

  const bg = dark ? '#0f1115' : '#eef1f6'
  const card = dark ? '#171a1f' : '#ffffff'
  const cardSoft = dark ? '#1e222a' : '#f6f8fb'
  const text = dark ? '#e9ecf1' : '#1b1f27'
  const sub = dark ? '#939aa6' : '#6b7280'
  const border = dark ? 'rgba(255,255,255,.08)' : 'rgba(17,24,39,.08)'
  const track = dark ? 'rgba(255,255,255,.08)' : 'rgba(17,24,39,.08)'
  const shadow = dark ? '0 18px 48px rgba(0,0,0,.55)' : '0 18px 44px rgba(19,32,63,.12)'

  const ok = dark ? '#3ddc84' : '#22a35c'
  const warn = dark ? '#ffc94d' : '#b26a00'
  const danger = dark ? '#ff6b6f' : '#d5343a'
  const muted = sub

  return `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: ${bg}; }
body {
  font-family: "PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, -apple-system, sans-serif;
  color: ${text};
  -webkit-font-smoothing: antialiased;
}
#app { width: ${theme.width}px; padding: 16px; background: ${bg}; }
.board {
  border-radius: 22px;
  background: ${card};
  border: 1px solid ${border};
  box-shadow: ${shadow};
  overflow: hidden;
}

.board-head {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 22px 26px 18px;
  background: linear-gradient(135deg, ${rgba(accent, dark ? 0.22 : 0.14)}, ${rgba(accent, 0.02)});
  border-bottom: 1px solid ${border};
}
.brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.brand-logo {
  width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, ${accent}, ${accent2});
  box-shadow: 0 8px 18px ${rgba(accent, 0.35)};
}
.brand-text { min-width: 0; }
.title { font-size: 20px; font-weight: 700; letter-spacing: .01em; }
.sub { margin-top: 3px; font-size: 12.5px; color: ${sub}; }
.head-time { flex-shrink: 0; text-align: right; font-size: 12px; color: ${sub}; line-height: 1.5; }
.head-time b { display: block; font-size: 13px; color: ${text}; font-weight: 600; }

.overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 18px 26px 4px; }
.stat { background: ${cardSoft}; border: 1px solid ${border}; border-radius: 14px; padding: 12px 14px; }
.stat-label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: ${sub}; }
.stat-value { margin-top: 6px; font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-up { background: ${ok}; }
.dot-down { background: ${danger}; }
.dot-paused { background: ${muted}; }
.dot-pending { background: ${warn}; }

.systems { display: flex; flex-direction: column; gap: 12px; padding: 16px 26px 22px; }
.sys { background: ${cardSoft}; border: 1px solid ${border}; border-radius: 16px; padding: 15px 16px; }
.sys-head { display: flex; align-items: center; gap: 10px; }
.sys-name { font-size: 15.5px; font-weight: 650; }
.sys-host { font-size: 12px; color: ${sub}; font-variant-numeric: tabular-nums; }
.pill {
  margin-left: auto; display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px; flex-shrink: 0;
}
.pill-up { color: ${ok}; background: ${rgba(ok, 0.14)}; }
.pill-down { color: ${danger}; background: ${rgba(danger, 0.14)}; }
.pill-paused { color: ${muted}; background: ${rgba(muted, 0.16)}; }
.pill-pending { color: ${warn}; background: ${rgba(warn, 0.16)}; }
.pill .dot { width: 7px; height: 7px; }

.metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 13px; }
.m-head { display: flex; justify-content: space-between; font-size: 12px; color: ${sub}; margin-bottom: 6px; }
.m-val { color: ${text}; font-weight: 600; font-variant-numeric: tabular-nums; }
.bar { height: 7px; border-radius: 999px; background: ${track}; overflow: hidden; }
.bar > i { display: block; height: 100%; border-radius: 999px; }
.bar-ok > i { background: linear-gradient(90deg, ${ok}, ${mix(ok, '#ffffff', 0.25)}); }
.bar-warn > i { background: linear-gradient(90deg, ${warn}, ${mix(warn, '#ffffff', 0.25)}); }
.bar-danger > i { background: linear-gradient(90deg, ${danger}, ${mix(danger, '#ffffff', 0.25)}); }
.bar-none > i { background: ${track}; }

.meta { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 12px; font-size: 12px; color: ${sub}; }
.meta b { color: ${text}; font-weight: 600; font-variant-numeric: tabular-nums; }

.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 11px; }
.chip {
  font-size: 11.5px; padding: 4px 9px; border-radius: 8px;
  background: ${dark ? 'rgba(255,255,255,.06)' : 'rgba(17,24,39,.05)'}; color: ${sub};
}
.chip b { color: ${text}; font-weight: 600; font-variant-numeric: tabular-nums; }
.chip-warn { color: ${warn}; background: ${rgba(warn, 0.14)}; }
.chip-danger { color: ${danger}; background: ${rgba(danger, 0.14)}; }

.footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 26px 18px; font-size: 11.5px; color: ${sub};
  border-top: 1px solid ${border};
}
.empty { padding: 34px; text-align: center; color: ${sub}; font-size: 13px; }
`.trim()
}