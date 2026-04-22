<template>
  <div class="metrics-chart-wrapper">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import {
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js'
import type { ChartConfiguration, ChartDataset, Plugin } from 'chart.js'
import type { ChartTypeRegistry } from 'chart.js'
import type { MetricsAverage, MetricsSample } from '~/composables/useMetricsHistory'

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Filler)

type SeriesMetricKey = Exclude<keyof MetricsSample, 'timestamp'>

export interface SeriesDef {
  key: SeriesMetricKey
  label: string
  color: string
  sampleSource?: 'default' | 'ott'
}

const props = defineProps<{
  samples: MetricsSample[]
  ottSamples?: MetricsSample[]
  average?: MetricsAverage | null
  ottAverage?: MetricsAverage | null
  stage?: string
  metricKey: SeriesMetricKey
  series: SeriesDef[]
  yAxisLabel: string
}>()

const STAGE4_NAME = 'MEDIA_ESTABLISHED'
const STAGE4_SPLIT_RATIO = 0.52
const STAGE4_CORE_ACCENT = '#8b5cf6'
const STAGE4_OTT_ACCENT = '#ef4444'
const KEY_POINT_COLOR = '#0f172a'
const E2E_METRIC_KEY: SeriesMetricKey = 'e2e_latency_ms'

const stage4OverlayPlugin: Plugin<'line'> = {
  id: 'stage4Overlay',
  afterDatasetsDraw(chart) {
    const options = chart.options.plugins?.stage4Overlay
    if (!options || options.stage !== STAGE4_NAME || options.metricKey !== E2E_METRIC_KEY) return
    if (typeof options.average !== 'number' || typeof options.ottAverage !== 'number') return

    const yScale = chart.scales.y
    const area = chart.chartArea
    if (!yScale || !area) return

    const x = area.right - 42
    const y1 = yScale.getPixelForValue(options.average)
    const y2 = yScale.getPixelForValue(options.ottAverage)
    const top = Math.min(y1, y2)
    const bottom = Math.max(y1, y2)
    const gap = Math.abs(options.ottAverage - options.average).toFixed(1)
    const labelY = top + (bottom - top) / 2
    const ctx = chart.ctx

    ctx.save()
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.56)'
    ctx.lineWidth = 1.2
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.moveTo(x - 8, top)
    ctx.lineTo(x + 8, top)
    ctx.moveTo(x - 8, bottom)
    ctx.lineTo(x + 8, bottom)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)'
    ctx.fillRect(x - 24, labelY - 10, 48, 20)
    ctx.fillStyle = '#f8fafc'
    ctx.font = "10px 'IBM Plex Mono', monospace"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`Gap ${gap}`, x, labelY)
    ctx.restore()
  }
}

Chart.register(stage4OverlayPlugin)

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends keyof ChartTypeRegistry> {
    stage4Overlay?: {
      metricKey?: SeriesMetricKey
      stage?: string
      average?: number | null
      ottAverage?: number | null
    }
  }
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'line'> | null = null

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatHMS(msValue: number) {
  const d = new Date(msValue)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

function datasetSamples(seriesDef: SeriesDef, samples: MetricsSample[], ottSamples: MetricsSample[]) {
  return seriesDef.sampleSource === 'ott' ? ottSamples : samples
}

function pointRadiusForMetric(index: number, splitIndex: number, lastIndex: number, metricKey: SeriesMetricKey) {
  if (metricKey === 'fps') {
    return index === splitIndex ? 4.4 : 0
  }
  if (index === 0 || index === splitIndex || index === lastIndex) return 4
  if (index === splitIndex - 1 || index === splitIndex + 1) return 2.6
  return 0
}

function xBounds(samples: MetricsSample[], ottSamples: MetricsSample[], series: SeriesDef[]) {
  const timestamps = series.flatMap((seriesDef) =>
    datasetSamples(seriesDef, samples, ottSamples).map((sample) => sample.timestamp * 1000)
  )
  if (timestamps.length === 0) return { min: undefined, max: undefined }
  return {
    min: Math.min(...timestamps),
    max: Math.max(...timestamps)
  }
}

function buildStandardDataset(
  label: string,
  color: string,
  data: { x: number; y: number }[]
): ChartDataset<'line', { x: number; y: number }[]> {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: color,
    borderWidth: 1.5,
    pointRadius: 0,
    pointHoverRadius: 3,
    tension: 0.16,
    fill: false
  }
}

function buildAverageDataset(
  label: string,
  color: string,
  averageValue: number,
  minX: number,
  maxX: number
): ChartDataset<'line', { x: number; y: number }[]> {
  return {
    label,
    data: [
      { x: minX, y: averageValue },
      { x: maxX, y: averageValue }
    ],
    borderColor: color,
    backgroundColor: color,
    borderDash: [6, 6],
    borderWidth: 1.1,
    pointRadius: 0,
    pointHoverRadius: 0,
    tension: 0,
    fill: false
  }
}

function buildDatasets(
  samples: MetricsSample[],
  ottSamples: MetricsSample[],
  series: SeriesDef[],
  metricKey: SeriesMetricKey,
  stage: string | undefined,
  average: MetricsAverage | null | undefined,
  ottAverage: MetricsAverage | null | undefined
) {
  const stage4 = stage === STAGE4_NAME
  const datasets: ChartDataset<'line', { x: number; y: number }[]>[] = []

  for (const s of series) {
    const points = datasetSamples(s, samples, ottSamples).map((sample) => ({
      x: sample.timestamp * 1000,
      y: Number(sample[s.key])
    }))

    if (!stage4 || points.length < 4) {
      datasets.push(buildStandardDataset(s.label, s.color, points))
      continue
    }

    const splitIndex = Math.max(1, Math.floor(points.length * STAGE4_SPLIT_RATIO))
    const lastIndex = points.length - 1
    const accent = s.sampleSource === 'ott' ? STAGE4_OTT_ACCENT : STAGE4_CORE_ACCENT
    const pointColor = metricKey === 'fps' ? accent : KEY_POINT_COLOR

    datasets.push({
      label: `${s.label} (pre-stage4)`,
      data: points.slice(0, splitIndex + 1),
      borderColor: s.color,
      backgroundColor: s.color,
      borderWidth: 1.6,
      pointRadius: (ctx) => pointRadiusForMetric(ctx.dataIndex, splitIndex, lastIndex, metricKey),
      pointHoverRadius: 5,
      pointBackgroundColor: pointColor,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.4,
      tension: 0.18,
      fill: false
    })
    datasets.push({
      label: `${s.label} (stage4)`,
      data: points.slice(splitIndex),
      borderColor: accent,
      backgroundColor: accent,
      borderWidth: 2.2,
      pointRadius: (ctx) =>
        pointRadiusForMetric(ctx.dataIndex + splitIndex, splitIndex, lastIndex, metricKey),
      pointHoverRadius: 5,
      pointBackgroundColor: accent,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      tension: 0.18,
      fill: false
    })
  }

  const { min, max } = xBounds(samples, ottSamples, series)
  if (
    stage4 &&
    metricKey === E2E_METRIC_KEY &&
    typeof min === 'number' &&
    typeof max === 'number'
  ) {
    const avgValue = average?.[metricKey]
    const ottAvgValue = ottAverage?.[metricKey]

    if (typeof avgValue === 'number') {
      datasets.push(buildAverageDataset('Core avg', 'rgba(59, 130, 246, 0.78)', avgValue, min, max))
    }
    if (typeof ottAvgValue === 'number') {
      datasets.push(buildAverageDataset('OTT avg', 'rgba(249, 115, 22, 0.82)', ottAvgValue, min, max))
    }
  }

  return datasets
}

function buildConfig(): ChartConfiguration<'line'> {
  const { min, max } = xBounds(props.samples, props.ottSamples || [], props.series)
  return {
    type: 'line',
    data: {
      datasets: buildDatasets(
        props.samples,
        props.ottSamples || [],
        props.series,
        props.metricKey,
        props.stage,
        props.average,
        props.ottAverage
      )
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      parsing: false,
      layout: { padding: { top: 4, right: 6, bottom: 0, left: 0 } },
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
            maxTicksLimit: 4,
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
          grace: '10%',
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
        stage4Overlay: {
          metricKey: props.metricKey,
          stage: props.stage,
          average: props.average?.[props.metricKey] ?? null,
          ottAverage: props.ottAverage?.[props.metricKey] ?? null
        },
        legend: { display: false },
        tooltip: {
          displayColors: false,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          padding: 8,
          titleFont: { family: "'IBM Plex Mono', monospace", size: 10 },
          bodyFont: { family: "'IBM Plex Mono', monospace", size: 11 },
          callbacks: {
            title: (items) => (items.length ? formatHMS(Number(items[0].parsed.x)) : ''),
            label: (item) => `${item.dataset.label}: ${item.parsed.y}`
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
  () =>
    [
      props.samples,
      props.ottSamples,
      props.average,
      props.ottAverage,
      props.stage,
      props.metricKey,
      props.series
    ] as const,
  () => {
    if (!chart) return

    chart.data.datasets = buildDatasets(
      props.samples,
      props.ottSamples || [],
      props.series,
      props.metricKey,
      props.stage,
      props.average,
      props.ottAverage
    )

    const { min, max } = xBounds(props.samples, props.ottSamples || [], props.series)
    const xScale = chart.options.scales?.x as { min?: number; max?: number } | undefined
    if (xScale) {
      xScale.min = min
      xScale.max = max
    }

    if (chart.options.plugins?.stage4Overlay) {
      chart.options.plugins.stage4Overlay.metricKey = props.metricKey
      chart.options.plugins.stage4Overlay.stage = props.stage
      chart.options.plugins.stage4Overlay.average = props.average?.[props.metricKey] ?? null
      chart.options.plugins.stage4Overlay.ottAverage = props.ottAverage?.[props.metricKey] ?? null
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
