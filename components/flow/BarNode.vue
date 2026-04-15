<template>
  <div class="bar-node-shell">
    <NodeResizer
      :is-visible="selected"
      :min-width="80"
      :min-height="28"
      :max-height="28"
      line-class="region-resizer-line"
      handle-class="region-resizer-handle"
    />
    <div
      class="bar-node-body"
      :style="{ '--bar-color': color, height: bodyHeight + 'px' }"
    ></div>

    <!-- 中 / 1/4 / 3/4 · 每边各有 source + target，支持 out-<side>-25 / in-<side>-75 等 id -->
    <template v-for="side in (['top','bottom','left','right'] as const)" :key="side">
      <template v-for="off in (['', '-25', '-75'] as const)" :key="side + off">
        <Handle
          :id="`in-${side}${off}`"
          type="target"
          :position="sidePos[side]"
          :style="barStyle(side, off)"
        />
        <Handle
          :id="`out-${side}${off}`"
          type="source"
          :position="sidePos[side]"
          :style="barStyle(side, off)"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'

const props = defineProps<{ data: any; selected?: boolean }>()
const color = computed(() => props.data?.color || '#64748b')
// 视觉厚度 (独立于节点拖拽区高度)
const bodyHeight = computed(() => {
  const v = Number(props.data?.height ?? 8)
  return isNaN(v) ? 8 : Math.max(2, Math.min(v, 26))
})

type Side = 'top' | 'bottom' | 'left' | 'right'
type Off  = '' | '-25' | '-75'
const sidePos: Record<Side, Position> = {
  top:    Position.Top,
  bottom: Position.Bottom,
  left:   Position.Left,
  right:  Position.Right
}
function barStyle(side: Side, off: Off) {
  const pct = off === '-25' ? '25%' : off === '-75' ? '75%' : '50%'
  const axis = (side === 'top' || side === 'bottom') ? 'left' : 'top'
  return { [axis]: pct } as Record<string, string>
}
</script>
