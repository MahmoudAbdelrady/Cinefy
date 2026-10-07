# Client routes and pages

## Layouts

- **`AppLayout`** — the public shell: header (logo, "Movies" link, a "My tickets" dialog, and either the user menu or Login / Sign-up buttons), `<router-outlet>`, and a footer with the "Privacy policy" link. The auth check and current-user load run in `afterNextRender`, so the server renders a neutral spinner and the browser does the real check.
- **`AuthLayout`** — the guest shell for `/membership/*` (logo + `<router-outlet>`), guarded by `guestGuard` as a whole.
- Both swap their outlet for `<cui-server-unavailable>` ("Try again") while `authService.serverUnavailable()` is true.

## Pages (`src/app/app.routes.ts`)

| Route                                                                 | Guard        | Render | Page                                                                                                                                         |
| --------------------------------------------------------------------- | ------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                   | —            | Server | **Home** — `featured-carousel` hero, "Now showing" rail, "Coming soon" rail                                                                  |
| `/movies`                                                             | —            | Server | **Movies** — grid with title search + experience / genre / rating selects (filtered in the browser)                                          |
| `/movies/:movieId`                                                    | —            | Server | **Movie detail** — backdrop, cast/crew, trailer dialog, `booking-section`; handles 404                                                       |
| `/movies/:movieId/seats/:showtimeId`                                  | `authGuard`  | Client | **Seat selection** — seat map, summary, hold timer; "Proceed to payment" creates the booking                                                 |
| `/checkout/:bookingId`                                                | `authGuard`  | Client | **Checkout** — pay with a saved card or by redirect; hold timer + expiry and cancel dialogs                                                  |
| `/booking-confirmation/:bookingId`                                    | `authGuard`  | Client | **Booking confirmation** — result per `PaymentState`; **polls** while `PENDING` (2.5s for the first minute, then ×1.5 backoff capped at 30s) |
| `/profile` (`?tab=account\|billing\|bookings`)                        | `authGuard`  | Client | **Profile** — personal details, password, saved cards, paged booking history                                                                 |
| `/privacy-policy`                                                     | —            | Server | **Privacy policy** — static; also the privacy-policy URL on the OAuth consent screens                                                        |
| `/membership/login`, `/signup`, `/forgot-password`, `/oauth/callback` | `guestGuard` | Client | Login, Sign-up, Forgot password, OAuth callback                                                                                              |
| `**`                                                                  | —            | Server | **Not found**                                                                                                                                |

`authGuard` redirects to `/membership/login?redirectUrl=…`; login, sign-up and the OAuth callback send the user back via `toSafeRedirect`.
