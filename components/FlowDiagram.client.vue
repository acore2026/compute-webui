<template>
  <section class="panel flex flex-col h-full overflow-hidden">
    <div class="panel-header">
      <div class="flex items-center gap-2">
        <span>架构图</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          v-for="v in viewTabs"
          :key="v.id"
          :class="['sidebar-tab', activeView === v.id && 'sidebar-tab-active']"
          @click="switchView(v.id)"
        >
          {{ v.label }}
        </button>
      </div>
    </div>

    <div class="flex-1 relative">
      <!-- STAGE 悬浮条：可拖拽，位置保存到 server state -->
      <div
        v-if="nodes.length > 0"
        class="canvas-caption-card text-center"
        :key="captionKey"
        :style="{ '--caption-top': captionTop + 'px' }"
        @mousedown="onCaptionDragStart"
        title="拖拽调整位置 (保存后持久化)"
      >
        <div class="canvas-caption-kicker">{{ caption.kicker }}</div>
        <h2 class="canvas-caption-title">{{ caption.title }}</h2>
        <div v-if="caption.phase" class="canvas-caption-meta justify-center">
          {{ caption.phase }}
        </div>
      </div>

      <!-- 空态 -->
      <div v-if="nodes.length === 0" class="absolute inset-0 grid place-items-center z-20 pointer-events-none">
        <div class="text-center pointer-events-auto">
          <div
            class="w-16 h-16 rounded-full grid place-items-center mx-auto mb-4"
            style="background: rgba(59, 130, 246, 0.10);"
          >
            <el-icon :size="32" color="#3b82f6"><Connection /></el-icon>
          </div>
          <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-text);">
            尚未创建架构图
          </div>
          <div class="mt-1 text-ink-500" style="font-size: 0.76rem;">
            前往编辑器创建架构图
          </div>
        </div>
      </div>

      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :node-types="nodeTypes"
        :edge-types="edgeTypes"
        :default-viewport="{ x: -22, y: 12, zoom: 0.78 }"
        :min-zoom="0.4"
        :max-zoom="2"
        :nodes-draggable="false"
        :nodes-connectable="false"
        :elements-selectable="false"
        :elevate-nodes-on-select="false"
        :elevate-edges-on-select="false"
        fit-view-on-init
        class="!bg-white"
      >
        <Background :gap="40" :size="1" pattern-color="#f1f5f9" />
        <Controls />
      </VueFlow>

      <div v-if="legend.visible && legend.items.length" class="canvas-legend">
        <span
          v-for="item in legend.items"
          :key="item.id"
          class="canvas-legend-pill"
          :style="{ '--lg-color': item.color } as any"
        >
          {{ item.label }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { VueFlow, type Node, type Edge } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { Connection } from '@element-plus/icons-vue'

import MissionNode from './flow/MissionNode.vue'
import MissionEdge from './flow/MissionEdge.vue'
import RegionNode from './flow/RegionNode.vue'
import BusNode from './flow/BusNode.vue'
import BarNode from './flow/BarNode.vue'
import {
  loadAll,
  pushRemoteState,
  DEFAULT_VIEW,
  type SequenceStep,
  type LegendConfig,
  type ViewId
} from './flow/storage'

const nodeTypes = {
  mission: markRaw(MissionNode),
  region:  markRaw(RegionNode),
  bus:     markRaw(BusNode),
  bar:     markRaw(BarNode)
}
const edgeTypes = { mission: markRaw(MissionEdge) }

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const sequence = ref<SequenceStep[]>([])
const legend = ref<LegendConfig>({ visible: false, items: [] })
const captionTop = ref<number>(40)

const viewTabs: { id: ViewId; label: string }[] = [
  { id: 'public-cloud', label: '公有云' },
  { id: 'core-network', label: '核心网' }
]
const activeView = ref<ViewId>(DEFAULT_VIEW)

async function hydrate(view: ViewId) {
  const all = await loadAll(view)
  nodes.value = all.topology.nodes.map(n => {
    if (n.type !== 'mission') return { ...n }
    const d = (n.data || {}) as any
    const cleaned: any = { ...d }
    cleaned.active = false
    cleaned.flashActive = false
    delete cleaned.message
    delete cleaned.messageIcon
    delete cleaned.messageState
    delete cleaned.plan
    return { ...n, data: cleaned }
  })
  edges.value = all.topology.edges.map(e => ({
    ...e, data: { ...((e.data as any) || {}) }
  }))
  sequence.value = all.sequence
  legend.value = all.legend
  captionTop.value = all.captionTop
}
async function switchView(next: ViewId) {
  if (next === activeView.value) return
  // 停掉演示、清除高亮、释放 baseSnap，避免跨视图污染
  timers.forEach(clearTimeout); timers = []
  baseSnap = null
  activeView.value = next
  caption.value = { ...DEFAULT_CAPTION }
  captionKey.value++
  await hydrate(next)
  hasSeq.value = !!sequence.value.length
  hasNodes.value = nodes.value.length > 0
}

// ---- Caption 拖拽（位置保存到 server state） ----
let saveCaptionTimer: any = null
function saveCaptionTopDebounced() {
  clearTimeout(saveCaptionTimer)
  const view = activeView.value
  saveCaptionTimer = setTimeout(() => {
    pushRemoteState({
      topology: { nodes: nodes.value, edges: edges.value },
      sequence: sequence.value,
      legend:   legend.value,
      captionTop: captionTop.value
    }, view)
  }, 500)
}
function onCaptionDragStart(e: MouseEvent) {
  const startY = e.clientY
  const startTop = captionTop.value
  e.preventDefault()
  const onMove = (ev: MouseEvent) => {
    const dy = ev.clientY - startY
    captionTop.value = Math.max(8, Math.min(startTop + dy, 600))
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    saveCaptionTopDebounced()
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

const missionNodeCount = computed(() => nodes.value.filter(n => n.type === 'mission').length)

const DEFAULT_CAPTION = {
  kicker: 'READY',
  title: '等待设备接入',
  phase: '已就绪'
}
const caption = ref({ ...DEFAULT_CAPTION })
const captionKey = ref(0)

function setCaption(c: Partial<typeof caption.value>) {
  caption.value = { ...caption.value, ...c }
  captionKey.value++
}

function clearHighlight() {
  nodes.value = nodes.value.map(n => {
    if (n.type !== 'mission') return { ...n }
    const d = { ...(n.data || {}) } as any
    d.active = false
    d.flashActive = false
    // 每次进入 READY 都彻底擦掉 step 临时注入的气泡 / 清单
    delete d.message
    delete d.messageIcon
    delete d.messageState
    delete d.plan
    return { ...n, data: d }
  })
  edges.value = edges.value.map(e => ({
    ...e,
    data: { ...((e.data as any) || {}), state: 'idle' }
  }))
}

let baseSnap: { nodes: Node[]; edges: Edge[] } | null = null
function snapshot() {
  baseSnap = {
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    edges: JSON.parse(JSON.stringify(edges.value))
  }
}
function restore() {
  if (!baseSnap) return
  nodes.value = baseSnap.nodes
  edges.value = baseSnap.edges
  baseSnap = null
}

// 纯"动画态"字段：每个 stage 独立，base 上的取值不 leak 到 stage。
const EDGE_ANIM_ONLY = new Set(['state', 'direction', 'glow'])
const NODE_ANIM_ONLY = new Set([
  'active', 'flashActive', 'message', 'messageIcon', 'messageState', 'plan'
])
function stripKeys<T extends Record<string, any>>(obj: T, keys: Set<string>): T {
  const out: Record<string, any> = {}
  for (const k of Object.keys(obj)) {
    if (!keys.has(k)) out[k] = (obj as any)[k]
  }
  return out as T
}

function applyStep(step: SequenceStep) {
  if (!baseSnap) snapshot()
  setCaption({ kicker: step.kicker, title: step.title, phase: step.phase })
  const base = baseSnap!
  const nodeS = (step as any).nodeSettings || {}
  nodes.value = base.nodes.map(n => {
    if (n.type !== 'mission') return { ...n, data: { ...(n.data || {}) } }
    const isActive = step.nodes.includes(n.id)
    const baseData = (n.data || {}) as any
    const baseVisual = stripKeys(baseData, NODE_ANIM_ONLY)
    const ov = (nodeS[n.id] || {}) as Record<string, any>
    const next: any = {
      ...baseVisual,
      ...ov,
      active: ov.active ?? isActive,
      flashActive: ov.flashActive ?? isActive
    }
    if ('plan' in ov && ov.plan === null) delete next.plan
    return { ...n, data: next }
  })
  const settings = step.edgeSettings || {}
  edges.value = base.edges.map(e => {
    const baseData = (e.data as any) || {}
    const baseVisual = stripKeys(baseData, EDGE_ANIM_ONLY)
    const override = settings[e.id] as Record<string, any> | undefined
    const highlighted = step.edges.includes(e.id) || !!override
    if (!highlighted) {
      return { ...e, data: { ...baseVisual, state: 'idle', glow: false } }
    }
    return {
      ...e,
      data: {
        ...baseVisual,
        ...(override || {}),
        state:     override?.state     || 'selected',
        direction: override?.direction || 'forward',
        glow:      override?.glow      ?? false
      }
    }
  })
}

let timers: ReturnType<typeof setTimeout>[] = []
// 通过后端广播 stage — 前端统一通过 SSE 监听 (见下方 onStageFromBackend)
async function pushStageToBackend(idx: number) {
  try {
    const r = await fetch(`/api/stage/set?idx=${idx}`, { method: 'POST' })
    if (!r.ok) throw new Error('status ' + r.status)
  } catch (e) {
    console.warn('[stage] push failed, fallback local', e)
    if (idx < 0) { restore(); setCaption({ ...DEFAULT_CAPTION }) }
    else if (idx < sequence.value.length) applyStep(sequence.value[idx])
  }
}

function simulate() {
  if (!sequence.value.length) return
  timers.forEach(clearTimeout); timers = []
  restore(); snapshot()
  // 按 1.5s 间隔依次 POST 给后端；后端广播，SSE 回来触发 applyStep
  sequence.value.forEach((_, idx) => {
    const t = setTimeout(() => pushStageToBackend(idx), idx * 1500)
    timers.push(t)
  })
  // 结束：回到 idle
  const endT = setTimeout(
    () => pushStageToBackend(-1),
    sequence.value.length * 1500 + 1500,
  )
  timers.push(endT)
}

function resetHighlight() {
  timers.forEach(clearTimeout); timers = []
  restore()
  setCaption({ ...DEFAULT_CAPTION })
}

// 注册到 header 共享 actions
const { simulate: simRef, reset: resetRef, hasSeq, hasNodes } = useFlowActions()

// ---- 后端 stage push (SSE) ----
let stageEs: EventSource | null = null
function connectStageStream() {
  try {
    stageEs = new EventSource('/api/stage/stream')
    stageEs.onmessage = (ev) => {
      const idx = Number(ev.data)
      console.log('[stage sse]', ev.data, 'idx=', idx, 'seqLen=', sequence.value.length)
      if (!Number.isFinite(idx)) return
      if (idx < 0 || idx >= sequence.value.length) {
        restore(); setCaption({ ...DEFAULT_CAPTION })
        return
      }
      if (!baseSnap) snapshot()
      applyStep(sequence.value[idx])
    }
    stageEs.onopen = () => console.log('[stage sse] opened')
    stageEs.onerror = () => {
      // EventSource 会自动重连，这里不做额外处理
    }
  } catch (e) {
    console.warn('[stage] SSE unavailable', e)
  }
}

onMounted(async () => {
  await hydrate(activeView.value)
  simRef.value = simulate
  resetRef.value = resetHighlight
  hasSeq.value = !!sequence.value.length
  hasNodes.value = nodes.value.length > 0
  // 重置后端 stage 状态，避免刷新后停留在上次播放的某个 stage
  fetch('/api/stage/set?idx=-1', { method: 'POST' }).catch(() => {})
  connectStageStream()
})
watch(sequence, v => { hasSeq.value = !!v.length }, { deep: true })
watch(nodes, v => { hasNodes.value = v.length > 0 }, { deep: true })

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  simRef.value = null
  resetRef.value = null
  hasSeq.value = false
  hasNodes.value = false
  if (stageEs) { stageEs.close(); stageEs = null }
})
</script>
