<template>
  <div class="bus-node-shell" :style="{ width: '100%', height: '100%' }">
    <NodeResizer
      :is-visible="selected"
      :min-width="200"
      :min-height="20"
      :max-height="48"
      line-class="region-resizer-line"
      handle-class="region-resizer-handle"
    />
    <div class="bus-backbone">
      <span class="bus-node-pill">
        <Sparkles :size="12" />
        {{ data.label || 'AGENT BUS' }}
      </span>
    </div>
    <Handle id="abi-top" type="source" :position="Position.Top" :style="{ left: '50%' }" />
    <Handle id="abi-bottom" type="source" :position="Position.Bottom" :style="{ left: '50%' }" />
    <Handle v-for="x in [15, 35, 55, 75, 90]" :key="'top-'+x"
      :id="'abi-top-' + x" type="source" :position="Position.Top" :style="{ left: x + '%' }" />
    <Handle v-for="x in [15, 35, 55, 75, 90]" :key="'bot-'+x"
      :id="'abi-bottom-' + x" type="source" :position="Position.Bottom" :style="{ left: x + '%' }" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import { Sparkles } from 'lucide-vue-next'

defineProps<{ data: any; selected?: boolean }>()
</script>
