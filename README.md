# 智能流程监控平台 (webfront)

基于 Nuxt 3 + Element Plus + PrimeVue + VueFlow 的浅色风格前端。

## 布局

- 顶部 Header：图标 + 标题 + 后端连接状态
- 左侧上半：实时视频流（默认从 `/stream/video` 拉流，可在 `nuxt.config.ts` 配置代理目标）
- 左侧下半：流程日志 / 状态指标 切换面板
- 右侧：VueFlow 流程图，支持自由布局拖拽、缩放、节点动态高亮（`is-active` / `is-success` / `is-error`）

## 启动

```bash
npm install
npm run dev
```

默认端口 3000。后端代理目标为 `http://localhost:8000`，可在 `nuxt.config.ts` 中调整。

## 节点高亮 API

`FlowDiagram` 组件暴露：

- `highlight(nodeId, edgeId?, status?)` — 高亮指定节点（与边）
- `clearHighlight()` — 清除全部高亮
- `resetLayout()` — 恢复默认节点布局

可通过模板 `ref` 或后端 SSE/WebSocket 推送驱动。
