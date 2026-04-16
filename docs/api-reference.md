# API Reference

> Compute-WebUI Backend Interface Documentation
>
> Base URL: `http://localhost:8000` (Python FastAPI) + `http://localhost:3000` (Nuxt Server Routes)
>
> Nuxt dev server proxies the following paths to FastAPI:
> `/api/logs`, `/api/metrics`, `/api/v1`, `/api/stage`, `/api/webrtc`, `/stream`
>
> `/api/topology` is handled by Nuxt's own server routes (reads/writes local JSON files).

---

## 1. Architecture Topology (Nuxt Server Route)

Architecture diagram data is stored as local JSON files in `data/topology/<view>.json`.

### GET /api/topology

Read the topology configuration for a given view.

**Query Parameters**

| Name | Type   | Required | Description                                   |
|------|--------|----------|-----------------------------------------------|
| view | string | Yes      | View identifier: `public-cloud` or `core-network` |

**Response** `200 OK`

```json
{
  "topology": {
    "nodes": [
      {
        "id": "node-1",
        "type": "mission",
        "position": { "x": 100, "y": 200 },
        "data": { "label": "IDM", "kind": "service", "handles": [...] }
      }
    ],
    "edges": [
      {
        "id": "e-1",
        "source": "node-1",
        "target": "node-2",
        "type": "mission",
        "data": { "kind": "baseline", "state": "idle", "direction": "forward", "glow": false }
      }
    ]
  },
  "sequence": [
    {
      "id": "step-1",
      "kicker": "STAGE 1",
      "title": "Step title",
      "phase": "Phase description",
      "nodes": ["node-1", "node-2"],
      "edges": ["e-1"],
      "edgeSettings": {
        "e-1": { "state": "selected", "direction": "forward", "glow": true, "lineColor": "#10b981" }
      },
      "nodeSettings": {
        "node-1": { "active": true, "message": "Processing...", "messageIcon": "spinner" }
      }
    }
  ],
  "legend": { "visible": true, "items": [{ "id": "l1", "color": "#7c3aed", "label": "Control" }] },
  "captionTop": 40
}
```

If the view file does not exist, returns an empty structure:

```json
{
  "topology": { "nodes": [], "edges": [] },
  "sequence": [],
  "legend": { "visible": false, "items": [] },
  "captionTop": 40
}
```

**Error Response** `400`

```json
{ "statusCode": 400, "statusMessage": "unknown view: xxx" }
```

---

### POST /api/topology

Write (overwrite) the topology configuration for a given view.

**Query Parameters**

| Name | Type   | Required | Description                                   |
|------|--------|----------|-----------------------------------------------|
| view | string | Yes      | View identifier: `public-cloud` or `core-network` |

**Request Body** — same schema as the GET response.

**Response** `200 OK`

```json
{ "ok": true, "view": "core-network" }
```

---

## 2. Stage Broadcast (FastAPI)

The Stage system broadcasts the current animation step index to all connected SSE clients.

### GET /api/stage

Get the current stage index.

**Response** `200 OK`

```json
{ "stage": 2 }
```

`stage = -1` indicates idle / READY state.

---

### POST /api/stage/set

Set the current stage and broadcast to all SSE subscribers.

**Query Parameters**

| Name | Type | Required | Default | Description                         |
|------|------|----------|---------|-------------------------------------|
| idx  | int  | No       | -1      | Stage index. `-1` = back to idle.   |

**Response** `200 OK`

```json
{ "ok": true, "stage": 3 }
```

---

### GET /api/stage/stream

Subscribe to stage changes via Server-Sent Events (SSE).

**Response** `200 OK` — `Content-Type: text/event-stream`

On connect, the server immediately sends the current stage:

```
data: -1

```

When stage changes:

```
data: 2

```

Keep-alive comment sent every 15 seconds if no change:

```
: keep-alive

```

---

## 3. Metrics History (FastAPI)

Returns historical time-series data points for system metrics (mock data).

### GET /api/v1/metrics/history

**Query Parameters**

| Name        | Type | Required | Default | Description                                      |
|-------------|------|----------|---------|--------------------------------------------------|
| time_window | int  | No       | 300     | Lookback window in seconds (clamped to 1–3600).  |

**Response** `200 OK`

```json
{
  "status": "SUCCESS",
  "metrics": [
    {
      "timestamp": 1679450000,
      "e2e_latency_ms": 12.4,
      "jitter_ms": 2.1,
      "compute_latency_ms": 5.2,
      "processing_latency_ms": 4.1,
      "fps": 30
    },
    {
      "timestamp": 1679450001,
      "e2e_latency_ms": 11.8,
      "jitter_ms": 1.5,
      "compute_latency_ms": 4.8,
      "processing_latency_ms": 3.9,
      "fps": 30
    }
  ]
}
```

Returns one sample per second within the window, sorted ascending by `timestamp`.

| Field                  | Type   | Unit    | Description            |
|------------------------|--------|---------|------------------------|
| timestamp              | int    | seconds | Unix epoch (seconds)   |
| e2e_latency_ms         | float  | ms      | End-to-end latency     |
| jitter_ms              | float  | ms      | Jitter                 |
| compute_latency_ms     | float  | ms      | Compute latency        |
| processing_latency_ms  | float  | ms      | Processing latency     |
| fps                    | int    | fps     | Frames per second      |

---

## 4. Logs (FastAPI)

Returns simulated process log entries.

### GET /api/logs

**Query Parameters**

| Name  | Type | Required | Default | Description                        |
|-------|------|----------|---------|------------------------------------|
| limit | int  | No       | 20      | Number of entries (clamped 1–200). |

**Response** `200 OK`

```json
{
  "items": [
    {
      "id": 10231,
      "time": "14:30:05",
      "level": "INFO",
      "message": "接收到新帧 frame_id=10231，开始预处理…"
    },
    {
      "id": 10230,
      "time": "14:30:05",
      "level": "OK",
      "message": "目标检测完成，识别 3 个对象 (耗时 42ms)"
    }
  ]
}
```

| Field   | Type   | Values                        | Description     |
|---------|--------|-------------------------------|-----------------|
| id      | int    | —                             | Frame / entry ID |
| time    | string | `HH:MM:SS`                   | Local time      |
| level   | string | `INFO`, `OK`, `WARN`, `ERROR` | Log level       |
| message | string | —                             | Log content     |

---

## 5. WebRTC Video Stream (FastAPI)

Establishes a WebRTC peer connection to stream video (mock MP4 loop).

### POST /api/webrtc/offer

**Request Body**

```json
{
  "sdp": "<SDP offer string>",
  "type": "offer"
}
```

**Response** `200 OK`

```json
{
  "sdp": "<SDP answer string>",
  "type": "answer"
}
```

**Error Response** `500` — if mock video file is missing.

The server loops `mock3.mp4` as the video track. Each connection gets an independent media player instance.

---

## 6. Health Check (FastAPI)

### GET /health

**Response** `200 OK`

```json
{ "ok": true }
```
