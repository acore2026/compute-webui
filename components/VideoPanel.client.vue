<template>
  <section class="panel flex flex-col h-full overflow-hidden">
    <div class="panel-header">
      <div class="flex items-center gap-2">
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

      <!-- 手势条 · 视频上方，玻璃拟态 -->
      <div class="glass-bar glass-bar-top">
        <span class="glass-bar-kicker">手势</span>
        <span class="glass-bar-dot" :style="{ background: gesture.color }"></span>
        <span class="glass-bar-text">{{ gesture.label }}</span>
        <span class="glass-bar-meta">置信度 {{ (gesture.confidence * 100).toFixed(0) }}%</span>
      </div>

      <!-- 指令条 · 视频下方，玻璃拟态 -->
      <div class="glass-bar glass-bar-bottom">
        <span class="glass-bar-kicker">指令</span>
        <span class="glass-bar-text glass-bar-text-wrap">{{ prompt }}</span>
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

// 手势 / 指令（占位数据，后续可接后端）
const gesture = ref({ label: '握拳 / FIST', confidence: 0.92, color: '#22d3ee' })
const prompt  = ref('请把桌上的水杯递给我')
</script>

<style scoped>
.glass-bar {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 252, 248, 0.38);
  backdrop-filter: blur(22px) saturate(1.35);
  -webkit-backdrop-filter: blur(22px) saturate(1.35);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow:
    0 10px 28px rgba(180, 160, 140, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.70);
  color: #3f3632;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  pointer-events: none;
  z-index: 2;
}

.glass-bar-top {
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
}

.glass-bar-bottom {
  bottom: 14px;
  left: 16px;
  right: 16px;
  border-radius: 14px;
  padding: 10px 16px;
  justify-content: flex-start;
}

.glass-bar-kicker {
  flex: 0 0 auto;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #7d6a5a;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(200, 180, 160, 0.20);
}

.glass-bar-dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.65);
}

.glass-bar-text {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.82rem;
  color: #3f3632;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.glass-bar-text-wrap {
  white-space: normal;
  line-height: 1.35;
  overflow: visible;
  text-overflow: clip;
}

.glass-bar-meta {
  flex: 0 0 auto;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: #8a7868;
  font-variant-numeric: tabular-nums;
}
</style>
