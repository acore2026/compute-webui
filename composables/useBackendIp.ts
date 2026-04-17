const DEFAULT_IP = 'http://localhost:8000'
const STORAGE_KEY = 'backend-ips'

export interface BackendIps {
  sdp: string
  metrics: string
  stage: string
  ar: string
}

const DEFAULTS: BackendIps = {
  sdp:     DEFAULT_IP,
  metrics: DEFAULT_IP,
  stage:   DEFAULT_IP,
  ar:      DEFAULT_IP
}

const _ips = ref<BackendIps>({ ...DEFAULTS })

/** 路径前缀 → BackendIps 字段。按具体到泛化排序，首个命中即用。 */
const PREFIX_MAP: [string, keyof BackendIps][] = [
  ['/api/v1/web/sdp',         'sdp'],
  ['/api/v1/metrics',         'metrics'],
  ['/api/v1/system/topology', 'stage'],
  ['/api/v1/system/ar',       'ar']
]

/** 调试用：固定列一份所有接口的样板路径，方便 diagnose 打印。 */
const SAMPLE_PATHS: Record<keyof BackendIps, string> = {
  sdp:     '/api/v1/web/sdp/offer',
  metrics: '/api/v1/metrics/history',
  stage:   '/api/v1/system/topology/stage',
  ar:      '/api/v1/system/ar/status'
}

/** 旧 schema 迁移：apiV1/apiLogs/apiMetrics/stream 或含 reset 的 5 字段 → 4 字段。 */
function migrate(raw: Record<string, unknown>): BackendIps {
  const hasNew = 'sdp' in raw || 'metrics' in raw || 'stage' in raw || 'ar' in raw
  if (hasNew) {
    return {
      sdp:     typeof raw.sdp     === 'string' ? raw.sdp     : DEFAULT_IP,
      metrics: typeof raw.metrics === 'string' ? raw.metrics : DEFAULT_IP,
      stage:   typeof raw.stage   === 'string' ? raw.stage   : DEFAULT_IP,
      ar:      typeof raw.ar      === 'string' ? raw.ar      : DEFAULT_IP
    }
  }
  const legacy = typeof raw.apiV1 === 'string' && raw.apiV1 ? raw.apiV1 : DEFAULT_IP
  return { sdp: legacy, metrics: legacy, stage: legacy, ar: legacy }
}

/** 轮询状态翻转跟踪：只在成功/失败边界打日志，避免刷屏。 */
type CallState = 'ok' | 'fail'
const _lastState: Record<string, CallState> = {}

export function useBackendIp() {
  function load() {
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          _ips.value = migrate(JSON.parse(raw))
        }
      } catch {
        _ips.value = { ...DEFAULTS }
      }
    }
  }

  function save(ips: BackendIps) {
    _ips.value = { ...ips }
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_ips.value))
    }
    // 清掉翻转状态，切完 IP 下一次调用会重新打一条边界日志
    for (const k of Object.keys(_lastState)) delete _lastState[k]
  }

  /** 把相对 backend 路径解析成带 IP 的完整 URL。匹配不到的一律打 sdp 字段。 */
  function backendUrl(path: string) {
    for (const [prefix, key] of PREFIX_MAP) {
      if (path.startsWith(prefix)) {
        return `${_ips.value[key]}${path}`
      }
    }
    return `${_ips.value.sdp}${path}`
  }

  /** 打印当前每个接口字段的 IP 及解析出的完整 URL，切 IP 后可视化确认。 */
  function diagnose(tag = 'backend-ip') {
    if (!import.meta.client) return
    const rows = (Object.keys(SAMPLE_PATHS) as (keyof BackendIps)[]).map(k => ({
      key:  k,
      ip:   _ips.value[k],
      url:  backendUrl(SAMPLE_PATHS[k])
    }))
    console.groupCollapsed(`[${tag}] 当前 4 个接口解析后 URL`)
    // eslint-disable-next-line no-console
    console.table(rows)
    console.groupEnd()
  }

  /**
   * 调用点封装：只在成功↔失败翻转时打一次，减少刷屏。
   * 用法：const ok = await traceCall('ar', url, () => $fetch(url))
   */
  async function traceCall<T>(
    label: string,
    url: string,
    run: () => Promise<T>
  ): Promise<T> {
    try {
      const r = await run()
      if (_lastState[label] !== 'ok') {
        // eslint-disable-next-line no-console
        console.info(`[${label}] OK`, url)
        _lastState[label] = 'ok'
      }
      return r
    } catch (e) {
      if (_lastState[label] !== 'fail') {
        // eslint-disable-next-line no-console
        console.error(`[${label}] FAIL`, url, e)
        _lastState[label] = 'fail'
      }
      throw e
    }
  }

  return {
    ips: _ips,
    load,
    save,
    backendUrl,
    diagnose,
    traceCall
  }
}
