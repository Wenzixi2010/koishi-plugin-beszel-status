<p align="center">
  基于 <a href="https://koishi.chat">koishi</a> 的 Beszel 服务器状态插件。<br>
  读取 Beszel Hub 的服务器列表与历史数据，渲染成适合群聊直接查看的图片卡片。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/koishi-plugin-beszel-status"><img src="https://img.shields.io/npm/v/koishi-plugin-beszel-status?style=flat-square&logo=npm&logoColor=white&color=CB3837&label=npm" alt="npm 版本"></a>
  <a href="https://www.npmjs.com/package/koishi-plugin-beszel-status"><img src="https://img.shields.io/npm/dw/koishi-plugin-beszel-status?style=flat-square&logo=npm&logoColor=white&color=CB3837&label=下载" alt="npm 周下载量"></a>
  <a href="https://www.npmjs.com/package/koishi-plugin-beszel-status"><img src="https://img.shields.io/npm/unpacked-size/koishi-plugin-beszel-status?style=flat-square&logo=npm&color=CB3837&label=包大小" alt="npm 解包大小"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/Wenzixi2010/koishi-plugin-beszel-status?style=flat-square&logo=github&label=许可证" alt="MIT 许可证"></a>
</p>

## 功能

> 发送指令 → 拉取 Beszel 数据 → 渲染卡片 → 以图片发送到当前会话

- **指令触发** — 在会话里发送指令即可，指令名与别名可在配置中修改。
- **在线心跳图** — 按时间桶统计上报情况，Uptime-Kuma 风格展示在线与中断时段。
- **指标折线图** — CPU、内存、磁盘可多选，附带最新数值。
- **地址打码** — 设备地址支持完整显示、打码或完全隐藏。
- **可选背景** — 极光 / 纯色 / 网格 / 点阵 / 自定义图片，支持模糊与压暗。
- **深浅主题** — 主题与强调色可配，显示项逐项开关。

## 快速开始

### 1. 准备环境

- Koishi >= 4.18.7
- Node.js >= 18
- Beszel Hub 的登录邮箱与密码
- Koishi 的 **puppeteer 插件** —— 渲染卡片，必需

### 2. 安装插件

在 Koishi 控制台的插件市场搜索 `koishi-plugin-beszel-status` 直接安装。手动管理依赖时可以执行：

```bash
pnpm add koishi-plugin-beszel-status
```

### 3. 配置并试跑

打开 Koishi 控制台 → 插件配置 → `beszel-status`，填写 Hub 地址、登录邮箱和密码后保存，在会话里发送：

```text
beszel
服务器状态
```

卡片会以图片形式发到触发的会话。其余配置都有默认值兜底，可以先直接试跑。

## 常用命令

- `beszel` — 渲染全部服务器状态。
- `beszel <关键词>` — 只渲染名称匹配的服务器，支持正则，例如 `beszel ^hk-`。

## 配置说明

| 分组 | 包含 |
| --- | --- |
| 连接设置 | Hub 地址、登录邮箱、密码、超时时间 |
| 指令设置 | 指令名称、别名、调试日志 |
| 卡片外观 | 标题、副标题、底部文字、主题、强调色、背景、宽度、图片格式、排序、数量上限 |
| 卡片显示项 | 总览、CPU、内存、磁盘、负载、运行时长、GPU、温度、服务、更新、电池、心跳图等逐项开关 |
| 历史与图表 | 地址显示方式、折线图指标、折线数值开关、历史区间、心跳图分段数 |
| 提示文案 | 出错与空列表时的回复文本 |

## License

本项目采用 [MIT](./LICENSE) 开源。