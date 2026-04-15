# Webfront Backend

FastAPI-based backend for the Webfront editor / dashboard.

## Endpoints

| Method | Path            | Description                              |
|--------|-----------------|------------------------------------------|
| GET    | /api/state      | 读取架构图 / 序列 / 图例 / caption 位置  |
| POST   | /api/state      | 整份覆盖保存（JSON body）                |
| GET    | /api/metrics    | 实时指标（当前为模拟数据）               |
| GET    | /api/logs?limit=20 | 日志条目列表                         |
| GET    | /stream/video   | 视频流 (占位)                            |
| GET    | /health         | 健康检查                                 |

## Run

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

数据文件：`backend/data/state.json`（首次 POST 后创建）。

## 前端对接

Nuxt dev server (`npm run dev`) 会通过 Vite proxy 将 `/api/*` 和 `/stream/*`
转发到本服务（`localhost:8000`）。
