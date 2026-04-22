"""
Webfront backend — FastAPI
==========================
职责（只负责运行时数据；架构图配置已迁到前端仓 data/topology/）：
  1. /api/v1/system/topology/stage   当前业务阶段（轮询）
  2. /api/v1/system/ar/status        AR 眼镜实时业务状态（含细分子状态）
  3. /api/v1/metrics/history          指标历史曲线（模拟数据）
  4. /api/v1/web/sdp/offer            WebRTC 视频流 SDP 协商
  5. /health                          健康检查

启动：
  python -m pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

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

    is_stage4 = _current_ar == "MEDIA_ESTABLISHED"

    def clamp(value: float, lower: float, upper: float) -> float:
        return max(lower, min(upper, value))

    def build_average(rows: list[dict]) -> dict | None:
        if not rows:
            return None
        return {
            "e2e_latency_ms": round(sum(item["e2e_latency_ms"] for item in rows) / len(rows), 2),
            "fps": round(sum(item["fps"] for item in rows) / len(rows), 2),
        }

    samples = []
    ott_samples = []
    for index, ts in enumerate(range(start_ts, now_ts + 1)):
        progress = index / max(window - 1, 1)
        wave = ((index * 7) % 9) - 4
        ripple = ((index * 5) % 7) - 3

        if is_stage4:
            transition = 0.52
            if progress < transition:
                e2e = 11.5 + progress * 8.0 + wave * 0.55
                fps = 29.5 - abs(ripple) * 0.18
            else:
                late = (progress - transition) / max(1 - transition, 1e-6)
                e2e = 38.0 + late * 22.0 + wave * 1.2
                fps = 25.0 - late * 3.0 - abs(ripple) * 0.35
        else:
            e2e = 12.5 + progress * 4.0 + wave * 0.5
            fps = 29.6 - abs(ripple) * 0.16

        core_sample = {
            "timestamp":      ts,
            "e2e_latency_ms": round(clamp(e2e, 8.5, 72.0), 2),
            "fps":            round(clamp(fps, 18.0, 30.0), 2),
        }
        samples.append(core_sample)

        if not is_stage4:
            continue

        ott_e2e = core_sample["e2e_latency_ms"] + 12.0 + progress * 8.0 + abs(wave) * 0.8
        ott_fps = core_sample["fps"] - 1.2 - abs(ripple) * 0.18
        ott_samples.append({
            "timestamp":      ts,
            "e2e_latency_ms": round(clamp(ott_e2e, 18.0, 88.0), 2),
            "fps":            round(clamp(ott_fps, 16.0, 30.0), 2),
        })

    return {
        "status": "SUCCESS",
        "metrics": samples,
        "ott_metrics": ott_samples if is_stage4 else [],
        "average": build_average(samples),
        "ott_average": build_average(ott_samples) if is_stage4 else None,
    }


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

# whisper 与 gesture 相互独立，各自有独立循环，且各自可为空。
# current_gesture 枚举：pointing_up, back, pointing_left, pointing_right, hello, palm
# last_whisper 为常驻字段，始终有内容，每 6 秒轮换一次。
_WHISPER_SEQUENCE: list[str] = [
    "看看前方情况",
    "沿着走廊走",
    "识别一下桌上物体",
    "停下来等一会",
    "回到出发点",
    "去厨房取餐",
]
_GESTURE_SEQUENCE: list[str] = [
    "hello",
    "",
    "pointing_up",
    "",
    "pointing_left",
    "palm",
    "",
    "pointing_right",
    "back",
]

_current_whisper: str = _WHISPER_SEQUENCE[0]  # 常驻，启动即有值
_current_gesture: str = ""
_whisper_task: asyncio.Task | None = None
_gesture_task: asyncio.Task | None = None


def _set_stage(stage_idx: int, ar: str) -> None:
    global _current_stage, _current_ar
    _current_stage = stage_idx
    _current_ar = ar
    log.info("[stage] stage=%d  ar=%s", stage_idx, ar)


# ---- simulate 演示循环 (后台协程，无限循环) ----
async def _run_simulate() -> None:
    """按 _SIMULATE_SEQUENCE 无限循环推进状态。"""
    try:
        while True:
            for ar, idx, wait in _SIMULATE_SEQUENCE:
                _set_stage(idx, ar)
                await asyncio.sleep(wait)
    except asyncio.CancelledError:
        pass


async def _run_whisper_loop() -> None:
    """独立循环推进 last_whisper（与 stage / gesture 无关，常驻不为空）。"""
    global _current_whisper
    # 启动立即赋一条，保证首次请求就有内容
    _current_whisper = _WHISPER_SEQUENCE[0]
    try:
        while True:
            for w in _WHISPER_SEQUENCE:
                _current_whisper = w
                await asyncio.sleep(6.0)
    except asyncio.CancelledError:
        pass


async def _run_gesture_loop() -> None:
    """独立循环推进 current_gesture（与 stage / whisper 无关）。"""
    global _current_gesture
    try:
        while True:
            for g in _GESTURE_SEQUENCE:
                _current_gesture = g
                await asyncio.sleep(2.5)
    except asyncio.CancelledError:
        pass


def _ensure_loop() -> None:
    """确保所有演示循环都在运行。"""
    global _sim_task, _whisper_task, _gesture_task
    if not (_sim_task and not _sim_task.done()):
        _sim_task = asyncio.create_task(_run_simulate())
    if not (_whisper_task and not _whisper_task.done()):
        _whisper_task = asyncio.create_task(_run_whisper_loop())
    if not (_gesture_task and not _gesture_task.done()):
        _gesture_task = asyncio.create_task(_run_gesture_loop())


@app.on_event("startup")
async def _auto_start_simulate() -> None:
    """服务启动时自动开始 stage / whisper / gesture 循环。"""
    _ensure_loop()


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
    """返回 AR 眼镜当前业务执行状态与提示语。

    last_whisper 与 current_gesture 彼此独立，各自可为空。
    """
    return {
        "status": "SUCCESS",
        "ar_status": _current_ar,
        "message": _AR_STATUS_MAP.get(_current_ar, "系统就绪，等待演示开始..."),
        "last_whisper": _current_whisper,
        "current_gesture": _current_gesture,
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
