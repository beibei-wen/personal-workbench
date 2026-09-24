# 个人工作生活专属 APP

这是一个只供本人在电脑浏览器中使用的个人工作生活工具。应用不登录、不联网、不使用云数据库，数据保存在当前浏览器的 IndexedDB 中。

## 已实现模块

- 首页总览
- 今日计划
- 自媒体
- 开发工作
- 咨询工作
- 健身计划
- 饮食计划
- 游戏娱乐
- 数据与设计
- 学习计划
- 快速备忘
- 数据与备份

## 本机运行

目标浏览器：最新稳定版 Chrome 或 Edge。

开发运行：

```powershell
npm install
npm run dev
```

生产构建：

```powershell
npm run build
```

构建结果位于：

```text
dist/index.html
```

该文件已经内联 JavaScript 和样式，可以直接用浏览器打开。数据会绑定到当前浏览器和当前文件路径，因此不要随意移动 `dist` 目录。日常更新时建议继续使用同一路径。

也可以直接打开项目根目录的 `index.html`。在 `file://` 模式下，它会自动跳转到已经构建好的 `dist/index.html`，不需要启动开发服务器。

## 数据备份

- 数据默认保存在当前电脑的浏览器 IndexedDB 中。
- 刷新、关闭浏览器和重启电脑后仍会保留。
- 清理浏览器数据、删除浏览器用户配置、重装系统或更换电脑时，应用内数据可能丢失。
- 请在“数据与备份”页面定期导出 JSON 备份。
- 恢复会整份替换当前数据，不会自动合并。

## 测试命令

```powershell
npm run lint
npm run test
npm run build
npm run test:e2e
```

一次执行完整检查：

```powershell
npm run check
```

端到端测试覆盖：

- 十个一级页面
- 八个专项业务模块
- 快速备忘到今日计划的闭环
- 今日计划和来源模块同步
- 浏览器进程重开后的数据持久化
- 构建后 `file://` 直接打开的持久化
- 备份导出、整份恢复和损坏文件保护
- 1280x720 和 1440x900 桌面布局

## 技术结构

- React + TypeScript + Vite
- Ant Design + Lucide
- Dexie + IndexedDB
- Zod
- Vitest + React Testing Library
- Playwright
