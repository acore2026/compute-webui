import type { Node, Edge } from '@vue-flow/core'

const LS_TOPO   = 'webfront.topology.v1'
const LS_SEQ    = 'webfront.sequence.v1'
const LS_LEGEND = 'webfront.legend.v1'

export interface EdgeOverride {
  /** 该 step 下这条边的流向 (覆盖 Inspector 设置) */
  direction?: 'forward' | 'reverse' | 'bidirectional'
  /** 该 step 下是否开启流光 (覆盖) */
  glow?: boolean
  /** 状态 (默认 'selected', 可选 'active') */
  state?: 'selected' | 'active' | 'idle'
}

export type BubbleIcon =
  | 'spinner' | 'done' | 'sparkles' | 'radio' | 'brain' | 'scan'

export type BubbleState = 'processing' | 'done'

export interface PlanItem {
  id: string
  label: string
  phase: 'pending' | 'processing' | 'done'
}

export interface NodePlan {
  title: string
  items: PlanItem[]
}

/** 每个 step 下某节点的气泡 / 清单 覆盖 */
export interface NodeOverride {
  message?: string
  messageIcon?: BubbleIcon
  messageState?: BubbleState
  plan?: NodePlan | null   // null = 清除 plan
  active?: boolean
  flashActive?: boolean
}

export interface SequenceStep {
  id: string
  kicker: string
  title: string
  phase: string
  nodes: string[]
  edges: string[]
  edgeSettings?: Record<string, EdgeOverride>
  /** 每个高亮节点在本 step 的气泡 / plan 覆盖 */
  nodeSettings?: Record<string, NodeOverride>
}

export interface Topology {
  nodes: Node[]
  edges: Edge[]
}

export interface LegendItem {
  id: string
  color: string
  label: string
}

export interface LegendConfig {
  visible: boolean
  items: LegendItem[]
}

export const DEFAULT_LEGEND: LegendConfig = { visible: false, items: [] }

/** 默认空白 — 所有节点 / 边 / 序列都由用户自行创建 */
export const EMPTY_TOPOLOGY: Topology = { nodes: [], edges: [] }

export function loadTopology(): Topology {
  if (typeof window === 'undefined') return { nodes: [], edges: [] }
  try {
    const raw = localStorage.getItem(LS_TOPO)
    if (!raw) return { nodes: [], edges: [] }
    const p = JSON.parse(raw) as Topology
    if (!Array.isArray(p.nodes) || !Array.isArray(p.edges)) throw new Error('invalid')
    return p
  } catch {
    return { nodes: [], edges: [] }
  }
}

export function saveTopology(t: Topology) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_TOPO, JSON.stringify(t))
}

export function loadSequence(): SequenceStep[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_SEQ)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSequence(seq: SequenceStep[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_SEQ, JSON.stringify(seq))
}

export function loadLegend(): LegendConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_LEGEND }
  try {
    const raw = localStorage.getItem(LS_LEGEND)
    if (!raw) return { ...DEFAULT_LEGEND }
    const p = JSON.parse(raw)
    if (typeof p?.visible !== 'boolean' || !Array.isArray(p?.items)) return { ...DEFAULT_LEGEND }
    return p
  } catch {
    return { ...DEFAULT_LEGEND }
  }
}

export function saveLegend(cfg: LegendConfig) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_LEGEND, JSON.stringify(cfg))
}

export function resetAll() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LS_TOPO)
  localStorage.removeItem(LS_SEQ)
  localStorage.removeItem(LS_LEGEND)
}

/* ============================================================
   Server-side 持久化：写入 data/state.json 跨端口 / 跨浏览器保留
   ============================================================ */
export interface RemoteState {
  topology: Topology | null
  sequence: SequenceStep[]
  legend: LegendConfig | null
  captionTop?: number
}

export async function fetchRemoteState(): Promise<RemoteState | null> {
  try {
    return await $fetch<RemoteState>('/api/state')
  } catch {
    return null
  }
}

export async function pushRemoteState(state: RemoteState) {
  try {
    await $fetch('/api/state', { method: 'POST', body: state })
  } catch (e) {
    console.warn('[storage] server push failed', e)
  }
}

/** 异步加载：优先 server，失败回退 localStorage */
export async function loadAll(): Promise<{
  topology: Topology
  sequence: SequenceStep[]
  legend: LegendConfig
  captionTop: number
}> {
  const remote = await fetchRemoteState()
  if (remote?.topology) {
    if (typeof window !== 'undefined') {
      saveTopology(remote.topology)
      if (remote.sequence) saveSequence(remote.sequence)
      if (remote.legend)   saveLegend(remote.legend)
    }
    return {
      topology: remote.topology,
      sequence: remote.sequence || [],
      legend:   remote.legend  || { ...DEFAULT_LEGEND },
      captionTop: typeof remote.captionTop === 'number' ? remote.captionTop : 40
    }
  }
  return {
    topology: loadTopology(),
    sequence: loadSequence(),
    legend:   loadLegend(),
    captionTop: 40
  }
}

/** 保存到 server + localStorage */
export async function saveAll(state: RemoteState) {
  if (state.topology) saveTopology(state.topology)
  saveSequence(state.sequence)
  if (state.legend)   saveLegend(state.legend)
  await pushRemoteState(state)
}

export { pushRemoteState as _pushRemoteState, fetchRemoteState as _fetchRemoteState }
