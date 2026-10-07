# Statistics and dashboard aggregates

## `/statistics` (ADMIN/MANAGER)

`/summary`, `/sales` and `/movies` (paged) all bind the same `DateRangeDTO` via `@Valid @ModelAttribute`: `from`/`to` as ISO `yyyy-MM-dd`, both `@NotNull`.

**One validator.** `StatisticsService.validateDateRange(DateRangeDTO)` is `public static` so every endpoint applies the same rules: `from <= to`, span ≤ `MAX_RANGE_YEARS` (1), `from` not before the start of last calendar year, `to` not after today. These are `BusinessException` → 422.

**Every statistics query filters `s.status IN REPORTABLE_STATUSES`.** DRAFT showtimes are excluded from revenue, ticket counts and capacity, so an unpublished schedule with test bookings never shows as sales. A new query needs the filter too.

**Everything is keyed to `Showtime.startDateTime`, never `Booking.createdAt`.** A ticket sold in July for an August screening counts in August. Because `to` is capped at today, advance sales appear in no period until the screening date — the summary deliberately doesn't reconcile against cash taken.

**Occupancy denominators are per showtime.** `totalSeats` sums `Hall.getCapacity()` once per showtime, so a 200-seat hall with four shows contributes 800. The hall queries return one row per showtime with **no `GROUP BY`** — an earlier `GROUP BY h` deduped halls and produced occupancy above 100%. Capacity subtracts AISLE positions from JSONB, which SQL can't do, so these queries return `Hall` entities and sum in Java.

**Occupancy is a percentage** scaled to `OCCUPANCY_SCALE` (2): `67.60`, not `0.676`. The frontend appends `%` without multiplying. Zero denominators return `BigDecimal.ZERO.setScale(2)` (`0.00`).

**`SUM` needs `ELSE 0` and an outer `COALESCE`; `COUNT` needs neither.** `COUNT(CASE WHEN c THEN 1 END)` has no `ELSE` on purpose — adding `ELSE 0` would count every row.

**Watch the fan-out.** `b.totalAmount` is on the booking row, so joining `BookingSeat` repeats it per seat and inflates `SUM` — that's why revenue and ticket counts are separate queries. Joins fan out the other way too: in `findMoviePerformanceBetween`, `LEFT JOIN Booking` repeats each showtime once per booking, so it counts showtimes with `COUNT(DISTINCT s.id)` (and its count query uses `COUNT(DISTINCT m.id)`).

**Summary returns both periods from one query each.** The previous window is the N days before `from`. Each query scans `BETWEEN :previousFrom AND :to` once. Revenue and tickets split the windows in SQL with `CASE WHEN ... >= :from`; the hall query (`findShowtimeHallsBetween`) projects the `startDateTime >= :from` / `< :from` booleans into `HallPeriodProjection` and splits them in Java.

**Sales zero-fills.** `getSales` emits a point for every date in the range, defaulting to zero, because the chart's bars are peak-relative. `SalesPointDTO.date` is a `LocalDate`, serialized as ISO by Jackson.

**Movie performance pages on the revenue query only.** `findMoviePerformanceBetween` drives the rows (pre-sorted `netRevenue DESC`); the tickets and seats queries are scoped to that page's `movieIds`. Movies with showtimes but no bookings still appear, with zero revenue (`LEFT JOIN Booking`). `MoviePerformanceDTO` carries raw `ticketsSold`, `totalSeats` and `totalShowtimes` — no occupancy field; the frontend derives it. A caller-supplied `sort` would append after the built-in `ORDER BY` — restrict it if the frontend ever sends one.

## Dashboard aggregate endpoints

These exist for the management dashboard widgets:

| Endpoint                       | Access                |
| ------------------------------ | --------------------- |
| `GET /halls/status-counts`     | ADMIN/MANAGER         |
| `GET /staff/on-shift`          | ADMIN/MANAGER         |
| `GET /showtimes/schedule?day=` | ADMIN/MANAGER/CASHIER |
| `GET /payment-gateways/active` | ADMIN/MANAGER         |

### Count-by-enum responses

Both pre-fill an `EnumMap` with every constant at `0L` and overlay the results, so keys are always present and in declaration order; a new enum constant appears automatically.

- `HallService.getHallStatusCounts` needs it because a bare `GROUP BY` returns no row for a status with zero matches.
- `StaffMemberService.getOnShiftSummary` loads on-shift staff (no `GROUP BY`), filters working days in Java, and merges into the map, skipping `ADMIN` when seeding. Filtering logic: [staff.md](staff.md#on-shift-summary).

### Schedule

`ShowtimeService.getScheduleForDate` filters on `COMMITTED_STATUSES`, so FINISHED screenings drop off as the day goes on — the widget answers "what's on now and later". Switch to `REPORTABLE_STATUSES` to keep completed ones. Its `ticketsSold` comes from `countBookedSeatsByShowtime`, which counts CONFIRMED seats **plus live holds**.

`findByMovieStatusesAndDateRangeWithHall` takes an optional `movieId` (`:movieId IS NULL OR …`) so the per-movie day view (called with `LIVE_STATUSES`) and the whole-cinema schedule share one query. It `JOIN FETCH`es `s.hall`, `h.type` and `s.tmdbMovie`, because the schedule reads all three for every row.

### Active gateway

`GET /payment-gateways/active` 404s when nothing is active. It uses the masking `toSummaryDTO(gateway)`, **not** `getActivePaymentGatewayForPayment()` (unmasked credentials).
