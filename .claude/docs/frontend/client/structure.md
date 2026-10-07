# Client app structure

Paths are relative to `cinefy-frontend/cinefy-client/`. Use LSP / `ls` for individual files; this map says what lives where.

```
src/
├── app/
│   ├── core/interceptors/     # base-url, csrf, auth-retry (see ../http.md and below); barrel: index.ts
│   ├── app.ts                 # Root component (<router-outlet> + the single <cui-toast>)
│   ├── app.routes.ts          # AuthLayout /membership shell + AppLayout shell + ** NotFound
│   ├── app.config.ts          # Browser providers: router, hydration, HttpClient + 5 interceptors, toast, PrimeNG
│   ├── app.config.server.ts   # Server providers merged onto appConfig
│   ├── app.routes.server.ts   # Per-route render modes (see the client CLAUDE.md)
│   └── cinefy-client-preset.ts # PrimeNG Aura preset (amber primary, dark surfaces); inputVariant 'filled'
├── layout/                    # app-layout, auth-layout (see routes-and-pages.md)
├── pages/                     # One folder per route (see routes-and-pages.md); auth/ holds the /membership pages
├── components/
│   ├── home/featured-carousel/          # Auto-advancing hero of highlighted movies (backdrop, scrims, meta, Play)
│   ├── movies/trailer-modal/            # YouTube trailer dialog (trailerUrl + title inputs; (closed) output)
│   ├── movies/booking-section/          # Date strip + showtimes grouped by hall type, on the detail page
│   ├── movies/booking-cancelled/        # Canceled-booking screen (movieId input), shown by seat-selection and checkout
│   ├── seat-selection/booking-summary/  # Selected-seats summary panel
│   ├── header/my-tickets-list/          # In-progress bookings; is itself the header's "My tickets" <cui-dialog>
│   ├── profile/                         # personal-details, profile-password, profile-billing (saved cards),
│   │                                    #   profile-history (paged past bookings) + past-booking-details-modal
│   └── auth/                            # oauth-buttons, oauth-register-form (phone-number step after a first
│                                        #   OAuth sign-in), otp-step, forgot-password (progress-dots +
│                                        #   steps/{request,reset,done}, own barrels + _fp-shared.scss)
├── services/                  # see below
├── shared/
│   ├── icons.ts               # Lucide re-exports — sole source of glyphs
│   ├── guards/                # authGuard, guestGuard
│   ├── types/                 # movies, halls, booking, auth (incl. OAuth types), clients, api
│   │                          #   (ApiError / ApiErrorCode / Redirection), seats
│   └── styles/_colors.scss    # The single shared partial (see styling.md)
├── utils/                     # payments.ts (brandChip); toSafeRedirect is in cinefy-ui/utils
├── environments/              # apiUrl + primeuiLicenseKey (see ../workspace.md)
├── main.ts / main.server.ts   # Browser / server bootstrap
├── server.ts                  # Express SSR host: PORT (default 4000), NG_ALLOWED_HOSTS (comma-separated),
│                              #   static files maxAge 1y
├── styles.scss                # Global reset + cinefy-ui buttons + the --cui-* token bridge + .reveal
└── index.html

public/                        # app-logo.svg, favicon.ico, Assets/ (Google + Microsoft sign-in logos)
mvp-version/                   # React design mock (gitignored, local only) — see the mvp-to-real skill
```

## Interceptor specifics

- `base-url.ts` — during SSR, a relative `apiUrl` (prod `/api`) is itself prefixed with `process.env.API_ORIGIN` (default `http://localhost:8080`). Sends `X-Auth-Context: client`.
- `csrf.ts` — runs in the browser only; cookie `client_XSRF-TOKEN`.
- `auth-retry.ts` — skips `/client/auth/login|refresh|session`; a second 401 clears auth state and navigates to `/membership/login`.

## Services

| Service                         | Methods                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `movies.ts` (`MoviesService`)   | `getHighlighted`, `getNowShowing`, `getAnnouncedUpcoming`, `getMovieDetails`                                                                                                                                                                                                                               |
| `halls.ts` (`HallsService`)     | `getHallTypes`                                                                                                                                                                                                                                                                                             |
| `booking.ts` (`BookingService`) | Public: `getBookableDates`, `getBookableShowtimes`. Authed: `getSeatSelection`, `getActiveBookings`, `getActiveBookingDetails`, `getBookingConfirmation`, `createBooking`, `cancelBooking`, `payBooking`, `paySavedCard`, `getPastBookings`, `getPastBookingDetails`. Reads take an optional `HttpContext` |
| `auth.ts` (`AuthService`)       | sign-up, verify-account, send-otp, login, logout, verify-otp, reset-password, refresh (single-flighted); OAuth: `getOAuthAuthorizationUrl`, `handleOAuthCallback`, `oAuthSignUp`; `getAuthStatus()`, `serverUnavailable`, `clearAuthState()`                                                               |
| `clients.ts` (`ClientService`)  | `getCurrentUser`, `updateCurrentUser`, `changeCurrentUserPassword`, `getPaymentMethods`, `deletePaymentMethod`, `clearCurrentUser`                                                                                                                                                                         |

## Barrels

`components/index.ts` (+ nested `components/auth/forgot-password/index.ts` and `.../forgot-password/steps/index.ts`), `pages/index.ts`, `services/index.ts`, `shared/types/index.ts`, `shared/guards/index.ts`, `app/core/interceptors/index.ts`, `utils/index.ts`.
