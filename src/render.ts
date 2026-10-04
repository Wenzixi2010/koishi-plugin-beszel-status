import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Context } from 'koishi'
import { StatusCard } from './components/StatusCard'
import { buildCss } from './styles'
import type { CardData, RenderOptions } from './types'

/** 生成完整的 HTML 文档（React SSR + 内联样式） */
export function buildHtml (data: CardData): string {
  const body = renderToStaticMarkup(React.createElement(StatusCard, { data }))
  const css = buildCss(data.theme)
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8" />'
    + '<meta name="viewport" content="width=device-width, initial-scale=1" />'
    + `<style>${css}</style></head><body><div id="app">${body}</div></body></html>`
}

/** 用浏览器渲染服务把卡片截成图片 */
export async function renderStatusImage (ctx: Context, data: CardData, options: RenderOptions): Promise<Buffer> {
  const puppeteer: any = (ctx as any).puppeteer ?? (ctx as any).get?.('puppeteer')
  if (!puppeteer) {
    throw new Error('未检测到浏览器渲染服务，请安装并启用 koishi-plugin-puppeteer')
  }

  const html = buildHtml(data)
  const page = await puppeteer.page()
  try {
    await page.setViewport({
      width: data.theme.width + 8,
      height: 800,
      deviceScaleFactor: options.deviceScaleFactor
    })
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: options.timeout })

    const element = await page.$('#app')
    const shot = element
      ? await element.screenshot({
        type: options.format,
        quality: options.format === 'png' ? undefined : options.quality
      })
      : await page.screenshot({ type: options.format, fullPage: true })

    return Buffer.isBuffer(shot) ? shot : Buffer.from(shot)
  } finally {
    await page.close()
  }
}