<template>
  <div class="metrics-chart-wrapper">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Filler
} from 'chart.js'
import type { ChartConfiguration } from 'chart.js'
import type { MetricsSample } from '~/composables/useMetricsHistory'

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Filler)

export interface SeriesDef {
  key: keyof MetricsSample
  label: string
  color: string
}

const props = defineProps<{
  samples: MetricsSample[]
  series: SeriesDef[]
  yAxisLabel: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatHMS(msValue: number) {
  const d = new Date(msValue)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

function buildDatasets(samples: MetricsSample[], series: SeriesDef[]) {
  return series.map((s) => ({
    label: s.label,
    data: samples.map((sample) => ({
      x: sample.timestamp * 1000,
      y: Number(sample[s.key])
    })),
    borderColor: s.color,
    backgroundColor: s.color,
    borderWidth: 1.4,
    pointRadius: 0,
    pointHoverRadius: 3,
    tension: 0.15,
    fill: false
  }))
}

function xBounds(samples: MetricsSample[]) {
  if (samples.length === 0) return { min: undefined, max: undefined }
  return {
    min: samples[0].timestamp * 1000,
    max: samples[samples.length - 1].timestamp * 1000
  }
}

function buildConfig(): ChartConfiguration {
  const { min, max } = xBounds(props.samples)
  return {
    type: 'line',
    data: {
      datasets: buildDatasets(props.samples, props.series)
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      parsing: false,
      layout: { padding: { top: 4, right: 4, bottom: 0, left: 0 } },
      scales: {
        x: {
          type: 'linear',
          min,
          max,
          bounds: 'data',
          offset: false,
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 5,
            padding: 2,
            callback: (value) => formatHMS(Number(value)),
            font: { family: "'IBM Plex Mono', monospace", size: 10 },
            color: '#94a3b8'
          },
          grid: { display: false },
          border: { color: 'rgba(148, 163, 184, 0.22)' }
        },
        y: {
          type: 'linear',
          beginAtZero: false,
          grace: '8%',
          ticks: {
            maxTicksLimit: 4,
            padding: 4,
            font: { family: "'IBM Plex Mono', monospace", size: 10 },
            color: '#94a3b8'
          },
          grid: { color: 'rgba(148, 163, 184, 0.10)', drawTicks: false },
          border: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          padding: 8,
          titleFont: { family: "'IBM Plex Mono', monospace", size: 10 },
          bodyFont: { family: "'IBM Plex Mono', monospace", size: 11 },
          callbacks: {
            title: (items) => (items.length ? formatHMS(Number(items[0].parsed.x)) : ''),
            label: (item) => `${item.parsed.y}`
          }
        }
      }
    }
  }
}

onMounted(() => {
  if (!canvasRef.value) return
  chart = new Chart(canvasRef.value, buildConfig())
})

watch(
  () => [props.samples, props.series] as const,
  () => {
    if (!chart) return
    chart.data.datasets = buildDatasets(props.samples, props.series)
    const { min, max } = xBounds(props.samples)
    const xScale = chart.options.scales?.x as { min?: number; max?: number } | undefined
    if (xScale) {
      xScale.min = min
      xScale.max = max
    }
    chart.update('none')
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy()
    chart = null
  }
})
</script>

<style scoped>
.metrics-chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
