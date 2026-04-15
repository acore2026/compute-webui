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

    <!-- 上中 / 下中 -->
    <Handle id="in-top"     type="target" :position="Position.Top"    :style="{ left: '50%' }" />
    <Handle id="out-top"    type="source" :position="Position.Top"    :style="{ left: '50%' }" />
    <Handle id="in-bottom"  type="target" :position="Position.Bottom" :style="{ left: '50%' }" />
    <Handle id="out-bottom" type="source" :position="Position.Bottom" :style="{ left: '50%' }" />
    <Handle id="in-left"    type="target" :position="Position.Left"   :style="{ top: '50%' }" />
    <Handle id="out-right"  type="source" :position="Position.Right"  :style="{ top: '50%' }" />
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
</script>
