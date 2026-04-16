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
        v-if="inEditor"
        class="icon-button"
        title="返回首页"
        @click="navigateTo('/')"
      >
        <el-icon :size="16"><Back /></el-icon>
      </button>

      <el-dropdown v-else trigger="click" @command="onMenuCommand">
        <button class="icon-button" title="设置">
          <el-icon :size="16"><Setting /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="backend-ip">
              <el-icon :size="14"><Link /></el-icon>
              后端地址
            </el-dropdown-item>
            <el-dropdown-item command="editor">
              <el-icon :size="14"><Edit /></el-icon>
              架构图编辑器
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <span class="font-mono text-[12px] text-ink-500 ml-2 tabular-nums">{{ now }}</span>
    </div>

    <!-- 后端地址弹窗 -->
    <el-dialog v-model="ipDialogVisible" title="后端地址" width="400px" :append-to-body="true">
      <el-input v-model="ipDraft" placeholder="http://localhost:8000" @keyup.enter="saveIp" />
      <template #footer>
        <el-button @click="ipDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveIp">确定</el-button>
      </template>
    </el-dialog>
  </header>
</template>

<script setup lang="ts">
import { Refresh, Setting, Back, VideoPlay, Link, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const inEditor = computed(() => route.path.startsWith('/editor'))

const { simulate: simRef, reset: resetRef, hasSeq, hasNodes } = useFlowActions()
const simulate = computed(() => simRef.value)
const reset    = computed(() => resetRef.value)

const now = ref(formatTime(new Date()))
let timer: ReturnType<typeof setInterval> | null = null

// 后端地址
const { backendIp, load: loadIp, save: saveBackendIp } = useBackendIp()
const ipDialogVisible = ref(false)
const ipDraft = ref('')

function onMenuCommand(cmd: string) {
  if (cmd === 'editor') {
    navigateTo('/editor')
  } else if (cmd === 'backend-ip') {
    ipDraft.value = backendIp.value
    ipDialogVisible.value = true
  }
}

function saveIp() {
  saveBackendIp(ipDraft.value)
  ipDialogVisible.value = false
  ElMessage.success(`后端地址已更新为 ${backendIp.value}`)
}

function formatTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(() => {
  loadIp()
  timer = setInterval(() => { now.value = formatTime(new Date()) }, 1000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>
