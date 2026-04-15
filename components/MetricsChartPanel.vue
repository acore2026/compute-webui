<template>
  <div class="metrics-chart-panel">
    <div v-if="showLoading" class="state-block">
      <div class="spinner"></div>
      <div class="state-text">加载指标…</div>
    </div>

    <template v-else-if="showEmpty">
      <div v-if="error" class="error-banner">
        <span class="error-text">{{ errorMessage }}</span>
        <button class="retry-btn" @click="onRetry">重试</button>
      </div>
      <div class="state-block">
        <div class="state-text state-empty">暂无指标数据</div>
      </div>
    </template>

    <template v-else>
      <div v-if="error" class="error-banner">
        <span class="error-text">{{ errorMessage }}（展示最近一次成功的数据）</span>
        <button class="retry-btn" @click="onRetry">重试</button>
      </div>

      <div class="chart-body">
        <MetricsLineChart
          :samples="samples"
          :series="seriesForMetric"
          :y-axis-label="config.yAxisLabel"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useMetricsHistory } from '~/composables/useMetricsHistory'
import type { MetricsSample } from '~/composables/useMetricsHistory'
import type { SeriesDef } from './MetricsLineChart.vue'

type MetricKey = 'e2e' | 'jitter' | 'compute' | 'fps'

interface MetricConfig {
  seriesKey: keyof MetricsSample
  label: string
  color: string
  yAxisLabel: string
}

const props = defineProps<{
  metric: MetricKey
}>()

const { samples, isLoading, error, refresh } = useMetricsHistory()

const METRIC_CONFIG: Record<MetricKey, MetricConfig> = {
  e2e:     { seriesKey: 'e2e_latency_ms',        label: 'E2E latency',     color: '#3b82f6', yAxisLabel: 'ms'  },
  jitter:  { seriesKey: 'jitter_ms',             label: 'Jitter',          color: '#f59e0b', yAxisLabel: 'ms'  },
  compute: { seriesKey: 'compute_latency_ms',    label: 'Compute latency', color: '#10b981', yAxisLabel: 'ms'  },
  fps:     { seriesKey: 'fps',                   label: 'FPS',             color: '#2563eb', yAxisLabel: 'fps' }
}

const config = computed(() => METRIC_CONFIG[props.metric])

const seriesForMetric = computed<SeriesDef[]>(() => [{
  key:   config.value.seriesKey,
  label: config.value.label,
  color: config.value.color
}])

const showLoading  = computed(() => isLoading.value && samples.value.length === 0 && !error.value)
const showEmpty    = computed(() => !isLoading.value && samples.value.length === 0)
const errorMessage = computed(() => (error.value ? (error.value.message || '请求失败') : ''))

function onRetry() {
  void refresh()
}
</script>

<style scoped>
.metrics-chart-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 6px 10px 8px;
  gap: 6px;
  overflow: hidden;
}

.state-block {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #64748b;
  min-height: 0;
}
.state-text {
  font-size: 0.78rem;
  letter-spacing: 0.02em;
}
.state-empty {
  opacity: 0.75;
}

.spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(148, 163, 184, 0.35);
  border-top-color: #3b82f6;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 10px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
  border-radius: var(--radius-btn, 6px);
  font-size: 0.72rem;
  flex: 0 0 auto;
}
.error-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.retry-btn {
  flex: 0 0 auto;
  padding: 3px 10px;
  font-size: 0.7rem;
  font-weight: 700;
  border: 1px solid rgba(185, 28, 28, 0.4);
  background: #fff;
  color: #b91c1c;
  border-radius: 999px;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}
.retry-btn:hover {
  background: #b91c1c;
  color: #fff;
}

.chart-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}
</style>
