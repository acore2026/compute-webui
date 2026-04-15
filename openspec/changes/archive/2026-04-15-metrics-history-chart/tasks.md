## 1. Types and composable

- [x] 1.1 Define `MetricsSample` and `MetricsHistoryResponse` TypeScript interfaces (inline in the composable file)
- [x] 1.2 Create `composables/useMetricsHistory.ts` accepting `{ timeWindowSec?: number; pollIntervalMs?: number }` with defaults `300` / `2000`
- [x] 1.3 Implement fetch using Nuxt `$fetch` against `/api/v1/metrics/history?time_window=<sec>`
- [x] 1.4 Gate state updates on `body.status === "SUCCESS"`; on any other status set `error` and preserve previous `samples`
- [x] 1.5 Implement in-flight guard so a slow request never overlaps with the next scheduled poll
- [x] 1.6 Start polling in `onMounted`, clear the interval in `onBeforeUnmount`; expose `refresh()` and `stop()`
- [x] 1.7 Expose reactive refs: `samples`, `isLoading`, `error`, `lastUpdated`
- [x] 1.8 Sort incoming `metrics` by ascending `timestamp` before assigning to `samples` (defensive against backend ordering)

## 2. Presentational chart component

- [x] 2.1 Create `components/MetricsLineChart.vue` with props `samples: MetricsSample[]`, `series: { key: keyof MetricsSample; label: string; color: string }[]`, `yAxisLabel: string`
- [x] 2.2 Import and register only the Chart.js modules needed: `LineController`, `LineElement`, `PointElement`, `LinearScale`, `Tooltip`, `Legend`, `Filler` (if used); avoid the auto-register bundle
- [x] 2.3 Build datasets from `samples` × `series`; x-values are `timestamp * 1000` (ms) so Chart.js time scale parses correctly
- [x] 2.4 Configure the time scale to display `HH:MM:SS` in the viewer's local timezone — **implemented via `LinearScale` with a `ticks.callback` formatter** (no Chart.js date adapter is installed; this keeps the "no new deps" promise from the design)
- [x] 2.5 Call `chart.update('none')` on sample changes to skip animation; only the first render animates
- [x] 2.6 Destroy the Chart.js instance in `onBeforeUnmount` to prevent canvas/memory leaks
- [x] 2.7 Attach a `ResizeObserver` (or Chart.js responsive option) so the chart re-fits when the panel resizes — used Chart.js `responsive: true` + `maintainAspectRatio: false`

## 3. Container component

- [x] 3.1 Create `components/MetricsChartPanel.vue`; call `useMetricsHistory()` and read its refs
- [x] 3.2 Render a loading indicator when `isLoading` is true AND `samples` is empty (first-load only)
- [x] 3.3 Render an error banner with a "Retry" button when `error` is non-null; the button calls `refresh()`
- [x] 3.4 Render an empty-state message when a successful response returned `samples.length === 0`
- [x] 3.5 Accept a `metric: 'e2e' | 'jitter' | 'compute' | 'fps'` prop and render **one** `MetricsLineChart` for the selected metric:
  - [x] 3.5.1 Build an internal `METRIC_CONFIG` map from each `metric` value to `{ seriesKey, label, color, yAxisLabel, title }`
  - [x] 3.5.2 Pass a single-element `series` array plus the matching `yAxisLabel` to `MetricsLineChart`
  - [x] 3.5.3 Do NOT render `processing_latency_ms` — it stays fetched/typed but is intentionally unused in the UI
- [x] 3.6 Keep the error banner visible above the chart when `error` is set AND prior `samples` still exist (stale-data mode)

## 4. Integrate into LogsPanel

- [x] 4.1 Remove the hardcoded `metrics` ref from `components/LogsPanel.vue` (the old 4-card mock)
- [x] 4.2 Replace the single `metrics` tab with **five mutually-exclusive tab buttons** — `流程日志`, `E2E latency`, `Jitter`, `Comp latency`, `FPS` — driven by a `TabId` union `'logs' | 'e2e' | 'jitter' | 'compute' | 'fps'`
- [x] 4.3 Render the log list under `v-show="tab === 'logs'"` (keeps the log timer alive when hidden) and render `<MetricsChartPanel :metric="tab" />` under `v-if="tab !== 'logs'"` so the metrics panel mounts only while a metric tab is active (polling starts/stops with it)
- [x] 4.4 Add a Chinese panel title (`状态监控`) on the left of `.panel-header` and keep the 5 tab buttons right-aligned via the default `.panel-header` `justify-content: space-between`
- [x] 4.5 Remove the `.metric-card`, `.metric-label`, `.metric-value`, `.metric-unit` styles if no longer referenced anywhere else in the file — N/A within `LogsPanel.vue` (its scoped styles never defined them). The global definitions live in `assets/css/main.scss` and are left alone to avoid out-of-scope blast radius; flag as a follow-up cleanup if nothing else adopts them.
- [x] 4.6 Verify the `<section>` height still fills the panel and each metric chart fills the content area on small viewports — `MetricsChartPanel` uses `height: 100%` + a flex column with `min-height: 0` at each level; the outer `<div v-if="tab !== 'logs'" class="h-full">` has no extra `grid` / `overflow-y-auto` (charts own their own overflow behavior).

## 5. Manual verification — **requires running dev server + backend**

> These tasks need a human at a browser; they can't be automated from this session. Flagged as NOT YET VERIFIED and left unchecked so they aren't forgotten.

- [ ] 5.1 Run the dev server (`npm run dev`) and open the app in a browser
- [ ] 5.2 Click each of the four metric tabs (`E2E latency`, `Jitter`, `Comp latency`, `FPS`) and confirm the first visit shows a loading indicator then populates the chart; switching between metric tabs swaps the curve without a fresh loading state
- [ ] 5.3 Stop the backend; confirm the error banner appears, the retry button is present, and the last good data stays on screen
- [ ] 5.4 Restart the backend and click retry; confirm the chart resumes updating without a page reload
- [ ] 5.5 Leave a metric tab open for >5 minutes; confirm no memory growth or CPU pinning (DevTools Performance tab)
- [ ] 5.6 Click `流程日志` and confirm — via DevTools Network — that `/api/v1/metrics/history` requests stop; click any metric tab and confirm polling resumes immediately (the `v-if` on `MetricsChartPanel` mounts/unmounts the composable with the tab)
- [ ] 5.7 Confirm no DOM element with the text "GPU 占用" or "队列积压" exists anywhere in the telemetry panel, and no chart series is drawn for `processing_latency_ms`

## 6. Cleanup

- [x] 6.1 Run `npm run typecheck` (or `nuxt typecheck`) — zero TypeScript errors **in the files this change added/edited** (`useMetricsHistory.ts`, `MetricsLineChart.vue`, `MetricsChartPanel.vue`, `LogsPanel.vue`). Pre-existing errors in `components/editor/Inspector.vue`, `components/FlowDiagram.client.vue`, and `pages/editor.vue` were already present on `main` and are out of scope for this change.
- [x] 6.2 Run `npm run lint` if configured — zero new warnings. **N/A**: no `lint` script exists in `package.json`.
- [x] 6.3 Remove any unused imports or leftover mock data from `LogsPanel.vue` — confirmed: no orphaned imports, old `metrics` ref removed, surrounding log-panel logic untouched.
