# ACN UI 项目 — UI元素全清单（供复现参考）

> 本文档用于给公司内部大模型参考复现本项目的 UI 风格与结构。

---

## 一、技术栈

- **框架**: React 19 + Vite 8 + TypeScript 5.9
- **样式**: Tailwind CSS 4（`@theme` CSS 变量方案）
- **图形可视化**: `@xyflow/react` 12（拓扑图核心）
- **动画**: Framer Motion 12
- **图标**: Lucide React
- **工具**: clsx + tailwind-merge
- **双语**: zh-CN / en（目录式 `catalog.json`）

---

## 二、设计令牌（Design Tokens）

### 色彩（浅色主题）

```
--color-bg:            #f8fafc
--color-panel:         rgba(255,255,255,0.9)
--color-panel-strong:  rgba(255,255,255,1)
--color-text:          #1e293b
--color-muted:         #64748b
--color-border:        #e2e8f0
--color-blue:          #3b82f6
--color-cyan:          #06b6d4
--color-green:         #10b981
--color-amber:         #f59e0b
--color-pink:          #ec4899
品牌蓝(CMCC):          #0085D0
```

### 语义配色

| 类型 | 颜色 | 虚线模式 | 动画速度 |
|------|------|---------|---------|
| 控制信令 | 紫 `#7c3aed` | `6 7` | 0.55s |
| 数据平面 | 琥珀 `#f59e0b` | `14 10` | 0.95s |
| 无线数据 | 蓝 `#0284c7` | `7 12` | 1.2s |
| 总线 | 青 `#38bdf8` | — | — |
| 基线/成功 | 绿 `#10b981` | — | — |

### 字体族

```css
/* 正文 */
font-family: "Inter", "IBM Plex Sans", sans-serif;

/* 标题 */
font-family: "Avenir Next", "Source Sans 3", "Helvetica Neue", "Noto Sans", sans-serif;

/* 等宽 */
font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
```

### 尺度

- **间距**: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 20 / 24 / 28 px
- **圆角**: 6（输入）/ 10-11（按钮）/ 12-16（卡片）/ 20（模态框）/ 26（标题卡）/ 999（药丸）
- **字号**: 0.68rem（标签）→ 2.5rem（画布主标题）

### 阴影分层

```css
/* 浅 */
box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);

/* 中 */
box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);

/* 深（模态框） */
box-shadow: 0 28px 70px rgba(15, 23, 42, 0.22);

/* 发光（激活节点） */
box-shadow: 0 14px 34px -10px rgba(59, 130, 246, 0.34);
```

---

## 三、整体布局（Dashboard Shell）

```
┌────────────────────────────────────────────────────┐
│ 顶栏 64px   CMCC Logo | 标题(#0085D0) | 状态+控制   │
├────────────────────────────────────┬───────────────┤
│                                    │               │
│   主画布                            │  侧边栏       │
│   · ReactFlow 拓扑                  │  487px        │
│   · 中上方悬浮标题卡                │  (320-560 可拖)│
│   · 左下角图例                      │  Tabs+叙事卡  │
│   1fr 弹性宽                        │  +聊天列表    │
│                                    │               │
├────────────────────────────────────┴───────────────┤
│ 底部面板 180px    左: 演示面板 | 右: 消息详情 380px │
└────────────────────────────────────────────────────┘
```

**演示生命周期（DemoPhase）**: `standby → running → paused → gate → complete`

**顶栏细节**:
- 高度 64px，下边 1px `#e2e8f0` 分隔线
- 左：CMCC Logo (118×118) + 主标题「AICore ACN 智能体网络」
- 右：状态徽章 + 图标按钮组

---

## 四、核心可视化组件（ReactFlow）

### 4.1 MissionNode（14 种 kind）

```
endpoint | access | upf | router | service | idm | agent
srf | scf | up | gw | robot | arm | card
```

**5 种外观模式（appearance）**:
- `default` — 常规节点
- `phone` — 手机设备插图 + 标签
- `robot-arm` — 机械臂 SVG 动画
- `agent-card` — 可展开智能体名片
- `gateway` — 网关样式
- `pill` — 圆形药丸

**节点数据结构**:

```ts
{
  nodeId: string,
  label: string,
  kind: NodeKind,
  status: 'online' | 'offline' | ...,
  role: string,
  details: [{ label, value | values: [] }],
  active: boolean,
  flashActive: boolean,
  transitioning: boolean,
  appearance: 'default' | 'phone' | 'robot-arm' | 'agent-card' | 'gateway' | 'pill',
  message: string,
  messageIcon: 'spinner' | 'check' | 'message',
  messageState: 'processing' | 'done',
  plan: {
    title: string,
    items: [{ id, label, phase, bubbleText }]
  },
  handles: ['in-top', 'out-bottom', 'in-left', ...],
  embeddedCard: { visible, title, chips: [] }
}
```

**节点染色机制**: 通过 CSS 变量 `--node-tint` 动态注入。

```jsx
const meta = kindMeta[data.kind] || { icon: Globe, tint: '#64748b' };
<div style={{ '--node-tint': meta.tint }}>
```

### 4.2 MissionEdge（连接线）

根据 `kind` × `plane` 自动适配颜色、虚线、动画速度：

```jsx
const activeColor = tone ?? (
  kind === 'bus'        ? '#38bdf8'
  : isControlPlane      ? '#7c3aed'
  : isDataPlane         ? '#f59e0b'
  : kind === 'wireless' ? '#0284c7'
                        : '#10b981'
);
```

### 4.3 RegionNode / BusNode

- **RegionNode**: 区域分组背景，无交互
- **BusNode**: 系统总线节点，自带 Sparkles 图标

---

## 五、重点 UI 部件

### 5.1 画布标题卡（核心视觉焦点）

**位置**: 画布中上方悬浮，可拖动（grabbing 光标）
**尺寸**: `width: min(520px, 100% - 220px)`，圆角 26px
**核心特征**: 玻璃态 `backdrop-filter: blur(10px)` + **四层叠加渐变**

```css
.canvas-caption-card {
  background:
    radial-gradient(circle at 14% -4%, rgba(56, 189, 248, 0.36), transparent 32%),
    radial-gradient(circle at 84% 8%,  rgba(99, 102, 241, 0.18), transparent 30%),
    radial-gradient(circle at 50% 120%, rgba(34, 211, 238, 0.14), transparent 44%),
    linear-gradient(180deg, rgba(243, 250, 255, 0.97), rgba(226, 244, 255, 0.9));
  border: 1px solid rgba(125, 211, 252, 0.44);
  backdrop-filter: blur(10px);
}
```

**内部结构（4 层叠加）**:

```html
<div class="canvas-caption-card">
  <div class="canvas-caption-glow"></div>    <!-- 背景光晕 -->
  <div class="canvas-caption-aura"></div>    <!-- 呼吸光圈 (4.2s) -->
  <div class="canvas-caption-edge"></div>    <!-- 动画边框 -->
  <div class="canvas-caption-content">
    <div class="canvas-caption-kicker">STAGE</div>  <!-- #0369a1 -->
    <h2 class="canvas-caption-title">Title</h2>     <!-- #0b2540 + text-shadow -->
  </div>
</div>
```

**进场动画**:

```css
@keyframes canvas-caption-in {
  from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.93); }
  68%  { opacity: 1; transform: translateX(-50%) translateY(-3px) scale(1.015); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
}
/* 260ms cubic-bezier(0.16, 0.84, 0.26, 1) */
```

### 5.2 侧边栏叙事阶段卡

```html
<div class="narrative-stage-card narrative-stage-card-active">
  <button class="narrative-stage-head">
    <span class="narrative-stage-dot narrative-stage-dot-active">1</span>
    <div class="narrative-stage-copy">
      <div class="narrative-stage-summary">Stage Title</div>
      <div class="narrative-stage-expanded">
        <div class="narrative-stage-items">
          <div class="narrative-stage-item">Item</div>
        </div>
      </div>
    </div>
  </button>
</div>
```

- 背景: `linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))`
- 激活边框: `rgba(14, 165, 233, 0.22)`
- 完成圆点背景: `rgba(16, 185, 129, 0.12)`
- 激活圆点背景: `rgba(14, 165, 233, 0.12)`

### 5.3 聊天消息卡片

```jsx
<button className="presentation-chat-item presentation-chat-item-clickable">
  <div className="presentation-chat-icon">
    <PresentationMessageIcon icon="message" />
  </div>
  <div className="presentation-chat-content">
    <div className="presentation-chat-meta">
      <span className="presentation-chat-speaker">Agent Name</span>
      <span className="presentation-chat-time">HH:MM:SS</span>
    </div>
    <div className="presentation-chat-body">Markdown content</div>
  </div>
</button>
```

- 网格布局: `grid-template-columns: 30px 1fr`
- Hover: 上浮 1px + 阴影加深 + 边框蓝化
- 历史消息: `opacity: 0.72`

### 5.4 消息详情模态框

```jsx
<div className="message-detail-overlay">
  <div className="message-detail-modal">
    <header className="message-detail-header">
      <h3 className="message-detail-title">{title}</h3>
      <button className="message-detail-close"><X size={16} /></button>
    </header>
    <div className="message-detail-sections">
      {sections.map(s => (
        <section className="message-detail-section">
          <h4 className="message-detail-section-title">{s.title}</h4>
          <div className="message-detail-section-body">
            {s.lines.map(l => <p className="message-detail-line">{l}</p>)}
          </div>
        </section>
      ))}
    </div>
  </div>
</div>
```

- 尺寸: `min(760px, 100%)`, `max-height: 80vh`
- 遮罩: `rgba(15, 23, 42, 0.28)` + `blur(8px)`
- 模态: 圆角 20px, `rgba(255, 255, 255, 0.96)`

### 5.5 步骤队列

```html
<div class="step-queue-item step-queue-item-active">
  <span class="step-queue-number">1</span>
  <div class="step-queue-copy">
    <span class="step-queue-label">IN PROGRESS</span>
    <span class="step-queue-value">Stage Name</span>
    <div class="step-queue-description">...</div>
  </div>
  <span class="step-queue-status step-queue-status-active">•</span>
</div>
```

- 激活蓝 `#2563eb` / 完成绿 `#16a34a`
- 数字背景 `rgba(59, 130, 246, 0.1)`

### 5.6 状态徽章 & 开关

```css
.status-badge-live   { color: var(--color-blue);  background: rgba(59,130,246,0.1); }
.status-badge-good   { color: var(--color-green); background: rgba(16,185,129,0.1); }
.status-badge-accent { color: var(--color-amber); background: rgba(245,158,11,0.1); }

/* 呼吸脉冲 */
@keyframes status-live-pulse {
  0%,100% { opacity: 1;    transform: scale(1); }
  50%     { opacity: 0.45; transform: scale(0.92); }
}
/* 1.8s infinite */
```

**开关 (.settings-switch)**:

```css
.settings-switch {
  width: 42px; height: 24px; border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  transition: all 180ms ease;
}
.settings-switch-active { background: rgba(14, 165, 233, 0.2); }
.settings-switch-thumb  { width: 18px; height: 18px; }
/* 激活时 transform: translateX(18px) */
```

### 5.7 按钮

| 类型 | 尺寸 | 样式 |
|------|------|------|
| Icon Button | 40×40 | 1px `#e2e8f0` 边框, hover `#f1f5f9`, radius 10px |
| Primary | h40 / px 20 | 背景 `#3b82f6`, 字重 600, 白字 |

---

## 六、场景数据结构（scenarios/state_*.json）

```json
{
  "description": "阶段说明文本",
  "domain": {
    "line_file": "line_0.json",
    "robot": ["ue-mno-a", "dog-mno-b"]
  },
  "ui_log": {
    "Register": [
      { "Time": "2026-01-08 10:00:01", "Content": "Log text" }
    ]
  },
  "agent_chat": [
    {
      "agent": "ACN Agent(MNOB)",
      "time": "2026-01-08 10:00:01",
      "think": "思考过程",
      "content": "**Markdown** response"
    }
  ],
  "pipeline": [
    {
      "sender": "RobotArm(MNO B)",
      "receiver": "ACN Agent(MNO B)",
      "action": "Action description",
      "type": "normal"
    }
  ],
  "robot": {
    "definitions": {
      "RobotDog": {
        "Vendor": "Unitree",
        "Capability": "[Camera, Payload: 10KG]",
        "Access Domain": "CMCC"
      }
    },
    "bindings": { "CMCC": ["UE Assistant", "RobotDog"] }
  }
}
```

**8 个场景阶段**:

| 文件 | 阶段 |
|------|------|
| state_0.json | 初始注册 |
| state_1.json | 数字身份签发 & 代理卡发布 |
| state_2.json | 家庭域创建 |
| state_3.json | 订单提交 |
| state_4.json | 配送机器人发现 |
| state_5.json | 任务分配 |
| state_6.json | 位置共享 |
| state_8.json | 对等验证 |

---

## 七、关键动画与交互

### 7.1 节点动画

```css
/* 激活闪烁 */
.mission-node-flash-shell {
  animation:
    node-border-sweep 1.25s linear infinite,
    node-ring-pulse   1.2s ease-in-out infinite;
}

/* 气泡入场 */
.mission-node-bubble {
  animation: bubble-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: bottom right;
}

/* 气泡退出 */
.mission-node-bubble-out {
  animation: bubble-out 220ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

### 7.2 边动画

```css
.edge-data-animated-forward     { animation: data-forward     0.95s linear infinite; }
.edge-control-animated-forward  { animation: control-forward  0.55s linear infinite; }
.edge-wireless-data-animated-forward { animation: wireless-data-forward 1.2s linear infinite; }
```

### 7.3 标题卡呼吸

```css
@keyframes canvas-caption-aura-breathe {
  0%,100% { box-shadow: 0 24px 54px rgba(...), 0 0 24px rgba(...); }
  50%     { box-shadow: 0 30px 64px rgba(...), 0 0 34px rgba(...); }
}
/* 4.2s infinite */
```

### 7.4 通用缓动函数

| 场景 | 缓动 | 持续 |
|------|------|------|
| 微交互（hover/点击） | `cubic-bezier(0.2, 0.8, 0.2, 1)` | 180-220ms |
| 进场/退场 | `cubic-bezier(0.16, 0.84, 0.26, 1)` | 260ms |
| 呼吸/脉冲 | `ease-in-out` | 1.2-4.2s |

---

## 八、国际化（i18n）

- 双语支持: `en` / `zh-CN`，默认 `zh-CN`
- 本地化文件: `src/locales/catalog.json`，~100+ 键值对
- 结构:

```json
{
  "ui.settings.title": {
    "en": "Settings",
    "zh-CN": "设置"
  },
  "narrative.standbyTitle": {
    "en": "Connect robots and place an order",
    "zh-CN": "连接机器人并发起订单"
  }
}
```

---

## 九、持久化与响应式

### LocalStorage Keys

| Key | 范围 | 说明 |
|------|------|------|
| `acn-ui-graph-font-scale` | 0.9 – 1.6 | 图形文本缩放 |
| `acn-ui-caption-card-scale` | 0.85 – 1.35 | 标题卡缩放 |
| `acn-ui-sidebar-width` | 320 – 560 px | 侧边栏宽度 |
| `acn-ui-play-speed` | 0.5 – 3x | 演示播放速度 |

### CSS 运行时变量

```css
--graph-font-scale: 1.2;
--caption-card-scale: 1;
--caption-font-scale: 1;
--node-tint: <dynamic>;
```

### 响应式

```css
@media (max-width: 1200px) {
  .sidebar-shell { width: clamp(360px, 38vw, 500px); }
}
```

---

## 十、资产

| 路径 | 说明 |
|------|------|
| `public/assets/hero.png` | 品牌英雄图（44KB） |
| `public/assets/phone.png` | 手机设备插图 |
| `public/assets/unitree-robotdog.png` | 机器狗插图 |
| 内联 SVG（机械臂） | `<svg viewBox="0 0 190 170">` + 渐变 defs |
| 内联 SVG（月球车） | `url(#rover-body)` / `url(#rover-accent)` |
| CMCC Logo | 顶栏左侧，118×118 |

---

## 十一、代表性代码片段

### 动态类名组合（clsx + tailwind-merge）

```jsx
<div className={cn(
  "mission-node-shell",
  data.active      && "mission-node-active-shell",
  data.flashActive && "mission-node-flash-shell",
  data.context     && "mission-node-context",
  data.emphasis    && "mission-node-emphasis",
)}>
```

### 侧边栏 Tab

```jsx
<div className="sidebar-tabs">   {/* 2 列网格，8px 间距 */}
  <button className="sidebar-tab sidebar-tab-active">AI Narrative</button>
  <button className="sidebar-tab">Agent Messages</button>
</div>
```

### ReactFlow 节点 Shell

```jsx
<div
  className={cn("mission-node-shell", data.flashActive && "mission-node-flash-shell")}
  style={{ '--node-tint': meta.tint }}
>
  {data.plan && <div className="mission-node-plan">...</div>}
  {data.message && <div className="mission-node-bubble">...</div>}
  <div className="mission-node">
    {/* 设备插图 | 图标 + 标签 + 细节 */}
  </div>
  {/* 连接 handles */}
</div>
```

---

## 十二、复现要点总结（给目标模型的重点提示）

1. **整体气质** — 浅色玻璃态 + 半透明白面板 + 多层径向渐变营造高级科技感
2. **色彩语义严格一致** — 控制=紫 / 数据=琥珀 / 无线=蓝 / 成功=绿
3. **动画节拍** — 交互 180-260ms，`cubic-bezier(0.2,0.8,0.2,1)` 或 `(0.16,0.84,0.26,1)`；呼吸 1.2-4.2s `ease-in-out`
4. **布局骨架** — 顶栏 64 + 主区 (1fr + 侧栏 487) + 底栏 180；底栏 `grid 1fr 380px`
5. **ReactFlow 节点** — Shell 通过 `--node-tint` 变量差异化染色；14 种 kind × 6 种 appearance
6. **排版** — Inter 正文 + Avenir Next 标题 + IBM Plex Mono 代码
7. **细节交互** — 卡片/节点 hover 上浮 1px + 阴影加深
8. **标题卡视觉焦点** — 四层径向渐变 + 玻璃态 + 呼吸光圈，是整体视觉的核心亮点

---

**报告生成时间**: 2026-04-13
**项目路径**: `D:/claude_max/0413a/acn_ui`
**主文件**: `src/App.tsx`（~4124 行）
