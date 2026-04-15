<template>
  <div
    class="mission-node-shell"
    :class="[
      shellClass,
      data.active && 'mission-node-active-shell',
      data.flashActive && 'mission-node-flash-shell'
    ]"
    :style="{ '--node-tint': meta.tint, ...(data.appearance === 'gateway' ? { width: '100%' } : {}) }"
  >
    <!-- Plan 清单气泡（较大，置于节点上方） -->
    <div v-if="data.plan" class="mission-node-plan">
      <div class="mission-node-plan-header">
        <LoaderCircle :size="12" class="mission-node-plan-icon" />
        <span class="mission-node-plan-title">PLAN</span>
        <span class="mission-node-plan-name">{{ data.plan.title }}</span>
      </div>
      <div class="mission-node-plan-list">
        <div
          v-for="item in data.plan.items"
          :key="item.id"
          class="mission-node-plan-item"
          :class="[
            item.phase === 'processing' && 'mission-node-plan-item-processing',
            item.phase === 'done'       && 'mission-node-plan-item-done'
          ]"
        >
          <span class="mission-node-plan-check" :class="`mission-node-plan-check-${item.phase}`">
            <LoaderCircle v-if="item.phase === 'processing'" :size="9" class="mission-node-plan-check-icon" />
            <span v-else-if="item.phase === 'done'">✓</span>
          </span>
          <div class="mission-node-plan-copy">
            <span class="mission-node-plan-text">{{ item.label }}</span>
            <span class="mission-node-plan-phase">{{ item.phase }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息气泡 -->
    <div
      v-if="data.message"
      class="mission-node-bubble"
      :class="data.messageState === 'done' && 'mission-node-bubble-done'"
    >
      <component :is="bubbleIcon.comp" :size="12"
        :class="['mission-node-bubble-icon', bubbleIcon.done && 'mission-node-bubble-icon-done']" />
      <span>{{ data.message }}</span>
    </div>

    <div
      class="mission-node"
      :class="[
        data.active && 'mission-node-active',
        data.flashActive && 'mission-node-flash'
      ]"
    >
      <div class="mission-node-icon">
        <component :is="meta.icon" :size="16" stroke-width="2" />
      </div>
      <div class="mission-node-text">
        <span class="mission-node-label">{{ data.label }}</span>
        <span v-if="data.role" class="mission-node-role">{{ data.role }}</span>
      </div>
    </div>

    <!-- Handles -->
    <Handle
      v-for="h in handles"
      :key="h.id"
      :id="h.id"
      :type="h.type"
      :position="h.position"
      :style="h.style"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import {
  LoaderCircle, CheckCircle2, Radio, Sparkles, BrainCircuit, ScanSearch
} from 'lucide-vue-next'
import { kindMeta, type NodeKind } from './kindMeta'

const props = defineProps<{ data: any }>()

const meta = computed(() => kindMeta[props.data.kind as NodeKind] || kindMeta.service)

const shellClass = computed(() => {
  switch (props.data.appearance) {
    case 'agent':   return 'mission-node-agent-shell'
    case 'gateway': return 'mission-node-gateway-shell'
    case 'pill':    return 'mission-node-pill-shell'
    default: return ''
  }
})

/** 气泡图标映射 */
const bubbleIcon = computed<{ comp: any; done: boolean }>(() => {
  const icon = props.data?.messageIcon
  const state = props.data?.messageState
  if (icon === 'radio')    return { comp: Radio,         done: false }
  if (icon === 'sparkles') return { comp: Sparkles,      done: false }
  if (icon === 'brain')    return { comp: BrainCircuit,  done: false }
  if (icon === 'scan')     return { comp: ScanSearch,    done: false }
  if (icon === 'done')     return { comp: CheckCircle2,  done: true  }
  if (icon === 'spinner')  return { comp: LoaderCircle,  done: false }
  return state === 'done'
    ? { comp: CheckCircle2, done: true }
    : { comp: LoaderCircle, done: false }
})

interface H { id: string; type: 'source' | 'target'; position: Position; style?: Record<string, string> }

const handles = computed<H[]>(() => {
  const list: H[] = []
  const ids: string[] = props.data.handles || ['in-top', 'out-bottom']
  for (const id of ids) {
    const isOut = id.startsWith('out')
    const t: 'source' | 'target' = isOut ? 'source' : 'target'
    let pos = Position.Top
    let style: Record<string, string> | undefined
    if (id.includes('top'))    pos = Position.Top
    if (id.includes('bottom')) pos = Position.Bottom
    if (id.includes('left'))   pos = Position.Left
    if (id.includes('right'))  pos = Position.Right
    if (id === 'out-top-left' || id === 'in-top-left')  { pos = Position.Top; style = { left: '38%' } }
    if (id === 'out-top-right' || id === 'in-top-right'){ pos = Position.Top; style = { left: '68%' } }
    if (id === 'out-bottom-left')  { pos = Position.Bottom; style = { left: '38%' } }
    if (id === 'out-bottom-right') { pos = Position.Bottom; style = { left: '68%' } }
    if (id === 'in-left-top')      { pos = Position.Left;   style = { top: '38%' } }
    if (id === 'in-left-bottom')   { pos = Position.Left;   style = { top: '68%' } }
    if (id === 'out-right-top')    { pos = Position.Right;  style = { top: '38%' } }
    if (id === 'out-right-bottom') { pos = Position.Right;  style = { top: '68%' } }
    list.push({ id, type: t, position: pos, style })
  }
  return list
})
</script>
