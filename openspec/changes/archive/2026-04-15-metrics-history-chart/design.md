## Context

The metrics tab in `components/LogsPanel.vue` currently renders four static mock cards driven by a hardcoded `metrics` ref — no network, no history, no real data. The backend now exposes a history endpoint:

```
GET /api/v1/metrics/history?time_window=300
→ { status: "SUCCESS", metrics: [{ timestamp, e2e_latency_ms, jitter_ms,
     compute_latency_ms, processing_latency_ms, fps }, ...] }
```

`time_window` is the lookback in seconds; the response is an array of discrete samples (one per second in the example payload, but the cadence is controlled by the backend, not the client).

The frontend is Nuxt 3. `/api/*` is proxied to the backend at `localhost:8000` (Vite dev config). `package.json` already includes both `chart.js@^4.4.8` and `echarts@^6.0.0` — we must pick one rather than add a third. There is one existing composable (`composables/useFlowActions.ts`); the repo is small and has no established chart-component pattern yet, so this change sets the precedent.

Stakeholders: operators watching the metrics panel need to see trends (is latency creeping up? is jitter spiking?) rather than instantaneous numbers.

## Goals / Non-Goals

**Goals:**
- Render a live, trend-visible view of the five backend fields (`e2e_latency_ms`, `jitter_ms`, `compute_latency_ms`, `processing_latency_ms`, `fps`) inside the existing metrics tab — no layout changes to `pages/index.vue`.
- Keep the data path in one composable so the chart components stay presentational.
- Fail gracefully: clear loading, error, and empty states; never crash the panel if the backend is down.
- Remain responsive under sustained polling (charts must not leak memory or pin the CPU).

**Non-Goals:**
- Configurable `time_window` (hardcoded at 300s for this change).
- Zoom, pan, brush-select, or tooltip-follow interactions beyond Chart.js defaults.
- Historical export (CSV/PNG), annotations, or alert thresholds.
- Reinstating GPU-usage / queue-backlog tiles — not in the new backend contract; a separate change if they come back.
- WebSocket / SSE streaming — polling only for v1.

## Decisions

### 1. Chart library: **Chart.js 4** (over ECharts 6)

Both are already in `package.json`, so neither adds a dependency. Chart.js was chosen because:
- The two charts we need (stacked line series with a shared time axis) are Chart.js's exact sweet spot; ECharts shines for dashboards with many chart types, which we don't have.
- Smaller runtime footprint; simpler tree-shaking via modular imports (`Chart.register(LineController, LineElement, ...)`).
- No DOM-heavy SVG; canvas rendering handles 300 points × 5 series smoothly.
- ECharts' richer feature set (dataZoom, toolbox, themes) is value we won't use here and would make the component heavier than needed.

**Trade-off**: if a future change needs heatmaps, gauges, or radar charts, we may end up adding ECharts anyway. Accepted — cross that bridge later rather than over-build now. If/when it happens, `echarts` can stay as-is (both libraries can coexist; no conflict).

### 2. **Two charts, not one**

The five fields split cleanly into two groups with different units and scales:
- **Latency chart** (`ms`): `e2e_latency_ms`, `jitter_ms`, `compute_latency_ms`, `processing_latency_ms` — four line series, shared y-axis.
- **FPS chart** (`fps`): single line series, its own y-axis.

Alternative considered: one chart with a secondary y-axis for FPS. Rejected — dual-axis charts routinely mislead readers (a flat FPS line next to a spiking latency line creates false visual correlation), and Chart.js dual-axis config adds complexity we don't need.

### 3. **Polling, not streaming**

`useMetricsHistory` polls the endpoint on a fixed interval (default **2s**, configurable via composable argument). The endpoint already returns the full 300-second window, so each response is authoritative — the composable replaces the reactive array wholesale rather than appending, which eliminates de-duplication/ordering bugs.

Alternatives considered:
- **WebSocket / SSE**: lower latency, but requires new backend endpoint and state machine on the client. Not justified for a 2s refresh.
- **Incremental polling** (only fetch samples since last `timestamp`): saves bandwidth but complicates client state and requires backend cursor support. The full-window response is small (~300 objects, ~150 bytes each → ~45 KB) and gzip-compresses well; not worth the complexity.

### 4. **Composable envelope**

`useMetricsHistory(options?: { timeWindowSec?: number; pollIntervalMs?: number })` returns:
```
{ samples: Ref<MetricsSample[]>, isLoading: Ref<boolean>,
  error: Ref<Error | null>, lastUpdated: Ref<number | null>,
  refresh: () => Promise<void>, stop: () => void }
```

- Uses `$fetch` (Nuxt built-in) — no extra HTTP client.
- Validates `body.status === "SUCCESS"` before writing to `samples`; any other value sets `error` and leaves `samples` unchanged (don't blank the chart on a transient failure — surface the error alongside the stale data).
- Lifecycle: starts polling on `onMounted`, clears the interval on `onBeforeUnmount`. Returning `stop` lets callers halt polling manually (e.g., when the tab is hidden — future optimization, not required for v1).
- Polling interval uses `setInterval`, but each tick **awaits the previous request** via an in-flight guard to avoid request pileup on slow networks.

### 5. **Component split**

- `components/MetricsChartPanel.vue` — container. Uses the composable, handles loading/error/empty states, mounts the two chart components, and stays inside `LogsPanel.vue`'s existing `v-show="tab === 'metrics'"` slot.
- `components/MetricsLineChart.vue` — dumb/presentational. Props: `samples: MetricsSample[]`, `series: SeriesDef[]`, `yAxisLabel: string`. Owns one Chart.js instance, watches `samples`, calls `chart.update('none')` (no animation) on change for smooth incremental redraws.

Rationale: one reusable chart component instead of two hand-written ones keeps the code DRY and leaves the door open for adding more chart panels without duplicating Chart.js boilerplate (registration, resize observer, cleanup).

### 6. **Timestamp handling**

Backend sends **Unix seconds** (per the sample payload — the values are ~1.6e9). Frontend multiplies by 1000 for `Date`. X-axis uses Chart.js's `time` scale with `second`/`minute` tick units and a local `HH:MM:SS` display format. No timezone conversion beyond what the browser does by default.

### 7. **Types**

Add a `types/metrics.ts` (or put it in the composable file — decide at implementation time) defining:
```ts
interface MetricsSample {
  timestamp: number; // seconds
  e2e_latency_ms: number;
  jitter_ms: number;
  compute_latency_ms: number;
  processing_latency_ms: number;
  fps: number;
}
interface MetricsHistoryResponse {
  status: "SUCCESS" | string;
  metrics: MetricsSample[];
}
```

## Risks / Trade-offs

- **Polling load on the backend** → Mitigation: 2s default is conservative; composable exposes `pollIntervalMs` so it can be tuned without code changes. In-flight guard prevents pile-up.
- **Chart flicker on each poll** → Mitigation: `chart.update('none')` disables animation on data refresh; first mount animates, subsequent updates don't.
- **Canvas memory leak if panel unmounts mid-poll** → Mitigation: `MetricsLineChart.vue` destroys its Chart.js instance in `onBeforeUnmount`; composable clears its interval symmetrically.
- **Unit drift** (backend starts sending microseconds, or field names change) → Mitigation: composable's `status === "SUCCESS"` gate plus TypeScript type narrows the surface. Changes to the contract will fail at compile time or show up as flat-line / absent series, not crashes.
- **Removed UI** (GPU usage, queue backlog) → Mitigation: called out as **BREAKING** in the proposal so stakeholders see it before merge.
- **Dual chart libraries in `package.json`** → Accepted trade-off; removing ECharts is out of scope. A follow-up cleanup change can drop it if nothing starts using it.

## Migration Plan

No backend migration needed — the endpoint already exists. Frontend rollout:

1. Ship `useMetricsHistory` and `MetricsLineChart` behind no flag; the metrics tab is the only consumer.
2. Replace the mock `metrics` block in `LogsPanel.vue` with `<MetricsChartPanel />`.
3. Verify in dev (`pnpm dev` / `npm run dev`) that charts render, update every 2s, and handle a stopped backend (error banner, stale data retained).
4. No rollback needed beyond reverting the commit — the old mock block is gone but the panel still functions (it shows the error state when the endpoint is unreachable).

## Open Questions

- Should the charts respect `prefers-reduced-motion` and skip even the first-mount animation? (Default Chart.js behavior is fine for v1; revisit if accessibility review flags it.)
- Is 2 seconds the right default poll interval, or does the backend publish faster/slower? Confirm with backend owner before merging; adjust `pollIntervalMs` default if needed.
- Do we need a visible "last updated Xs ago" indicator on the panel? Leaning no for v1 (polling is fast enough that staleness is not user-visible), but `lastUpdated` is already returned by the composable so it's a one-line addition if requested.

## Post-apply revision (layout pivot)

After `/opsx:apply` the user requested a layout change. The decisions below *supersede* Decision #2 ("Two charts, not one") and Decision #5 ("Component split") above:

- **Five-tab layout** — The telemetry panel header now has five mutually-exclusive tab buttons: `流程日志`, `E2E latency`, `Jitter`, `Comp latency`, `FPS`. Left side of the header carries a Chinese title (`状态监控`). There is no longer a `Telemetry` kicker nor a `状态指标` subtitle.
- **One chart per view** — Instead of stacking a latency chart + an FPS chart simultaneously, `MetricsChartPanel` now takes a `metric: 'e2e' | 'jitter' | 'compute' | 'fps'` prop and renders exactly one `MetricsLineChart` for the active metric. An internal `METRIC_CONFIG` maps the prop to `{ seriesKey, label, color, yAxisLabel, title }`.
- **`processing_latency_ms` is no longer rendered.** It is still part of the backend envelope and is still typed on `MetricsSample`, but no tab is dedicated to it. Reinstating it is a one-line addition to `METRIC_CONFIG` plus a new tab button if ever wanted.
- **Mount/unmount semantics** — `LogsPanel.vue` wraps `MetricsChartPanel` in `v-if="tab !== 'logs'"`. The composable therefore starts polling when the user enters any metric tab and stops polling the moment they return to the logs tab — a cleaner version of the "Polling stops on unmount" scenario than the original v-show design. Switching between metric tabs does NOT remount the panel; the prop change alone swaps the active series.
- **Unchanged** — the composable (`useMetricsHistory`), the Chart.js module selection, the `LinearScale` + `HH:MM:SS` formatter, loading/error/empty UX, and the decision to skip ECharts all stand as originally designed.
