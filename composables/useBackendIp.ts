const DEFAULT_IP = 'http://localhost:8000'
const STORAGE_KEY = 'backend-ips'

export interface BackendIps {
  apiV1: string
  apiLogs: string
  apiMetrics: string
  stream: string
}

const DEFAULTS: BackendIps = {
  apiV1: DEFAULT_IP,
  apiLogs: DEFAULT_IP,
  apiMetrics: DEFAULT_IP,
  stream: DEFAULT_IP
}

const _ips = ref<BackendIps>({ ...DEFAULTS })

/** 路径前缀 → BackendIps 字段的映射 */
const PREFIX_MAP: [string, keyof BackendIps][] = [
  ['/api/v1',      'apiV1'],
  ['/api/logs',    'apiLogs'],
  ['/api/metrics', 'apiMetrics'],
  ['/stream',      'stream']
]

export function useBackendIp() {
  function load() {
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          _ips.value = { ...DEFAULTS, ...parsed }
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
  }

  /** Resolve a relative backend path to a full URL based on prefix */
  function backendUrl(path: string) {
    for (const [prefix, key] of PREFIX_MAP) {
      if (path.startsWith(prefix)) {
        return `${_ips.value[key]}${path}`
      }
    }
    return `${_ips.value.apiV1}${path}`
  }

  return {
    ips: _ips,
    load,
    save,
    backendUrl
  }
}
