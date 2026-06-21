# 简历投递管理工具 (Resume Tracker)

本地优先(local-first)的简历投递与面试管理工具。数据全部保存在浏览器本地(IndexedDB),不上传服务器;可安装为 PWA 在手机 / 桌面离线使用。

**在线使用**:<https://miaomaioji.github.io/-Resume-submission-tracking-/>

> 🚧 开发中。完整设计与里程碑见 [docs/PLAN.md](docs/PLAN.md)。

## 功能(规划)

- 📋 高密度表格 + Excel 式内联编辑,搜索 / 筛选 / 排序 / 批量
- 🧭 8 态状态机 + 里程碑时间线(面试轮次记入时间线)
- ⏰ 投递无响应超时变色,阈值可**按渠道**单独设置
- 🗂️ 看板(拖拽改状态) / 日历 / 三视图联动
- 🔔 提醒中心、ICS 日历导出
- 🌗 深色模式、中英双语(后续)
- 💾 JSON 导出 / 备份;一键迁移旧版单文件数据

## 技术栈

React 18 · TypeScript · Vite · PWA · Tailwind CSS 4 · Dexie(IndexedDB) · TanStack Table · dnd-kit · react-big-calendar

## 开发

需要 Node 18+。

```bash
npm install
npm run dev        # 开发服务器
npm run build      # 类型检查 + 构建
npm run test       # 单元测试
npm run lint       # 代码检查
```

## 旧版

最早的单文件原型保留在 [`legacy/job_tracker_v2.html`](legacy/job_tracker_v2.html)。新版会在首次使用时提供一键导入其本地数据(`localStorage`)。

## 许可证

[GPL-3.0](LICENSE)
