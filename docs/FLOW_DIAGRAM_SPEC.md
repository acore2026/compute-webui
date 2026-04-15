# 流程图（ReactFlow 拓扑图）UI 元素与动画规范

> 本文档专注于 **ReactFlow 拓扑图本身** 的所有 UI 元素、尺寸、颜色、动画，作为独立可复现规范提供。
>
> 技术基座：`@xyflow/react@12.10.2` + Tailwind 4 + 原生 CSS keyframes。
>
> 文件引用：`src/App.tsx`（节点/边组件与布局），`src/index.css`（样式与动画）。

---

## 目录

1. [基础常量与颜色变量](#1-基础常量与颜色变量)
2. [节点类型元数据 kindMeta](#2-节点类型元数据-kindmeta)
3. [节点外壳样式（默认 Default）](#3-节点外壳样式默认-default)
4. [节点状态与活跃效果](#4-节点状态与活跃效果)
5. [特殊外观：Agent / Gateway / Pill / Phone / Robot](#5-特殊外观agent--gateway--pill--phone--robot)
6. [嵌入卡片、Chip、设备插图](#6-嵌入卡片chip设备插图)
7. [消息气泡与计划 Plan](#7-消息气泡与计划-plan)
8. [Handle（连接点）](#8-handle连接点)
9. [区域节点 Region / 总线节点 Bus](#9-区域节点-region--总线节点-bus)
10. [MissionEdge 连接线完整规范](#10-missionedge-连接线完整规范)
11. [全部动画关键帧（Keyframes）](#11-全部动画关键帧keyframes)
12. [背景 Background 与 Viewport](#12-背景-background-与-viewport)
13. [Legend 图例](#13-legend-图例)
14. [布局坐标 LAYOUT](#14-布局坐标-layout)
15. [节点 / 边数据示例](#15-节点--边数据示例)
16. [关键尺寸速查表](#16-关键尺寸速查表)
17. [完整颜色速查表](#17-完整颜色速查表)

---

## 1. 基础常量与颜色变量

### 1.1 节点配色变量（`src/index.css` 顶部 `@theme`）

```css
--node-blue:  #3b82f6;
--node-cyan:  #06b6d4;
--node-green: #10b981;
--node-amber: #f59e0b;
--node-pink:  #ec4899;
```

### 1.2 字体缩放变量

所有节点文字尺寸均乘以 `--graph-font-scale`（默认 `1.2`，范围 `0.9 – 1.6`），支持运行时缩放：

```css
font-size: calc(0.78rem * var(--graph-font-scale, 1));
```

### 1.3 视口默认值

```ts
const DEFAULT_VIEWPORT = { x: -22, y: 42, zoom: 1.24 };
const MIN_GRAPH_ZOOM = 0.5;
const MAX_GRAPH_ZOOM = 2;
```

---

## 2. 节点类型元数据 kindMeta

14 种节点 kind，每种映射一个 **Lucide 图标** 和一个 **tint 色**（通过 CSS 变量 `--node-tint` 注入）：

```ts
const kindMeta: Record<NodeKind, { icon: any; tint: string }> = {
  endpoint: { icon: Smartphone,   tint: 'var(--node-blue)'  },  // #3b82f6
  access:   { icon: Radio,        tint: 'var(--node-green)' },  // #10b981
  upf:      { icon: Router,       tint: 'var(--node-cyan)'  },  // #06b6d4
  router:   { icon: Repeat,       tint: 'var(--node-amber)' },  // #f59e0b
  service:  { icon: Cpu,          tint: 'var(--node-pink)'  },  // #ec4899
  idm:      { icon: UserCheck,    tint: '#6366f1'           },  // 靛蓝
  agent:    { icon: BrainCircuit, tint: '#8b5cf6'           },  // 紫
  srf:      { icon: Settings,     tint: '#ec4899'           },  // 粉
  scf:      { icon: Settings,     tint: '#f43f5e'           },  // 玫红
  up:       { icon: Database,     tint: '#06b6d4'           },  // 青
  gw:       { icon: Waypoints,    tint: '#f59e0b'           },  // 琥珀
  robot:    { icon: Bot,          tint: '#0f766e'           },  // 深青
  arm:      { icon: Wrench,       tint: '#f97316'           },  // 橙
  card:     { icon: UserCheck,    tint: '#0f766e'           },  // 深青
};
```

**动态染色注入**：

```jsx
<div
  className="mission-node-shell"
  style={{ '--node-tint': kindMeta[data.kind].tint }}
>
```

---

## 3. 节点外壳样式（默认 Default）

### 3.1 `.mission-node-shell`（外壳容器）

```css
.mission-node-shell {
  position: relative;
  isolation: isolate;
  padding: 1px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(247, 250, 252, 0.98));
  border: 1px solid rgba(191, 203, 221, 0.95);
  box-shadow:
    0 12px 24px rgba(15, 23, 42, 0.07),
    0 0 0 1px rgba(255, 255, 255, 0.92);   /* 内部白色高光 */
  transition: border-color 220ms ease, box-shadow 220ms ease, opacity 220ms ease, filter 220ms ease;
}
```

### 3.2 `.mission-node`（内容区域，带 tint 染色）

```css
.mission-node {
  min-width: 118px;
  background:
    radial-gradient(circle at top right,
      color-mix(in srgb, var(--node-tint) 8%, transparent), transparent 44%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
  border-radius: 11px;
  padding: 12px 12px;
  transition: background 220ms ease, opacity 220ms ease, transform 220ms ease;
}
```

### 3.3 `.mission-node-icon`（图标块）

```css
.mission-node-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--node-tint) 10%, white);
  color: var(--node-tint);
  flex: 0 0 auto;
}
```

Lucide 图标以 `size={16}` 渲染。

### 3.4 `.mission-node-label` / `.mission-node-role`（文字）

```css
.mission-node-label {
  font-size: calc(0.78rem * var(--graph-font-scale, 1));
  font-weight: 800;
  color: var(--color-text);      /* #1e293b */
  line-height: 1.05;
}

.mission-node-role {
  font-size: calc(0.6rem * var(--graph-font-scale, 1));
  font-weight: 600;
  color: #66768e;
  letter-spacing: 0.01em;
  line-height: 1.15;
  max-width: 160px;
}
```

---

## 4. 节点状态与活跃效果

### 4.1 `.mission-node-active` + `.mission-node-active-shell`（静态激活）

```css
.mission-node-active {
  background: linear-gradient(135deg, white 0%,
    color-mix(in srgb, var(--node-tint) 5%, white) 100%);
}

.mission-node-active-shell {
  border-color: var(--node-tint);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--node-tint) 28%, transparent),
    0 0 0 5px color-mix(in srgb, var(--node-tint) 8%,  transparent),
    0 10px 24px -12px color-mix(in srgb, var(--node-tint) 24%, transparent);
}
```

### 4.2 `.mission-node-flash-shell`（闪烁 / 扫描激活）

```css
.mission-node-flash-shell {
  border-color: color-mix(in srgb, var(--node-tint) 44%, rgba(191, 203, 221, 0.95));
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--node-tint) 28%, transparent),
    0 0 0 4px color-mix(in srgb, var(--node-tint) 14%, transparent),
    0 10px 24px rgba(15, 23, 42, 0.08),
    0 0 18px color-mix(in srgb, var(--node-tint) 12%, transparent);
  animation:
    node-border-sweep 1.25s linear infinite,
    node-ring-pulse   1.2s ease-in-out infinite;
}
```

### 4.3 `.mission-node-flash`（内部脉冲）

```css
.mission-node-flash {
  background:
    radial-gradient(circle at 82% 18%,
      color-mix(in srgb, var(--node-tint) 26%, white), transparent 34%),
    radial-gradient(circle at 18% 78%,
      color-mix(in srgb, var(--node-tint) 14%, white), transparent 30%),
    linear-gradient(180deg,
      color-mix(in srgb, var(--node-tint) 7%, white), rgba(248, 250, 252, 0.97));
  animation: node-inner-pulse 1.15s ease-in-out infinite;
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--node-tint) 28%, transparent),
    inset 0 0 22px  color-mix(in srgb, var(--node-tint) 16%, transparent);
}
```

### 4.4 `.mission-node-transitioning`（过渡消失）

```css
.mission-node-transitioning {
  opacity: 0.66;
  transform: translateY(4px) scale(0.992);
}
```

---

## 5. 特殊外观：Agent / Gateway / Pill / Phone / Robot

### 5.1 Agent Shell（智能体节点 — 紫蓝色调）

```css
.mission-node-agent-shell {
  border-color: rgba(129, 140, 248, 0.28);
  background: linear-gradient(180deg, rgba(251, 250, 255, 0.99), rgba(243, 248, 255, 0.98));
  box-shadow:
    0 0 0 1px rgba(129, 140, 248, 0.12),
    0 0 0 6px rgba(129, 140, 248, 0.08),
    0 14px 30px rgba(15, 23, 42, 0.08);
}

.mission-node-agent-shell .mission-node {
  background:
    radial-gradient(circle at 18% 24%, rgba(99, 102, 241, 0.14), transparent 28%),
    radial-gradient(circle at 78% 22%, rgba(34, 211, 238, 0.12), transparent 24%),
    radial-gradient(circle at 52% 86%, rgba(96, 165, 250, 0.11), transparent 26%),
    linear-gradient(180deg, rgba(251, 252, 255, 0.99), rgba(241, 248, 255, 0.95));
  box-shadow:
    inset 0 0 0 1px rgba(129, 140, 248, 0.12),
    0 0 0 1px rgba(129, 140, 248, 0.10),
    0 10px 22px rgba(15, 23, 42, 0.05),
    inset 0 0 20px rgba(99, 102, 241, 0.06);
}
```

### 5.2 Gateway Shell（固定 64px 高）

```css
.mission-node-gateway-shell {
  border-radius: 12px;
  height: 64px;
  box-sizing: border-box;
}

.mission-node-gateway-shell .mission-node {
  border-radius: 11px;
  padding: 12px 12px;
  height: calc(100% - 6px);
  display: flex;
  align-items: center;
  margin: 2px 1px 4px;
}
```

> Gateway 节点的顶/底 Handle 需要偏移：`{ top: '2px' }` / `{ bottom: '2px' }`，避免被圆角裁剪。

### 5.3 Pill Shell（药丸形）

```css
.mission-node-pill-shell {
  border-radius: 999px;
  overflow: visible;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.04);
}

.mission-node-pill-shell .mission-node {
  border-radius: 999px;
  padding: 8px 12px;
  width: 100%;
  min-width: 0;
}

.mission-node-pill-shell .mission-node-label {
  font-size: calc(0.64rem * var(--graph-font-scale, 1));
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 5.4 Phone / Robot Shell（玻璃态设备外壳）

```css
.mission-node-phone-shell,
.mission-node-robot-shell {
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  box-shadow:
    0 12px 28px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.46), rgba(248, 250, 252, 0.28)),
    linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(148, 163, 184, 0.08));
  backdrop-filter: blur(8px);
  overflow: visible;
}

.mission-node-phone-shell .mission-node,
.mission-node-robot-shell .mission-node {
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 22px;
  padding: 10px 10px 12px;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(241, 245, 249, 0.38));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -10px 24px rgba(226, 232, 240, 0.18);
  position: relative;
  z-index: 2;
}
```

---

## 6. 嵌入卡片、Chip、设备插图

### 6.1 `.mission-node-embedded-card`（节点内嵌卡片，展示 Agent Card 等）

```css
.mission-node-embedded-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  align-self: center;
  align-items: center;
  min-width: 0;
  height: 76px;
  padding: 9px 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(248, 250, 252, 0.62));
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
  position: relative;
  z-index: 3;
}

.mission-node-embedded-card-tall {
  height: 86px;
  padding-top: 11px;
  padding-bottom: 11px;
}

.mission-node-embedded-card-title {
  align-self: flex-start;
  font-size: calc(0.58rem * var(--graph-font-scale, 1));
  font-weight: 800;
  color: #0f172a;
}

.mission-node-embedded-card .mission-node-agent-card-chip {
  min-height: 17px;
  padding: 0 8px;
  font-size: calc(0.49rem * var(--graph-font-scale, 1));
  max-width: 100%;
}
```

### 6.2 设备插图（DeviceIllustration）

- **phone**：`<img src="/assets/phone.png" className="device-art device-art-phone" />`，宽 `120%`
- **robot**：`<img src="/assets/unitree-robotdog.png" className="device-art device-art-dog" />`，固定宽 `104px`
- **robot-arm**：内联 SVG，`viewBox="0 0 190 170"`，含渐变：

```xml
<linearGradient id="rover-body" x1="0" x2="1" y1="0" y2="1">
  <stop offset="0%"   stopColor="#f3f4f6"/>
  <stop offset="100%" stopColor="#9ca3af"/>
</linearGradient>
<linearGradient id="rover-accent" x1="0" x2="1" y1="0" y2="0">
  <stop offset="0%"   stopColor="#f59e0b"/>
  <stop offset="100%" stopColor="#f97316"/>
</linearGradient>
```

---

## 7. 消息气泡与计划 Plan

### 7.1 `.mission-node-bubble`（右上方悬浮气泡）

```css
.mission-node-bubble {
  position: absolute;
  top: -38px;
  right: -22px;
  max-width: 196px;
  padding: 9px 13px;
  border-radius: 16px 16px 5px 16px;       /* 三圆角 + 右下尖角 */
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--node-tint) 18%, transparent),
    0 12px 26px rgba(15, 23, 42, 0.1);
  color: #475569;
  font-size: calc(0.72rem * var(--graph-font-scale, 1));
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.01em;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  animation: bubble-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: bottom right;
}

/* 气泡底部小尾巴（45° 旋转小方块） */
.mission-node-bubble::after {
  content: "";
  position: absolute;
  right: 16px;
  bottom: -6px;
  width: 10px;
  height: 10px;
  background: rgba(255, 255, 255, 0.96);
  border-right:  1px solid rgba(148, 163, 184, 0.28);
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
  transform: rotate(45deg);
}
```

### 7.2 `.mission-node-plan`（更大的任务列表气泡，节点上方）

```css
.mission-node-plan {
  position: absolute;
  top: -120px;
  right: -10px;
  width: 180px;
  padding: 8px 10px 9px;
  border-radius: 16px 16px 4px 16px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.26);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--node-tint) 14%, transparent),
    0 14px 30px rgba(15, 23, 42, 0.12);
  z-index: 4;
  display: grid;
  gap: 8px;
  animation: bubble-in 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: bottom right;
}
```

### 7.3 `.mission-node-plan-item`（计划项：圆点 + 两行文字）

```css
.mission-node-plan-item {
  display: grid;
  grid-template-columns: 12px 1fr;
  gap: 6px;
  align-items: center;
  font-size: calc(0.56rem * var(--graph-font-scale, 1));
  color: #64748b;                 /* todo */
}

.mission-node-plan-item-processing { color: #0f172a; }
.mission-node-plan-item-done       { color: #334155; }

/* 小圆点 */
.mission-node-plan-check {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 900;
  color: white;
  background: rgba(148, 163, 184, 0.32);     /* todo 默认灰 */
}

.mission-node-plan-check-processing {
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--node-tint) 72%, white),
    color-mix(in srgb, var(--node-tint) 48%, #e2e8f0));
}

.mission-node-plan-item-done .mission-node-plan-check {
  background: linear-gradient(135deg, var(--node-tint),
    color-mix(in srgb, var(--node-tint) 62%, white));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--node-tint) 12%, transparent);
}

/* 阶段标签（TODO / DOING / DONE） */
.mission-node-plan-phase {
  font-size: calc(0.5rem * var(--graph-font-scale, 1));
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.mission-node-plan-item-processing .mission-node-plan-phase {
  color: color-mix(in srgb, var(--node-tint) 52%, #475569);
}

.mission-node-plan-item-done .mission-node-plan-phase {
  color: #475569;
}
```

---

## 8. Handle（连接点）

### 8.1 `.mission-handle` 基础样式

```css
.mission-handle {
  width: 5px;
  height: 5px;
  background: rgba(148, 163, 184, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.96);
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.12);
  opacity: 0.72 !important;
  transition: opacity 0.2s ease, background 0.2s ease;
  pointer-events: none;
  z-index: 10;
}

.mission-handle-n3 { border-color: var(--color-green); }  /* N3 数据面 */
.mission-handle-n6 { border-color: var(--color-amber); }  /* N6 数据面 */
.mission-handle-n9-in,
.mission-handle-n9-out { border-color: var(--color-blue); }  /* N9 */
```

### 8.2 Handle 位置 ID 列表

| ID | Position | 偏移 |
|----|---------|------|
| `in-top`, `out-top` | Top | 默认居中 |
| `in-bottom`, `out-bottom` | Bottom | 默认居中 |
| `in-left`, `out-left` | Left | 默认居中 |
| `in-right`, `out-right` | Right | 默认居中 |
| `in-left-top` | Left | `top: 38%` |
| `in-left-bottom` | Left | `top: 68%` |
| `in-top-left` | Top | `left: 38%` |
| `in-top-right` | Top | `left: 68%` |
| `out-top-left`, `out-top-right` | Top | 38% / 68% |
| `out-right-top`, `out-right-bottom` | Right | 38% / 68% |
| `out-bottom-left`, `out-bottom-right` | Bottom | 38% / 68% |

### 8.3 `.handle-label`（N3 / N6 / N9 等标签芯片）

```css
.handle-label {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: calc(0.5rem * var(--graph-font-scale, 1));
  font-weight: 800;
  color: #475569;
  background: rgba(255, 255, 255, 0.97);
  padding: 1px 5px;
  line-height: 1.2;
  border-radius: 7px;
  border: 1px solid rgba(203, 213, 225, 0.98);
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.05);
  white-space: nowrap;
  pointer-events: none;
  z-index: 12;
}
```

---

## 9. 区域节点 Region / 总线节点 Bus

### 9.1 `.region-node`（默认 / domain — 蓝色网格底）

```css
.region-node {
  border-radius: 28px;
  border: 1px solid rgba(59, 130, 246, 0.22);
  background:
    linear-gradient(rgba(59, 130, 246, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.045) 1px, transparent 1px),
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 42%),
    linear-gradient(180deg, rgba(246, 250, 255, 0.94), rgba(235, 244, 252, 0.78));
  background-size: 18px 18px, 18px 18px, auto, auto;
  padding: 18px 22px;
  color: #1e3a8a;
  font-size: calc(0.74rem * var(--graph-font-scale, 1));
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}
```

### 9.2 `.region-node-subdomain`（嵌套子域 — 灰色）

```css
.region-node-subdomain {
  border-radius: 24px;
  border-color: rgba(148, 163, 184, 0.22);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(246, 249, 252, 0.4));
  padding: 13px 16px;
  color: #475569;
  font-size: calc(0.57rem * var(--graph-font-scale, 1));
  font-weight: 800;
  letter-spacing: 0.13em;
}
```

### 9.3 `.region-node-family`（家庭域 — 青绿色点阵）

```css
.region-node-family {
  border-color: rgba(20, 184, 166, 0.32);
  background:
    radial-gradient(circle at 1px 1px, rgba(15, 118, 110, 0.1) 1px, transparent 1.2px),
    radial-gradient(circle at top left, rgba(45, 212, 191, 0.16), transparent 50%),
    linear-gradient(180deg, rgba(240, 253, 250, 0.92), rgba(236, 253, 245, 0.72));
  color: #115e59;
  font-size: calc(0.56rem * var(--graph-font-scale, 1));
}
```

### 9.4 `.region-node-external`（外部 / OTT — 橙色网格）

```css
.region-node-external {
  border-color: rgba(249, 115, 22, 0.20);
  background:
    linear-gradient(rgba(249, 115, 22, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(249, 115, 22, 0.045) 1px, transparent 1px),
    radial-gradient(circle at top left, rgba(251, 146, 60, 0.1), transparent 46%),
    linear-gradient(180deg, rgba(255, 251, 245, 0.94), rgba(255, 244, 235, 0.8));
  color: #9a3412;
}
```

### 9.5 总线节点 `.bus-node-shell`（AgentBus / MCP Tool Bus 等长条）

```css
.bus-node-shell {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bus-backbone {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 252, 0.96));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.7),
    0 0 0 1px rgba(148, 163, 184, 0.16),
    0 0 10px rgba(96, 165, 250, 0.05),
    0 0 14px rgba(129, 140, 248, 0.04),
    0 4px 10px rgba(15, 23, 42, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.bus-node-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: transparent;
  color: #0f172a;
  font-size: calc(0.58rem * var(--graph-font-scale, 1));
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.bus-node-caption {
  font-size: calc(0.5rem * var(--graph-font-scale, 1));
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  opacity: 0.56;
}
```

---

## 10. MissionEdge 连接线完整规范

### 10.1 数据接口

```ts
interface DemoEdgeData {
  kind?: 'baseline' | 'bus' | 'logic' | 'wireless';
  state?: 'idle' | 'active' | 'selected';
  plane?: 'control' | 'data';
  note?: string;             // 'control' 也会强制视作控制面
  tone?: string;             // 外部强制色
  animationDirection?: 'forward' | 'reverse';
  transitioning?: boolean;
}
```

### 10.2 贝塞尔曲率

```ts
const [path] = getBezierPath({
  ...props,
  curvature:
    kind === 'wireless' ? 0.2 :
    kind === 'bus'      ? 0.2 :
                          0.16,
});
```

### 10.3 状态判定

```ts
const isSelected        = state === 'selected';
const isActive          = state === 'active' || isSelected;
const isControlPlane    = plane === 'control' || kind === 'logic' || note === 'control';
const isDataPlane       = plane === 'data' || DATA_PLANE_EDGE_IDS.has(id);
const isWirelessDataPlane = kind === 'wireless' && isDataPlane;
```

### 10.4 颜色规则

```ts
// 活跃色
const activeColor = tone ?? (
  kind === 'bus'        ? '#38bdf8'    // 浅天蓝
  : isControlPlane      ? '#7c3aed'    // 控制面紫
  : isDataPlane         ? '#f59e0b'    // 数据面琥珀
  : kind === 'wireless' ? '#0284c7'    // 无线蓝
                        : '#10b981'    // 默认基线绿
);

// 空闲色
const color = state === 'idle'
  ? (kind === 'bus'      ? '#bfd6e6'   // 淡灰蓝
    : kind === 'wireless' ? '#c7e8fb'  // 极淡蓝
    :                       '#c3cedb') // 灰
  : activeColor;
```

### 10.5 线宽（strokeWidth）

| 状态 | Wireless Data | Data Plane | Control Plane | Bus | 默认 |
|------|---|---|---|---|---|
| Selected | 3.4 | 5.2 | 2.7 | 3.05 | 3.05 |
| Active | 2.8 | 4.7 | 2.25 | 1.8 | 1.9 |
| Idle (wireless) | 1.8 | — | — | — | — |
| Idle | — | 4.1 | 1.55 | 1.45 | 1.35 |

### 10.6 虚线 strokeDasharray

```ts
const dash =
  isActive && isWirelessDataPlane ? '7 12'
  : kind === 'wireless'            ? '3 4'
  : isActive && isControlPlane     ? '6 7'
  : isActive && isDataPlane        ? '14 10'
  : isActive                        ? '11 8'
  :                                   undefined;
```

### 10.7 不透明度

```ts
const opacity =
  isSelected ? 1
  : isActive ? (isWirelessDataPlane ? 0.9
              : isDataPlane         ? 0.96
              : isControlPlane      ? 0.92
                                    : 0.88)
  : kind === 'wireless' ? 0.4
                        : 0.32;
```

### 10.8 动画类名映射

```ts
const animationClass = isActive
  ? isControlPlane
      ? (animationDirection === 'reverse' ? 'edge-control-animated-reverse' : 'edge-control-animated-forward')
  : isWirelessDataPlane
      ? (animationDirection === 'reverse' ? 'edge-wireless-data-animated-reverse' : 'edge-wireless-data-animated-forward')
  : isDataPlane
      ? (animationDirection === 'reverse' ? 'edge-data-animated-reverse' : 'edge-data-animated-forward')
  :     (animationDirection === 'reverse' ? 'edge-animated-reverse' : 'edge-animated-forward')
  : '';
```

### 10.9 边缘动画 CSS（完整 keyframes）

```css
/* Baseline */
@keyframes dash-forward  { from { stroke-dashoffset: 38; } to { stroke-dashoffset: 0;  } }
@keyframes dash-reverse  { from { stroke-dashoffset: 0;  } to { stroke-dashoffset: 38; } }
.edge-animated-forward   { animation: dash-forward 0.72s linear infinite; }
.edge-animated-reverse   { animation: dash-reverse 0.72s linear infinite; }

/* Control Plane */
@keyframes control-forward { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0;  } }
@keyframes control-reverse { from { stroke-dashoffset: 0;  } to { stroke-dashoffset: 24; } }
.edge-control-animated-forward { animation: control-forward 0.55s linear infinite; }
.edge-control-animated-reverse { animation: control-reverse 0.55s linear infinite; }

/* Data Plane */
@keyframes data-forward { from { stroke-dashoffset: 52; } to { stroke-dashoffset: 0;  } }
@keyframes data-reverse { from { stroke-dashoffset: 0;  } to { stroke-dashoffset: 52; } }
.edge-data-animated-forward { animation: data-forward 0.95s linear infinite; }
.edge-data-animated-reverse { animation: data-reverse 0.95s linear infinite; }

/* Wireless Data Plane */
@keyframes wireless-data-forward { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0;  } }
@keyframes wireless-data-reverse { from { stroke-dashoffset: 0;  } to { stroke-dashoffset: 24; } }
.edge-wireless-data-animated-forward { animation: wireless-data-forward 1.2s linear infinite; }
.edge-wireless-data-animated-reverse { animation: wireless-data-reverse 1.2s linear infinite; }
```

### 10.10 边缘标签 `.edge-note`

```css
.edge-note {
  display: inline-block;
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
  color: #64748b;
  font-size: calc(0.5rem * var(--graph-font-scale, 1));
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
}
```

### 10.11 MissionEdge JSX 模板

```jsx
function MissionEdge(props) {
  const { kind = 'baseline', state = 'idle', note, tone, animationDirection, plane } = props.data || {};
  const [path, labelX, labelY] = getBezierPath({
    ...props,
    curvature: kind === 'wireless' ? 0.2 : kind === 'bus' ? 0.2 : 0.16,
  });
  /* 计算 isActive / isControlPlane / isDataPlane / color / strokeWidth / dash / opacity / animationClass，如上所述 */

  return (
    <>
      <path
        id={props.id}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
        strokeLinecap="round"
        opacity={opacity}
        className={animationClass}
        markerEnd={props.markerEnd}
      />
      {note && note !== 'control' && (
        <foreignObject x={labelX - 40} y={labelY - 10} width={80} height={20}>
          <div className="edge-note">{note}</div>
        </foreignObject>
      )}
    </>
  );
}
```

---

## 11. 全部动画关键帧（Keyframes）

### 11.1 节点相关

```css
/* 边框扫描（依赖 background-position 在渐变上滑动） */
@keyframes node-border-sweep {
  from { background-position:   0% 50%; }
  to   { background-position: 180% 50%; }
}

/* 光环脉冲 */
@keyframes node-ring-pulse {
  0%, 100% { opacity: 0.78; }
  50%      { opacity: 1;    }
}

/* 光晕呼吸（更柔） */
@keyframes node-halo-pulse {
  0%, 100% { opacity: 0.46; transform: scale(0.995); }
  50%      { opacity: 0.78; transform: scale(1.02);  }
}

/* 内部脉冲（内阴影强度变化） */
@keyframes node-inner-pulse {
  0%, 100% {
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--node-tint) 16%, transparent),
      inset 0 0 16px  color-mix(in srgb, var(--node-tint)  9%, transparent);
  }
  50% {
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--node-tint) 26%, transparent),
      inset 0 0 24px  color-mix(in srgb, var(--node-tint) 16%, transparent);
  }
}

/* 处理中指示器旋转 */
@keyframes spin {
  from { transform: rotate(0deg);   }
  to   { transform: rotate(360deg); }
}
```

### 11.2 气泡相关

```css
@keyframes bubble-in {
  from { opacity: 0; transform: translateY(6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1);    }
}
/* 180ms cubic-bezier(0.2, 0.8, 0.2, 1); transform-origin: bottom right; */

@keyframes bubble-out {
  from { opacity: 1; transform: translateY(0)   scale(1);    }
  to   { opacity: 0; transform: translateY(5px) scale(0.975); }
}
/* 220ms cubic-bezier(0.4, 0, 0.2, 1) forwards; */

/* 侧边气泡变体 */
@keyframes bubble-in-side {
  from { opacity: 0; transform: translateY(-50%) translateX(-8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(-50%) translateX(0)     scale(1);    }
}

@keyframes bubble-out-side {
  from { opacity: 1; transform: translateY(-50%) translateX(0)     scale(1);    }
  to   { opacity: 0; transform: translateY(-50%) translateX(-8px) scale(0.975); }
}
```

### 11.3 边缘动画（重述，便于集中参考）

见 [10.9](#109-边缘动画-css完整-keyframes)。

### 11.4 通用缓动常量

| 场景 | 缓动 | 持续 |
|------|------|------|
| 气泡出入 | `cubic-bezier(0.2, 0.8, 0.2, 1)` | 180-220ms |
| 画布标题 | `cubic-bezier(0.16, 0.84, 0.26, 1)` | 260ms |
| 节点脉冲 | `ease-in-out` | 1.15-1.2s |
| 节点扫描 | `linear` | 1.25s |
| 边动画 | `linear` | 0.55-1.2s |

---

## 12. 背景 Background 与 Viewport

### 12.1 ReactFlow `<Background>`（点阵）

```jsx
<Background gap={40} size={1} color="#f1f5f9" />
```

- 点距：40px
- 点大小：1px
- 点颜色：`#f1f5f9`（近白的浅灰）

### 12.2 默认视口

```ts
const DEFAULT_VIEWPORT = { x: -22, y: 42, zoom: 1.24 };
const MIN_GRAPH_ZOOM = 0.5;
const MAX_GRAPH_ZOOM = 2;
```

### 12.3 画布底色

画布容器（`.canvas-area`）背景为纯白 `#ffffff`，Background 点阵叠加其上。

---

## 13. Legend 图例

位于画布左下角，展示控制面 / 数据面两条药丸：

```html
<div class="canvas-legend">
  <span class="canvas-legend-pill canvas-legend-pill-control">Control Signaling</span>
  <span class="canvas-legend-pill canvas-legend-pill-data">Data Plane</span>
</div>
```

```css
.canvas-legend {
  position: absolute;
  left: 20px;
  bottom: 18px;
  display: inline-flex;
  gap: 8px;
  z-index: 6;
  pointer-events: none;
}

.canvas-legend-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(203, 213, 225, 0.92);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  color: #334155;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.canvas-legend-pill::before {
  content: "";
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.canvas-legend-pill-control::before {
  background: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
}

.canvas-legend-pill-data::before {
  background: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.14);
}
```

---

## 14. 布局坐标 LAYOUT

静态坐标方案（非自动布局算法），通过 `LAYOUT` 常量集中定义所有区域与节点的 x/y/w/h：

```ts
const LAYOUT = {
  // 区域
  ott:    { x: 980, y:  84, width: 330, height: 212 },
  mno:    { x: 980, y: 356, width: 424, height: 296 },
  core:   { x:  36, y: 108, width: 860, height: 348 },
  access: { x:  36, y: 492, width: 760, height: 232 },
  bus:    { x: 212, y: 236, width: 508, height:  24 },

  // 节点
  nodes: {
    idm:            { x: 218,  y: 140, width: 136 },
    acnAgent:       { x: 558,  y: 140, width: 176 },
    srf:            { x: 150,  y: 308, width: 128 },
    scf:            { x: 322,  y: 308, width: 128 },
    up:             { x: 482,  y: 308, width: 128 },
    cmccGw:         { x: 649,  y: 308, width: 168 },
    ran:            { x: 202,  y: 572, width: 128 },
    phone:          { x: 392,  y: 520, width: 296, height: 136 },
    robotDog:       { x: 392,  y: 678, width: 344, collapsedWidth: 156, height: 112 },
    phoneAgentCard: { x: 578,  y: 532, width: 174 },
    agentCard:      { x: 578,  y: 592, width: 220 },
    ottOrdering:    { x: 1142, y: 112, width: 148 },
    ottGw:          { x: 1000, y: 216, width: 168 },
    mnoGw:          { x: 1000, y: 404, width: 168 },
    mnoEndpoint:    { x: 1068, y: 500, width: 304, height: 132 },
    armAgentCard:   { x: 1102, y: 632, width: 174 },
  },
};
```

### 14.1 布局逻辑

- **Core 域**（电信核心网）：左侧 x=36, 宽 860
- **Access 域**（无线接入）：Core 下方
- **OTT 域**（外部平台）：右上角
- **MNO 域**（移动运营商）：OTT 下方
- **AgentBus**：跨越 Core 顶部的长条，y=236

---

## 15. 节点 / 边数据示例

### 15.1 节点示例（IDM）

```ts
{
  id: 'idm',
  type: 'mission',
  hidden: !visibleSet.has('idm'),
  position: { x: LAYOUT.nodes.idm.x, y: LAYOUT.nodes.idm.y },
  style:    { width: LAYOUT.nodes.idm.width },
  data: {
    nodeId: 'idm',
    label: 'Identity',
    kind:  'idm',
    role:  'Identity Management',
    active:         activeNodeSet.has('idm'),
    flashActive:    flashFor('idm'),
    transitioning:  transitioningNodeSet.has('idm'),
    context:        activeNodeSet.has('idm'),
    handles:        ['in-bottom', 'out-bottom'],
    processing:     playback.phase === 'running' && activeNodeSet.has('idm'),
    message:        bubbleFor('idm'),
    messageIcon:    bubbleIconFor('idm'),
    messageState:   bubbleStateFor('idm'),
    messageLeaving: bubbleLeavingFor('idm'),
  },
}
```

### 15.2 边示例 — Bus（总线挂载）

```ts
{
  id: 'e-idm-bus',
  source: 'bus-line',
  sourceHandle: 'abi-top',
  target: 'idm',
  targetHandle: 'in-bottom',
  type: 'mission',
  hidden: !visibleSet.has('idm') || !visibleSet.has('bus-line'),
  data: {
    kind: 'bus',
    state: activeEdgeSet.has('e-idm-bus') ? 'selected' : 'idle',
    transitioning: transitioningEdgeSet.has('e-idm-bus'),
  },
}
```

### 15.3 边示例 — Wireless（无线，可切换 control/data）

```ts
{
  id: 'e-ran-phone',
  source: 'phone',
  sourceHandle: 'out-left',
  target: 'ran',
  targetHandle: 'in-right',
  type: 'mission',
  hidden: !visibleSet.has('ran') || !visibleSet.has('phone'),
  data: {
    kind: 'wireless',
    state: activeEdgeSet.has('e-ran-phone') ? 'selected' : 'idle',
    transitioning: transitioningEdgeSet.has('e-ran-phone'),
    plane: phoneRanPlane,     // 'control' | 'data'
  },
}
```

### 15.4 边示例 — Logic（控制面强制）

```ts
{
  id: 'e-srf-ran',
  source: 'ran',
  sourceHandle: 'out-top-left',
  target: 'srf',
  targetHandle: 'in-bottom',
  type: 'mission',
  hidden: !visibleSet.has('srf') || !visibleSet.has('ran'),
  data: {
    kind: 'logic',
    state: activeEdgeSet.has('e-srf-ran') ? 'selected' : 'idle',
    note: 'control',
    transitioning: transitioningEdgeSet.has('e-srf-ran'),
  },
}
```

---

## 16. 关键尺寸速查表

| 组件 | 属性 | 值 |
|------|------|-----|
| 节点 Shell | border-radius | 12px |
| 节点 Shell | padding | 1px |
| 节点 inner | border-radius | 11px |
| 节点 inner | padding | 12px 12px |
| 节点 inner | min-width | 118px |
| 节点 icon | width × height | 26×26 |
| 节点 icon | border-radius | 7px |
| 节点 icon（Lucide size） | — | 16 |
| 节点 label | font-size | 0.78rem × scale |
| 节点 role | font-size | 0.6rem × scale |
| 气泡 | border-radius | 16px 16px 5px 16px |
| 气泡 | padding | 9px 13px |
| 气泡 | max-width | 196px |
| 气泡箭头 | 10×10 rotate 45° | — |
| Plan | width | 180px |
| Plan | padding | 8px 10px 9px |
| Plan | top offset | -120px |
| Plan item | 圆点 | 12×12 |
| Handle | width × height | 5×5 |
| Gateway 节点 | height | 64px |
| Pill 节点 | padding | 8px 12px |
| Phone / Robot | border-radius | 24px (inner 22px) |
| 嵌入卡片 | height | 76px（tall 86px） |
| 区域节点 domain | border-radius | 28px |
| 区域节点 subdomain | border-radius | 24px |
| Background gap/size | — | 40 / 1 |
| Viewport zoom | — | 0.5 – 2（默认 1.24） |

---

## 17. 完整颜色速查表

### 17.1 节点

| 场景 | 颜色 |
|------|------|
| 节点渐变顶 | `rgba(255, 255, 255, 0.99)` |
| 节点渐变底 | `rgba(247, 250, 252, 0.98)` |
| 节点边框（idle） | `rgba(191, 203, 221, 0.95)` |
| 节点阴影（idle） | `0 12px 24px rgba(15, 23, 42, 0.07)` |
| 节点文字 | `#1e293b`（label）/ `#66768e`（role） |
| Agent Shell 边框 | `rgba(129, 140, 248, 0.28)` |
| Phone/Robot Shell 边框 | `rgba(255, 255, 255, 0.40)` |

### 17.2 边缘

| 类型 | 活跃色 | 空闲色 |
|------|--------|--------|
| Control | `#7c3aed` 紫 | `#c3cedb` 灰 |
| Data | `#f59e0b` 琥珀 | `#c3cedb` 灰 |
| Wireless | `#0284c7` 深蓝 | `#c7e8fb` 极淡蓝 |
| Bus | `#38bdf8` 浅天蓝 | `#bfd6e6` 淡灰蓝 |
| Baseline（默认） | `#10b981` 绿 | `#c3cedb` 灰 |

### 17.3 区域

| 区域 | 主色 | 文字 |
|------|------|------|
| domain（蓝） | `rgba(59, 130, 246, 0.22)` | `#1e3a8a` |
| subdomain（灰） | `rgba(148, 163, 184, 0.22)` | `#475569` |
| family（青绿） | `rgba(20, 184, 166, 0.32)` | `#115e59` |
| external（橙） | `rgba(249, 115, 22, 0.20)` | `#9a3412` |

### 17.4 图例

| 项 | 颜色 |
|------|------|
| Control dot | `#7c3aed` + 光晕 `rgba(124, 58, 237, 0.12)` |
| Data dot | `#f59e0b` + 光晕 `rgba(245, 158, 11, 0.14)` |

---

## 复现要点（Cheat Sheet）

1. **整体风格**：浅色玻璃态 + 半透明白节点 + 精细 tint 渗透
2. **节点 tint 机制**：通过 `--node-tint` CSS 变量 + `color-mix()` 函数实现 kind 差异化染色
3. **边缘语义颜色严格一致**：紫=控制 / 琥珀=数据 / 蓝=无线 / 青=总线 / 绿=基线
4. **动画节拍**：
   - 边动画：`linear`，0.55s（控制，最快）→ 1.2s（无线，最慢）
   - 节点脉冲：`ease-in-out` 1.15-1.25s
   - 气泡进出：`cubic-bezier(0.2, 0.8, 0.2, 1)` 180-220ms
5. **虚线模式承载语义**：控制 `6 7`（密）、数据 `14 10`（疏长）、无线 `7 12`（稀疏）、基线 `11 8`
6. **Bezier 曲率**：无线/总线 0.2，其他 0.16（略直）
7. **Handle 尺寸极小**（5×5），透明度 0.72，靠 CSS 伪装为连接点而非交互按钮
8. **Plan / Bubble 都有小尖角**（右下 5px 小圆角 + 45° 旋转方块箭头）
9. **Region 背景**：双层 1px 网格线（18×18px）+ 径向渐变柔光
10. **背景点阵**：40px 间距、1px、`#f1f5f9`，几乎无感但增加空间感

---

**源文件位置**
- 节点/边 React 组件：`src/App.tsx`（MissionNode / MissionEdge / RegionNode / BusNode）
- 样式与动画：`src/index.css`（L1248-2800 节点相关 / L1588-1658 边动画）
- kindMeta：`src/App.tsx:2339`
- LAYOUT：`src/App.tsx:3948`

**生成时间**：2026-04-13
