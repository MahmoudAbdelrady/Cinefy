# Client ↔ backend contract

The only contract with `cinefy-backend` is the HTTP API (Swagger, plus [`.claude/docs/backend/`](../../backend/)). Endpoint lists are in the services ([structure.md](structure.md#services)); this file covers the behavior the UI depends on.

## Error codes

The client branches on JSON `errorCode` — the `ApiErrorCode` union in `shared/types/api.ts`: `'ACCOUNT_NOT_VERIFIED' | 'OTP_INVALID' | 'PASSWORD_INCORRECT' | 'PASSWORD_REUSED' | 'PAYMENT_NOT_ATTEMPTED'` — never on message text. `PAYMENT_NOT_ATTEMPTED` is how `booking-confirmation.ts` tells "no payment was ever started" from a real failure.

## Payment

- `POST /booking/{uuid}/pay` and `POST /booking/{uuid}/pay-saved-card` both return a `Redirection` (`{ url }`); the checkout page assigns it to `window.location.href`. The code never names Paymob — it's provider-agnostic.
- A card is only saved as a side effect of paying, so the saved-card list is refetched on return to checkout.
- **The payment result is asynchronous.** The gateway redirects back to `/booking-confirmation/:bookingId`, but settlement arrives on a server-side webhook, so the page may first read `paymentState: 'PENDING'` and polls until it resolves. `PaymentState` is `'CONFIRMED' | 'PENDING' | 'FAILED' | 'EXPIRED' | 'REFUNDED'`.
- `POST /booking` sends an `Idempotency-Key` header (`crypto.randomUUID()`).

## Empty vs missing

**Client-facing list endpoints return an empty array, never 404, when there's nothing** (a movie with no bookable dates, a date with no showtimes). The empty state is driven off `length === 0`, so empty isn't an error. A 404 means the resource itself is absent (an unknown movie id on `/movies/{id}`), handled separately — see `movie-detail.ts`, which branches on `HttpErrorResponse.status === 404`.

## Public vs authenticated

- **Public** reads: `/movies/highlighted`, `/movies/now-showing`, `/movies/announced-upcoming`, `/movies/{id}` (raw TMDB id), `/halls/types`, `/booking/movies/{id}/dates`, `/booking/movies/{id}/showtimes?date=`.
- Everything else needs the client session (JWT cookies) — see [../http.md](../http.md#auth).
