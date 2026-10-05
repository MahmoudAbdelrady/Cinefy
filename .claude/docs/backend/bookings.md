# Bookings, holds and tickets

`BookingController` (`/booking`) + `BookingService`. Online payment is in [payments.md](payments.md).

## Access

Access is **not** uniform on this controller. The class is `@Validated` (for the `@Pattern` on the `Idempotency-Key` header and the `{bookingReference}` path variable).

| Endpoints                                                                                                                                 | Access                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET /movies/{id}/dates`, `GET /movies/{id}/showtimes?date=`, `GET /showtimes/{uuid}` (seat map)                                          | `@PublicApi` + `permitAll()`                                          |
| `GET /payment-redirect`, `POST /payment-callback?hmac=` (Paymob)                                                                          | `@PublicApi` + `permitAll()`; authenticated by HMAC instead           |
| `POST /` (create, needs `Idempotency-Key` UUID header), `DELETE /{uuid}`, `GET /active`, `GET /active/{uuid}`, `GET /{uuid}/confirmation` | CLIENT + ADMIN/MANAGER/CASHIER                                        |
| `GET /past`, `GET /past/{uuid}`                                                                                                           | `CLIENT` only (profile booking history)                               |
| `POST /{uuid}/pay`, `POST /{uuid}/pay-saved-card`                                                                                         | `CLIENT` only                                                         |
| `POST /{uuid}/settle` (on-site payment: `{isCash, transactionId?}`)                                                                       | Staff only: ADMIN/MANAGER/CASHIER                                     |
| `POST /tickets/{bookingReference}/scan`                                                                                                   | ADMIN/MANAGER/CASHIER/**USHER** — the only endpoint that grants USHER |

## Bookability and seat rules

- A showtime is **bookable** while its status is in `COMMITTED_STATUSES` (PUBLISHED or RUNNING) **and its end time** is at least 60 minutes away (`BOOKING_CUTOFF_MINUTES`). See [persistence.md](persistence.md#where-a-domain-predicate-lives) for `isBookable` and its SQL twins (which use `s.endDateTime > :cutOffDate`).
- A hold lasts **10 minutes** (`HOLD_WINDOW_MINUTES`).
- Max seats per booking: `Math.max(MAX_SEATS_MINIMUM, (int) (capacity * MAX_SEATS_CAPACITY_RATIO))` = max(6, 20% of capacity, floored).
- Requested seats must be unique, inside the grid, and not AISLE. Clients can't book `onSiteOnly` seats.

## Creating and changing a hold

- **Idempotency:** an existing `Idempotency-Key` returns the stored booking, unless it's an expired hold, which is deleted and rebuilt.
- **Concurrency:** `createBooking` catches `DataIntegrityViolationException | ObjectOptimisticLockingFailureException`, retries the lookup by key, and otherwise throws `ConflictException` ("One or more selected seats have been taken"). Other guards: pessimistic locks (`findByUuidForUpdate`, `findByBookingReferenceForUpdate`), the partial-uniqueness constraints on `BookingSeat` and `Booking` ([domain-model.md](domain-model.md#booking)), and `@Version` on every entity.
- **Re-posting for the same showtime mutates the existing hold** (`mutateActivePendingBooking`): overlapping seats are kept or added; with no overlap the hold is replaced. Reclaiming a seat from a dead hold goes through `claimRequestedSeats`, which sets `active = null` and flushes first.
- **One hold per showtime:** for clients the DB enforces it (`CLIENT_ID`, `SHOWTIME_ID`, `ON_HOLD`). Staff holds have a NULL `CLIENT_ID`, so the constraint never applies — `findOnHoldByShowtimeAndBookedBy` enforces it in code.
- **Who booked:** `buildBooking` sets `client` for a `Client` principal and `bookedBy` for a `StaffMember` (counter sale). The auth context decides which principal arrives — see [security.md](security.md#auth-contexts).
- **Starting a checkout** (`prepareBookingForPayment`) resets `expiresAt` to now + 10 minutes and sets `PENDING_PAYMENT`. Seats can't be changed while `PENDING_PAYMENT`.
- **Expiry:** `BookingCleanupJob` hard-deletes seats, then bookings, where `onHold = true AND expiresAt < now` (including `PENDING_PAYMENT`), in batches of 200 every minute.

## Ownership and settlement

- `validateBookingOwnership` throws `ForbiddenException` (**403**) — unlike saved cards, which 404.
- `/settle` works only for the staff member who created the hold, so client bookings can't be settled on-site. It returns the confirmation unchanged if the booking is already settled. A card settlement needs a `transactionId` that isn't already recorded on another booking.
- `GET /{uuid}/confirmation` returns 422 with `ErrorCode.PAYMENT_NOT_ATTEMPTED` while `status` is null (no checkout ever started).

## Payment results

`applyPaymentResult` (from the Paymob webhook):

- A successful charge for a missing or expired booking, or for a booking already settled by a different transaction, is **auto-refunded** via `refundTransaction`.
- A refund/void callback for a transaction other than the one that settled the booking is ignored.

## Tickets

- `confirmPaidBooking` runs for **every** confirmation, online or on-site. It generates the 10-character `bookingReference`, stores a QR of it in `ticketQrCode` (data URI, via `QrGenerator`), and sets `onHold = null`.
- Only client bookings are emailed (`EmailService`, `@Async`).
- **Scanning** (`POST /tickets/{bookingReference}/scan`, alphanumeric pattern) looks the booking up with a pessimistic lock: unknown reference → 404; status not `CONFIRMED` (e.g. refunded) or already used → 422; otherwise sets `ticketUsed`.

## Saved cards

`ClientPaymentMethod` rows are created from Paymob card-token webhooks (`ClientPaymentMethodService.createMethod`, which silently skips unknown client emails and duplicate tokens). Clients list them with `GET /client/me/payment-methods` and delete with `DELETE /client/me/payment-methods/{uuid}`.

- `findOwnedByCurrentClient(uuid)` scopes the lookup by uuid **and** the current client, so another client's card raises `NotFoundException` → **404, not 403** — the response must not reveal that the card exists. Used before a saved-card charge and by delete.
- Deletion is a hard delete (nothing holds an FK to it), unlike `PaymentGateway`'s soft delete.
