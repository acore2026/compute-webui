<template>
  <section class="panel flex flex-col h-full overflow-hidden">
    <div class="panel-header">
      <div class="flex items-center gap-2">
        <span>状态监控</span>
      </div>
      <div class="flex items-center gap-1.5 flex-wrap">
        <button
          v-for="t in tabs"
          :key="t.id"
          :class="['sidebar-tab', tab === t.id && 'sidebar-tab-active']"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-hidden">
      <MetricsChartPanel :metric="tab" class="h-full" />
    </div>
  </section>
</template>

<script setup lang="ts">
type TabId = 'e2e' | 'jitter' | 'compute' | 'processing' | 'fps'

const tabs: { id: TabId; label: string }[] = [
  { id: 'e2e',        label: 'E2E latency'  },
  { id: 'jitter',     label: 'Jitter'       },
  { id: 'compute',    label: 'Comp latency' },
  { id: 'processing', label: 'Proc latency' },
  { id: 'fps',        label: 'FPS'          }
]

const tab = ref<TabId>('e2e')
</script>
