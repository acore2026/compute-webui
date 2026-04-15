import type { Node, Edge } from '@vue-flow/core'

/* LAYOUT — 来自 docs/FLOW_DIAGRAM_SPEC.md §14
   注意：所有 mission 节点的 x/y 转换为相对父区域坐标（VueFlow group 节点要求） */

export const LAYOUT = {
  // 区域（绝对坐标）
  ott:    { x: 980, y:  84, width: 330, height: 212 },
  mno:    { x: 980, y: 356, width: 424, height: 296 },
  core:   { x:  36, y: 108, width: 860, height: 348 },
  access: { x:  36, y: 492, width: 760, height: 232 },
  bus:    { x: 212, y: 236, width: 508, height:  24 }
}

// 子节点（绝对坐标）
const N = {
  // Core
  idm:            { x: 218,  y: 140, width: 136 },
  acnAgent:       { x: 558,  y: 140, width: 196 },
  srf:            { x: 150,  y: 308, width: 128 },
  scf:            { x: 322,  y: 308, width: 128 },
  up:             { x: 482,  y: 308, width: 128 },
  cmccGw:         { x: 649,  y: 308, width: 168 },
  // Access
  ran:            { x: 202,  y: 572, width: 128 },
  phone:          { x: 392,  y: 540, width: 200 },
  robotDog:       { x: 392,  y: 632, width: 200 },
  phoneAgentCard: { x: 612,  y: 540, width: 174 },
  agentCard:      { x: 612,  y: 632, width: 174 },
  // OTT
  ottOrdering:    { x: 1142, y: 132, width: 148 },
  ottGw:          { x: 1000, y: 220, width: 168 },
  // MNO
  mnoGw:          { x: 1000, y: 404, width: 168 },
  mnoEndpoint:    { x: 1068, y: 500, width: 304 },
  armAgentCard:   { x: 1102, y: 580, width: 174 }
}

export const initialNodes: Node[] = [
  // ----- Region 节点（背景层，静态） -----
  { id: 'core',   type: 'region', position: { x: LAYOUT.core.x,   y: LAYOUT.core.y   },
    style: { width: `${LAYOUT.core.width}px`,   height: `${LAYOUT.core.height}px`   },
    data: { label: 'Core Network · CMCC', variant: 'default' },
    selectable: false, draggable: false, focusable: false, zIndex: 0 },

  { id: 'access', type: 'region', position: { x: LAYOUT.access.x, y: LAYOUT.access.y },
    style: { width: `${LAYOUT.access.width}px`, height: `${LAYOUT.access.height}px` },
    data: { label: 'Access · RAN / UE', variant: 'access' },
    selectable: false, draggable: false, focusable: false, zIndex: 0 },

  { id: 'ott',    type: 'region', position: { x: LAYOUT.ott.x,    y: LAYOUT.ott.y    },
    style: { width: `${LAYOUT.ott.width}px`,    height: `${LAYOUT.ott.height}px`    },
    data: { label: 'OTT · External', variant: 'external' },
    selectable: false, draggable: false, focusable: false, zIndex: 0 },

  { id: 'mno',    type: 'region', position: { x: LAYOUT.mno.x,    y: LAYOUT.mno.y    },
    style: { width: `${LAYOUT.mno.width}px`,    height: `${LAYOUT.mno.height}px`    },
    data: { label: 'MNO B · Partner', variant: 'mno' },
    selectable: false, draggable: false, focusable: false, zIndex: 0 },

  // ----- Bus 节点 -----
  { id: 'bus-line', type: 'bus', position: { x: LAYOUT.bus.x, y: LAYOUT.bus.y },
    style: { width: `${LAYOUT.bus.width}px`, height: `${LAYOUT.bus.height}px` },
    data: { label: 'AGENT BUS · ABI' },
    selectable: false, draggable: false, focusable: false, zIndex: 1 },

  // ----- Mission 节点 (Core) -----
  { id: 'idm',      type: 'mission', position: { x: N.idm.x, y: N.idm.y }, style: { width: `${N.idm.width}px` },
    data: { label: 'Identity', kind: 'idm', role: 'IDM · 数字身份',
      handles: ['in-bottom', 'out-bottom'], message: '' } },

  { id: 'acnAgent', type: 'mission', position: { x: N.acnAgent.x, y: N.acnAgent.y }, style: { width: `${N.acnAgent.width}px` },
    data: { label: 'ACN Agent', kind: 'agent', role: 'Mission Orchestrator', appearance: 'agent',
      handles: ['in-bottom', 'out-bottom', 'in-right', 'out-right'], message: '' } },

  { id: 'srf', type: 'mission', position: { x: N.srf.x, y: N.srf.y }, style: { width: `${N.srf.width}px` },
    data: { label: 'SRF', kind: 'srf', role: 'Session Resource',
      handles: ['in-top', 'out-top', 'in-bottom', 'out-bottom'] } },

  { id: 'scf', type: 'mission', position: { x: N.scf.x, y: N.scf.y }, style: { width: `${N.scf.width}px` },
    data: { label: 'SCF', kind: 'scf', role: 'Session Control',
      handles: ['in-top', 'out-top', 'in-bottom', 'out-bottom'] } },

  { id: 'up', type: 'mission', position: { x: N.up.x, y: N.up.y }, style: { width: `${N.up.width}px` },
    data: { label: 'UP', kind: 'up', role: 'User Plane',
      handles: ['in-top', 'out-top', 'in-bottom', 'out-bottom', 'out-right'] } },

  { id: 'cmccGw', type: 'mission', position: { x: N.cmccGw.x, y: N.cmccGw.y }, style: { width: `${N.cmccGw.width}px` },
    data: { label: 'CMCC GW', kind: 'gw', role: 'Inter-Operator Gateway', appearance: 'gateway',
      handles: ['in-top', 'in-left', 'out-right'] } },

  // ----- Mission 节点 (Access) -----
  { id: 'ran', type: 'mission', position: { x: N.ran.x, y: N.ran.y }, style: { width: `${N.ran.width}px` },
    data: { label: 'RAN', kind: 'access', role: 'Radio Access Node',
      handles: ['in-top', 'out-top', 'out-top-left', 'out-top-right', 'in-right', 'out-right'] } },

  { id: 'phone', type: 'mission', position: { x: N.phone.x, y: N.phone.y }, style: { width: `${N.phone.width}px` },
    data: { label: 'UE · Phone', kind: 'endpoint', role: 'Smartphone',
      handles: ['in-left', 'out-left', 'out-right'] } },

  { id: 'robotDog', type: 'mission', position: { x: N.robotDog.x, y: N.robotDog.y }, style: { width: `${N.robotDog.width}px` },
    data: { label: 'Robot Dog', kind: 'robot', role: 'Unitree · Quadruped',
      handles: ['in-left', 'out-left', 'out-right'] } },

  { id: 'phoneAgentCard', type: 'mission', position: { x: N.phoneAgentCard.x, y: N.phoneAgentCard.y }, style: { width: `${N.phoneAgentCard.width}px` },
    data: { label: 'UE Agent Card', kind: 'card', role: '已签发 · 蓝色凭证', appearance: 'pill',
      handles: ['in-left'] } },

  { id: 'agentCard', type: 'mission', position: { x: N.agentCard.x, y: N.agentCard.y }, style: { width: `${N.agentCard.width}px` },
    data: { label: 'RobotDog Card', kind: 'card', role: '已签发 · 绿色凭证', appearance: 'pill',
      handles: ['in-left'] } },

  // ----- Mission 节点 (OTT) -----
  { id: 'ottOrdering', type: 'mission', position: { x: N.ottOrdering.x, y: N.ottOrdering.y }, style: { width: `${N.ottOrdering.width}px` },
    data: { label: 'Ordering', kind: 'service', role: 'OTT 下单服务',
      handles: ['out-bottom', 'in-left'] } },

  { id: 'ottGw', type: 'mission', position: { x: N.ottGw.x, y: N.ottGw.y }, style: { width: `${N.ottGw.width}px` },
    data: { label: 'OTT GW', kind: 'gw', role: 'External Gateway', appearance: 'gateway',
      handles: ['in-top', 'out-bottom', 'out-left'] } },

  // ----- Mission 节点 (MNO) -----
  { id: 'mnoGw', type: 'mission', position: { x: N.mnoGw.x, y: N.mnoGw.y }, style: { width: `${N.mnoGw.width}px` },
    data: { label: 'MNO B GW', kind: 'gw', role: 'Partner Gateway', appearance: 'gateway',
      handles: ['in-top', 'out-bottom', 'out-left'] } },

  { id: 'mnoEndpoint', type: 'mission', position: { x: N.mnoEndpoint.x, y: N.mnoEndpoint.y }, style: { width: `${N.mnoEndpoint.width}px` },
    data: { label: 'Robotic Arm', kind: 'arm', role: 'MNO B · 远程机械臂',
      handles: ['in-top', 'out-bottom'] } },

  { id: 'armAgentCard', type: 'mission', position: { x: N.armAgentCard.x, y: N.armAgentCard.y }, style: { width: `${N.armAgentCard.width}px` },
    data: { label: 'Arm Agent Card', kind: 'card', role: '已签发 · 橙色凭证', appearance: 'pill',
      handles: ['in-top'] } }
]

// ----- Edges -----
export const initialEdges: Edge[] = [
  // Bus 挂载（控制总线）
  { id: 'e-idm-bus',    source: 'bus-line', sourceHandle: 'abi-top-15', target: 'idm',     targetHandle: 'in-bottom', type: 'mission',
    data: { kind: 'bus', state: 'idle' } },
  { id: 'e-acn-bus',    source: 'bus-line', sourceHandle: 'abi-top-75', target: 'acnAgent',targetHandle: 'in-bottom', type: 'mission',
    data: { kind: 'bus', state: 'idle' } },
  { id: 'e-srf-bus',    source: 'bus-line', sourceHandle: 'abi-bottom-15', target: 'srf',  targetHandle: 'in-top', type: 'mission',
    data: { kind: 'bus', state: 'idle' } },
  { id: 'e-scf-bus',    source: 'bus-line', sourceHandle: 'abi-bottom-35', target: 'scf',  targetHandle: 'in-top', type: 'mission',
    data: { kind: 'bus', state: 'idle' } },
  { id: 'e-up-bus',     source: 'bus-line', sourceHandle: 'abi-bottom-55', target: 'up',   targetHandle: 'in-top', type: 'mission',
    data: { kind: 'bus', state: 'idle' } },

  // Core control plane
  { id: 'e-idm-acn',    source: 'idm',      sourceHandle: 'out-bottom', target: 'acnAgent', targetHandle: 'in-bottom', type: 'mission',
    data: { kind: 'logic', plane: 'control', state: 'idle' } },

  // RAN ↔ Core (control)
  { id: 'e-srf-ran', source: 'srf', sourceHandle: 'out-bottom', target: 'ran', targetHandle: 'in-top', type: 'mission',
    data: { kind: 'logic', plane: 'control', state: 'idle', note: 'control' } },
  { id: 'e-scf-ran', source: 'scf', sourceHandle: 'out-bottom', target: 'ran', targetHandle: 'in-top', type: 'mission',
    data: { kind: 'logic', plane: 'control', state: 'idle', note: 'control' } },

  // UP → CMCC GW (data plane)
  { id: 'e-up-gw', source: 'up', sourceHandle: 'out-right', target: 'cmccGw', targetHandle: 'in-left', type: 'mission',
    data: { kind: 'baseline', plane: 'data', state: 'idle', note: 'N6' } },

  // RAN → UP (data plane)
  { id: 'e-ran-up', source: 'ran', sourceHandle: 'out-top-right', target: 'up', targetHandle: 'in-bottom', type: 'mission',
    data: { kind: 'baseline', plane: 'data', state: 'idle', note: 'N3' } },

  // RAN ↔ Phone (wireless)
  { id: 'e-ran-phone', source: 'phone', sourceHandle: 'out-left', target: 'ran', targetHandle: 'in-right', type: 'mission',
    data: { kind: 'wireless', plane: 'data', state: 'idle' } },

  // Phone ↔ AgentCard
  { id: 'e-phone-card', source: 'phone', sourceHandle: 'out-right', target: 'phoneAgentCard', targetHandle: 'in-left', type: 'mission',
    data: { kind: 'baseline', state: 'idle' } },
  { id: 'e-dog-card',   source: 'robotDog', sourceHandle: 'out-right', target: 'agentCard', targetHandle: 'in-left', type: 'mission',
    data: { kind: 'baseline', state: 'idle' } },

  // OTT
  { id: 'e-ott-ord-gw', source: 'ottOrdering', sourceHandle: 'out-bottom', target: 'ottGw', targetHandle: 'in-top', type: 'mission',
    data: { kind: 'logic', plane: 'control', state: 'idle' } },

  // OTT ↔ MNO ↔ CMCC (跨域)
  { id: 'e-ott-mno', source: 'ottGw', sourceHandle: 'out-bottom', target: 'mnoGw', targetHandle: 'in-top', type: 'mission',
    data: { kind: 'baseline', plane: 'data', state: 'idle', note: 'NRF' } },
  { id: 'e-mno-cmcc', source: 'mnoGw', sourceHandle: 'out-left', target: 'cmccGw', targetHandle: 'in-top', type: 'mission',
    data: { kind: 'baseline', plane: 'data', state: 'idle' } },

  // MNO 内
  { id: 'e-mno-arm', source: 'mnoGw', sourceHandle: 'out-bottom', target: 'mnoEndpoint', targetHandle: 'in-top', type: 'mission',
    data: { kind: 'baseline', plane: 'data', state: 'idle' } },
  { id: 'e-arm-card', source: 'mnoEndpoint', sourceHandle: 'out-bottom', target: 'armAgentCard', targetHandle: 'in-top', type: 'mission',
    data: { kind: 'baseline', state: 'idle' } }
]

// 演示流转序列
export const SIMULATION_STEPS: Array<{ kicker: string; title: string; phase: string; nodes: string[]; edges: string[] }> = [
  { kicker: 'STAGE 1', title: '智能体身份注册', phase: '控制面 · IDM',
    nodes: ['idm', 'acnAgent'], edges: ['e-idm-bus', 'e-acn-bus', 'e-idm-acn'] },
  { kicker: 'STAGE 2', title: 'Agent Card 签发', phase: '凭证下发',
    nodes: ['phone', 'robotDog', 'phoneAgentCard', 'agentCard'], edges: ['e-phone-card', 'e-dog-card'] },
  { kicker: 'STAGE 3', title: 'OTT 下单 → MNO 协同', phase: '跨域协同',
    nodes: ['ottOrdering', 'ottGw', 'mnoGw'], edges: ['e-ott-ord-gw', 'e-ott-mno'] },
  { kicker: 'STAGE 4', title: '机械臂任务下发', phase: '数据面 · MNO',
    nodes: ['mnoGw', 'mnoEndpoint', 'armAgentCard'], edges: ['e-mno-arm', 'e-arm-card'] },
  { kicker: 'STAGE 5', title: '无线接入 · UE 接入 RAN', phase: '无线数据面',
    nodes: ['phone', 'ran'], edges: ['e-ran-phone'] },
  { kicker: 'STAGE 6', title: 'UP 透传至跨域 GW', phase: '数据平面 · N3 / N6',
    nodes: ['ran', 'up', 'cmccGw'], edges: ['e-ran-up', 'e-up-gw', 'e-mno-cmcc'] },
  { kicker: 'COMPLETE', title: '端到端协同建立', phase: '全链路就绪',
    nodes: ['acnAgent'], edges: [] }
]
