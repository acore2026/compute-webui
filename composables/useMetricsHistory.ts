export interface MetricsSample {
  timestamp: number
  e2e_latency_ms: number
  jitter_ms: number
  compute_latency_ms: number
  processing_latency_ms: number
  fps: number
}

export interface MetricsHistoryResponse {
  status: string
  metrics: MetricsSample[]
}

export interface UseMetricsHistoryOptions {
  timeWindowSec?: number
  pollIntervalMs?: number
}

export function useMetricsHistory(options: UseMetricsHistoryOptions = {}) {
  const timeWindowSec = options.timeWindowSec ?? 300
  const pollIntervalMs = options.pollIntervalMs ?? 2000

  const samples = ref<MetricsSample[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const lastUpdated = ref<number | null>(null)

  let timer: ReturnType<typeof setInterval> | null = null
  let inFlight: Promise<void> | null = null
  let stopped = false

  async function fetchOnce(): Promise<void> {
    isLoading.value = true
    try {
      const body = await $fetch<MetricsHistoryResponse>(
        `/api/v1/metrics/history?time_window=${timeWindowSec}`
      )
      if (!body || body.status !== 'SUCCESS' || !Array.isArray(body.metrics)) {
        throw new Error(
          `Unexpected response from metrics history: status=${body?.status ?? 'null'}`
        )
      }
      const sorted = [...body.metrics].sort((a, b) => a.timestamp - b.timestamp)
      samples.value = sorted
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
    isLoading,
    error,
    lastUpdated,
    refresh,
    stop
  }
}
