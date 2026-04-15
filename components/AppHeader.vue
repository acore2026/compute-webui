<template>
  <header
    class="h-16 px-6 flex items-center justify-between bg-white/80 backdrop-blur border-b border-ink-200"
    style="box-shadow: 0 1px 0 rgba(15,23,42,0.02);"
  >
    <!-- 左：Logo + 标题 -->
    <div class="flex items-center gap-4">
      <img
        src="/assets/cmcc-logo.svg"
        alt="CMCC"
        class="h-10 w-auto select-none"
        draggable="false"
      />
      <span
        class="dashboard-title"
        style="
          font-family: 'Orbitron', 'Segoe UI', 'PingFang SC', sans-serif;
          font-size: 1.45rem;
          font-weight: 700;
          color: #0085D0;
          letter-spacing: 0.06em;
          line-height: 1.2;
        "
      >
        端网协同
      </span>
    </div>

    <!-- 右：首页动作 + 编辑器切换 + 时间 -->
    <div class="flex items-center gap-2">
      <template v-if="!inEditor">
        <button
          class="icon-button"
          :disabled="!hasNodes"
          title="清除高亮"
          @click="reset?.()"
        >
          <el-icon :size="16"><Refresh /></el-icon>
        </button>
        <button
          class="icon-button"
          :disabled="!hasSeq"
          title="启动流程演示"
          @click="simulate?.()"
        >
          <el-icon :size="16"><VideoPlay /></el-icon>
        </button>
        <span class="mx-1 w-px h-6 bg-ink-200"></span>
      </template>

      <button
        class="icon-button"
        :title="inEditor ? '返回首页' : '架构图编辑器'"
        @click="toggleEditor"
      >
        <el-icon :size="16">
          <Back v-if="inEditor" />
          <Setting v-else />
        </el-icon>
      </button>

      <span class="font-mono text-[12px] text-ink-500 ml-2 tabular-nums">{{ now }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Refresh, Setting, Back, VideoPlay } from '@element-plus/icons-vue'

const route = useRoute()
const inEditor = computed(() => route.path.startsWith('/editor'))

const { simulate: simRef, reset: resetRef, hasSeq, hasNodes } = useFlowActions()
const simulate = computed(() => simRef.value)
const reset    = computed(() => resetRef.value)

const now = ref(formatTime(new Date()))
let timer: ReturnType<typeof setInterval> | null = null

function formatTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function toggleEditor() {
  navigateTo(inEditor.value ? '/' : '/editor')
}

onMounted(() => {
  timer = setInterval(() => { now.value = formatTime(new Date()) }, 1000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>
