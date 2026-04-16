# Webfront Backend

FastAPI-based backend — 只负责运行时数据推送和模拟。
架构图配置已迁移到前端仓 `data/topology/*.json`，由 Nuxt server route 管理。

## Endpoints

| Method | Path                               | Description                       |
|--------|------------------------------------|-----------------------------------|
| GET    | /api/stage                         | 当前 stage 编号                   |
| POST   | /api/stage/set?idx=N               | 设置当前 stage (-1 = idle)        |
| GET    | /api/stage/stream                  | SSE 广播 stage 变更               |
| GET    | /api/v1/metrics/history?time_window=300 | 指标历史曲线（模拟数据）     |
| GET    | /api/logs?limit=20                 | 日志条目列表（模拟数据）          |
| POST   | /api/webrtc/offer                  | WebRTC 视频流                     |
| GET    | /health                            | 健康检查                          |

## Run

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 前端对接

Nuxt dev server (`npm run dev`) 通过 Vite proxy 将指定路径
(`/api/logs`, `/api/metrics`, `/api/v1`, `/api/stage`, `/api/webrtc`, `/stream`)
转发到本服务 (`localhost:8000`)。`/api/topology` 由 Nuxt 自身的 server route 处理。
