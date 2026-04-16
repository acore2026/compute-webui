"""
Webfront backend — FastAPI
==========================
职责（只负责运行时数据；架构图配置已迁到前端仓 data/topology/）：
  1. /api/v1/system/topology/stage   当前业务阶段（轮询）
  2. /api/v1/system/ar/status        AR 眼镜实时业务状态（含细分子状态）
  3. /api/v1/metrics/history          指标历史曲线（模拟数据）
  4. /api/v1/web/sdp/offer            WebRTC 视频流 SDP 协商
  5. /api/v1/stage/simulate           触发后端 stage 演示循环
  6. /api/logs                        流程日志（模拟数据）
  7. /health                          健康检查

启动：
  python -m pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import asyncio
import logging
import random
import time as _time
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

app = FastAPI(title="Webfront Backend", version="0.3.0")

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
# Stage 状态机
# ============================================================
#
# _current_stage (int)  宏观阶段索引 → _STAGE_NAMES
# _current_ar    (str)  细粒度 AR 子状态 → _AR_STATUS_MAP
#
# 演示流程 (simulate):
#   INIT → ACN_NETWORKING → ACN_COMPLETE → COMPUTING → SANDBOX_UP
#   → MEDIA_ESTABLISHED → (停留) → 回到 INIT
#
_STAGE_NAMES = ["INIT", "ACN_NETWORKING", "COMPUTING", "MEDIA_ESTABLISHED"]

# 演示时序：(ar_status, 对应的宏观 stage index, 停留秒数)
_SIMULATE_SEQUENCE: list[tuple[str, int, float]] = [
    ("INIT",              0, 2.0),
    ("ACN_NETWORKING",    1, 3.0),
    ("ACN_COMPLETE",      1, 2.0),
    ("COMPUTING",         2, 3.0),
    ("SANDBOX_UP",        2, 2.0),
    ("MEDIA_ESTABLISHED", 3, 6.0),
]

_current_stage: int = 0          # 宏观 stage index
_current_ar: str = "INIT"        # 细粒度 AR 子状态
_sim_task: asyncio.Task | None = None

_AR_STATUS_MAP: dict[str, str] = {
    "INIT":              "系统就绪，等待演示开始...",
    "ACN_NETWORKING":    "正在进行 6G ACN 自动组网...",
    "ACN_COMPLETE":      "6G ACN 组网完成",
    "COMPUTING":         "智算沙箱寻址与媒体协商中...",
    "SANDBOX_UP":        "智算沙箱拉起成功",
    "MEDIA_ESTABLISHED": "业务已连接，实时增强渲染中",
}


def _set_stage(stage_idx: int, ar: str) -> None:
    global _current_stage, _current_ar
    _current_stage = stage_idx
    _current_ar = ar
    log.info("[stage] stage=%d  ar=%s", stage_idx, ar)


# ---- simulate 演示循环 (后台协程) ----
async def _run_simulate() -> None:
    """按 _SIMULATE_SEQUENCE 依次推进状态，每步停留指定秒数，结束后回 INIT。"""
    try:
        for ar, idx, wait in _SIMULATE_SEQUENCE:
            _set_stage(idx, ar)
            await asyncio.sleep(wait)
        # 停留在最后一个 stage
    except asyncio.CancelledError:
        _set_stage(0, "INIT")


@app.post("/api/v1/stage/simulate")
async def stage_simulate() -> dict:
    """触发一次完整的 stage 演示流程。"""
    global _sim_task
    if _sim_task and not _sim_task.done():
        _sim_task.cancel()
        try: await _sim_task
        except (asyncio.CancelledError, Exception): pass
    _sim_task = asyncio.create_task(_run_simulate())
    return {"ok": True, "message": "simulation started"}


@app.post("/api/v1/stage/reset")
async def stage_reset() -> dict:
    """停止演示并回到 INIT。"""
    global _sim_task
    if _sim_task and not _sim_task.done():
        _sim_task.cancel()
        try: await _sim_task
        except (asyncio.CancelledError, Exception): pass
    _set_stage(0, "INIT")
    return {"ok": True}


# ============================================================
# /api/v1/web/sdp/offer — WebRTC 视频流 SDP 协商 (aiortc)
# 将同目录下的 mock 视频作为视频轨道推给客户端
#
# 使用 MediaRelay 共享同一个 MediaPlayer 给所有 PC，
# 并通过定时检测自动重建到达 EOF 的 player，实现无限循环。
# ============================================================
MOCK_VIDEO = Path(__file__).parent / "mock3.mp4"

_pcs: set[RTCPeerConnection] = set()
_relay = MediaRelay()
_player: MediaPlayer | None = None


def _get_or_create_player() -> MediaPlayer:
    """获取全局 MediaPlayer，如不存在或已停止则重新创建。"""
    global _player
    if _player is None:
        _player = MediaPlayer(
            str(MOCK_VIDEO),
            options={"stream_loop": "-1"},
        )
        log.info("[video] created new MediaPlayer")
    return _player


def _reset_player() -> None:
    """强制销毁并重建 player（当 ffmpeg 子进程意外退出时调用）。"""
    global _player
    if _player is not None:
        try:
            if _player.video:
                _player.video.stop()
        except Exception:
            pass
        _player = None
    _get_or_create_player()


# 定期检查 player 是否还活着，挂了就重建
_player_watchdog: asyncio.Task | None = None


async def _watchdog_loop() -> None:
    while True:
        await asyncio.sleep(5)
        if _player is not None and _player.video is not None:
            try:
                track = _player.video
                # PlayerStreamTrack 内部的 _player 进程退了会让 readyState 变成 ended
                if getattr(track, "readyState", "live") == "ended":
                    log.warning("[video] player track ended, resetting")
                    _reset_player()
            except Exception:
                pass


@app.on_event("startup")
async def _start_watchdog():
    global _player_watchdog
    _player_watchdog = asyncio.create_task(_watchdog_loop())


@app.post("/api/v1/web/sdp/offer")
async def web_sdp_offer(request: Request):
    if not MOCK_VIDEO.exists():
        return Response(status_code=500, content=f"missing {MOCK_VIDEO}".encode())

    params = await request.json()
    sdp_offer = params.get("sdp_offer", {})
    offer = RTCSessionDescription(
        sdp=sdp_offer.get("sdp", ""),
        type=sdp_offer.get("type", "offer"),
    )

    pc = RTCPeerConnection()
    _pcs.add(pc)
    log.info("WebRTC SDP offer received (client=%s), pcs=%d",
             params.get("client_id", "?"), len(_pcs))

    player = _get_or_create_player()

    @pc.on("connectionstatechange")
    async def on_state():
        log.info("pc state: %s", pc.connectionState)
        if pc.connectionState in {"failed", "closed", "disconnected"}:
            await pc.close()
            _pcs.discard(pc)

    if player.video:
        # MediaRelay 让每个 PC 拿到独立的 relay track，共享同一个源
        pc.addTrack(_relay.subscribe(player.video))

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return {
        "status": "SUCCESS",
        "sdp_answer": {
            "sdp":  pc.localDescription.sdp,
            "type": pc.localDescription.type,
        },
    }


# ============================================================
# /api/v1/system/topology/stage — 系统业务阶段（核心网用）
# ============================================================
@app.get("/api/v1/system/topology/stage")
def topology_stage() -> dict:
    """返回当前宏观业务阶段，前端轮询此接口驱动拓扑动画。"""
    idx = _current_stage
    stage_name = _STAGE_NAMES[idx] if 0 <= idx < len(_STAGE_NAMES) else "INIT"
    return {
        "status": "SUCCESS",
        "current_stage": stage_name,
        "scene": "scene_core",
        "timestamp": int(datetime.now().timestamp()),
    }


# ============================================================
# /api/v1/system/ar/status — AR 眼镜实时业务状态（含细分子状态）
# ============================================================
@app.get("/api/v1/system/ar/status")
def ar_status() -> dict:
    """返回 AR 眼镜当前业务执行状态与提示语。"""
    return {
        "status": "SUCCESS",
        "ar_status": _current_ar,
        "message": _AR_STATUS_MAP.get(_current_ar, "系统就绪，等待演示开始..."),
        "timestamp": int(datetime.now().timestamp()),
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
