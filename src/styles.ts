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

/**
 * 配色对齐 kkk（HeroUI 那套 token）：中性灰做表面分层，强调色只用于点缀。
 * 这里用十六进制而非 oklch，兼容老版本 Chromium。
 */
export function buildCss (theme: CardTheme): string {
  const dark = theme.mode === 'dark'
  const accent = theme.accent

  const bg = dark ? '#1b1b1e' : '#f6f6f8'
  const surface = dark ? '#2b2b2f' : '#ffffff'
  const surfaceSecondary = dark ? '#35353a' : '#f1f1f3'
  const surfaceTertiary = dark ? '#3d3d43' : '#e9e9ec'
  const border = dark ? 'rgba(255,255,255,.10)' : 'rgba(24,24,28,.10)'
  const borderSoft = dark ? 'rgba(255,255,255,.06)' : 'rgba(24,24,28,.06)'
  const text = dark ? '#fafafa' : '#1e1e21'
  const sub = dark ? '#a4a4ab' : '#737379'
  const shadow = dark ? '0 24px 60px rgba(0,0,0,.5)' : '0 24px 60px rgba(24,24,28,.10)'

  const ok = dark ? '#45d18d' : '#2eb87a'
  const warn = dark ? '#efb03e' : '#d99b2b'
  const danger = dark ? '#e5484d' : '#d93843'

  return `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: ${bg}; }
body {
  font-family: "HarmonyOS Sans SC", "HarmonyOSHans-Regular", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  line-height: 1.6;
  color: ${text};
  -webkit-font-smoothing: antialiased;
}
#app { width: ${theme.width}px; padding: 16px; background: ${bg}; }
.board {
  border-radius: 40px;
  background: ${surface};
  border: 1px solid ${border};
  box-shadow: ${shadow};
  overflow: hidden;
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
  background: ${rgba(accent, dark ? 0.16 : 0.1)};
  color: ${accent};
}
.brand-text { min-width: 0; }
.title { font-size: 19px; font-weight: 650; letter-spacing: -.01em; }
.sub { margin-top: 3px; font-size: 12.5px; color: ${sub}; }
.head-time { flex-shrink: 0; text-align: right; font-size: 11.5px; color: ${sub}; line-height: 1.6; }
.head-time b { display: block; font-size: 13px; font-weight: 600; color: ${text}; }

/* 总览：一张卡四等分，用细分割线而不是四个独立盒子 */
.overview {
  display: grid; grid-template-columns: repeat(4, 1fr);
  margin: 20px 32px 2px;
  background: ${surfaceSecondary};
  border: 1px solid ${borderSoft};
  border-radius: 22px;
  overflow: hidden;
}
.stat { padding: 14px 18px; }
.stat + .stat { border-left: 1px solid ${borderSoft}; }
.stat-label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: ${sub}; }
.stat-value { margin-top: 6px; font-size: 24px; font-weight: 800; line-height: 1; letter-spacing: -.02em; }
.dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dot-up { background: ${ok}; }
.dot-down { background: ${danger}; }
.dot-paused { background: ${sub}; }
.dot-pending { background: ${warn}; }

.systems { display: flex; flex-direction: column; gap: 10px; padding: 20px 32px 24px; }
.sys { background: ${surfaceSecondary}; border: 1px solid ${borderSoft}; border-radius: 22px; padding: 16px 18px; }
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