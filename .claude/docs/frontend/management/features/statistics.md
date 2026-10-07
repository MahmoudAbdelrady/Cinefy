# Statistics page (`/statistics`)

Four components driven by one `DateRange`, backed by the three `/statistics/*` endpoints (backend rules: [`.claude/docs/backend/statistics.md`](../../../backend/statistics.md)).

**The date range has exactly one owner.** `date-range-selector` holds the preset state (7/14/30 days, custom range in a popover) _and_ the default; `StatisticsPage.range` starts as `signal<DateRange | null>(null)` and is filled by the selector's first emit. Don't re-derive the default in the page — that duplication was removed deliberately.

**The initial emit must be deferred.** `output()` has no replay buffer, and a parent's `(rangeChange)` listener isn't attached until _after_ the child's constructor returns. Emitting from the constructor fires into an emitter with no subscribers and is silently dropped, leaving `range` permanently `null`. The selector therefore emits from `afterNextRender`. This applies to any component that announces an initial value through an `output()`.

**Panels are gated on a non-null range.** `summary-cards`, `sales-chart` and `movie-performance` declare `range` as `input.required<DateRange>()`, so the page wraps them in `@if (range(); as range)`. Rendering them before the first emit throws.

**Formatting lives in templates, not TypeScript.** No `formatMoney` / `formatPercent` / `format(date, …)` helpers — numbers go through `DecimalPipe` (`| number`) and dates through `DatePipe` (`| date: 'd MMM'`). The backend sends pre-rounded values, so digit-format args are usually omitted; the pipe still supplies thousands separators. Two places force two decimals to match the backend's `OCCUPANCY_SCALE`: `movie-performance`'s occupancy (`| number: '1.2-2'`, in a 60px fixed-width value span) and `summary-cards`' delta (`| number: '1.2-2'` — a pipe, not `.toFixed()`, because deltas can reach four digits and only the pipe adds separators). The `summary-cards` occupancy value and the `sales-chart` table occupancy use a plain `| number`.

**Occupancy is a percentage number, not a fraction** — `67.60`, not `0.676`; templates append `%` without multiplying. `movie-performance` gets no occupancy field and derives `ticketsSold / totalSeats * 100`, guarded against a zero denominator.

**Gross revenue is derived, never sent:** `grossRevenue = netRevenue + refunded`, computed the same way in `summary-cards` and `sales-chart`.

**Movie performance doesn't sort.** Rows arrive pre-sorted by `netRevenue`; rank is `page * pageSize + index + 1` so it stays continuous across pages. `page` is a 0-indexed `linkedSignal` sourced from `range` (`computation: () => 0`, matching `cui-paginator`), so a range change resets to the first page while the pager can still write to it — a `signal` + reset `effect` would fire the fetch twice.

**No client-side date or gap-fill mapping.** `SalesPointDTO.date` is ISO `yyyy-MM-dd`, so `sales-chart`'s `| date` parses it directly, and the backend zero-fills every day in the range, which the chart's peak-relative bar heights assume. The chart is plain HTML/CSS bars with PrimeNG tooltips plus a "View details" table — no chart library.

**The header collapses a single-day range.** `statistics.html` renders `Showing {from} to {to}` but wraps the `to` half in `@if (range.from !== range.to)`, so a one-day range reads `Showing 23 Aug 2026`. A plain `===` works because both are ISO strings.
