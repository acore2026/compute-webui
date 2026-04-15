# Center Canvas Animation — UI Reproduction Spec

> 目标：为其他 AI 提供**中心画布动画**中所有 UI 元素的完整、可复现的规范。包含气泡（bubble）、气泡内清单（plan checklist）、节点（node）、连线（edge）、设备外壳（phone / robot / arm）、画布标题卡（caption card）、背景、以及全部关键动画关键帧、颜色、时序。所有数值来自源码：
>
> - 逻辑：`src/App.tsx`（`MissionNode`, `MissionEdge`, `BubbleIconGlyph`, `kindMeta`）
> - 样式：`src/index.css`
> - 参考：`FLOW_DIAGRAM_SPEC.md`, `UI_INVENTORY.md`

---

## 目录

1. 总体视觉层级 / Z 轴
2. 画布标题卡 Canvas Caption Card
3. 画布背景 Canvas Background
4. 节点基础 Mission Node（形状、阴影、tint 色）
5. 节点激活/闪烁状态（active / flash / transitioning）
6. 特殊节点外壳（Agent / Gateway / Pill / Phone / Robot）
7. 设备插画（Phone PNG / Robot Dog PNG / Robot Arm SVG）
8. 节点徽章与卡片（online dot、detail chip、embedded card）
9. 区域节点与总线节点（Region / Family / External / Bus）
10. 连线 Mission Edge（颜色、虚线、粗细、方向动画）
11. 消息气泡 Bubble（结构、图标、尾巴、方位变体）
12. 气泡内清单 Plan Checklist（结构、三态勾选圈、右侧变体）
13. 图例 Legend
14. 全局关键帧 Keyframes
15. 颜色 / CSS 变量 / 字号缩放
16. 动画时序一览表
17. 复现要点总结

---

## 1. 总体视觉层级 / Z 轴

| 元素 | z-index | 说明 |
|---|---|---|
| 画布背景点阵 | 0 | React Flow `<Background>` |
| 连线 SVG | 1 | MissionEdge |
| 节点 shell | 2 | mission-node-shell |
| 消息气泡 | 3 | mission-node-bubble |
| Plan 清单气泡 | 4 | mission-node-plan |
| 图例 legend | 6 | canvas-legend |
| 画布标题卡 | 6 | canvas-caption-card |

视口默认：`{ x: -22, y: 42, zoom: 1.24 }`，zoom 范围 `0.5 – 2.0`。

---

## 2. 画布标题卡 Canvas Caption Card

主要动画元素，屏幕顶部居中悬浮。

```css
.canvas-caption-card {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  width: min(calc(520px * var(--caption-card-scale, 1)), calc(100% - 220px));
  padding: calc(20px * S) calc(26px * S) calc(22px * S);  /* S = --caption-card-scale */
  border-radius: calc(26px * S);
  background:
    radial-gradient(circle at 14% -4%, rgba(56,189,248,0.36), transparent 32%),
    radial-gradient(circle at 84% 8%,  rgba(99,102,241,0.18), transparent 30%),
    radial-gradient(circle at 50% 120%,rgba(34,211,238,0.14), transparent 44%),
    linear-gradient(180deg, rgba(243,250,255,0.97), rgba(226,244,255,0.9));
  border: 1px solid rgba(125, 211, 252, 0.44);
  box-shadow:
    0 24px 54px rgba(15,23,42,0.16),
    0 0 0 1px rgba(255,255,255,0.92),
    0 0 28px rgba(14,165,233,0.18),
    0 0 78px rgba(34,211,238,0.11);
  backdrop-filter: blur(10px);
  isolation: isolate;
  overflow: hidden;
  animation:
    canvas-caption-in 260ms cubic-bezier(0.16, 0.84, 0.26, 1),
    canvas-caption-aura-breathe 4.2s ease-in-out infinite;
  transform-origin: top center;
  cursor: grab;
  user-select: none;
}
```

**内容结构**：

```jsx
<div class="canvas-caption-card">
  <div class="canvas-caption-content">
    <span class="canvas-caption-kicker">SCENARIO</span>
    <h1 class="canvas-caption-title canvas-caption-title-zh">中文标题</h1>
  </div>
</div>
```

**排版**：
- `.canvas-caption-kicker`：0.72rem × `--caption-font-scale`，weight 900，`letter-spacing: 0.2em`，uppercase，颜色 `#0369a1`，pill 背景 `linear-gradient(180deg, rgba(56,189,248,0.18), rgba(255,255,255,0.4))`，`box-shadow: inset 0 0 0 1px rgba(125,211,252,0.32), 0 0 20px rgba(14,165,233,0.16)`。
- `.canvas-caption-title`：`2.5rem × --caption-font-scale`，weight 900，line-height 0.92，`letter-spacing: -0.055em`（中文版 `0.02em`），`color: #0b2540`，`text-shadow: 0 1px 0 rgba(255,255,255,0.96), 0 0 10px rgba(125,211,252,0.14)`。

**关键帧**：

```css
@keyframes canvas-caption-in {
  from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.93); }
  68%  { opacity: 1; transform: translateX(-50%) translateY(-3px) scale(1.015); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}

@keyframes canvas-caption-aura-breathe {
  0%, 100% {
    box-shadow:
      0 24px 54px rgba(15,23,42,0.16),
      0 0 0 1px rgba(255,255,255,0.92),
      0 0 24px rgba(14,165,233,0.14),
      0 0 64px rgba(34,211,238,0.09),
      0 0 92px rgba(99,102,241,0.06);
  }
  50% {
    box-shadow:
      0 30px 64px rgba(15,23,42,0.18),
      0 0 0 1px rgba(255,255,255,0.95),
      0 0 34px rgba(14,165,233,0.22),
      0 0 84px rgba(34,211,238,0.14),
      0 0 122px rgba(99,102,241,0.1);
  }
}
```

---

## 3. 画布背景 Canvas Background

```css
.canvas-area {
  position: relative;
  background: #ffffff;
  overflow: hidden;
}
```

React Flow `<Background>`：
- 类型：点阵 dots
- Gap：`40px`
- Dot size：`1px`
- Dot color：`#f1f5f9`（极浅灰）

---

## 4. 节点基础 Mission Node

### 4.1 外壳 `.mission-node-shell`

```css
.mission-node-shell {
  border-radius: 12px;
  padding: 1px;
  background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(247,250,252,0.98));
  border: 1px solid rgba(191,203,221,0.95);
  box-shadow:
    0 12px 24px rgba(15,23,42,0.07),
    0 0 0 1px rgba(255,255,255,0.92);
  transition: border-color 220ms ease, box-shadow 220ms ease, opacity 220ms ease, filter 220ms ease;
}
```

### 4.2 内容 `.mission-node`

```css
.mission-node {
  min-width: 118px;
  border-radius: 11px;
  padding: 12px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--node-tint) 8%, transparent), transparent 44%),
    linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92));
}
```

### 4.3 节点图标 `.mission-node-icon`

```css
.mission-node-icon {
  width: 26px; height: 26px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--node-tint) 10%, white);
  color: var(--node-tint);
  display: grid;
  place-items: center;
}
/* Lucide icon size={16} */
```

### 4.4 文本排版

- `.mission-node-label`：`font-size: calc(0.78rem * var(--graph-font-scale))`，weight 800，color `#1e293b`，line-height 1.05
- `.mission-node-role`：`calc(0.6rem * var(--graph-font-scale))`，weight 600，color `#66768e`，max-width 160px

### 4.5 节点类型与 tint 色映射（`kindMeta`）

| kind | Lucide 图标 | tint 色名 | Hex |
|---|---|---|---|
| endpoint | Smartphone | node-blue | `#3b82f6` |
| access | Radio | node-green | `#10b981` |
| upf | Router | node-cyan | `#06b6d4` |
| router | Repeat | node-amber | `#f59e0b` |
| service | Cpu | node-pink | `#ec4899` |
| idm | UserCheck | indigo | `#6366f1` |
| agent | BrainCircuit | purple | `#8b5cf6` |
| srf | Settings | pink | `#ec4899` |
| scf | Settings | rose | `#f43f5e` |
| up | Database | cyan | `#06b6d4` |
| gw | Waypoints | amber | `#f59e0b` |
| robot | Bot | teal | `#0f766e` |
| arm | Wrench | orange | `#f97316` |
| card | UserCheck | teal | `#0f766e` |

每个节点通过内联样式注入 `--node-tint`，所有气泡、图标、光晕全部用 `color-mix(in srgb, var(--node-tint) N%, ...)` 动态派生。

---

## 5. 节点激活 / 闪烁 / 过渡状态

### 5.1 `.mission-node-active-shell`（选中/当前步骤）

```css
.mission-node-active-shell {
  border-color: var(--node-tint);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--node-tint) 28%, transparent),
    0 0 0 5px color-mix(in srgb, var(--node-tint) 8%, transparent),
    0 10px 24px -12px color-mix(in srgb, var(--node-tint) 24%, transparent);
}
.mission-node-active {
  background: linear-gradient(135deg, white, color-mix(in srgb, var(--node-tint) 5%, white));
}
```

### 5.2 `.mission-node-flash-shell`（处理中，强光扫边）

```css
.mission-node-flash-shell {
  border-color: color-mix(in srgb, var(--node-tint) 44%, rgba(191,203,221,0.95));
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--node-tint) 28%, transparent),
    0 0 0 4px color-mix(in srgb, var(--node-tint) 14%, transparent),
    0 10px 24px rgba(15,23,42,0.08),
    0 0 18px color-mix(in srgb, var(--node-tint) 12%, transparent);
}
/* ::before — 扫描式渐变描边 */
.mission-node-flash-shell::before {
  background: linear-gradient(120deg,
    transparent 10%,
    color-mix(in srgb, var(--node-tint) 20%, transparent) 24%,
    color-mix(in srgb, var(--node-tint) 82%, transparent) 42%,
    color-mix(in srgb, var(--node-tint) 24%, transparent) 58%,
    color-mix(in srgb, var(--node-tint) 92%, transparent) 72%,
    color-mix(in srgb, var(--node-tint) 18%, transparent) 86%,
    color-mix(in srgb, var(--node-tint) 76%, transparent) 100%);
  background-size: 210% 210%;
  animation: node-border-sweep 1.25s linear infinite, node-ring-pulse 1.2s ease-in-out infinite;
}
/* ::after — 外层 halo 光晕 */
.mission-node-flash-shell::after {
  inset: -6px;
  border-radius: 16px;
  background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--node-tint) 22%, white), transparent 70%);
  filter: blur(8px);
  opacity: 0.72;
  animation: node-halo-pulse 1.2s ease-in-out infinite;
}
```

### 5.3 `.mission-node-flash`（内部脉动）

```css
.mission-node-flash {
  background:
    radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--node-tint) 26%, white), transparent 34%),
    radial-gradient(circle at 18% 78%, color-mix(in srgb, var(--node-tint) 14%, white), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, var(--node-tint) 7%, white), rgba(248,250,252,0.97));
  animation: node-inner-pulse 1.15s ease-in-out infinite;
}
```

### 5.4 `.mission-node-transitioning-shell`（淡出过渡）

```css
.mission-node-transitioning-shell { opacity: 0.62; }
.mission-node-transitioning {
  opacity: 0.66;
  transform: translateY(4px) scale(0.992);
}
```

---

## 6. 特殊节点外壳变体

### 6.1 Agent Shell（ACN Agent / Ordering Agent）

```css
.mission-node-agent-shell {
  border-color: rgba(129,140,248,0.28);
  background: linear-gradient(180deg, rgba(251,250,255,0.99), rgba(243,248,255,0.98));
  box-shadow:
    0 0 0 1px rgba(129,140,248,0.12),
    0 0 0 6px rgba(129,140,248,0.08),
    0 14px 30px rgba(15,23,42,0.08);
}
.mission-node-agent-shell .mission-node {
  background:
    radial-gradient(circle at 18% 24%, rgba(99,102,241,0.14), transparent 28%),
    radial-gradient(circle at 78% 22%, rgba(34,211,238,0.12), transparent 24%),
    radial-gradient(circle at 52% 86%, rgba(96,165,250,0.11), transparent 26%),
    linear-gradient(180deg, rgba(251,252,255,0.99), rgba(241,248,255,0.95));
  box-shadow:
    inset 0 0 0 1px rgba(129,140,248,0.12),
    0 0 0 1px rgba(129,140,248,0.10),
    0 10px 22px rgba(15,23,42,0.05),
    inset 0 0 20px rgba(99,102,241,0.06);
}
```

ACN Agent 节点 (`data.nodeId === 'acn-agent'`) 额外获得 `.mission-node-acn-agent-shell` 类，用于触发右侧 plan 气泡定位（见 §12）。

Ordering Agent 节点获 `.mission-node-ordering-shell`，气泡和 plan 的 `top` 分别调整为 `-36px` 和 `-102px`。

### 6.2 Gateway Shell

```css
.mission-node-gateway-shell { border-radius: 12px; height: 64px; }
.mission-node-gateway-shell .mission-node {
  border-radius: 11px;
  height: calc(100% - 6px);
  padding: 12px;
  display: flex;
  align-items: center;
  margin: 2px 1px 4px;
}
```

### 6.3 Pill Shell（胶囊形）

```css
.mission-node-pill-shell {
  border-radius: 999px;
  overflow: visible;
  box-shadow: 0 6px 14px rgba(15,23,42,0.04);
}
.mission-node-pill-shell .mission-node {
  border-radius: 999px;
  padding: 8px 12px;
}
.mission-node-pill-shell .mission-node-label {
  font-size: calc(0.64rem * var(--graph-font-scale));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 6.4 Phone Shell / Robot Shell（玻璃质感外壳）

```css
.mission-node-phone-shell,
.mission-node-robot-shell {
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 24px;
  backdrop-filter: blur(8px);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.46), rgba(248,250,252,0.28)),
    linear-gradient(135deg, rgba(255,255,255,0.18), rgba(148,163,184,0.08));
  box-shadow:
    0 12px 28px rgba(15,23,42,0.08),
    inset 0 1px 0 rgba(255,255,255,0.42);
}
.mission-node-phone-shell .mission-node,
.mission-node-robot-shell .mission-node {
  border: 1px solid rgba(255,255,255,0.34);
  border-radius: 22px;
  padding: 10px 10px 12px;
  width: 100%; height: 100%;
  background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(241,245,249,0.38));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.45),
    inset 0 -10px 24px rgba(226,232,240,0.18);
  position: relative;
  z-index: 2;
}
```

---

## 7. 设备插画（Phone / Robot / Arm）

### 7.1 Phone 图 `.device-art-phone`

```css
.device-art-phone {
  width: 120%;
  filter: drop-shadow(0 14px 20px rgba(15,23,42,0.12));
}
```
资源：`/assets/phone.png`

### 7.2 Robot Dog 图 `.device-art-dog`

```css
.device-art-dog {
  width: 104px;
  max-width: 104px;
  filter: drop-shadow(0 14px 20px rgba(15,23,42,0.12));
}
```
资源：`/assets/unitree-robotdog.png`

### 7.3 Robot Arm — 内联 SVG

```jsx
<svg class="device-art-arm" viewBox="0 0 190 170" width="86%">
  <defs>
    <linearGradient id="rover-body" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%"  stop-color="#f3f4f6"/>
      <stop offset="100%" stop-color="#9ca3af"/>
    </linearGradient>
    <linearGradient id="rover-accent" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%"   stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#f97316"/>
    </linearGradient>
  </defs>
  {/* 机臂路径：stroke-width 4–8px，stroke-linecap round，颜色混用 #64748b / #6b7280 / url(#rover-body) / url(#rover-accent) / #475569 */}
</svg>
```

### 7.4 设备容器 `.mission-node-device-wrap`

```css
.mission-node-device-wrap {
  display: grid;
  grid-template-columns: minmax(72px, 1fr) minmax(156px, 188px);
  align-items: center;
  gap: 8px;
}
.mission-node-phone-shell .mission-node-device-wrap {
  grid-template-columns: minmax(72px, 1fr) minmax(172px, 208px);
}
.mission-node-robot-shell .mission-node-device-wrap {
  grid-template-columns: 124px minmax(188px, 220px);
  justify-content: start;
  gap: 4px;
}
```

---

## 8. 节点徽章与卡片

### 8.1 在线指示点

```css
.mission-node-online-dot {
  width: 6px; height: 6px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
}
.mission-node-online-dot-inline { width: 5px; height: 5px; box-shadow: 0 0 0 2px rgba(34,197,94,0.1); }
```

### 8.2 Detail Chip

```css
.mission-node-detail-chip {
  display: inline-flex;
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--node-tint) 9%, white);
  border: 1px solid color-mix(in srgb, var(--node-tint) 14%, rgba(148,163,184,0.28));
  color: #334155;
  font-size: calc(0.56rem * var(--graph-font-scale));
  font-weight: 700;
  white-space: nowrap;
}
.mission-node-agent-card-chip {
  min-height: 18px;
  padding: 0 7px;
  font-size: calc(0.52rem * var(--graph-font-scale));
}
```

### 8.3 Embedded Card（节点内嵌卡）

```css
.mission-node-embedded-card {
  display: flex;
  flex-direction: column;
  height: 76px;                /* 高变体 86px */
  padding: 9px 12px;
  gap: 6px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255,255,255,0.84), rgba(248,250,252,0.62));
  border: 1px solid rgba(148,163,184,0.22);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.45);
  position: relative; z-index: 3;
}
.mission-node-embedded-card-title {
  font-size: calc(0.58rem * var(--graph-font-scale));
  font-weight: 800;
  color: #0f172a;
  align-self: flex-start;
}
```

---

## 9. 区域节点与总线节点

### 9.1 `.region-node`（默认区域，蓝色网格）

```css
.region-node {
  border-radius: 28px;
  border: 1px solid rgba(59,130,246,0.22);
  padding: 18px 22px;
  background:
    linear-gradient(rgba(59,130,246,0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.045) 1px, transparent 1px),
    radial-gradient(circle at top left, rgba(59,130,246,0.14), transparent 42%),
    linear-gradient(180deg, rgba(246,250,255,0.94), rgba(235,244,252,0.78));
  background-size: 18px 18px, 18px 18px, auto, auto;
  color: #1e3a8a;
  font-size: calc(0.74rem * var(--graph-font-scale));
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
```

### 9.2 `.region-node-subdomain`（灰色子域）

```css
.region-node-subdomain {
  border-radius: 24px;
  border: 1px solid rgba(148,163,184,0.22);
  padding: 13px 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.58), rgba(246,249,252,0.4));
  color: #475569;
  font-size: calc(0.57rem * var(--graph-font-scale));
  font-weight: 800;
  letter-spacing: 0.13em;
}
```

### 9.3 `.region-node-family`（青色家庭域，带点阵）

```css
.region-node-family {
  border-color: rgba(20,184,166,0.32);
  background:
    radial-gradient(circle at 1px 1px, rgba(15,118,110,0.1) 1px, transparent 1.2px),
    radial-gradient(circle at top left, rgba(45,212,191,0.16), transparent 50%),
    linear-gradient(180deg, rgba(240,253,250,0.92), rgba(236,253,245,0.72));
  color: #115e59;
  font-size: calc(0.56rem * var(--graph-font-scale));
}
```

### 9.4 `.region-node-external`（橙色外部/OTT）

```css
.region-node-external {
  border-color: rgba(249,115,22,0.20);
  background:
    linear-gradient(rgba(249,115,22,0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(249,115,22,0.045) 1px, transparent 1px),
    radial-gradient(circle at top left, rgba(251,146,60,0.1), transparent 46%),
    linear-gradient(180deg, rgba(255,251,245,0.94), rgba(255,244,235,0.8));
  background-size: 18px 18px, 18px 18px, auto, auto;
  color: #9a3412;
}
```

### 9.5 Bus Node（总线胶囊）

```css
.bus-backbone {
  width: 100%; height: 100%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,249,252,0.96));
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,0.7),
    0 0 0 1px rgba(148,163,184,0.16),
    0 0 10px rgba(96,165,250,0.05),
    0 0 14px rgba(129,140,248,0.04),
    0 4px 10px rgba(15,23,42,0.04);
}
/* ::before 叠加 90deg cyan→indigo 渐变 + 2 个 radial，::after 水平高光 */

.bus-node-pill {
  display: inline-flex;
  gap: 6px;
  border-radius: 999px;
  color: #0f172a;
  font-weight: 900;
  font-size: calc(0.58rem * var(--graph-font-scale));
  letter-spacing: 0.07em;
  text-transform: uppercase;
}
.bus-node-caption {
  font-size: calc(0.5rem * var(--graph-font-scale));
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  opacity: 0.56;
}
```

---

## 10. 连线 Mission Edge

### 10.1 颜色决策（`kind`, `plane`, `tone`）

```ts
activeColor =
    tone
  ?? (kind === 'bus'        ? '#38bdf8'    // 总线 / sky
    : isControlPlane        ? '#7c3aed'    // 控制面 purple
    : isDataPlane           ? '#f59e0b'    // 数据面 amber
    : kind === 'wireless'   ? '#0284c7'    // 无线 blue
                            : '#10b981');  // 默认 green

idleColor =
    kind === 'bus'      ? '#bfd6e6'
  : kind === 'wireless' ? '#c7e8fb'
                        : '#c3cedb';
```

### 10.2 虚线样式 strokeDasharray

| 场景 | dasharray | 说明 |
|---|---|---|
| 无线数据（active） | `7 12` | 稀疏长虚线 |
| 无线（idle） | `3 4` | 细密虚线 |
| 控制面（active） | `6 7` | 中等虚线 |
| 数据面（active） | `14 10` | 粗段虚线 |
| 默认 active | `11 8` | — |
| 其他 | 无（实线） | — |

### 10.3 粗细 strokeWidth

| 状态 | wireless-data | data | control | bus | default |
|---|---|---|---|---|---|
| selected | 3.4 | 5.2 | 2.7 | 3.05 | 3.05 |
| active | 2.8 | 4.7 | 2.25 | 1.8 | 1.9 |
| idle (wireless) | 1.8 | — | — | — | — |
| idle | — | 4.1 | 1.55 | 1.45 | 1.35 |

### 10.4 不透明度

```ts
opacity = isSelected ? 1
       : isActive   ? (isWirelessDataPlane ? 0.9
                     : isDataPlane          ? 0.96
                     : isControlPlane       ? 0.92
                                            : 0.88)
       : kind === 'wireless' ? 0.4
                             : 0.32;
```

### 10.5 贝塞尔曲率

```ts
curvature = kind === 'wireless' ? 0.2
          : kind === 'bus'      ? 0.2
                                : 0.16;
```

### 10.6 流动方向动画类与关键帧

```css
.edge-control-animated-forward  { animation: control-forward  0.55s linear infinite; }
.edge-control-animated-reverse  { animation: control-reverse  0.55s linear infinite; }
.edge-data-animated-forward     { animation: data-forward     0.95s linear infinite; }
.edge-data-animated-reverse     { animation: data-reverse     0.95s linear infinite; }
.edge-wireless-data-animated-forward { animation: wireless-data-forward 1.2s linear infinite; }
.edge-wireless-data-animated-reverse { animation: wireless-data-reverse 1.2s linear infinite; }
.edge-animated-forward { animation: dash-forward 0.72s linear infinite; }
.edge-animated-reverse { animation: dash-reverse 0.72s linear infinite; }

@keyframes control-forward { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
@keyframes control-reverse { from { stroke-dashoffset: 0; }  to { stroke-dashoffset: 24; } }
@keyframes data-forward    { from { stroke-dashoffset: 52; } to { stroke-dashoffset: 0; } }
@keyframes data-reverse    { from { stroke-dashoffset: 0; }  to { stroke-dashoffset: 52; } }
@keyframes wireless-data-forward { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
@keyframes wireless-data-reverse { from { stroke-dashoffset: 0; }  to { stroke-dashoffset: 24; } }
@keyframes dash-forward { from { stroke-dashoffset: 38; } to { stroke-dashoffset: 0; } }
@keyframes dash-reverse { from { stroke-dashoffset: 0; }  to { stroke-dashoffset: 38; } }
```

### 10.7 Edge Label

```css
.edge-note {
  font-size: calc(0.5rem * var(--graph-font-scale));
  font-weight: 700;
  color: #64748b;
  background: transparent;
}
```

---

## 11. 消息气泡 Bubble

### 11.1 结构（JSX）

```jsx
<div class="mission-node-bubble" /* 可选 .mission-node-bubble-done / -leaving */>
  <BubbleIconGlyph icon={messageIcon} state={messageState} />
  <span>{message}</span>
</div>
```

### 11.2 容器样式

```css
.mission-node-bubble {
  position: absolute;
  top: -38px;
  right: -22px;
  max-width: 196px;
  padding: 9px 13px;
  border-radius: 16px 16px 5px 16px;   /* 右下角尖，其他圆 */
  background: rgba(255,255,255,0.96);
  border: 1px solid rgba(148,163,184,0.28);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--node-tint) 18%, transparent),
    0 12px 26px rgba(15,23,42,0.1);
  color: #475569;
  font-size: calc(0.72rem * var(--graph-font-scale));
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.01em;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  animation: bubble-in 180ms cubic-bezier(0.2,0.8,0.2,1);
  transform-origin: bottom right;
  will-change: transform, opacity;
}
```

### 11.3 尾巴（小三角）

```css
.mission-node-bubble::after {
  content: "";
  position: absolute;
  right: 16px;
  bottom: -6px;
  width: 10px; height: 10px;
  background: rgba(255,255,255,0.96);
  border-right: 1px solid rgba(148,163,184,0.28);
  border-bottom: 1px solid rgba(148,163,184,0.28);
  transform: rotate(45deg);
}
```

### 11.4 图标种类 `BubbleIconGlyph`

```tsx
type BubbleIcon = 'spinner' | 'done' | 'sparkles' | 'radio' | 'brain' | 'scan';

function BubbleIconGlyph({ icon, state }) {
  if (icon === 'radio')    return <Radio size={12} className="mission-node-bubble-icon" />;
  if (icon === 'sparkles') return <Sparkles size={12} className="mission-node-bubble-icon" />;
  if (icon === 'brain')    return <BrainCircuit size={12} className="mission-node-bubble-icon" />;
  if (icon === 'scan')     return <ScanSearch size={12} className="mission-node-bubble-icon" />;
  if (icon === 'done')     return <CheckCircle2 size={12} className="mission-node-bubble-icon mission-node-bubble-icon-done" />;
  if (icon === 'spinner')  return <LoaderCircle size={12} className="mission-node-bubble-icon" />;
  return state === 'done'
    ? <CheckCircle2 size={12} className="mission-node-bubble-icon mission-node-bubble-icon-done" />
    : <LoaderCircle size={12} className="mission-node-bubble-icon" />;
}
```

```css
.mission-node-bubble-icon {
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--node-tint) 78%, #475569);
  animation: spin 0.7s linear infinite;
}
.mission-node-bubble-icon-done {
  color: #16a34a;
  animation: none;
}
```

### 11.5 完成态 `.mission-node-bubble-done`

```css
.mission-node-bubble-done {
  border-color: rgba(34,197,94,0.24);
  box-shadow:
    0 0 0 1px rgba(34,197,94,0.16),
    0 12px 26px rgba(15,23,42,0.1);
}
```

### 11.6 离场态 `.mission-node-bubble-leaving`

```css
.mission-node-bubble-leaving {
  animation: bubble-out 220ms cubic-bezier(0.4,0,0.2,1) forwards;
  pointer-events: none;
}
```

### 11.7 特殊定位

**ACN Agent**（气泡在右上，尾巴右下）：
```css
.mission-node-acn-agent-shell .mission-node-bubble {
  top: -38px; right: -22px; left: auto;
}
.mission-node-acn-agent-shell .mission-node-bubble::after {
  right: 16px; bottom: -6px;
  border-right: 1px solid rgba(148,163,184,0.28);
  border-bottom: 1px solid rgba(148,163,184,0.28);
  transform: rotate(45deg);
}
```

**Phone / Robot**：
```css
.mission-node-phone-shell .mission-node-bubble,
.mission-node-robot-shell .mission-node-bubble {
  top: -28px; right: -20px; z-index: 6;
}
.mission-node-robot-shell .mission-node-bubble { top: -26px; }
```

**Ordering**：`top: -36px`

### 11.8 关键帧

```css
@keyframes bubble-in {
  from { opacity: 0; transform: translateY(6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes bubble-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(5px) scale(0.975); }
}
@keyframes bubble-in-side {
  from { opacity: 0; transform: translateY(-50%) translateX(-8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(-50%) translateX(0) scale(1); }
}
@keyframes bubble-out-side {
  from { opacity: 1; transform: translateY(-50%) translateX(0) scale(1); }
  to   { opacity: 0; transform: translateY(-50%) translateX(-8px) scale(0.975); }
}
```

---

## 12. 气泡内清单 Plan Checklist

> 「清单气泡」是更大的气泡，包含 header + 多条任务项，每项前面有三态圆形勾选圈。

### 12.1 数据结构

```ts
plan: {
  title: string;                            // 右上角小标题，如 "Dial friends"
  items: Array<{
    id: string;
    label: string;                          // 主文案
    phase: 'pending' | 'processing' | 'done';
    bubbleText: string;
  }>;
}
planLeaving?: boolean;                      // 触发离场动画
```

### 12.2 容器 `.mission-node-plan`

```css
.mission-node-plan {
  position: absolute;
  top: -120px;
  right: -10px;
  width: 180px;
  padding: 8px 10px 9px;
  border-radius: 16px 16px 4px 16px;
  background: rgba(255,255,255,0.98);
  border: 1px solid rgba(148,163,184,0.26);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--node-tint) 14%, transparent),
    0 14px 30px rgba(15,23,42,0.12);
  z-index: 4;
  display: grid;
  gap: 8px;
  animation: bubble-in 200ms cubic-bezier(0.2,0.8,0.2,1);
  transform-origin: bottom right;
}
.mission-node-plan::after {
  content: "";
  position: absolute;
  right: 18px; bottom: -6px;
  width: 10px; height: 10px;
  background: rgba(255,255,255,0.98);
  border-right: 1px solid rgba(148,163,184,0.26);
  border-bottom: 1px solid rgba(148,163,184,0.26);
  transform: rotate(45deg);
}
.mission-node-plan-leaving {
  animation: bubble-out 220ms cubic-bezier(0.4,0,0.2,1) forwards;
  pointer-events: none;
}
```

### 12.3 Header

```jsx
<div class="mission-node-plan-header">
  <LoaderCircle size={12} class="mission-node-plan-icon" />
  <span class="mission-node-plan-title">Plan</span>
  <span class="mission-node-plan-name">{plan.title}</span>
</div>
```

```css
.mission-node-plan-header { display: flex; align-items: center; gap: 6px; min-width: 0; }
.mission-node-plan-icon   { color: color-mix(in srgb, var(--node-tint) 78%, #475569); animation: spin 0.9s linear infinite; }
.mission-node-plan-title  {
  font-size: calc(0.54rem * var(--graph-font-scale));
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: color-mix(in srgb, var(--node-tint) 38%, #334155);
}
.mission-node-plan-name   {
  font-size: calc(0.62rem * var(--graph-font-scale));
  font-weight: 700;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: auto;
  max-width: 118px;
  text-align: right;
}
```

### 12.4 列表与行

```jsx
<div class="mission-node-plan-list">
  {items.map(item => (
    <div class={cn(
      "mission-node-plan-item",
      item.phase === 'processing' && "mission-node-plan-item-processing",
      item.phase === 'done' && "mission-node-plan-item-done",
    )}>
      <span class={cn("mission-node-plan-check", `mission-node-plan-check-${item.phase}`)}>
        {item.phase === 'processing'
          ? <LoaderCircle size={9} class="mission-node-plan-check-icon" />
          : item.phase === 'done' ? '✓' : ''}
      </span>
      <div class="mission-node-plan-copy">
        <span class="mission-node-plan-text">{item.label}</span>
        <span class="mission-node-plan-phase">{item.phase}</span>
      </div>
    </div>
  ))}
</div>
```

```css
.mission-node-plan-list { display: grid; gap: 4px; }

.mission-node-plan-item {
  display: grid;
  grid-template-columns: 12px 1fr;
  gap: 6px;
  align-items: center;
  font-size: calc(0.56rem * var(--graph-font-scale));
  line-height: 1.15;
  color: #64748b;
}
.mission-node-plan-item-processing { color: #0f172a; }
.mission-node-plan-item-done       { color: #334155; }

.mission-node-plan-copy { display: grid; gap: 1px; min-width: 0; }
.mission-node-plan-text { min-width: 0; }

.mission-node-plan-phase {
  font-size: calc(0.5rem * var(--graph-font-scale));
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
  line-height: 1;
}
.mission-node-plan-item-processing .mission-node-plan-phase {
  color: color-mix(in srgb, var(--node-tint) 52%, #475569);
}
.mission-node-plan-item-done .mission-node-plan-phase { color: #475569; }
```

### 12.5 三态勾选圈

```css
.mission-node-plan-check {
  width: 12px; height: 12px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: calc(0.55rem * var(--graph-font-scale));
  font-weight: 900;
  color: white;
  background: rgba(148,163,184,0.32);          /* pending = 灰底 */
}
.mission-node-plan-check-icon { animation: spin 0.9s linear infinite; }

.mission-node-plan-check-processing {
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--node-tint) 72%, white),
    color-mix(in srgb, var(--node-tint) 48%, #e2e8f0));
}

.mission-node-plan-item-done .mission-node-plan-check {
  background: linear-gradient(135deg, var(--node-tint), color-mix(in srgb, var(--node-tint) 62%, white));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--node-tint) 12%, transparent);
}
```

**三态总结**：

| phase | 圆圈背景 | 中央字符 | 其他 |
|---|---|---|---|
| pending | 灰 `rgba(148,163,184,0.32)` | 无 | — |
| processing | tint 渐变 | 旋转的 `LoaderCircle` 9px | 文字 `#0f172a` |
| done | 纯 tint 渐变 + 外环光晕 | 白色 `✓` | 文字 `#334155` |

### 12.6 ACN Agent 的右侧定位

当 plan 挂在 ACN Agent 上时，从顶部移到右侧：

```css
.mission-node-acn-agent-shell .mission-node-plan {
  top: 50%;
  right: auto;
  left: calc(100% + 30px);
  transform: translateY(-50%);
  transform-origin: center left;
  animation: bubble-in-side 200ms cubic-bezier(0.2,0.8,0.2,1);
}
.mission-node-acn-agent-shell .mission-node-plan::after {
  top: 50%;
  left: -6px;
  right: auto; bottom: auto;
  border-right: 0; border-bottom: 0;
  border-left: 1px solid rgba(148,163,184,0.26);
  border-top:  1px solid rgba(148,163,184,0.26);
  transform: translateY(-50%) rotate(45deg);
}
.mission-node-acn-agent-shell .mission-node-plan.mission-node-plan-leaving {
  animation: bubble-out-side 220ms cubic-bezier(0.4,0,0.2,1) forwards;
}
```

### 12.7 Ordering 变体

```css
.mission-node-ordering-shell .mission-node-plan { top: -102px; }
```

---

## 13. 图例 Legend

```css
.canvas-legend {
  position: absolute;
  left: 20px; bottom: 18px;
  display: inline-flex;
  gap: 8px;
  z-index: 6;
}
.canvas-legend-pill {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.96);
  border: 1px solid rgba(203,213,225,0.92);
  box-shadow: 0 10px 24px rgba(15,23,42,0.08);
  color: #334155;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
/* ::before 10×10 圆点 */
.canvas-legend-pill.control::before {
  background: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124,58,237,0.12);
}
.canvas-legend-pill.data::before {
  background: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245,158,11,0.14);
}
```

---

## 14. 全局关键帧 Keyframes（汇总）

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes node-border-sweep {
  from { background-position: 0% 50%; }
  to   { background-position: 180% 50%; }
}
@keyframes node-ring-pulse {
  0%, 100% { opacity: 0.78; }
  50%      { opacity: 1; }
}
@keyframes node-halo-pulse {
  0%, 100% { opacity: 0.46; transform: scale(0.995); }
  50%      { opacity: 0.78; transform: scale(1.02); }
}
@keyframes node-inner-pulse {
  0%, 100% {
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--node-tint) 16%, transparent),
      inset 0 0 16px color-mix(in srgb, var(--node-tint) 9%, transparent);
  }
  50% {
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--node-tint) 26%, transparent),
      inset 0 0 24px color-mix(in srgb, var(--node-tint) 16%, transparent);
  }
}

@keyframes bubble-in  { from { opacity: 0; transform: translateY(6px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes bubble-out { from { opacity: 1; transform: translateY(0) scale(1); }     to { opacity: 0; transform: translateY(5px) scale(0.975); } }
@keyframes bubble-in-side  { from { opacity: 0; transform: translateY(-50%) translateX(-8px) scale(0.97); } to { opacity: 1; transform: translateY(-50%) translateX(0) scale(1); } }
@keyframes bubble-out-side { from { opacity: 1; transform: translateY(-50%) translateX(0) scale(1); }     to { opacity: 0; transform: translateY(-50%) translateX(-8px) scale(0.975); } }

@keyframes canvas-caption-in { /* 见 §2 */ }
@keyframes canvas-caption-aura-breathe { /* 见 §2 */ }

/* 边线方向动画见 §10.6 */
```

---

## 15. 颜色 / CSS 变量 / 字号缩放

```css
:root {
  /* 语义 */
  --color-bg: #f8fafc;
  --color-panel: rgba(255,255,255,0.9);
  --color-panel-strong: rgba(255,255,255,1);
  --color-text: #1e293b;
  --color-muted: #64748b;
  --color-border: #e2e8f0;

  /* 节点 tint */
  --node-blue:  #3b82f6;
  --node-cyan:  #06b6d4;
  --node-green: #10b981;
  --node-amber: #f59e0b;
  --node-pink:  #ec4899;

  /* 运行时注入（每个节点独立） */
  --node-tint: <dynamic>;

  /* 缩放 */
  --graph-font-scale: 1.2;       /* 范围 0.9 – 1.6 */
  --caption-card-scale: 1;       /* 范围 0.85 – 1.35 */
  --caption-font-scale: 1;
}
```

**色彩混合原则**：几乎所有气泡、节点光晕都用 `color-mix(in srgb, var(--node-tint) N%, <白/灰/透明>)`，使得相同结构在不同 kind 节点上自动变色。

---

## 16. 动画时序一览表

| 元素 | 动画 | 时长 | 缓动 | 备注 |
|---|---|---|---|---|
| Bubble 入场 | `bubble-in` | 180ms | `cubic-bezier(0.2,0.8,0.2,1)` | `scale(0.97)` → 1 |
| Bubble 离场 | `bubble-out` | 220ms | `cubic-bezier(0.4,0,0.2,1)` | forwards |
| Bubble 侧入场 | `bubble-in-side` | 200ms | — | ACN Agent |
| Bubble 侧离场 | `bubble-out-side` | 220ms | — | ACN Agent |
| Plan 入场 | `bubble-in` | 200ms | — | — |
| Caption 入场 | `canvas-caption-in` | 260ms | `cubic-bezier(0.16,0.84,0.26,1)` | 68% 过冲 |
| Caption 呼吸 | `canvas-caption-aura-breathe` | 4.2s | ease-in-out | infinite |
| Node 边扫 | `node-border-sweep` | 1.25s | linear | infinite |
| Node 环脉 | `node-ring-pulse` | 1.2s | ease-in-out | infinite |
| Node Halo | `node-halo-pulse` | 1.2s | ease-in-out | scale 0.995↔1.02 |
| Node 内脉 | `node-inner-pulse` | 1.15s | ease-in-out | inset 阴影 |
| Spinner 旋转 | `spin` | 0.7s / 0.9s | linear | infinite |
| Edge control | `control-forward/-reverse` | 0.55s | linear | — |
| Edge data | `data-forward/-reverse` | 0.95s | linear | — |
| Edge wireless-data | `wireless-data-forward/-reverse` | 1.2s | linear | — |
| Edge baseline | `dash-forward/-reverse` | 0.72s | linear | — |
| 所有 transition | — | 220ms | ease | 标准微交互 |

---

## 17. 复现要点总结

1. **视觉主轴**：白底 + 40px 点阵 + 顶部居中“玻璃呼吸卡”作为标题，中央一组可高亮的节点，节点之间由语义化虚线连接。
2. **tint-driven**：所有节点相关饰件（光晕、图标、气泡描边、勾选圈）都从 `--node-tint` 通过 `color-mix()` 派生 —— 只要为节点注入一个 tint 变量，全部配色自动协调。
3. **边动画是「色 + 虚线 + 速度」三合一编码**：
   - 控制面：紫 `#7c3aed`，虚线 `6 7`，0.55s
   - 数据面：橙 `#f59e0b`，虚线 `14 10`，0.95s
   - 无线数据：蓝 `#0284c7`，虚线 `7 12`，1.2s
   - 默认：绿 `#10b981`，虚线 `11 8`，0.72s
4. **气泡体系**：两级同构 —— 单行消息气泡（96%白，右下尖角，180ms 入场）与清单气泡（98%白，内含 header + 列表 + 三态勾选圈，200ms 入场）。ACN Agent 专属侧向定位（右侧，`bubble-in-side`）。
5. **三态勾选圈**：圆形 12px，灰底 → tint 渐变 + 转圈 → 纯 tint + 白 ✓ + 外环。是动画节奏感的核心。
6. **激活节点**：双环 halo + 扫光渐变描边 + 内脉冲，三层关键帧叠加，造出「正在工作」的视觉脉搏。
7. **玻璃外壳（phone/robot）**：`backdrop-filter: blur(8px)` + 双层浅色渐变 + inset 白高光，内部再嵌真实 PNG / SVG 设备图，加 `drop-shadow(0 14px 20px rgba(15,23,42,0.12))`。
8. **标题卡呼吸**：4.2s `ease-in-out` 的 `box-shadow` 4 层光环脉动，`backdrop-filter: blur(10px)`，是整个画布「活感」的锚点。
9. **响应式**：所有字号乘以 `--graph-font-scale (0.9–1.6)`，标题乘以 `--caption-card-scale`；保持比例。
10. **离场处理**：气泡/清单设 `.mission-node-bubble-leaving` / `.mission-node-plan-leaving` 触发 `bubble-out`；节点用 `.mission-node-transitioning-shell` 降透明度 + 下沉 4px。

> 复现时最重要的一个“非显而易见”点：**不要硬编码颜色到气泡／勾选圈**，一律使用 `color-mix(in srgb, var(--node-tint) N%, …)`，这是全套动画能在 14 种 kind 上保持视觉一致的关键。
