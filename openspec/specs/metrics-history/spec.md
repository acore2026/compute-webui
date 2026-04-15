# metrics-history Specification

## Purpose

TBD - created from change `metrics-history-chart`. Update Purpose after initial review.

## Requirements

### Requirement: History endpoint contract

The frontend SHALL consume backend metrics exclusively from `GET /api/v1/metrics/history?time_window=<seconds>`. The response envelope SHALL be a JSON object with a `status` string and a `metrics` array of samples. Each sample SHALL contain the numeric fields `timestamp` (Unix seconds), `e2e_latency_ms`, `jitter_ms`, `compute_latency_ms`, `processing_latency_ms`, and `fps`.

#### Scenario: Successful response is accepted

- **WHEN** the endpoint returns HTTP 200 with `status: "SUCCESS"` and a non-empty `metrics` array of well-formed samples
- **THEN** the frontend SHALL treat the array as authoritative and replace any previously held samples with the new array in full

#### Scenario: Non-SUCCESS status is rejected

- **WHEN** the endpoint returns HTTP 200 but `status` is anything other than `"SUCCESS"`
- **THEN** the frontend SHALL surface an error and MUST NOT overwrite previously held samples with the response body

#### Scenario: Empty metrics array is a valid empty state

- **WHEN** the endpoint returns `status: "SUCCESS"` with `metrics: []`
- **THEN** the frontend SHALL clear any previously held samples and SHALL display the empty state

### Requirement: Polling cadence

The frontend SHALL poll the history endpoint on a fixed interval while the metrics view is mounted. The default interval SHALL be 2 seconds. The poller MUST NOT issue a new request while a previous request for the same poller instance is still in flight; instead, it SHALL wait for the in-flight request to resolve or reject before scheduling the next tick.

#### Scenario: Steady-state polling

- **WHEN** the metrics view has been mounted for more than one poll interval and the network is healthy
- **THEN** the frontend SHALL have issued at least one request per elapsed interval and SHALL display samples whose most recent `timestamp` is no older than two poll intervals

#### Scenario: Slow backend does not cause request pile-up

- **WHEN** a single history request takes longer than the poll interval to resolve
- **THEN** the frontend MUST NOT have more than one in-flight request to the history endpoint at any time, and the next request SHALL be issued only after the previous one resolves or rejects

#### Scenario: Polling stops on unmount

- **WHEN** the metrics view is unmounted (e.g., user navigates away, switches tabs, or the parent panel is destroyed)
- **THEN** the frontend SHALL stop issuing new requests and SHALL release the interval timer

### Requirement: Chart rendering

The frontend SHALL render the sample stream as time-series line charts with time on the x-axis. The metrics view SHALL expose four per-metric tabs — `e2e` (e2e_latency_ms), `jitter` (jitter_ms), `compute` (compute_latency_ms), and `fps` — and MUST render exactly the one chart corresponding to the currently active tab. The three latency tabs SHALL use a y-axis labelled in milliseconds; the `fps` tab SHALL use a y-axis labelled in frames per second. The x-axis SHALL display timestamps in the viewer's local time as `HH:MM:SS`.

`processing_latency_ms` is part of the backend contract and SHALL remain in the fetched/typed sample shape, but the UI MUST NOT render it.

#### Scenario: Active tab drives which metric is drawn

- **WHEN** a successful history response is received with `metrics` of length N > 0 AND the active metric tab is one of `e2e` / `jitter` / `compute` / `fps`
- **THEN** the frontend SHALL display exactly one chart with exactly one line series whose values are the active tab's field (`e2e_latency_ms`, `jitter_ms`, `compute_latency_ms`, or `fps` respectively), the series SHALL have N points, and the points SHALL be plotted in ascending `timestamp` order

#### Scenario: Only one metric chart is mounted at a time

- **WHEN** any metric tab is active
- **THEN** the DOM MUST NOT contain more than one `MetricsLineChart` instance, and MUST NOT render a series for `processing_latency_ms`

#### Scenario: FPS tab uses its own y-axis label

- **WHEN** the `fps` tab is active
- **THEN** the chart's y-axis label SHALL be `fps`, and the chart MUST NOT share a y-axis with any latency series

#### Scenario: Switching tabs swaps the series without remount churn

- **WHEN** the user switches between metric tabs (`e2e` ↔ `jitter` ↔ `compute` ↔ `fps`) without passing through the logs tab
- **THEN** the same `MetricsChartPanel` SHALL remain mounted and SHALL update its chart to reflect the newly-selected metric, and the composable MUST NOT issue an additional fetch solely because of the tab switch

#### Scenario: Live updates redraw without full re-animation

- **WHEN** a subsequent poll delivers a new sample array while the chart is already mounted
- **THEN** the chart SHALL update in place to reflect the new data without re-running the first-mount entry animation

### Requirement: Loading, error, and empty states

The metrics view SHALL distinguish three non-data states — first-load, fetch-error, and empty — so the operator can tell the difference between "waiting for data", "backend is broken", and "backend has nothing to report".

#### Scenario: First-load shows a loading indicator

- **WHEN** the metrics view mounts and no response has yet been received
- **THEN** the frontend SHALL display a loading indicator and MUST NOT render a chart with fabricated or placeholder samples

#### Scenario: Fetch error surfaces a banner and preserves stale data

- **WHEN** a poll request fails (network error, non-200 status, or non-SUCCESS envelope) after at least one prior successful poll
- **THEN** the frontend SHALL display an error banner with a retry control AND SHALL continue displaying the most recent successful sample array so the operator can see the last known good state

#### Scenario: Retry control resumes polling

- **WHEN** the user activates the retry control while the error banner is displayed
- **THEN** the frontend SHALL issue an immediate history request and, on success, SHALL clear the error banner and resume the regular polling cadence

#### Scenario: Empty response shows an empty state, not an error

- **WHEN** a successful response arrives with an empty `metrics` array
- **THEN** the frontend SHALL display an empty-state message and MUST NOT display the error banner

### Requirement: Removed metric tiles

The telemetry panel SHALL NOT display the previous mock tiles for GPU usage or queue backlog, because the new backend contract does not provide these fields.

#### Scenario: No GPU or queue-backlog tiles are rendered

- **WHEN** any metric tab is active under any state (loading, error, empty, or populated)
- **THEN** the DOM MUST NOT contain tiles labelled "GPU 占用" (GPU usage) or "队列积压" (queue backlog), nor a series or chart for either field

### Requirement: Telemetry panel tab layout

The telemetry panel SHALL present five mutually-exclusive tab buttons in its header: `流程日志` (logs), `E2E latency`, `Jitter`, `Comp latency`, and `FPS`. The logs tab SHALL render the existing flow-log list; each of the four metric tabs SHALL render a `MetricsChartPanel` configured for that specific metric. The panel SHALL have a Chinese title (e.g. `状态监控`) on the left of the header and the five tab buttons on the right.

#### Scenario: Exactly one tab is active at a time

- **WHEN** the user clicks any tab button
- **THEN** exactly one button SHALL carry the active style and the content area SHALL render only that tab's view (logs OR a single metric chart)

#### Scenario: Leaving all metric tabs unmounts the chart panel

- **WHEN** the user switches from any metric tab to the `流程日志` tab
- **THEN** `MetricsChartPanel` SHALL be unmounted (via `v-if`), which in turn SHALL stop the history-polling composable

#### Scenario: Entering a metric tab mounts the panel and starts polling

- **WHEN** the user switches from the `流程日志` tab to any metric tab
- **THEN** `MetricsChartPanel` SHALL mount, the composable SHALL issue an immediate history request, and regular polling SHALL resume from that moment
