export interface MetricsSample {
  timestamp: number
  e2e_latency_ms: number
  fps: number
}

export interface MetricsAverage {
  e2e_latency_ms: number
  fps: number
}

export interface MetricsHistoryResponse {
  status: string
  metrics: MetricsSample[]
  ott_metrics?: MetricsSample[]
  average?: MetricsAverage | null
  ott_average?: MetricsAverage | null
}

export interface UseMetricsHistoryOptions {
  timeWindowSec?: number
  pollIntervalMs?: number
}

export function useMetricsHistory(options: UseMetricsHistoryOptions = {}) {
  const timeWindowSec = options.timeWindowSec ?? 300
  const pollIntervalMs = options.pollIntervalMs ?? 2000

  const samples = ref<MetricsSample[]>([])
  const ottSamples = ref<MetricsSample[]>([])
  const average = ref<MetricsAverage | null>(null)
  const ottAverage = ref<MetricsAverage | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const lastUpdated = ref<number | null>(null)

  const { backendUrl, traceCall } = useBackendIp()

  let timer: ReturnType<typeof setInterval> | null = null
  let inFlight: Promise<void> | null = null
  let stopped = false

  async function fetchOnce(): Promise<void> {
    isLoading.value = true
    try {
      const url = backendUrl(`/api/v1/metrics/history?time_window=${timeWindowSec}`)
      const body = await traceCall('metrics', url, () => $fetch<MetricsHistoryResponse>(url))
      if (!body || body.status !== 'SUCCESS' || !Array.isArray(body.metrics)) {
        throw new Error(
          `Unexpected response from metrics history: status=${body?.status ?? 'null'}`
        )
      }
      const sorted = [...body.metrics].sort((a, b) => a.timestamp - b.timestamp)
      const sortedOtt = Array.isArray(body.ott_metrics)
        ? [...body.ott_metrics].sort((a, b) => a.timestamp - b.timestamp)
        : []
      samples.value = sorted
      ottSamples.value = sortedOtt
      average.value = body.average ?? null
      ottAverage.value = body.ott_average ?? null
      lastUpdated.value = Date.now()
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      isLoading.value = false
    }
  }

  async function refresh(): Promise<void> {
    if (inFlight) {
      await inFlight
      return
    }
    inFlight = fetchOnce().finally(() => {
      inFlight = null
    })
    await inFlight
  }

  function tick() {
    if (stopped) return
    if (inFlight) return
    void refresh()
  }

  function stop() {
    stopped = true
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(() => {
    void refresh()
    timer = setInterval(tick, pollIntervalMs)
  })

  onBeforeUnmount(() => {
    stop()
  })

  return {
    samples,
    ottSamples,
    average,
    ottAverage,
    isLoading,
    error,
    lastUpdated,
    refresh,
    stop
  }
}
