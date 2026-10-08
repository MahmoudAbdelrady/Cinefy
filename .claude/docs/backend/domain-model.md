# Domain model

Field lists are in the entity classes under `entity/`; this file only covers what the code doesn't make obvious.

## Hall

- `layout` is one JSONB `HallLayout`: `Map<SeatCategory, List<String>>` categories + `List<String> onSiteOnly` (seats sold only at the counter).
- `categoryPrices` is a JSONB `Map<SeatCategory, BigDecimal>`.
- `getCapacity()` = `totalRows * totalColumns` − AISLE positions in the layout. SQL can't compute this, so capacity sums happen in Java.
- `HallService.mergeSeats` / `mergeCategoryPrices` build fresh values from the DTO and replace the JSONB columns wholesale — there are no per-seat rows to upsert.
- Rows and columns are capped at 50 (`HallService.MAX_GRID_DIMENSION`).

### Seat positions

Strings matching `^([A-Z]+)([0-9]+)$` (`A1`, `AA15`). Rows run A–Z, then **doubled letters** AA, BB, CC… — not Excel-style. The private `HallService.toRowIndex` uses only the first letter and the label length (`(len-1)*26 + letter + 1`), so `AB` would also map to 27. With the 50-row cap, real labels stop at XX.

`POSITION_PATTERN` and `toRowIndex` are private. The public helpers are `HallService.isSeatInGrid(hall, position)` and `HallService.POSITION_COMPARATOR` (used by `BookingService`).

## TmdbMovie

Not a `BaseEntity`: the TMDB id is the `@Id` (no UUID, no audit), so movie endpoints take the raw TMDB id, not a uuid. `isAnnounced` (client "Coming soon" rail) and `isHighlighted` (client hero) default to false. `lastSyncedAt` is refreshed by `TmdbSyncJob`.

## Showtime

`startDateTime` / `endDateTime` are `TIMESTAMP(0)`. `status` defaults to `DRAFT`.

## Booking

- `hallName`, `hallType` are denormalized snapshots.
- `client` (online booking) **or** `bookedBy` (staff counter sale) is set — never both.
- `totalAmount` is the booking's own total, written when seats are established — not a gateway fact, so on-site bookings have it too. `PaymentService` charges this number, so the gateway can't be charged something different from what the UI showed.
- `status` is **null while on hold**, `PENDING_PAYMENT` once a checkout starts, `CONFIRMED` / `REFUNDED` once settled.
- `paymentGateway` stays null for on-site bookings.
- `onHold` defaults to true; settling sets it to **null**. Unique on (`CLIENT_ID`, `SHOWTIME_ID`, `ON_HOLD`): Postgres treats NULLs as distinct, so a settled booking frees the slot for a new hold on the same showtime.
- `idempotencyKey` (not null), `bookingReference` and `paymentTransactionId` are unique.
- `bookingReference` is a 10-character code from `REFERENCE_ALPHABET` (no I, O, 0, 1), generated at confirmation. `ticketQrCode` (TEXT) holds a QR of that reference as a `data:image/png;base64,` URI. `ticketUsed` is set by ticket scanning.
- `paymentTransactionId` on an **unsettled** booking is the id of the last _failed_ attempt; it's cleared when a new payment starts. `BookingService.resolvePaymentState` uses it to tell `FAILED` from `PENDING`.
- Helpers: `hasExpired([asOf])`, `isActiveHold([asOf])`.

## BookingSeat

`active` defaults to true; released seats set it to **null**. Unique on (`SHOWTIME_ID`, `POSITION`, `ACTIVE`) — partial uniqueness over live seats, the same NULL trick as `Booking`.

## Users

- `User` is an abstract `@MappedSuperclass` (no table). `phoneNumber` is unique and stored as **digits only** — the frontend owns the `+`.
- `password` is bcrypt-hashed and **nullable**: OAuth-registered clients never get one (see [manual-migrations.md](manual-migrations.md#nullable-password-oauth-clients)).
- `StaffMember` adds position, employment type, working days (`DayOfWeek` start/end) and working hours (`LocalTime` start/end).
- `Client` adds `isVerified` (default false) and `hasPassword()` (not a column; drives "set" vs "change" password).

## ClientPaymentMethod

A client's saved card, created from a Paymob card-token webhook: `token` (unique), `maskedPan`, `cardBrand`. Hard-deleted — nothing holds an FK to it.

## PaymentGateway

See [payments.md](payments.md). In short: `active` (the field is `active`, **not** `isActive`, so Lombok/Jackson emit one JSON property), encrypted `credentials` (TEXT), plaintext JSONB `paymentChannels`, soft-deleted via `deletedAt`.

## Enums

| Enum              | Values and notes                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HallStatus`      | `SCHEDULED`, `ACTIVE`, `INACTIVE`, `UNDER_MAINTENANCE`                                                                                                                                                                                                                                                                                                                                                                           |
| `SeatCategory`    | `STANDARD`, `VIP`, `AISLE`                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ShowtimeStatus`  | `DRAFT`, `PUBLISHED`, `RUNNING`, `FINISHED`. Static sets: `ACTIVE_STATUSES` {DRAFT, PUBLISHED}, `COMMITTED_STATUSES` {PUBLISHED, RUNNING}, `LIVE_STATUSES` {DRAFT, PUBLISHED, RUNNING}, `REPORTABLE_STATUSES` {PUBLISHED, RUNNING, FINISHED}. Reportable and committed are **not** interchangeable: `ShowtimeStatusJob` flips past showtimes to FINISHED, so a committed-only filter matches almost nothing in a past date range |
| `BookingStatus`   | `PENDING_PAYMENT`, `CONFIRMED`, `REFUNDED`. `SETTLED_STATUSES` {CONFIRMED, REFUNDED} and a null-safe static `isSettled(status)` — use it instead of comparing                                                                                                                                                                                                                                                                    |
| `PaymentState`    | `CONFIRMED`, `PENDING`, `FAILED`, `EXPIRED`, `REFUNDED`. Response-only, derived by `BookingService.resolvePaymentState` — never parsed from input, so no `fromString`                                                                                                                                                                                                                                                            |
| `StaffPosition`   | `ADMIN`, `MANAGER`, `CASHIER`, `USHER`                                                                                                                                                                                                                                                                                                                                                                                           |
| `EmploymentType`  | `FULL_TIME`, `PART_TIME`                                                                                                                                                                                                                                                                                                                                                                                                         |
| `UserType`        | `STAFF_MEMBER`, `CLIENT`                                                                                                                                                                                                                                                                                                                                                                                                         |
| `OtpType`         | `RESET_PASSWORD`, `EMAIL_VERIFICATION`                                                                                                                                                                                                                                                                                                                                                                                           |
| `OAuthProvider`   | `GOOGLE`, `MICROSOFT`                                                                                                                                                                                                                                                                                                                                                                                                            |
| `PaymentProvider` | `PAYMOB`. Carries its own `GatewayProviderSpec` (`PAYMOB(new PaymobGateway())`), so `provider.getSpec()` answers `credentialsType()` / `channelConfigType()` / `supportsChannels()` / `channelsRequired()`. Consequence: `entity/enums` imports from `dto/payment`, and specs can't be Spring beans                                                                                                                              |
