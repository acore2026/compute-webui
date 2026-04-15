"""
Webfront backend — FastAPI
==========================
职责：
  1. /api/state     架构图 / 序列 / 图例 / caption 位置 持久化 (JSON 文件)
  2. /api/logs      流程日志 (当前为模拟数据；后续替换为真实日志源)
  3. /api/metrics   实时指标 (当前为模拟数据)
  4. /stream/video  实时视频 (占位，等硬件/推流接入)

启动：
  python -m pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import asyncio
import json
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
# 持久化目录
# ============================================================
DATA_DIR = Path(__file__).parent / "data"
STATE_FILE = DATA_DIR / "state.json"
DATA_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# /api/state — 架构图配置读写
# ============================================================
@app.get("/api/state")
def get_state() -> dict:
    """读取保存的配置；首次无文件时返回默认空值"""
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "topology": None,
        "sequence": [],
        "legend": None,
        "captionTop": 40,
    }


@app.post("/api/state")
async def post_state(request: Request) -> dict:
    """整份覆盖写回。前端应传 {topology, sequence, legend, captionTop}。"""
    body = await request.json()
    STATE_FILE.write_text(
        json.dumps(body, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return {"ok": True}


# ============================================================
# /api/metrics — 实时指标 (示例数据)
# ============================================================
@app.get("/api/metrics")
def metrics() -> dict:
    return {
        "fps":        round(24 + random.random() * 3, 1),
        "latency_ms": round(30 + random.random() * 30, 1),
        "gpu":        round(60 + random.random() * 30, 1),
        "queue":      random.randint(0, 15),
        "ts":         datetime.now().isoformat(timespec="seconds"),
    }


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
    return {"ok": True, "state_file": str(STATE_FILE), "state_exists": STATE_FILE.exists()}
