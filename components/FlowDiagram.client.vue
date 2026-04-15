<template>
  <section class="panel flex flex-col h-full overflow-hidden">
    <div class="panel-header">
      <div class="flex items-center gap-2">
        <span class="title-kicker">Topology</span>
        <span>架构图</span>
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
import { loadAll, pushRemoteState, type SequenceStep, type LegendConfig } from './flow/storage'

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

// 初始化：异步从 server 拉取，剥离演示残留（气泡、清单也一并清掉）
async function hydrate() {
  const all = await loadAll()
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
    ...e, data: { ...((e.data as any) || {}), state: 'idle' }
  }))
  sequence.value = all.sequence
  legend.value = all.legend
  captionTop.value = all.captionTop
}
hydrate()

// ---- Caption 拖拽（位置保存到 server state） ----
let saveCaptionTimer: any = null
function saveCaptionTopDebounced() {
  clearTimeout(saveCaptionTimer)
  saveCaptionTimer = setTimeout(() => {
    pushRemoteState({
      topology: { nodes: nodes.value, edges: edges.value },
      sequence: sequence.value,
      legend:   legend.value,
      captionTop: captionTop.value
    })
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

function applyStep(step: SequenceStep) {
  if (!baseSnap) snapshot()
  setCaption({ kicker: step.kicker, title: step.title, phase: step.phase })
  const base = baseSnap!
  const nodeS = (step as any).nodeSettings || {}
  nodes.value = base.nodes.map(n => {
    if (n.type !== 'mission') return { ...n, data: { ...(n.data || {}) } }
    const isActive = step.nodes.includes(n.id)
    const baseData = (n.data || {}) as any
    const ov = nodeS[n.id] || {}
    const next: any = {
      ...baseData,
      active: ov.active ?? isActive,
      flashActive: ov.flashActive ?? isActive
    }
    if (ov.message !== undefined)      next.message = ov.message
    if (ov.messageIcon !== undefined)  next.messageIcon = ov.messageIcon
    if (ov.messageState !== undefined) next.messageState = ov.messageState
    if ('plan' in ov) {
      if (ov.plan === null) delete next.plan
      else next.plan = ov.plan
    }
    return { ...n, data: next }
  })
  const settings = step.edgeSettings || {}
  edges.value = base.edges.map(e => {
    const baseData = (e.data as any) || {}
    const override = settings[e.id]
    const highlighted = step.edges.includes(e.id) || !!override
    if (!highlighted) {
      return { ...e, data: { ...baseData, state: 'idle' } }
    }
    return {
      ...e,
      data: {
        ...baseData,
        state: override?.state || 'selected',
        direction: override?.direction ?? baseData.direction ?? 'forward',
        glow:      override?.glow      ?? baseData.glow      ?? false
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
    if (idx < 0) { restore(); clearHighlight(); setCaption({ ...DEFAULT_CAPTION }) }
    else if (idx < sequence.value.length) applyStep(sequence.value[idx])
  }
}

function simulate() {
  if (!sequence.value.length) return
  timers.forEach(clearTimeout); timers = []
  restore(); clearHighlight(); snapshot()
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
  clearHighlight()
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
        restore(); clearHighlight(); setCaption({ ...DEFAULT_CAPTION })
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

onMounted(() => {
  simRef.value = simulate
  resetRef.value = resetHighlight
  hasSeq.value = !!sequence.value.length
  hasNodes.value = nodes.value.length > 0
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
