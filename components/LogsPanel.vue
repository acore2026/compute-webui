<template>
  <section class="panel flex flex-col h-full overflow-hidden">
    <div class="panel-header">
      <div class="flex items-center gap-2">
        <span class="title-kicker">Telemetry</span>
        <span>{{ tab === 'logs' ? '流程日志' : '状态指标' }}</span>
      </div>
      <!-- 自定义 Tabs，对齐 §3.4 -->
      <div class="flex items-center gap-1.5">
        <button
          :class="['sidebar-tab', tab === 'logs' && 'sidebar-tab-active']"
          @click="tab = 'logs'"
        >
          日志
        </button>
        <button
          :class="['sidebar-tab', tab === 'metrics' && 'sidebar-tab-active']"
          @click="tab = 'metrics'"
        >
          指标
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-hidden">
      <!-- 日志 — 固定展示最新 4 条，均分容器高度 -->
      <div v-show="tab === 'logs'" class="log-list">
        <div
          v-for="(log, idx) in logs.slice(0, 4)"
          :key="log.id"
          class="log-row"
          :class="{ 'log-row-active': idx === 0 }"
        >
          <span class="log-mark" :class="markClass(log.level)">
            {{ levelMark(log.level) }}
          </span>
          <span class="log-level" :class="levelTextClass(log.level)">{{ log.level }}</span>
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
          <span class="log-id">#{{ log.id }}</span>
        </div>
      </div>

      <!-- 指标 -->
      <div v-show="tab === 'metrics'" class="h-full overflow-y-auto scrollbar-thin p-4 grid grid-cols-2 gap-3">
        <div v-for="m in metrics" :key="m.label" class="metric-card">
          <div class="metric-label">{{ m.label }}</div>
          <div class="flex items-baseline mt-1">
            <span class="metric-value tabular-nums">{{ m.value }}</span>
            <span class="metric-unit">{{ m.unit }}</span>
          </div>
          <div
            class="mt-3 rounded-full overflow-hidden"
            style="height: 6px; background: rgba(148, 163, 184, 0.18);"
          >
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{ width: m.percent + '%', background: m.color }"
            ></div>
          </div>
          <div class="mt-2 flex items-center justify-between" style="font-size: 0.68rem; color: #64748b; font-weight: 600;">
            <span class="font-mono tracking-wider">{{ m.percent }}%</span>
            <span class="font-mono">{{ m.trend }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.log-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  height: 100%;
  overflow: hidden;
}
.log-row {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  grid-template-columns: 20px 44px 60px 1fr 40px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-btn);
  background: rgba(255, 255, 255, 0.82);
  font-size: 0.74rem;
  line-height: 1.2;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}
.log-row:hover {
  border-color: color-mix(in srgb, var(--color-blue) 24%, var(--color-border));
}
.log-row-active {
  border-color: color-mix(in srgb, var(--color-blue) 30%, var(--color-border));
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.08), rgba(255, 255, 255, 0.95));
}
.log-mark {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
}
.log-mark-info  { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
.log-mark-ok    { background: rgba(16, 185, 129, 0.12); color: #059669; }
.log-mark-warn  { background: rgba(245, 158, 11, 0.14); color: #b45309; }
.log-mark-error { background: rgba(239, 68, 68, 0.12);  color: #b91c1c; }

.log-level {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.log-time {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.68rem;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
}
.log-message {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.74rem;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.log-id {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.64rem;
  color: var(--color-muted);
  text-align: right;
}
</style>

<script setup lang="ts">
interface LogItem { id: number; time: string; level: 'INFO' | 'WARN' | 'ERROR' | 'OK'; message: string }

const tab = ref<'logs' | 'metrics'>('logs')
const logs = ref<LogItem[]>([])
let counter = 0
let timer: ReturnType<typeof setInterval> | null = null

const samples: Array<Pick<LogItem, 'level' | 'message'>> = [
  { level: 'INFO', message: '接收到新帧 frame_id=10231，开始预处理…' },
  { level: 'OK',   message: '目标检测完成，识别 3 个对象 (耗时 42ms)' },
  { level: 'INFO', message: '推送结果到下游服务 /api/result' },
  { level: 'WARN', message: 'GPU 负载偏高 87%，启动节流策略' },
  { level: 'ERROR', message: '帧 10198 解码失败，已跳过' }
]

function levelTextClass(level: string) {
  return {
    INFO:  'text-[#2563eb]',
    OK:    'text-[#059669]',
    WARN:  'text-[#b45309]',
    ERROR: 'text-[#b91c1c]'
  }[level] || 'text-ink-700'
}
function markClass(level: string) {
  return {
    INFO:  'log-mark-info',
    OK:    'log-mark-ok',
    WARN:  'log-mark-warn',
    ERROR: 'log-mark-error'
  }[level] || 'log-mark-info'
}
function levelMark(level: string) {
  return ({ INFO: 'i', OK: '✓', WARN: '!', ERROR: '×' } as Record<string, string>)[level] || '•'
}

function pushLog() {
  const s = samples[Math.floor(Math.random() * samples.length)]
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  logs.value.unshift({
    id: ++counter,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    level: s.level,
    message: s.message
  })
  if (logs.value.length > 200) logs.value.pop()
}

const metrics = ref([
  { label: 'FPS',         value: 25.6, unit: 'f/s',    percent: 64, color: '#3b82f6', trend: '↗ +1.2' },
  { label: '推理延迟',    value: 42,   unit: 'ms',     percent: 35, color: '#10b981', trend: '↘ -3' },
  { label: 'GPU 使用率',  value: 78,   unit: '%',      percent: 78, color: '#f59e0b', trend: '↗ +5' },
  { label: '队列积压',    value: 6,    unit: 'frames', percent: 20, color: '#7c3aed', trend: '→ 0' }
])

onMounted(() => {
  for (let i = 0; i < 6; i++) pushLog()
  timer = setInterval(pushLog, 2200)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>
