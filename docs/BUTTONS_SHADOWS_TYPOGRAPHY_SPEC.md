# 按钮、阴影、字体 UI 规范

> 本文档聚焦项目中 **通用 UI 元素**（按钮、表单、徽章、字体、阴影、圆角、间距、动画），作为独立可复现规范。
>
> 不包含流程图节点/边细节（见 `FLOW_DIAGRAM_SPEC.md`）。
>
> 源文件：`src/index.css`（2800+ 行）。

---

## 目录

1. [颜色 Token 系统](#1-颜色-token-系统)
2. [字体系统](#2-字体系统)
3. [按钮系统](#3-按钮系统)
4. [开关与表单控件](#4-开关与表单控件)
5. [徽章 Badge / 状态指示](#5-徽章-badge--状态指示)
6. [阴影分级（Elevation）](#6-阴影分级elevation)
7. [边框与圆角系统](#7-边框与圆角系统)
8. [间距系统](#8-间距系统)
9. [过渡与动画](#9-过渡与动画)
10. [特殊浮层组件](#10-特殊浮层组件)
11. [列表与卡片](#11-列表与卡片)
12. [Chip / 小标签](#12-chip--小标签)
13. [复现要点速查](#13-复现要点速查)

---

## 1. 颜色 Token 系统

### 1.1 `@theme` 基础变量（`src/index.css:2-19`）

```css
@theme {
  --color-bg:           #f8fafc;
  --color-panel:        rgba(255, 255, 255, 0.9);
  --color-panel-strong: rgba(255, 255, 255, 1);
  --color-text:         #1e293b;
  --color-muted:        #64748b;
  --color-border:       #e2e8f0;
  --color-blue:         #3b82f6;
  --color-cyan:         #06b6d4;
  --color-green:        #10b981;
  --color-amber:        #f59e0b;
  --color-pink:         #ec4899;
  --node-blue:          #3b82f6;
  --node-cyan:          #06b6d4;
  --node-green:         #10b981;
  --node-amber:         #f59e0b;
  --node-pink:          #ec4899;
}
```

### 1.2 常用半透明配色库

| RGBA | 典型用途 |
|------|---------|
| `rgba(59, 130, 246, 0.08)` | 蓝色渐变底 |
| `rgba(59, 130, 246, 0.10)` | 蓝色徽章背景 |
| `rgba(59, 130, 246, 0.12)` | 焦点外发光圈 |
| `rgba(16, 185, 129, 0.10)` | 绿色徽章背景 |
| `rgba(245, 158, 11, 0.10)` | 琥珀徽章背景 |
| `rgba(148, 163, 184, 0.10)` | 中性徽章背景 |
| `rgba(148, 163, 184, 0.12)` | 灰色关闭按钮 |
| `rgba(148, 163, 184, 0.18)` | 开关关闭态底 |
| `rgba(14, 165, 233, 0.20)` | 开关激活底 |
| `rgba(14, 165, 233, 0.42)` | 开关激活边框 |
| `rgba(255, 255, 255, 0.90-0.99)` | 面板/卡片分层半透明 |
| `rgba(203, 213, 225, 0.92-0.98)` | 浅灰边框 |
| `rgba(15, 23, 42, 0.05-0.22)` | 阴影分级 |

### 1.3 `color-mix()` 混合规则

项目大量使用 CSS 4 的 `color-mix()` 做主题色衍生：

```css
/* 语义色 + 边框色按比例混合 */
border-color: color-mix(in srgb, var(--color-blue) 28%, var(--color-border));

/* 节点主色 + 白混合做浅底 */
background: color-mix(in srgb, var(--node-tint) 10%, white);

/* 主色 + 透明做外发光 */
box-shadow: 0 0 0 5px color-mix(in srgb, var(--node-tint) 8%, transparent);
```

---

## 2. 字体系统

### 2.1 字族

```css
/* 全局正文 */
:root {
  font-family: "Inter", "IBM Plex Sans", sans-serif;
}

/* 页面大标题 */
.dashboard-title {
  font-family: "Avenir Next", "Source Sans 3", "Helvetica Neue", "Noto Sans", sans-serif;
}

/* 代码字体（聊天正文中的 inline code） */
.presentation-chat-body code {
  font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
}
```

### 2.2 字号尺度速查

| 用途 | 字号 | 字重 | 示例 |
|------|------|------|------|
| 大型主标题（进度） | 2.38rem | 700 | `.narrative-progress-title` |
| 应用标题 | 1.45rem | 550 | `.dashboard-title` |
| H2（画布 caption） | ~1.4rem | 900 | `.canvas-caption-title` |
| 小标题（模态/分段） | 0.82rem | 800 | `.message-detail-section-title` |
| 按钮文字 | 0.9rem | 600 | `.primary-button` |
| 侧栏 Tab | 0.76rem | 700 | `.sidebar-tab` |
| 正文 | 0.86rem – 1rem | 400 – 600 | 普通段落 |
| 时间戳/副文案 | 0.68rem – 0.78rem | 600 – 700 | 聊天元信息 |
| 节点 label | 0.78rem × scale | 800 | `.mission-node-label` |
| 节点 role | 0.6rem × scale | 600 | `.mission-node-role` |
| 超小标签 | 0.5rem – 0.56rem × scale | 700 – 800 | Chip、handle label |

### 2.3 字重（font-weight）习惯

| 权重 | 场景 |
|------|------|
| 400 | 极少，仅正文段落 |
| 550 | Dashboard 主标题（Avenir Next 特殊字重） |
| 600 | 按钮、链接、次要强调 |
| 700 | 标签、副标题、大多数强调文本 |
| 800 | 节点 label、小节标题、步骤编号 |
| 900 | 大标题、分类大写 caption（配合 `letter-spacing`） |

### 2.4 `letter-spacing` 习惯

| 值 | 场景 |
|---|------|
| 0 / 不设置 | 常规正文 |
| 0.01em | 气泡、细调 |
| 0.02em | Sidebar tab、表单 label |
| 0.04em | Legend、徽章文字 |
| 0.05em – 0.08em | Status Badge、小 caption |
| 0.12em – 0.16em | Uppercase 分类标签（Region、Kicker） |
| 0.18em – 0.2em | 画布主 caption kicker |

### 2.5 `line-height` 习惯

| 值 | 场景 |
|---|------|
| 1 | 图表标签、Pill 紧凑文字 |
| 1.05 | 节点 label |
| 1.15 | 多行节点 role |
| 1.25 | 气泡正文 |
| 1.35 | 标题、副标题 |
| 1.55 | 段落正文 |

### 2.6 `text-transform`

- `uppercase`：所有 kicker、徽章、Region label、Phase 标签、Legend
- 默认不变换：正文、按钮、节点 label

---

## 3. 按钮系统

### 3.1 主按钮 `.primary-button`

```css
.primary-button {
  height: 40px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  background: var(--color-blue);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  border: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.primary-button:hover    { opacity: 0.9; }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
```

### 3.2 图标按钮 `.icon-button`

```css
.icon-button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: white;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  background: #f1f5f9;
  border-color: var(--color-muted);
}

.icon-button:disabled { opacity: 0.45; cursor: not-allowed; }
```

### 3.3 关闭按钮 `.message-detail-close`

```css
.message-detail-close {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(148, 163, 184, 0.12);
  color: #475569;
  cursor: pointer;
}
```

### 3.4 侧栏标签 `.sidebar-tab` / `.sidebar-tab-active`

```css
.sidebar-tab {
  height: 36px;
  border-radius: 11px;
  border: 1px solid var(--color-border);
  background: white;
  color: var(--color-muted);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.sidebar-tab-active {
  color: var(--color-text);
  border-color: color-mix(in srgb, var(--color-blue) 28%, var(--color-border));
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.10), rgba(255, 255, 255, 0.96));
}
```

### 3.5 折叠按钮 `.sidebar-collapse-button`（侧栏拉手）

```css
.sidebar-collapse-button {
  position: absolute;
  top: 14px;
  left: -18px;
  width: 18px;
  height: 34px;
  border: 1px solid rgba(203, 213, 225, 0.96);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  color: var(--color-muted);
  transition: background 180ms ease, color 180ms ease,
              border-color 180ms ease, box-shadow 180ms ease;
}

.sidebar-collapse-button:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(148, 163, 184, 0.9);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  color: var(--color-text);
}
```

### 3.6 按钮样式设计原则

- **主按钮**：实色蓝底、白字、radius 10、hover 仅改 opacity
- **次要按钮**：白底、1px 边框、hover 改背景+边框色
- **关闭/次要 icon**：无边框、灰背景（8-12% alpha）、radius 10
- **Tab**：灰字+白底 → 深字+淡蓝渐变（激活态）
- **所有按钮**：`transition` 统一 `0.2s`（180-200ms）

---

## 4. 开关与表单控件

### 4.1 切换开关 `.settings-switch`

```css
.settings-switch {
  position: relative;
  width: 42px;
  height: 24px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease;
}

.settings-switch-active {
  background: rgba(14, 165, 233, 0.20);
  border-color: rgba(14, 165, 233, 0.42);
}

.settings-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: white;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.18);
  transition: transform 180ms ease;
}

.settings-switch-active .settings-switch-thumb {
  transform: translateX(18px);
}

.settings-switch-disabled {
  opacity: 0.48;
  cursor: not-allowed;
}
```

### 4.2 输入框 `.settings-input`

```css
.settings-input {
  width: 100%;
  min-height: 40px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.98);
  color: var(--color-text);
  font-size: 0.82rem;
  outline: none;
}

.settings-input:focus {
  border-color: color-mix(in srgb, var(--color-blue) 42%, var(--color-border));
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
```

### 4.3 范围滑块 `.settings-range-input`

```css
.settings-range-input {
  flex: 1 1 auto;
  accent-color: #2563eb;
}
```

### 4.4 脚本编辑器 focus（多行 textarea）

```css
.script-editor:focus {
  border-color: color-mix(in srgb, var(--color-blue) 40%, var(--color-border));
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
```

### 4.5 表单控件设计原则

- **高度**：统一 40px（与 primary-button 保持一致）
- **radius**：10px
- **边框**：1px `--color-border`（#e2e8f0）
- **背景**：`rgba(255, 255, 255, 0.98)` 几乎纯白
- **Focus ring**：`0 0 0 3px rgba(59, 130, 246, 0.12)`（3px 外圈、12% alpha）+ 边框色加深
- **Outline**：`outline: none`（由 box-shadow 替代）

---

## 5. 徽章 Badge / 状态指示

### 5.1 `.status-badge` 基础

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}
```

### 5.2 语义色变体

```css
.status-badge-live   { color: var(--color-blue);  background: rgba(59,  130, 246, 0.10); }
.status-badge-good   { color: var(--color-green); background: rgba(16,  185, 129, 0.10); }
.status-badge-accent { color: var(--color-amber); background: rgba(245, 158,  11, 0.10); }
.status-badge-idle   { color: var(--color-muted); background: rgba(148, 163, 184, 0.10); }
```

### 5.3 脉冲呼吸点 `.status-badge-icon`

```css
.status-badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 6px;
  height: 6px;
  background: currentColor;
  box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 16%, transparent);
  animation: status-live-pulse 1.8s ease-in-out infinite;
}

@keyframes status-live-pulse {
  0%, 100% { opacity: 1;    transform: scale(1);    }
  50%      { opacity: 0.45; transform: scale(0.92); }
}
```

### 5.4 在线指示点

```css
.mission-node-online-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
}

.mission-node-online-dot-inline {
  width: 5px;
  height: 5px;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.10);
}
```

### 5.5 徽章设计原则

- **形状**：始终 `border-radius: 999px`（药丸形）
- **padding**：`4px 10px`（紧凑）
- **字号 / 字重**：0.7rem / 700
- **letter-spacing**：0.05em（小字也要清晰）
- **配色模式**：`color: <主色>` + `background: rgba(<主色>, 0.1)` + `border: 1px solid currentColor`
- **脉冲点**：`currentColor` + 4px 外发光圈（16% alpha）

---

## 6. 阴影分级（Elevation）

项目阴影不按 Material 标准命名，但可归纳为以下分级：

### 6.1 阴影等级表

| 级别 | 场景 | CSS |
|------|------|-----|
| **E0** | 无 | `none` |
| **E1** | 开关滑块、细小元素 | `0 1px 4px rgba(15, 23, 42, 0.18)` |
| **E2** | 次要卡片、浮于平面 | `0 3px 8px rgba(15, 23, 42, 0.05)` |
| **E3** | 按钮底、折叠按钮 | `0 4px 12px rgba(15, 23, 42, 0.08)` |
| **E4** | 折叠按钮 hover、Tab 激活 | `0 6px 16px rgba(15, 23, 42, 0.12)` |
| **E5** | 聊天卡、Legend | `0 10px 24px rgba(15, 23, 42, 0.08)` |
| **E6** | Mission Node 默认 | `0 12px 24px rgba(15, 23, 42, 0.07)` |
| **E7** | 气泡 Bubble | `0 14px 28px rgba(15, 23, 42, 0.08)` |
| **E8** | Settings Popover | `0 18px 40px rgba(15, 23, 42, 0.16)` |
| **E9** | Message Detail Modal | `0 28px 70px rgba(15, 23, 42, 0.22)` |

### 6.2 内阴影（Inset）— 高光与内凹

```css
/* 内顶部白色高光（卡片、玻璃面板） */
box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);

/* Phone/Robot 节点内部高光 + 底部微凹 */
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.45),
  inset 0 -10px 24px rgba(226, 232, 240, 0.18);

/* Bus 总线节点多层内高光 */
box-shadow:
  inset 0 0 0 1px rgba(255, 255, 255, 0.70),
  0 0 0 1px rgba(148, 163, 184, 0.16),
  0 0 10px rgba(96, 165, 250, 0.05),
  0 0 14px rgba(129, 140, 248, 0.04),
  0 4px 10px rgba(15, 23, 42, 0.04);
```

### 6.3 发光阴影（带颜色，呼吸用）

```css
/* Canvas Caption 卡片呼吸 —— 3 层彩色外发光 */
box-shadow:
  0 24px 54px rgba(15, 23, 42, 0.16),
  0 0 0 1px   rgba(255, 255, 255, 0.92),
  0 0 24px    rgba(14, 165, 233, 0.14),
  0 0 64px    rgba(34, 211, 238, 0.09),
  0 0 92px    rgba(99, 102, 241, 0.06);

/* 50% 关键帧时更强 */
box-shadow:
  0 30px 64px rgba(15, 23, 42, 0.18),
  0 0 0 1px   rgba(255, 255, 255, 0.95),
  0 0 34px    rgba(14, 165, 233, 0.22),
  0 0 84px    rgba(34, 211, 238, 0.14),
  0 0 122px   rgba(99, 102, 241, 0.10);
```

### 6.4 焦点环（Focus Ring）

```css
/* 表单聚焦 */
box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);

/* 激活节点外圈（组合） */
box-shadow:
  0 0 0 1px color-mix(in srgb, var(--node-tint) 28%, transparent),
  0 0 0 5px color-mix(in srgb, var(--node-tint)  8%, transparent),
  0 10px 24px -12px color-mix(in srgb, var(--node-tint) 24%, transparent);
```

### 6.5 阴影设计原则

- **深灰阴影主色**：`rgba(15, 23, 42, α)`（基础 slate-900）
- **层级越高 α 越大**：0.05 → 0.22
- **垂直偏移 ≈ 模糊半径 / 2-3**：例如 `0 12px 24px`
- **白色内高光**：几乎所有卡片顶部有 `inset 0 1px 0 rgba(255,255,255,0.45)` 营造"贴膜"质感
- **焦点环 3px / 12% alpha**：表单默认规格

---

## 7. 边框与圆角系统

### 7.1 圆角（radius）速查

| 值 | 用途 |
|---|------|
| `6px` | inline code、小标签 |
| `10px` | 按钮、输入框、icon button、关闭按钮 |
| `11px` | 侧栏 Tab、节点内部 |
| `12px` | 节点 Shell、小字段 |
| `14px` | 嵌入卡片、step-queue-item、event-row |
| `16px` | Settings popover、消息气泡（异形） |
| `20px` | Message Detail Modal |
| `22px` | 手机/机器人内部 |
| `24px` | 手机/机器人外壳、subdomain |
| `26px` | Canvas Caption（动态 scale） |
| `28px` | Region Domain |
| `999px` | 药丸、徽章、开关、在线点、折叠手柄 |

### 7.2 边框色 tokens

```css
/* 基础 */
border: 1px solid var(--color-border);              /* #e2e8f0 */

/* 浅灰层次 */
border: 1px solid rgba(203, 213, 225, 0.92);
border: 1px solid rgba(148, 163, 184, 0.22);

/* 蓝焦点（混合） */
border-color: color-mix(in srgb, var(--color-blue) 28%, var(--color-border));
border-color: color-mix(in srgb, var(--color-blue) 42%, var(--color-border));  /* focus */

/* 语义边框 */
.event-row-accent  { border-left-color: var(--color-amber); }
.event-row-good    { border-left-color: var(--color-green); }
.event-row-neutral { border-left-color: var(--color-blue); }
```

### 7.3 圆角原则

- 越"基础"的控件用越小的 radius（按钮 10、输入 10）
- 卡片层级越外、面积越大 radius 越大（12 → 14 → 16 → 20）
- 装饰类/图例/药丸统一 `999px`

---

## 8. 间距系统

### 8.1 常用值

| 场景 | 取值 |
|------|------|
| 图标组内 gap | `4px`, `6px` |
| 按钮内图标-文字 gap | `6px`, `8px`, `10px` |
| 控件行 gap | `8px`, `10px`, `12px` |
| 卡片内边距 | `10px – 14px` |
| 模态框内边距 | `18px – 20px` |
| 容器外边距 | `22px`, `28px` |

### 8.2 具体应用

```css
/* 按钮水平 padding */
padding: 0 20px;            /* primary */

/* 表单 padding */
padding: 10px 12px;         /* input */

/* 徽章 padding */
padding: 4px 10px;          /* status-badge */

/* 卡片 padding */
padding: 12px 12px;         /* mission-node */
padding: 12px 12px 12px 10px; /* step-queue-item */
padding: 14px;              /* settings-popout */

/* 模态 padding */
padding: 20px 20px 18px;    /* message-detail-modal */

/* 区域 padding */
padding: 18px 22px;         /* region-node */
padding: 13px 16px;         /* region-subdomain */
```

---

## 9. 过渡与动画

### 9.1 Duration 标准

| Duration | 典型场景 |
|----------|---------|
| `140ms` | 聊天项 hover（最快） |
| `180ms` / `0.2s` | 开关、按钮、输入 focus、tab |
| `200ms` | Plan 气泡进入 |
| `220ms` | 节点状态切换 |
| `260ms` | Canvas Caption 进场 |
| `320ms` | Canvas 内容 enter（较慢） |
| `1.15s – 1.8s` | 脉冲、呼吸类 |
| `4.2s` | Caption Aura 深呼吸 |

### 9.2 Easing 函数

```css
/* 常规 */
transition: all 0.2s;
transition: background 180ms ease;

/* 弹性进入（最常用） */
cubic-bezier(0.2, 0.8, 0.2, 1)       /* 180-220ms */

/* Caption 级大进场 */
cubic-bezier(0.16, 0.84, 0.26, 1)    /* 260ms */

/* 平缓退出 */
cubic-bezier(0.4, 0, 0.2, 1)         /* forwards 退场 */

/* 呼吸 */
ease-in-out                          /* 1.15-4.2s */

/* 动画循环 */
linear                               /* 边 dash 动画 0.55-1.2s */
```

### 9.3 核心 keyframes

```css
@keyframes status-live-pulse {
  0%, 100% { opacity: 1;    transform: scale(1); }
  50%      { opacity: 0.45; transform: scale(0.92); }
}

@keyframes bubble-in {
  from { opacity: 0; transform: translateY(6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}

@keyframes bubble-out {
  from { opacity: 1; transform: translateY(0)   scale(1); }
  to   { opacity: 0; transform: translateY(5px) scale(0.975); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes canvas-caption-in {
  from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.93); }
  68%  { opacity: 1; transform: translateX(-50%) translateY(-3px) scale(1.015); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
}
```

### 9.4 过渡设计原则

- **交互反馈**：180-220ms，`cubic-bezier(0.2, 0.8, 0.2, 1)`
- **大元素进场**：260ms，`cubic-bezier(0.16, 0.84, 0.26, 1)`（略过冲）
- **呼吸/脉冲**：`ease-in-out` 1.15-4.2s infinite
- **统一原则**：永远 `transition` 明确属性（避免 `all`），保持性能

---

## 10. 特殊浮层组件

### 10.1 设置 Popover `.settings-popout`

```css
.settings-popout {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 320px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--color-border);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  z-index: 30;
}
```

### 10.2 消息详情模态框 `.message-detail-modal`

```css
.message-detail-modal {
  width: min(760px, 100%);
  max-height: min(80vh, 860px);
  overflow-y: auto;
  padding: 20px 20px 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.92);
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.22);
}
```

---

## 11. 列表与卡片

### 11.1 步骤队列项 `.step-queue-item`

```css
.step-queue-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 20px;
  gap: 12px;
  padding: 12px 12px 12px 10px;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.82);
}

.step-queue-item-active {
  border-color: color-mix(in srgb, var(--color-blue) 30%, var(--color-border));
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.08), rgba(255, 255, 255, 0.95));
}

.step-queue-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.10);
  color: #2563eb;
  font-size: 0.9rem;
  font-weight: 800;
}
```

### 11.2 事件行 `.event-row`（Timeline）

```css
.event-row {
  display: flex;
  gap: 12px;
  padding: 10px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-left: 4px solid transparent;
}

.event-row-accent  { border-left-color: var(--color-amber); }
.event-row-good    { border-left-color: var(--color-green); }
.event-row-neutral { border-left-color: var(--color-blue);  }
```

### 11.3 列表卡片设计原则

- **Grid 布局**：`28px 1fr 20px` 三列（图标、内容、状态）
- **radius 14px**（中卡片专用）
- **激活态**：浅蓝渐变 + 蓝边框（30% 混合）
- **Timeline**：左 4px 语义色粗边 + 1px 灰边框

---

## 12. Chip / 小标签

### 12.1 通用 chip（节点内细节标签）

```css
.mission-node-detail-chip {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--node-tint) 9%, white);
  border:     1px solid color-mix(in srgb, var(--node-tint) 14%, rgba(148, 163, 184, 0.28));
  color: #334155;
  font-size: calc(0.56rem * var(--graph-font-scale, 1));
  font-weight: 700;
}
```

### 12.2 Chip 设计原则

- **形状**：药丸 `999px`
- **最小高度**：20px（适合行内文字高度）
- **padding**：`0 8px`（仅水平）
- **主色 9% 底 + 14% 边框**：视觉轻盈
- **文字**：`#334155` 中性深灰，不跟随主色（保持可读性）

---

## 13. 复现要点速查

### 13.1 "一眼认出本项目" 的视觉签名

1. **半透明白 + 玻璃态**：几乎所有面板 `rgba(255,255,255,0.90-0.98)`
2. **蓝色主色**：`#3b82f6`（主按钮、焦点、tab 激活）
3. **圆角阶梯**：按钮/输入 10 → 卡片 14 → 模态 20 → 药丸 999
4. **深灰阴影**：`rgba(15, 23, 42, α)` 基础色，α 跟随层级
5. **Focus ring**：统一 `0 0 0 3px rgba(59,130,246,0.12)`
6. **Inter 字体**：正文首选 Inter
7. **Uppercase + letter-spacing**：所有分类/kicker 标签
8. **药丸 Badge**：`currentColor` + 10% alpha 底 + 脉冲点
9. **过渡节奏**：交互 180-220ms、进场 260ms、呼吸 1.2-4.2s

### 13.2 关键工程技巧

- **CSS 变量覆盖**：`--node-tint`、`--graph-font-scale` 支持运行时缩放/染色
- **`color-mix(in srgb, ...)`**：大量用于主题色衍生，避免硬编码多个 alpha
- **统一过渡时长**：`180ms` / `220ms` 几乎贯穿所有交互
- **Outline 全部替换为 box-shadow**：确保圆角不被裁剪
- **inset 高光**：所有卡片顶部都有 `inset 0 1px 0 rgba(255,255,255,0.45)`

### 13.3 快速起手样式模板（复制即用）

```css
/* 一个"本项目风格"的卡片 */
.my-card {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 14px;
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.my-card:hover {
  border-color: color-mix(in srgb, var(--color-blue) 28%, var(--color-border));
  box-shadow:
    0 14px 30px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

/* 一个"本项目风格"的按钮 */
.my-button {
  height: 40px;
  padding: 0 20px;
  border-radius: 10px;
  border: 0;
  background: var(--color-blue);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.my-button:hover { opacity: 0.9; }

/* 一个"本项目风格"的徽章 */
.my-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid currentColor;
  color: var(--color-green);
  background: rgba(16, 185, 129, 0.10);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
```

---

**源文件**：`src/index.css`（2800+ 行）
**生成时间**：2026-04-13
