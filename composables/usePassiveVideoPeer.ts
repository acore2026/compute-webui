import type { Ref } from 'vue'
import { buildPublishedOfferDescription } from './passiveVideoOffer'
import { buildPassiveVideoRtcConfiguration } from './passiveVideoRtcConfig'

const DEFAULT_RECONNECT_DELAY_MS = 1500
const DEFAULT_CONNECT_TIMEOUT_MS = 8000

export interface PassiveVideoPeerOptions {
  clientId: string
  offerPath?: string
  reconnectDelayMs?: number
}

function clearMedia(videoEl: Ref<HTMLVideoElement | null>) {
  if (videoEl.value) {
    videoEl.value.srcObject = null
  }
}

export function usePassiveVideoPeer(options: PassiveVideoPeerOptions) {
  const {
    clientId,
    offerPath = '/api/v1/web/sdp/offer',
    reconnectDelayMs = DEFAULT_RECONNECT_DELAY_MS
  } = options

  const videoEl = ref<HTMLVideoElement | null>(null)
  const connected = ref(false)
  const connecting = ref(false)
  const errorMsg = ref('')

  const { backendUrl, traceCall } = useBackendIp()

  let pc: RTCPeerConnection | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let connectWatchdog: ReturnType<typeof setTimeout> | null = null
  let stopped = false

  function cancelReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function cancelConnectWatchdog() {
    if (connectWatchdog) {
      clearTimeout(connectWatchdog)
      connectWatchdog = null
    }
  }

  function cleanupPeer(targetPc: RTCPeerConnection | null = pc) {
    if (!targetPc) return
    try {
      targetPc.ontrack = null
      targetPc.onconnectionstatechange = null
      targetPc.close()
    } catch {
      // ignore close errors during reconnect/shutdown
    }
    if (targetPc === pc) {
      pc = null
    }
  }

  function scheduleReconnect() {
    if (stopped || reconnectTimer || connecting.value) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      void start()
    }, reconnectDelayMs)
  }

  async function connectOnce(): Promise<void> {
    const currentPc = new RTCPeerConnection(buildPassiveVideoRtcConfiguration())
    pc = currentPc

    currentPc.ontrack = (event) => {
      if (videoEl.value && event.streams[0]) {
        videoEl.value.srcObject = event.streams[0]
      }
    }

    currentPc.onconnectionstatechange = () => {
      if (pc !== currentPc) return
      const state = currentPc.connectionState
      if (state === 'connected') {
        connected.value = true
        connecting.value = false
        errorMsg.value = ''
        cancelReconnectTimer()
        cancelConnectWatchdog()
        return
      }
      if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        connected.value = false
        connecting.value = false
        clearMedia(videoEl)
        cleanupPeer(currentPc)
        scheduleReconnect()
      }
    }

    currentPc.addTransceiver('video', { direction: 'recvonly' })
    const offer = await currentPc.createOffer()
    await currentPc.setLocalDescription(offer)
    const publishedOffer = await buildPublishedOfferDescription(
      currentPc,
      { type: offer.type, sdp: offer.sdp ?? '' },
      DEFAULT_CONNECT_TIMEOUT_MS
    )

    const url = backendUrl(offerPath)
    const response = await traceCall('sdp', url, async () => {
      const result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          sdp_offer: publishedOffer
        })
      })
      if (!result.ok) throw new Error(`offer failed: ${result.status}`)
      return result
    })
    const payload = await response.json()
    if (!payload?.sdp_answer) throw new Error('No sdp_answer in response')
    await currentPc.setRemoteDescription(payload.sdp_answer)
    cancelConnectWatchdog()
    connectWatchdog = setTimeout(() => {
      if (pc !== currentPc || stopped || currentPc.connectionState === 'connected') return
      connected.value = false
      connecting.value = false
      clearMedia(videoEl)
      cleanupPeer(currentPc)
      scheduleReconnect()
    }, DEFAULT_CONNECT_TIMEOUT_MS)
  }

  async function start() {
    if (stopped) {
      stopped = false
    }
    if (connecting.value || connected.value || pc) return
    connecting.value = true
    errorMsg.value = ''
    try {
      await connectOnce()
    } catch (error: any) {
      errorMsg.value = String(error?.message || error)
      connecting.value = false
      connected.value = false
      cancelConnectWatchdog()
      cleanupPeer()
      clearMedia(videoEl)
      scheduleReconnect()
    }
  }

  function stop() {
    stopped = true
    cancelReconnectTimer()
    cancelConnectWatchdog()
    connecting.value = false
    connected.value = false
    cleanupPeer()
    clearMedia(videoEl)
  }

  function reconnect() {
    stop()
    stopped = false
    void start()
  }

  onBeforeUnmount(() => {
    stop()
  })

  return {
    videoEl,
    connected,
    connecting,
    errorMsg,
    start,
    reconnect,
    stop
  }
}
