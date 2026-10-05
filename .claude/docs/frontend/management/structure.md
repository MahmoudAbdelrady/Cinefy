# Management app structure

Paths are relative to `cinefy-frontend/cinefy-management/`. Use LSP / `ls` for individual files; this map says what lives where.

```
src/
├── app/
│   ├── core/interceptors/   # base-url, csrf, auth-retry (see ../http.md); barrel: index.ts
│   ├── app.ts               # Root component (<router-outlet> + the single <cui-toast>)
│   ├── app.routes.ts        # Routes (see routes-and-access.md)
│   ├── app.config.ts        # Providers: router, HTTP + interceptors, toast, PrimeNG (license key,
│   │                        #   CinefyPreset, darkModeSelector: false)
│   └── cinefy-preset.ts     # PrimeNG definePreset(Aura, …) theme (blue primary, gray surfaces)
├── components/
│   ├── auth/                # forgot-password (progress-dots + steps: request/otp/reset/done; the OTP input
│   │                        #   is cinefy-ui's <cui-input-otp>); _auth-card.scss shared with login
│   ├── dashboard/           # dashboard-widget card shell + the widgets (see features/dashboard.md)
│   ├── halls/               # hall-config-modal (create/edit form + layout editor), hall-layout-editor
│   │                        #   (interactive seat grid), halls-list (unpaged; client-side search + status
│   │                        #   filter), halls-statistics (derived from the list, no separate fetch),
│   │                        #   hall-types-list (load + inline edit + delete popover; public
│   │                        #   loadTypesError + add(type)), manage-hall-types-modal (dialog shell + add form)
│   ├── movies/              # movie-picker, current-showtimes, upcoming-movies, movie-showtimes-modal,
│   │                        #   manage-showtime-modal, movies-statistics, book-seats (seat selection +
│   │                        #   on-site payment), booking-ticket (printable stub in book-seats' `done`
│   │                        #   stage), active-bookings-list (staff's own holds), scan-ticket-modal
│   │                        #   (see features/ticket-scanning.md)
│   ├── payment/             # gateway-list, manage-gateway-modal, payment-channels (per-gateway channel
│   │                        #   editor), provider-spec.ts (provider field/channel specs driving the form)
│   ├── profile/             # profile-identity, profile-personal-details, profile-password
│   ├── statistics/          # date-range-selector, summary-cards, sales-chart, movie-performance
│   │                        #   (see features/statistics.md)
│   ├── staff/               # manage-staff-modal, staff-details, staff-list (paginated, searchable),
│   │                        #   staff-position-coverage
│   ├── header/              # Top bar: <drawer-component>, the header-actions outlet, user <cui-menu>
│   │                        #   (Profile / Logout)
│   ├── drawer/              # Mobile nav: PrimeNG <p-drawer> with <site-brand> + <nav-links>; own isOpen signal
│   ├── nav-links/           # The <nav> tab list, filtered by canAccessRoute; (navigated) output
│   ├── site-brand/          # Logo + "Management Portal"
│   ├── sidebar/             # Desktop nav: <aside> with <site-brand> + <nav-links>
│   ├── help-hint/           # Inline help callout (icon + title + projected body); currently unused
│   └── stats/               # Generic stat-card component
├── pages/                   # auth/ (login, forgot-password), dashboard, halls, movies, payment, staff,
│                            #   statistics, profile, access-denied, not-found
├── layout/                  # app-layout (sidebar + header + <router-outlet>), auth-layout (guest shell)
├── services/                # auth, halls, movies, showtimes, booking, staff, payment-gateways, statistics,
│                            #   showtime-events, header-actions (see below)
├── shared/
│   ├── icons.ts             # Lucide re-exports — sole source of glyphs
│   ├── access.ts            # Position rules (see routes-and-access.md)
│   ├── constants/           # ui.ts (SEARCH_DEBOUNCE_MS, DEFAULT_PAGE_SIZE), formats.ts (TIME/DATE_FORMAT),
│   │                        #   validation.ts (management-only RESOURCE_NAME / NO_WHITESPACE / ALPHANUMERIC_PATTERN)
│   ├── guards/              # auth-guard, guest-guard, position-guard
│   ├── types/               # halls, movies, showtimes, booking, staff, payment-gateway, stats, statistics, auth, api
│   └── styles/              # _colors, _shadows, _mixins (see styling.md)
├── utils/                   # sets.ts: toggleInSet(set, value, include?), setsEqual(a, b)
├── environments/            # apiUrl + primeuiLicenseKey (see ../workspace.md)
└── styles.scss              # Global reset + cinefy-ui buttons + the --cui-* token bridge
```

## Services

| Service               | Notes                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth.ts`             | Login, logout, refresh (single-flighted), forgot/verify/reset password; `getAuthStatus()`, `serverUnavailable`, `clearAuthState()`                                                   |
| `halls.ts`            | Hall and hall-type CRUD, `getHallStatusCounts`                                                                                                                                       |
| `movies.ts`           | Search, detail, `getUpcomingMovies`, `setAnnouncement` / `setHighlight` (send an explicit value, not a toggle)                                                                       |
| `showtimes.ts`        | CRUD, publish, stats, `getScheduleForDate` (dashboard)                                                                                                                               |
| `booking.ts`          | Seat selection, active bookings, create/cancel, `settlePayment` (on-site), `scanTicket`. `getSeatSelection` takes an optional `HttpContext`                                          |
| `staff.ts`            | CRUD, position coverage, on-shift summary, and the `/staff/me` current-user cache (a `BehaviorSubject`; `patchCurrentStaffMember` / `clearCurrentStaffMember`)                       |
| `payment-gateways.ts` | CRUD, active-status toggle, `getActivePaymentGateway` (optional `HttpContext`; 404 = none active)                                                                                    |
| `statistics.ts`       | Summary, daily sales, movie performance — responses pass through untouched                                                                                                           |
| `showtime-events.ts`  | Cross-component event bus (RxJS Subjects): `created$`, `updated$`, `published$`, `deleted$`, `singleDeleted$`, `committedChanged$`, `highlightChanged$`, `showtimeOccupancyChanged$` |
| `header-actions.ts`   | Signal-based template injection for the header                                                                                                                                       |

Toasts aren't a local service — `CinefyToastService` comes from `cinefy-ui/services`.

## Barrels and shared files

Barrels: `components/index.ts`, `pages/index.ts`, `services/index.ts`, `shared/types/index.ts`, `shared/guards/index.ts`, `shared/constants/index.ts`, `utils/index.ts`, `app/core/interceptors/index.ts`, and the nested `components/auth/forgot-password/index.ts` and `.../forgot-password/steps/index.ts`. Three components aren't in `components/index.ts` and are imported by relative path: `DashboardWidgetComponent`, `HallTypesListComponent`, and the unused `HelpHint`.

Seat helpers: `seatStats()` / `SeatStats` are exported from `hall-layout-editor.ts`; `createSeatGrid` / `resizeGrid` are module functions in `hall-config-modal.ts`; ordering and row labels come from `cinefy-ui/types`.

Shared files beside component folders: `components/auth/_auth-card.scss` (login + the four forgot-password steps), `components/halls/hall-type-form.ts` + `_hall-type-row.scss` (`createHallTypeForm()`, name error messages, row styles shared by `hall-types-list` and `manage-hall-types-modal`), `components/profile/_panel.scss`, `components/staff/_position-colors.scss`.
