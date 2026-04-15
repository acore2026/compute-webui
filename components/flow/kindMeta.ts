import {
  Smartphone, Radio, Router, Repeat, Cpu, UserCheck, BrainCircuit,
  Settings, Database, Waypoints, Bot, Wrench, IdCard,
  Dog, Car, Glasses, Plane, Store, Server,
  UserCog, Route, RadioTower, MonitorCog, CircuitBoard, Share2,
  Network, Layers3, Boxes, Shield, Zap,
  Rabbit, Cog, Waves
} from 'lucide-vue-next'
import { defineComponent, h } from 'vue'
import type { Component } from 'vue'

/** 文字图标：lucide 里没有合适 svg 时用字母/字符替代
 *  接受 size 与 color，与 lucide 组件 props 一致，在 flex 容器中能正确对齐 */
function textIcon(ch: string): Component {
  return defineComponent({
    props: {
      size:  { type: Number, default: 16 },
      color: { type: String, default: 'currentColor' }
    },
    setup(props) {
      return () => h('span', {
        style: {
          display: 'inline-block',
          width:  `${props.size}px`,
          height: `${props.size}px`,
          lineHeight: `${props.size}px`,
          fontSize:  `${Math.max(props.size - 2, 10)}px`,
          fontWeight: 800,
          textAlign: 'center',
          color: props.color,
          fontFamily: "'Avenir Next', 'Helvetica Neue', system-ui, sans-serif",
          letterSpacing: 0,
          verticalAlign: 'middle',
          flexShrink: 0
        }
      }, ch)
    }
  })
}

export type NodeKind =
  // 网络/终端基础
  | 'endpoint' | 'access' | 'upf' | 'router' | 'service'
  | 'idm' | 'agent' | 'srf' | 'scf' | 'up'
  | 'gw' | 'robot' | 'arm' | 'card'
  // 终端/设备
  | 'dog' | 'car' | 'glasses' | 'drone' | 'merchant' | 'server' | 'labubu' | 'machine'
  // 新增：电信/智能体/算力
  | 'identity_mgr' | 'signaling' | 'base_station' | 'user_plane'
  | 'sys_agent' | 'compute_agent' | 'connect_agent' | 'acn_agent'
  | 'csf' | 'maas' | 'sandbox' | 'aic'

export type Appearance = 'default' | 'agent' | 'gateway' | 'pill'

export const kindMeta: Record<NodeKind, { icon: Component; tint: string; label?: string }> = {
  endpoint: { icon: Smartphone,   tint: 'var(--node-blue)'  },
  access:   { icon: Radio,        tint: 'var(--node-green)' },
  upf:      { icon: Router,       tint: 'var(--node-cyan)'  },
  router:   { icon: Repeat,       tint: 'var(--node-amber)' },
  service:  { icon: Cpu,          tint: 'var(--node-pink)'  },
  idm:      { icon: UserCheck,    tint: '#6366f1'           },
  agent:    { icon: BrainCircuit, tint: '#8b5cf6'           },
  srf:      { icon: Settings,     tint: '#ec4899'           },
  scf:      { icon: Settings,     tint: '#f43f5e'           },
  up:       { icon: Database,     tint: '#06b6d4'           },
  gw:       { icon: Waypoints,    tint: '#f59e0b'           },
  robot:    { icon: Bot,          tint: '#0f766e', label: '机器人' },
  arm:      { icon: Wrench,       tint: '#f97316', label: '机器臂' },
  card:     { icon: IdCard,       tint: '#0f766e'           },

  dog:      { icon: Dog,          tint: '#14b8a6', label: '机器狗' },
  car:      { icon: Car,          tint: '#0ea5e9', label: '车辆'   },
  glasses:  { icon: Glasses,      tint: '#a855f7', label: 'AR 眼镜' },
  drone:    { icon: Plane,        tint: '#6366f1', label: '无人机' },
  merchant: { icon: Store,        tint: '#ea580c', label: '商户'   },
  server:   { icon: Server,       tint: '#0f172a', label: '服务器' },
  labubu:   { icon: textIcon('L'), tint: '#ec4899', label: 'Labubu' },
  machine:  { icon: Cog,          tint: '#64748b', label: '机械'   },

  // 电信 / 网络
  identity_mgr: { icon: UserCog,    tint: '#6366f1', label: '身份管理' },
  signaling:    { icon: Route,      tint: '#ec4899', label: '信令路由' },
  base_station: { icon: RadioTower, tint: '#10b981', label: '无线基站' },
  user_plane:   { icon: textIcon('U'), tint: '#0ea5e9', label: '用户面' },

  // 智能体家族
  sys_agent:     { icon: MonitorCog,   tint: '#8b5cf6', label: 'SYS 智能体' },
  compute_agent: { icon: CircuitBoard,  tint: '#0ea5e9', label: '计算智能体' },
  connect_agent: { icon: Share2,       tint: '#14b8a6', label: '连接智能体' },
  acn_agent:     { icon: Network,      tint: '#7c3aed', label: 'ACN 智能体' },

  // 算力 / 服务
  csf:     { icon: Zap,     tint: '#f43f5e', label: '计算服务功能' },
  maas:    { icon: Boxes,   tint: '#f59e0b', label: 'MaaS' },
  sandbox: { icon: Shield,  tint: '#334155', label: '沙箱' },
  aic:     { icon: Layers3, tint: '#eab308', label: '智算' }
}
