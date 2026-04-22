import type { Node, Edge } from '@vue-flow/core'

export type ViewId = 'public-cloud' | 'core-network'
export const VIEW_IDS: ViewId[] = ['public-cloud', 'core-network']
export const DEFAULT_VIEW: ViewId = 'core-network'

/**
 * 设计：每个 step 对自己涉及的 node/edge 可以完全独立覆盖 data 上任意字段。
 * 下面列出的是"常见的"覆盖字段，便于 IDE 提示，但接口用 [extra] 索引签名开放给
 * 任何新字段——以后新增任何视觉 / 状态属性自动 per-stage 生效，不需要改类型。
 *
 * 真正必须 base 共享的结构性字段（kind / plane / label）不通过 override 写入，
 * 由编辑器的 EDGE_BASE_ONLY / NODE_BASE_ONLY 集合控制。
 */
export interface EdgeOverride {
  direction?: 'forward' | 'reverse' | 'bidirectional'
  glow?: boolean
  state?: 'selected' | 'active' | 'idle'
  tone?: string
  lineColor?: string
  lineWidth?: number
  lineOpacity?: number
  pathType?: string
  note?: string
  [extra: string]: unknown
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

export interface NodeOverride {
  message?: string
  messageIcon?: BubbleIcon
  messageState?: BubbleState
  plan?: NodePlan | null
  active?: boolean
  flashActive?: boolean
  [extra: string]: unknown
}

export interface SequenceStep {
  id: string
  kicker: string
  title: string
  phase: string
  nodes: string[]
  edges: string[]
  edgeSettings?: Record<string, EdgeOverride>
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

export const EMPTY_TOPOLOGY: Topology = { nodes: [], edges: [] }

export const DEFAULT_STEP: SequenceStep = {
  id: 'stage-base',
  kicker: 'BASE',
  title: 'INIT',
  phase: 'Shared base layout',
  nodes: [],
  edges: []
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function compactRecord<T extends Record<string, unknown> | undefined>(value: T) {
  if (!value) return undefined
  const entries = Object.entries(value).filter(([, item]) => item && Object.keys(item as object).length > 0)
  return entries.length ? Object.fromEntries(entries) as T : undefined
}

function sanitizeStep(step: SequenceStep, index: number): SequenceStep {
  return {
    id: typeof step.id === 'string' && step.id ? step.id : `step-${index + 1}`,
    kicker: typeof step.kicker === 'string' && step.kicker ? step.kicker : `STAGE ${index + 1}`,
    title: typeof step.title === 'string' && step.title ? step.title : `STEP ${index + 1}`,
    phase: typeof step.phase === 'string' ? step.phase : '',
    nodes: Array.isArray(step.nodes) ? [...step.nodes] : [],
    edges: Array.isArray(step.edges) ? [...step.edges] : [],
    nodeSettings: compactRecord(step.nodeSettings),
    edgeSettings: compactRecord(step.edgeSettings)
  }
}

function isBaseLikeStep(step: SequenceStep | undefined) {
  if (!step) return false
  const title = step.title.trim().toUpperCase()
  return !title || title === 'INIT' || title === 'DEFAULT' || title === 'BASE' || step.id === DEFAULT_STEP.id
}

function toBaseStep(step: SequenceStep | undefined): SequenceStep {
  if (!step) return { ...DEFAULT_STEP }
  return {
    ...step,
    id: DEFAULT_STEP.id,
    kicker: typeof step.kicker === 'string' && step.kicker ? step.kicker : DEFAULT_STEP.kicker,
    title: typeof step.title === 'string' && step.title ? step.title : DEFAULT_STEP.title,
    phase: typeof step.phase === 'string' ? step.phase : DEFAULT_STEP.phase
  }
}

export function normalizeSequenceSteps(steps: SequenceStep[] | undefined | null): SequenceStep[] {
  const sanitized = Array.isArray(steps) ? steps.map(sanitizeStep) : []
  const hasBaseStage = isBaseLikeStep(sanitized[0])
  const baseStep = hasBaseStage ? toBaseStep(sanitized[0]) : { ...DEFAULT_STEP }
  const animationSteps = hasBaseStage ? sanitized.slice(1) : sanitized
  return [baseStep, ...animationSteps]
}

/* ============================================================
   数据源：前端代码仓下的 data/topology/<view>.json
   通过 Nuxt server route /api/topology 读写，不再走 Python 后端，
   也不再使用 localStorage。
   ============================================================ */
export interface CaptionConfig {
  kicker: string
  title: string
  phase: string
}

export const DEFAULT_CAPTION: CaptionConfig = { kicker: 'READY', title: '等待设备接入', phase: '已就绪' }

export interface RemoteState {
  topology: Topology | null
  sequence: SequenceStep[]
  legend: LegendConfig | null
  captionTop?: number
  captionVisible?: boolean
  caption?: CaptionConfig
}

export async function fetchRemoteState(view: ViewId = DEFAULT_VIEW): Promise<RemoteState | null> {
  try {
    return await $fetch<RemoteState>(`/api/topology?view=${view}`)
  } catch {
    return null
  }
}

export async function pushRemoteState(state: RemoteState, view: ViewId = DEFAULT_VIEW) {
  try {
    await $fetch(`/api/topology?view=${view}`, { method: 'POST', body: state })
  } catch (e) {
    console.warn('[topology] save failed', e)
  }
}

export async function loadAll(view: ViewId = DEFAULT_VIEW): Promise<{
  topology: Topology
  sequence: SequenceStep[]
  legend: LegendConfig
  captionTop: number
  captionVisible: boolean
  caption: CaptionConfig
}> {
  const remote = await fetchRemoteState(view)
  const topology  = remote?.topology  ?? { nodes: [], edges: [] }
  const sequence  = normalizeSequenceSteps(remote?.sequence)
  const legendCfg = remote?.legend    ?? { ...DEFAULT_LEGEND }
  const captionTop = typeof remote?.captionTop === 'number' ? remote.captionTop : 40
  const captionVisible = remote?.captionVisible ?? true
  const captionCfg = remote?.caption  ?? { ...DEFAULT_CAPTION }
  return { topology, sequence, legend: legendCfg, captionTop, captionVisible, caption: captionCfg }
}

export async function saveAll(state: RemoteState, view: ViewId = DEFAULT_VIEW) {
  await pushRemoteState({
    ...state,
    sequence: normalizeSequenceSteps(state.sequence)
  }, view)
}
