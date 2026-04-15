## Why

The metrics tab in `LogsPanel.vue` currently shows four static mock cards (FPS, inference latency, GPU usage, queue backlog) with no backend data — they are hardcoded `ref()` values. The backend now exposes a time-series endpoint (`GET /api/v1/metrics/history?time_window=300`) that returns real samples of end-to-end latency, jitter, compute/processing latency, and FPS. Replacing the static cards with live line charts turns the panel from a placeholder into an actual operator-facing observability view, and makes latency/jitter trends visible rather than hidden behind point-in-time numbers.

## What Changes

- **BREAKING**: Remove the four static mock metric cards in `LogsPanel.vue` (FPS, 推理延迟, GPU usage, 队列积压) and the hardcoded `metrics` ref backing them. The displayed fields change — GPU usage and queue backlog are not part of the new backend contract and will no longer be shown.
- Add a time-series line chart view fed by the new history endpoint.
- Add a new composable (`composables/useMetricsHistory.ts`) that polls `GET /api/v1/metrics/history?time_window=300` on a fixed interval, validates the `status === "SUCCESS"` envelope, and exposes a reactive array of samples plus loading/error state.
- Replace the two-tab (`日志` / `指标`) header with a **five-button tab row**: `流程日志`, `E2E latency`, `Jitter`, `Comp latency`, `FPS`. Add a Chinese panel title `状态监控` on the left; remove the `Telemetry` kicker.
- Each of the four metric tabs shows exactly one line chart for that field; switching tabs swaps the series without remounting the panel. Latency tabs use a `ms` y-axis, the `FPS` tab uses a `fps` y-axis.
- `processing_latency_ms` is still part of the backend contract and is fetched/typed, but no tab displays it in v1.
- Render timestamps on the x-axis as local `HH:MM:SS` (backend sends Unix seconds).
- Show a loading skeleton on first fetch, an error banner with a retry button on fetch failure, and an "no data" state when `metrics` is empty. The metric panel mounts only while a metric tab is active (`v-if`), so polling starts/stops with the tab.
- Use Chart.js (already in `package.json`) as the rendering library — no new dependency.

## Capabilities

### New Capabilities

- `metrics-history`: Frontend capability for fetching and visualizing the backend metrics history time series. Covers the polling data source, the envelope/schema contract with the backend, the chart rendering requirements, and the loading/error/empty UX.

### Modified Capabilities

<!-- None — the existing LogsPanel metrics tab has no spec; it is mock-only UI being replaced. -->

## Impact

- **Affected files**:
  - `components/LogsPanel.vue` — metrics tab markup and script (lines ~44–66, ~193–198) replaced with chart components and a call to the new composable.
  - `composables/useMetricsHistory.ts` — new.
  - `components/MetricsLatencyChart.vue`, `components/MetricsFpsChart.vue` — new (or a single parameterized chart component; design phase decides).
- **APIs consumed**: new dependency on `GET /api/v1/metrics/history?time_window=300` (proxied through Nuxt dev server to backend `localhost:8000`).
- **Dependencies**: no new npm packages — Chart.js 4 and ECharts 6 are both already installed; design will pick one.
- **Removed behaviour**: GPU usage and queue backlog tiles disappear from the UI. If these are still needed they must come back as a separate change against a different (future) backend endpoint.
- **Layout**: stays within the existing `LogsPanel` metrics tab; no changes to `pages/index.vue` grid layout.
- **Out of scope**: historical export, alert thresholds, zoom/pan interactions, configurable `time_window` — these can be layered on later.
