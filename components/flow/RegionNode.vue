<template>
  <div class="region-node" :class="[colorClass, patternClass]">
    <NodeResizer
      :is-visible="selected"
      :min-width="180"
      :min-height="120"
      line-class="region-resizer-line"
      handle-class="region-resizer-handle"
    />
    <div class="region-node-title">{{ data.label }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeResizer } from '@vue-flow/node-resizer'

const props = defineProps<{ data: any; selected?: boolean }>()

const colorClass = computed(() => {
  switch (props.data.variant) {
    case 'external': return 'region-color-external'
    case 'mno':      return 'region-color-mno'
    case 'access':   return 'region-color-access'
    default: return ''
  }
})

/** pattern: 'none' | 'grid' | 'dots'
 *  未指定时按老行为兼容：mno 用 dots，其它用 grid */
const patternClass = computed(() => {
  const p = props.data.pattern ?? (props.data.variant === 'mno' ? 'dots' : 'grid')
  if (p === 'grid') return 'region-pattern-grid'
  if (p === 'dots') return 'region-pattern-dots'
  return ''
})
</script>
