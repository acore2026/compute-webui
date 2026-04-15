<template>
  <BaseEdge
    :id="id"
    :path="edgePath[0]"
    :marker-end="markerEnd"
    :style="{
      stroke: color,
      color: color,
      strokeWidth: strokeWidth,
      strokeDasharray: dash || undefined,
      strokeLinecap: 'round',
      opacity: opacity,
      fill: 'none'
    }"
    :class="animationClass"
  />

  <!-- 流光 — 仅在激活/选中时显示 -->
  <template v-if="glow && isActive">
    <!-- 单向：forward / reverse -->
    <template v-if="direction !== 'bidirectional'">
      <path
        :d="edgePath[0]"
        fill="none"
        :stroke="color"
        :stroke-width="Math.max(strokeWidth + 1.2, 3.2)"
        stroke-linecap="round"
        pathLength="1"
        stroke-dasharray="0.18 0.82"
        :class="`edge-flow-${direction}`"
        :style="{
          filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 6px ${color})`,
          animationDuration: particleDuration,
          animationDelay: tailDelay,
          opacity: 0.55,
          pointerEvents: 'none'
        }"
      />
      <path
        :d="edgePath[0]"
        fill="none"
        stroke="#ffffff"
        :stroke-width="Math.max(strokeWidth + 0.8, 2.8)"
        stroke-linecap="round"
        pathLength="1"
        stroke-dasharray="0.035 0.965"
        :class="`edge-flow-${direction}`"
        :style="{
          filter: `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`,
          animationDuration: particleDuration,
          pointerEvents: 'none'
        }"
      />
    </template>

    <!-- 双向：从中点向两端扩散，左右各一束 head + tail，tail 用独立 keyframes 起点即对齐 -->
    <template v-else>
      <!-- 右侧 tail -->
      <path
        :d="edgePath[0]"
        fill="none"
        :stroke="color"
        :stroke-width="Math.max(strokeWidth + 1.2, 3.2)"
        stroke-linecap="round"
        pathLength="1"
        stroke-dasharray="0.18 0.82"
        class="edge-flow-right-half-tail"
        :style="{
          filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 6px ${color})`,
          animationDuration: particleDuration,
          opacity: 0.55,
          pointerEvents: 'none'
        }"
      />
      <!-- 右侧 head -->
      <path
        :d="edgePath[0]"
        fill="none"
        stroke="#ffffff"
        :stroke-width="Math.max(strokeWidth + 0.8, 2.8)"
        stroke-linecap="round"
        pathLength="1"
        stroke-dasharray="0.035 0.965"
        class="edge-flow-right-half-head"
        :style="{
          filter: `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`,
          animationDuration: particleDuration,
          pointerEvents: 'none'
        }"
      />
      <!-- 左侧 tail -->
      <path
        :d="edgePath[0]"
        fill="none"
        :stroke="color"
        :stroke-width="Math.max(strokeWidth + 1.2, 3.2)"
        stroke-linecap="round"
        pathLength="1"
        stroke-dasharray="0.18 0.82"
        class="edge-flow-left-half-tail"
        :style="{
          filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 6px ${color})`,
          animationDuration: particleDuration,
          opacity: 0.55,
          pointerEvents: 'none'
        }"
      />
      <!-- 左侧 head -->
      <path
        :d="edgePath[0]"
        fill="none"
        stroke="#ffffff"
        :stroke-width="Math.max(strokeWidth + 0.8, 2.8)"
        stroke-linecap="round"
        pathLength="1"
        stroke-dasharray="0.035 0.965"
        class="edge-flow-left-half-head"
        :style="{
          filter: `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`,
          animationDuration: particleDuration,
          pointerEvents: 'none'
        }"
      />
    </template>
  </template>

  <EdgeLabelRenderer v-if="showNote">
    <div
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${edgePath[1]}px, ${edgePath[2]}px)`,
        pointerEvents: 'none'
      }"
    >
      <span class="edge-note">{{ data.note }}</span>
    </div>
  </EdgeLabelRenderer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  BaseEdge, EdgeLabelRenderer,
  getBezierPath, getStraightPath, getSmoothStepPath,
  type Position
} from '@vue-flow/core'

const props = defineProps<{
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  data?: any
  markerEnd?: string
}>()

const kind  = computed(() => props.data?.kind ?? 'baseline')
const state = computed(() => props.data?.state ?? 'idle')
const plane = computed(() => props.data?.plane)
const tone  = computed(() => props.data?.tone)
const note  = computed(() => props.data?.note)
const direction = computed<'forward' | 'reverse' | 'bidirectional'>(() => props.data?.direction ?? 'forward')
const glow  = computed(() => !!props.data?.glow)

const pathType = computed<'bezier' | 'straight' | 'step' | 'smoothstep'>(
  () => props.data?.pathType ?? 'bezier'
)

const edgePath = computed(() => {
  const common = {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition
  }
  switch (pathType.value) {
    case 'straight':
      return getStraightPath(common)
    case 'step':
      return getSmoothStepPath({ ...common, borderRadius: 0 })
    case 'smoothstep':
      return getSmoothStepPath({ ...common, borderRadius: 12 })
    default:
      return getBezierPath({
        ...common,
        curvature: kind.value === 'wireless' ? 0.2 : kind.value === 'bus' ? 0.2 : 0.16
      })
  }
})

const isSelected = computed(() => state.value === 'selected')
const isActive   = computed(() => state.value === 'active' || isSelected.value)
const isControlPlane    = computed(() => plane.value === 'control' || kind.value === 'logic' || note.value === 'control')
const isDataPlane       = computed(() => plane.value === 'data')
const isWirelessDataPlane = computed(() => kind.value === 'wireless' && isDataPlane.value)

const customColor = computed<string | undefined>(() => props.data?.lineColor || undefined)
const customWidth = computed<number | undefined>(() => {
  const w = props.data?.lineWidth
  return typeof w === 'number' && w > 0 ? w : undefined
})
const customOpacity = computed<number | undefined>(() => {
  const o = props.data?.lineOpacity
  return typeof o === 'number' && o >= 0 && o <= 1 ? o : undefined
})

const color = computed(() => {
  if (state.value === 'idle') {
    if (customColor.value) return customColor.value
    if (kind.value === 'bus')      return '#bfd6e6'
    if (kind.value === 'wireless') return '#c7e8fb'
    return '#c3cedb'
  }
  if (tone.value) return tone.value
  if (kind.value === 'bus') return '#38bdf8'
  if (isControlPlane.value) return '#7c3aed'
  if (isDataPlane.value)    return '#f59e0b'
  if (kind.value === 'wireless') return '#0284c7'
  return '#10b981'
})

const strokeWidth = computed(() => {
  if (isSelected.value) {
    if (isWirelessDataPlane.value) return 3.4
    if (isDataPlane.value)         return 5.2
    if (isControlPlane.value)      return 2.7
    if (kind.value === 'bus')      return 3.05
    return 3.05
  }
  if (isActive.value) {
    if (isWirelessDataPlane.value) return 2.8
    if (isDataPlane.value)         return 4.7
    if (isControlPlane.value)      return 2.25
    if (kind.value === 'bus')      return 1.8
    return 1.9
  }
  // idle 状态允许用户自定义线宽；默认 2.5 (中)
  if (customWidth.value !== undefined) return customWidth.value
  return 2.5
})

const dash = computed(() => {
  if (isActive.value && isWirelessDataPlane.value) return '7 12'
  if (kind.value === 'wireless')                   return '3 4'
  if (isActive.value && isControlPlane.value)      return '6 7'
  if (isActive.value && isDataPlane.value)         return '14 10'
  if (isActive.value)                              return '11 8'
  return undefined
})

const opacity = computed(() => {
  if (isSelected.value) return 1
  if (isActive.value) {
    if (isWirelessDataPlane.value) return 0.9
    if (isDataPlane.value)         return 0.96
    if (isControlPlane.value)      return 0.92
    return 0.88
  }
  // idle 状态允许用户自定义不透明度；默认 0.75 (明显)
  if (customOpacity.value !== undefined) return customOpacity.value
  return 0.75
})

const animationClass = computed(() => {
  if (!isActive.value) return ''
  const dir = direction.value
  if (isControlPlane.value)      return `edge-control-animated-${dir}`
  if (isWirelessDataPlane.value) return `edge-wireless-data-animated-${dir}`
  if (isDataPlane.value)         return `edge-data-animated-${dir}`
  return `edge-animated-${dir}`
})

const showNote = computed(() => note.value && note.value !== 'control')

/* 流光滑段动画速度 */
const particleDuration = computed(() => {
  if (isControlPlane.value)      return '1.0s'
  if (isWirelessDataPlane.value) return '1.7s'
  if (isDataPlane.value)         return '1.3s'
  if (kind.value === 'bus')      return '1.5s'
  return '1.2s'
})

/* 拖尾延迟：使 tail 的"头端"贴合 head 的"尾端"
   forward: tail 在 head 之前位置 → 需要正 delay (tail 在时间上滞后)
   reverse: 反向滚动时 tail 天然在 head 身后（路径位置更大）→ 0 */
const tailDelay = computed(() => {
  if (direction.value === 'reverse') return '0s'
  const dur = parseFloat(particleDuration.value) || 1.2
  return `${(dur * 0.145).toFixed(3)}s`
})

</script>
