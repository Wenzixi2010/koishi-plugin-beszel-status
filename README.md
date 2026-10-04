# koishi-plugin-beszel-status

把 [Beszel](https://beszel.dev) 的服务器状态渲染成一张图片卡片，发送到触发指令的聊天会话（群聊 / 私聊）。

- 用指定指令触发，卡片直接以图片形式发出
- 基于 React SSR + 浏览器渲染服务（puppeteer）截图，卡片支持深浅主题与自定义强调色
- 背景可选极光 / 纯色 / 网格 / 点阵 / 自定义图片（URL 或本地文件），支持模糊与压暗
- 每台服务器可显示在线心跳图（Uptime-Kuma 风格）与 CPU / 内存 / 磁盘折线图
- 设备地址支持完整显示、打码或完全隐藏
- 连接、指令、外观、显示项、历史图表、提示文案等均可配置

## 依赖

需要一个浏览器渲染服务，任选其一：

- `koishi-plugin-puppeteer`
- `puppeteer-without-canvas`

## 配置

在 Koishi 控制台的插件配置页填写：

| 分组 | 说明 |
| --- | --- |
| 连接设置 | Beszel Hub 地址、登录邮箱、密码、超时时间 |
| 指令设置 | 指令名称、别名、调试日志 |
| 卡片外观 | 标题、副标题、底部文字、主题、强调色、背景样式与背景图、宽度、缩放、图片格式、排序、数量上限 |
| 卡片显示项 | 逐项控制总览、CPU、内存、磁盘、负载、运行时长、GPU、温度、服务、更新、电池、心跳图等 |
| 历史与图表 | 地址显示方式（完整 / 打码 / 隐藏）、折线图指标、历史区间、心跳图分段数 |
| 提示文案 | 出错与空列表时的回复文本 |

## 指令

| 指令 | 作用 |
| --- | --- |
| `beszel` | 渲染全部服务器状态卡片 |
| `beszel <关键词>` | 只渲染名称匹配的服务器，支持正则（例如 `beszel ^hk-`） |

指令名与别名都可以在配置里修改。

## 实现说明

1. 使用 `POST {hubUrl}/api/collections/users/auth-with-password` 登录，拿到 PocketBase token 并缓存；
2. 使用 `GET {hubUrl}/api/collections/systems/records?perPage=200&sort=name` 拉取服务器列表；
3. 需要历史图表时，按粒度查询 `system_stats`，把记录切成时间桶得到心跳条，并按指标生成折线序列；
4. 用 React 把卡片渲染成 HTML 字符串（`react-dom/server`），内联样式，无构建步骤；
5. 交给 `ctx.puppeteer` 截图，作为图片消息返回。

服务端要求 Node.js 18+（依赖全局 `fetch`）。

## License

MIT