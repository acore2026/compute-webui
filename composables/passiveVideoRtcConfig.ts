export const DEFAULT_PASSIVE_VIDEO_ICE_SERVER_URLS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302'
]

export const LOCALHOST_PASSIVE_VIDEO_ICE_SERVERS: RTCIceServer[] = [
  // { urls: 'stun:127.0.0.1:3478' },
  // {
  //   urls: 'turn:127.0.0.1:3478?transport=udp',
  //   username: 'sandboxdemo',
  //   credential: 'sandboxdemo'
  // }
  {
    "urls": "stun:101.245.78.174:28002"
  },
  {
    "urls": "turn:101.245.78.174:28002?transport=udp",
    "username": "cloudproxy",
    "credential": "f41bd6b00f9fe5b5980197d793699aea"
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
        // ...LOCALHOST_PASSIVE_VIDEO_ICE_SERVERS,
        // ...DEFAULT_PASSIVE_VIDEO_ICE_SERVER_URLS.map((url) => ({ urls: url }))
        ...LOCALHOST_PASSIVE_VIDEO_ICE_SERVERS
      ]
    // : DEFAULT_PASSIVE_VIDEO_ICE_SERVER_URLS.map((url) => ({ urls: url }))
    : [
        // ...LOCALHOST_PASSIVE_VIDEO_ICE_SERVERS,
        // ...DEFAULT_PASSIVE_VIDEO_ICE_SERVER_URLS.map((url) => ({ urls: url }))
        ...LOCALHOST_PASSIVE_VIDEO_ICE_SERVERS
      ]

  return {
    iceServers
  }
}
