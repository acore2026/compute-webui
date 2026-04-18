export const DEFAULT_PASSIVE_VIDEO_ICE_SERVER_URLS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302'
]

export const LOCALHOST_PASSIVE_VIDEO_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:127.0.0.1:3478' },
  {
    urls: 'turn:127.0.0.1:3478?transport=udp',
    username: 'sandboxdemo',
    credential: 'sandboxdemo'
  }
]

function resolveRuntimeHostname(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  return window.location.hostname || ''
}

export function buildPassiveVideoRtcConfiguration(hostname = resolveRuntimeHostname()): RTCConfiguration {
  const normalizedHostname = hostname.trim().toLowerCase()
  const useLocalTurn = normalizedHostname === 'localhost' || normalizedHostname === '127.0.0.1'

  const iceServers: RTCIceServer[] = useLocalTurn
    ? [
        ...LOCALHOST_PASSIVE_VIDEO_ICE_SERVERS,
        ...DEFAULT_PASSIVE_VIDEO_ICE_SERVER_URLS.map((url) => ({ urls: url }))
      ]
    : DEFAULT_PASSIVE_VIDEO_ICE_SERVER_URLS.map((url) => ({ urls: url }))

  return {
    iceServers
  }
}
