# Management domain notes

Types live in `src/shared/types/`; this file covers what they don't make obvious. Backend semantics are in [`.claude/docs/backend/domain-model.md`](../../backend/domain-model.md).

```
HallStatus:    ACTIVE | SCHEDULED | UNDER_MAINTENANCE | INACTIVE
SeatCategory:  STANDARD | VIP | AISLE
ShowtimeStatus: DRAFT | PUBLISHED | RUNNING | FINISHED
PaymentState:  CONFIRMED | PENDING | FAILED | EXPIRED | REFUNDED
```

- **Hall** — has a `HallType` (by `typeId`), `TicketPricing[]` per `SeatCategory`, and a seat layout (`SeatCategory → seatId[]`). Seat ids are `{RowLabel}{ColumnNumber}`; rows run A–Z, then doubled letters AA, BB, CC… (`cinefy-ui/types` `seatRowLabel`).
- **Movie** — TMDB-backed; referenced by its numeric TMDB id.
- **Showtime** — ties a movie, hall and start time; drafts are published in batches. Carries `bookedSeats` / `myOnHoldSeats` / `totalSeats` for occupancy, plus **`bookable`**: the server's verdict on whether seats may still be sold (PUBLISHED or RUNNING, and at least the booking cutoff before it ends). Drive the Book button off this flag and don't re-derive it. (Today `movie-showtimes-modal`'s `applyLocalPublish` / `applyLocalBulkPublish` set `bookable: true` locally after a publish.) `MovieShowtimeListItem` (the per-day row) has the same fields.
- **Booking** — holds seats for a showtime (`expiresAt`), then is settled on-site via `StaffPaymentRequest { isCash: boolean; transactionId?: string }`. `transactionId` is required only for card payments — the reference printed on the card receipt, typed by hand, so the backend rejects one already recorded on another booking. `POST /booking/:uuid/settle` returns a `BookingConfirmation` (`{ paymentState, bookingReference, qrCode, seats, totalPrice, … }`), which `<booking-ticket>` prints.
- **Staff** — `StaffPosition`, `EmploymentType`, working days (start/end weekday), working hours, and a phone stored as digits only (the frontend owns the `+`).
- **PaymentGateway** — a provider (`PAYMOB`), credentials, and `PaymentChannel[]` (each with a currency and provider integration ids). At most one gateway is active; `active` is toggled separately from the create/edit form.
