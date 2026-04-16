const DEFAULT_IP = 'http://localhost:8000'
const STORAGE_KEY = 'backend-ip'

const _backendIp = ref(DEFAULT_IP)

export function useBackendIp() {
  function load() {
    if (import.meta.client) {
      _backendIp.value = localStorage.getItem(STORAGE_KEY) || DEFAULT_IP
    }
  }

  function save(url: string) {
    const v = url.trim() || DEFAULT_IP
    _backendIp.value = v
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, v)
    }
  }

  /** Resolve a relative backend path (e.g. '/api/v1/foo') to a full URL */
  function backendUrl(path: string) {
    return `${_backendIp.value}${path}`
  }

  return {
    backendIp: _backendIp,
    load,
    save,
    backendUrl
  }
}
