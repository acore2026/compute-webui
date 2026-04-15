<template>
  <section class="panel flex flex-col h-full overflow-hidden">
    <div class="panel-header">
      <div class="flex items-center gap-2">
        <span class="title-kicker">Video</span>
        <span>实时视频流</span>
      </div>
      <div class="flex items-center gap-2">
        <span :class="['status-badge', statusBadgeClass]">
          <span class="status-badge-icon"></span>
          {{ statusText }}
        </span>
        <button class="icon-button icon-button-sm" @click="reconnect" title="重连">
          <el-icon :size="14"><Refresh /></el-icon>
        </button>
      </div>
    </div>

    <div
      class="flex-1 relative grid place-items-center overflow-hidden"
      style="background:
        radial-gradient(circle at 20% 10%, rgba(56, 189, 248, 0.10), transparent 50%),
        radial-gradient(circle at 90% 100%, rgba(99, 102, 241, 0.08), transparent 50%),
        #f1f5f9;"
    >
      <video
        v-show="connected"
        ref="videoEl"
        autoplay
        playsinline
        muted
        class="w-full h-full object-contain"
      />
      <div
        v-if="!connected"
        style="
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.86rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #64748b;
        "
      >
        {{ connecting ? '连接中…' : '待推送' }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'

const props = defineProps<{ offerUrl?: string }>()
const videoEl = ref<HTMLVideoElement | null>(null)
const connected = ref(false)
const connecting = ref(false)
const errorMsg = ref('')

let pc: RTCPeerConnection | null = null

const statusText = computed(() =>
  connected.value ? 'Live' : connecting.value ? 'Connecting' : 'Offline'
)
const statusBadgeClass = computed(() =>
  connected.value ? 'status-badge-live'
    : connecting.value ? 'status-badge-accent'
    : 'status-badge-idle'
)

async function connect() {
  if (connecting.value || connected.value) return
  if (typeof window === 'undefined' || !window.RTCPeerConnection) return
  connecting.value = true
  errorMsg.value = ''
  try {
    pc = new RTCPeerConnection({ iceServers: [] })

    pc.ontrack = (e) => {
      if (videoEl.value && e.streams[0]) {
        videoEl.value.srcObject = e.streams[0]
      }
    }
    pc.onconnectionstatechange = () => {
      const s = pc?.connectionState
      if (s === 'connected') {
        connected.value = true
        connecting.value = false
      }
      if (s === 'failed' || s === 'closed' || s === 'disconnected') {
        connected.value = false
        connecting.value = false
      }
    }

    // 只接收视频
    pc.addTransceiver('video', { direction: 'recvonly' })

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    const resp = await fetch(props.offerUrl || '/api/webrtc/offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sdp: offer.sdp, type: offer.type })
    })
    if (!resp.ok) throw new Error(`offer failed: ${resp.status}`)
    const answer = await resp.json()
    await pc.setRemoteDescription(answer)
  } catch (e: any) {
    errorMsg.value = String(e?.message || e)
    connecting.value = false
    connected.value = false
    cleanup()
  }
}

function cleanup() {
  if (pc) {
    try { pc.close() } catch {}
    pc = null
  }
  if (videoEl.value) {
    videoEl.value.srcObject = null
  }
}

function reconnect() {
  cleanup()
  connected.value = false
  connecting.value = false
  nextTick(connect)
}

onMounted(connect)
onBeforeUnmount(cleanup)
</script>
