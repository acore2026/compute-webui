"""
Webfront backend — FastAPI
==========================
职责（只负责运行时数据；架构图配置已迁到前端仓 data/topology/）：
  1. /api/stage/*              当前 Stage 广播（SSE 推送）— 核心用途
  2. /api/v1/metrics/history   指标历史曲线（模拟数据）
  3. /api/metrics              实时指标（单点 mock，legacy）
  4. /api/logs                 流程日志（模拟数据）
  5. /api/webrtc/offer         WebRTC 视频流
  6. /health                   健康检查

启动：
  python -m pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import asyncio
import logging
import random
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# WebRTC (aiortc)
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRelay


logging.basicConfig(level=logging.INFO)
log = logging.getLogger("webfront")

app = FastAPI(title="Webfront Backend", version="0.2.0")

# 允许开发模式下 Nuxt 前端跨域直连 (生产经 vite proxy 不需要)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# /api/v1/metrics/history — 指标历史曲线 (示例数据)
# 前端 composables/useMetricsHistory.ts 消费本接口
# ============================================================
@app.get("/api/v1/metrics/history")
def metrics_history(time_window: int = 300) -> dict:
    """返回过去 time_window 秒的采样点（每秒一条，模拟数据）。"""
    window = max(1, min(int(time_window), 3600))
    now_ts = int(datetime.now().timestamp())
    start_ts = now_ts - window + 1

    samples = []
    for ts in range(start_ts, now_ts + 1):
        compute = round(3.5 + random.random() * 3.0, 2)
        processing = round(3.0 + random.random() * 2.5, 2)
        jitter = round(0.5 + random.random() * 2.5, 2)
        e2e = round(compute + processing + jitter + random.random() * 1.5, 2)
        fps = 30 if random.random() > 0.08 else 30 - random.randint(1, 4)
        samples.append({
            "timestamp":             ts,
            "e2e_latency_ms":        e2e,
            "jitter_ms":             jitter,
            "compute_latency_ms":    compute,
            "processing_latency_ms": processing,
            "fps":                   fps,
        })

    return {"status": "SUCCESS", "metrics": samples}


# ============================================================
# /api/logs — 日志条目 (示例数据)
# ============================================================
_SAMPLES = [
    ("INFO",  "接收到新帧 frame_id={fid}，开始预处理…"),
    ("OK",    "目标检测完成，识别 3 个对象 (耗时 42ms)"),
    ("INFO",  "推送结果到下游服务 /api/result"),
    ("WARN",  "GPU 负载偏高 87%，启动节流策略"),
    ("ERROR", "帧 {fid} 解码失败，已跳过"),
]


@app.get("/api/logs")
def logs(limit: int = 20) -> dict:
    limit = max(1, min(limit, 200))
    now = datetime.now()
    base_fid = 10000 + int(now.timestamp()) % 1000
    items = []
    for i in range(limit):
        lvl, tmpl = random.choice(_SAMPLES)
        fid = base_fid - i
        items.append({
            "id":      fid,
            "time":    now.strftime("%H:%M:%S"),
            "level":   lvl,
            "message": tmpl.format(fid=fid),
        })
    # 最新在前
    return {"items": items}


# ============================================================
# /api/stage — 当前激活的 Stage，由后端广播给所有前端
# ============================================================
_current_stage: int = -1                 # -1 表示 idle / READY
_stage_subs: list[asyncio.Queue[int]] = []


def _broadcast_stage(idx: int) -> None:
    global _current_stage
    _current_stage = idx
    for q in list(_stage_subs):
        try: q.put_nowait(idx)
        except Exception: pass


@app.get("/api/stage")
def stage_current() -> dict:
    return {"stage": _current_stage}


@app.post("/api/stage/set")
async def stage_set(idx: int = -1) -> dict:
    """设置当前 stage，客户端通过 SSE 收到广播。idx=-1 表示回到 idle/READY。"""
    _broadcast_stage(idx)
    return {"ok": True, "stage": idx}


@app.get("/api/stage/stream")
async def stage_stream():
    """SSE: 订阅 stage 变化。"""
    q: asyncio.Queue[int] = asyncio.Queue()
    _stage_subs.append(q)

    async def gen():
        try:
            # 发一次初始值，前端刚连上就能同步
            yield f"data: {_current_stage}\n\n"
            while True:
                try:
                    idx = await asyncio.wait_for(q.get(), timeout=15)
                    yield f"data: {idx}\n\n"
                except asyncio.TimeoutError:
                    # 心跳，保活代理
                    yield ": keep-alive\n\n"
        finally:
            if q in _stage_subs:
                _stage_subs.remove(q)

    return StreamingResponse(gen(), media_type="text/event-stream")


# ============================================================
# /api/webrtc/offer — WebRTC 视频流 (aiortc)
# 将同目录下的 mock 视频作为视频轨道推给客户端
# ============================================================
MOCK_VIDEO = Path(__file__).parent / "mock3.mp4"

_pcs: set[RTCPeerConnection] = set()


@app.post("/api/webrtc/offer")
async def webrtc_offer(request: Request):
    if not MOCK_VIDEO.exists():
        return Response(status_code=500, content=f"missing {MOCK_VIDEO}".encode())

    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    _pcs.add(pc)
    log.info("WebRTC offer received, pcs=%d", len(_pcs))

    # 每个连接独立的 MediaPlayer，loop 依靠 ffmpeg stream_loop
    player = MediaPlayer(
        str(MOCK_VIDEO),
        options={"stream_loop": "-1"},
    )

    @pc.on("connectionstatechange")
    async def on_state():
        log.info("pc state: %s", pc.connectionState)
        if pc.connectionState in {"failed", "closed", "disconnected"}:
            try:
                if player.video:
                    player.video.stop()
            except Exception:
                pass
            await pc.close()
            _pcs.discard(pc)

    if player.video:
        pc.addTrack(player.video)

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return {
        "sdp":  pc.localDescription.sdp,
        "type": pc.localDescription.type,
    }


@app.on_event("shutdown")
async def on_shutdown():
    await asyncio.gather(*(pc.close() for pc in list(_pcs)))
    _pcs.clear()


# ============================================================
# 健康检查
# ============================================================
@app.get("/health")
def health() -> dict:
    return {"ok": True}
