# Webfront Backend

FastAPI-based backend — 只负责运行时数据推送和模拟。
架构图配置已迁移到前端仓 `data/topology/*.json`，由 Nuxt server route 管理。

## Endpoints

| Method | Path                                    | Description                       |
|--------|-----------------------------------------|-----------------------------------|
| GET    | /api/v1/system/topology/stage           | 当前业务阶段（轮询）              |
| GET    | /api/v1/system/ar/status                | AR 眼镜实时业务状态               |
| GET    | /api/v1/metrics/history?time_window=300 | 指标历史曲线（模拟数据）          |
| POST   | /api/v1/web/sdp/offer                   | WebRTC 视频流 SDP 协商            |
| GET    | /health                                 | 健康检查                          |

## Run

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

局域网调试需加 `--host 0.0.0.0`，否则 192.168.x.x 网段访问不到。

## 前端对接

前端通过 `composables/useBackendIp.ts` 解析接口 URL，用户可在页面右上角设置弹窗
按接口粒度配置后端 IP。Nuxt Vite dev proxy 仅保留 `/api/v1` 作为本机兜底，
`/api/topology`、`/api/upload` 由 Nuxt Nitro 自身的 server route 处理。
