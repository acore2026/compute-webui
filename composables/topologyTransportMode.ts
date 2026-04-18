import type { ViewId } from '../components/flow/storage'

export type TransportMode = 'ACN' | 'OTT'

export const TRANSPORT_MODE_ACN: TransportMode = 'ACN'
export const TRANSPORT_MODE_OTT: TransportMode = 'OTT'

type TraceCall = <T>(label: string, url: string, run: () => Promise<T>) => Promise<T>

export interface TopologyTransportRequestDeps {
  backendUrl: (path: string) => string
  traceCall: TraceCall
  fetchImpl?: typeof fetch
}

function fetchOrThrow(fetchImpl: typeof fetch | undefined): typeof fetch {
  if (fetchImpl) return fetchImpl
  if (typeof fetch !== 'function') {
    throw new Error('fetch_unavailable')
  }
  return fetch
}

export function transportModeForTopologyView(view: ViewId): TransportMode {
  return view === 'public-cloud' ? TRANSPORT_MODE_OTT : TRANSPORT_MODE_ACN
}

export function normalizeTransportMode(value: unknown): TransportMode {
  return String(value || '').trim().toUpperCase() === TRANSPORT_MODE_OTT
    ? TRANSPORT_MODE_OTT
    : TRANSPORT_MODE_ACN
}

export function resolveTopologyViewFromBackendState(stage: string, transportMode: unknown): ViewId {
  if (stage !== 'MEDIA_ESTABLISHED') {
    return 'core-network'
  }
  return normalizeTransportMode(transportMode) === TRANSPORT_MODE_OTT
    ? 'public-cloud'
    : 'core-network'
}

export async function syncTransportModeForTopologyView(
  view: ViewId,
  { backendUrl, traceCall, fetchImpl }: TopologyTransportRequestDeps,
): Promise<TransportMode> {
  const url = backendUrl('/api/v1/transport_mode')
  const response = await traceCall('transport_mode', url, async () => {
    const result = await fetchOrThrow(fetchImpl)(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transportMode: transportModeForTopologyView(view),
      }),
    })
    if (!result.ok) {
      throw new Error(`transport_mode_update_failed:${result.status}`)
    }
    return result
  })
  const payload = await response.json()
  return normalizeTransportMode(payload?.transportMode)
}

export async function fetchTransportModeFromSandboxHealth(
  { backendUrl, traceCall, fetchImpl }: TopologyTransportRequestDeps,
): Promise<TransportMode> {
  const url = backendUrl('/api/health')
  const response = await traceCall('transport_mode_health', url, async () => {
    const result = await fetchOrThrow(fetchImpl)(url)
    if (!result.ok) {
      throw new Error(`transport_mode_health_failed:${result.status}`)
    }
    return result
  })
  const payload = await response.json()
  return normalizeTransportMode(payload?.transportMode)
}
