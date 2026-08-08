# CLAUDE.md — cinefy-management

## Overview

Angular 21 management dashboard for the Cinefy cinema platform. Standalone components, signal-based state, client-side rendered (no SSR — admin app behind auth), custom SCSS design system with ng-primitives for accessible headless UI.

## Workspace Layout

This app lives in a pnpm workspace rooted at `cinefy-frontend/` (a sibling of `cinefy-backend/` at the repo root). The workspace holds three packages — `cinefy-management` (this app), `cinefy-ui` (the shared component library), and `cinefy-client` (the public-facing SSR booking app). Run `pnpm install` from `cinefy-frontend/`. `cinefy-management` consumes the **built** library via `"cinefy-ui": "link:../cinefy-ui/dist"`, so the library must be built before/alongside the app.

## Commands

```bash
# from cinefy-frontend/ (workspace root):
pnpm ui:build                                 # Build cinefy-ui (ng-packagr → cinefy-ui/dist)
pnpm mgmt:dev                                 # Dev server on :4200
pnpm app:build                                # Build library, then the app

# from cinefy-management/:
pnpm start                                    # Dev server on :4200
pnpm build                                    # Production build (browser only)
pnpm test                                     # Run tests (Karma)
```

> **pnpm only** (v11.4.0) — do not use npm or yarn.

## Project Structure

```
src/
├── app/
│   ├── core/interceptors/              # HTTP interceptors (registered in app.config.ts, in order)
│   │   ├── base-url.ts                 # Prepends environment apiUrl to relative HTTP requests
│   │   ├── csrf.ts                     # Attaches CSRF token to mutating requests
│   │   ├── auth-retry.ts               # On 401, refreshes the access token and retries once
│   │   ├── error-toast.ts              # On HTTP error, shows a toast (skippable via SKIP_ERROR_TOAST context)
│   │   └── error-toast-context.ts      # SKIP_ERROR_TOAST token + skipErrorToast() helper
│   ├── app.ts                          # Root component
│   ├── app.routes.ts                   # Route definitions (AppLayout + AuthLayout, guarded)
│   └── app.config.ts                   # Providers (router, HTTP + interceptors, toast, menu)
├── components/                         # Reusable UI components
│   ├── auth/                           # forgot-password (progress-dots + steps: request/otp/reset/done)
│   │                                   #   — the OTP input itself is cinefy-ui's <input-otp>, not local
│   ├── dashboard/                      # now-showing, today-schedule, upcoming-movies-widget
│   ├── halls/
│   │   ├── hall-config-modal/          # Create/edit hall form + layout editor
│   │   ├── hall-layout-editor/         # Interactive seat grid editor
│   │   ├── halls-list/                 # Unpaged hall list (client-side search + status filter)
│   │   ├── halls-statistics/           # Stats cards (derived from halls-list, not a separate fetch)
│   │   └── manage-hall-types-modal/    # Hall type CRUD
│   ├── movies/                         # movie-picker, current-showtimes, upcoming-movies,
│   │                                   #   movie-showtimes-modal, manage-showtime-modal,
│   │                                   #   movies-statistics, book-seats (seat selection + on-site payment),
│   │                                   #   booking-ticket (printable stub shown in book-seats' `done` stage),
│   │                                   #   active-bookings-list (staff's own in-progress holds)
│   ├── payment/
│   │   ├── gateway-list/               # Gateway list + active/inactive toggles
│   │   ├── manage-gateway-modal/       # Create/edit payment gateway form
│   │   ├── payment-channels/           # Per-gateway channel editor (currency + integration ids)
│   │   └── provider-spec.ts            # Provider field/channel specs driving the form
│   ├── profile/                        # profile-identity, profile-personal-details, profile-password
│   ├── staff/
│   │   ├── manage-staff-modal/         # Create/edit staff member form
│   │   ├── staff-details/              # Read-only staff detail view
│   │   ├── staff-list/                 # Paginated searchable staff table
│   │   └── staff-position-coverage/    # Position coverage stats
│   ├── header/                         # Top navigation bar
│   ├── help-hint/                      # Inline help tooltip
│   ├── sidebar/                        # Navigation sidebar
│   └── stats/                          # Generic stat-card component
│                                       # Shared UI (input-field, field-error, loading-spinner,
│                                       # custom-select, async-select, phone-input, toast,
│                                       # modal, pagination, date-picker, time-picker, switch,
│                                       # empty-state, seat-map, hold-timer, not-found,
│                                       # input-otp, password-checklist, media-image) lives in cinefy-ui.
│                                       #   empty-state: inputs [icon]/[title]/[description]; add class="fill" to stretch to full height.
│                                       #   switch (<cui-switch>): size md|sm, color accent|highlight;
│                                       #     [checked]/[disabled] inputs, (checkedChange) output.
│                                       #   custom-select: static items[] + client-side search.
│                                       #   async-select: lazy fetchFn (loads on first open, spinner);
│                                       #     accepts a paged (PaginatedResponse) or flat (T[]) source.
│                                       #   both selects: [multi] toggles multi-select (default false). Single
│                                       #     mode emits (selectionChange)=T; multi mode emits
│                                       #     (multiSelectionChange)=T[] and shows checkmarks + a "first +N"
│                                       #     trigger. [value] is a controlled input (parent echoes changes back).
│                                       # Imports are grouped by subpath:
│                                       #   from 'cinefy-ui/components' — component classes
│                                       #   from 'cinefy-ui/services'   — ToastService
│                                       #   from 'cinefy-ui/pipes'      — PhoneFormat/RelativeTime/Time12h
│                                       #   from 'cinefy-ui/types'      — PaginatedResponse, PageFields, ToastContext
├── pages/                              # Route-level components
│   ├── auth/                           # login (/login), forgot-password (/forgot-password)
│   ├── dashboard/                      # Dashboard page (/)
│   ├── halls/                          # Hall management page (/halls)
│   ├── movies/                         # Movies / showtimes page (/movies)
│   ├── payment/                        # Payment gateways page (/payment)
│   ├── staff/                          # Staff management page (/staff)
│   ├── profile/                        # Current-user profile page (/profile)
│   ├── access-denied/                  # Shown when a route's position check fails
│   └── not-found/                      # 404 page (wildcard ** route, authed)
├── layout/
│   ├── app-layout/                     # Authed shell: sidebar + header + <router-outlet>
│   └── auth-layout/                    # Guest shell for /login + /forgot-password
├── services/
│   ├── auth.ts                         # Login, logout, refresh, forgot/verify/reset password
│   ├── halls.ts                        # Hall & hall-type CRUD (HttpClient)
│   ├── movies.ts                       # Movie search + detail
│   ├── showtimes.ts                    # Showtime CRUD + publish + stats
│   ├── booking.ts                      # Seat-selection fetch + active bookings + create/cancel booking +
│   │                                   #   settlePayment (on-site). getSeatSelection takes an optional
│   │                                   #   HttpContext so callers can pass skipErrorToast() when they
│   │                                   #   render the failure themselves (book-seats does).
│   ├── showtime-events.ts              # Cross-component event bus (RxJS Subjects): created$/updated$/published$/deleted$/singleDeleted$/committedChanged$/highlightChanged$/showtimeOccupancyChanged$
│   ├── staff.ts                        # Staff CRUD + position coverage + current-user (/staff/me) cache
│   ├── payment-gateways.ts             # Payment gateway CRUD + active-status toggle
│   ├── header-actions.ts               # Signal-based template injection for header
│   └── sidebar.ts                      # Sidebar open/close state (signal)
│                                       # (Toasts are NOT a local service — ToastService comes from cinefy-ui/services.)
├── shared/
│   ├── icons.ts                        # Re-exports of lucide icons used in the app — sole source of glyphs
│   ├── access.ts                       # Position → allowed-route/action rules (canAccessRoute, canManage, ...)
│   ├── validation.ts                   # Shared form regexes (password/email/name/username patterns)
│   ├── constants/                      # UI constants (SEARCH_DEBOUNCE_MS, DEFAULT_PAGE_SIZE)
│   ├── guards/                         # auth-guard, guest-guard, position-guard (route CanActivate/CanMatch)
│   ├── types/                          # halls, movies, showtimes, booking, staff, payment-gateway, stats, auth, api
│   └── styles/
│       ├── _colors.scss                # Full color palette ($gray-*, $blue-*, etc.) — project-owned
│       ├── _shadows.scss                # $shadow-xs/sm/md/lg + focus-ring tokens — project-owned
│       └── _mixins.scss                # Management-only mixins: icon-box. Shared flex-*/lucide-icon-fix/text-truncate come from cinefy-ui.
│                                       # Breakpoints, shared mixins, and button styles come from cinefy-ui via @use.
│                                       # src/styles.scss bridges $colors/$shadows → var(--cui-*) for the lib's components.
├── environments/
│   ├── environment.ts                  # Dev: apiUrl = http://localhost:8080
│   └── environment.prod.ts             # Prod: apiUrl = /api
└── styles.scss                         # Global reset + ng-primitives overrides (tooltip, dialog overlay)
```

Barrel exports exist at `components/index.ts`, `pages/index.ts`, `services/index.ts`, `shared/types/index.ts`, `shared/guards/index.ts`, `app/core/interceptors/index.ts`, and a nested `components/auth/forgot-password/index.ts` — always import through them.

Not every shared file is a folder: `components/halls/seat-layout.ts` (seat-grid + `comparePositions` helpers), `components/profile/_panel.scss`, and `components/staff/_position-colors.scss` sit beside their component folders.

## Routes

Two layout shells, each gated by a guard:

```
'' (AppLayout, canActivate: authGuard)        # redirects to /login if not authenticated
├── /           → DashboardPage     (canMatch: positionCanMatch)
├── /halls      → HallsPage         (canMatch: positionCanMatch)
├── /movies     → MoviesPage        (canMatch: positionCanMatch)   movie search + showtimes scheduling
├── /payment    → PaymentPage       (canMatch: positionCanMatch)   payment gateways
├── /staff      → StaffPage         (canMatch: positionCanMatch)   staff management
└── /profile    → ProfilePage       (current-user profile; no position gate)

'' (AuthLayout, canActivate: guestGuard)       # redirects away if already authenticated
├── /login           → LoginPage
└── /forgot-password → ForgotPasswordPage

**                 → NotFoundPage      (canActivate: authGuard)   catch-all 404
```

**Position-based access:** a protected route is declared twice — once with `canMatch: [positionCanMatch]` (renders the real page if the current staff position may access it) and once falling through to `AccessDeniedPage`. `/halls`, `/movies`, `/payment`, and `/staff` follow this exactly. Two routes deviate today, so check before assuming: `/` (dashboard) has the `canMatch` but **no** `AccessDeniedPage` fallthrough — a denied position falls through to the `**` wildcard and gets `NotFoundPage` instead; `/profile` has the fallthrough entry but **no** `canMatch` on the first, so the `AccessDeniedPage` line is dead and profile is open to any authenticated staff member (which is the intent — it's the current user's own profile). The position → route mapping lives in [`shared/access.ts`](src/shared/access.ts) (`canAccessRoute`), and `positionCanMatch` ([`shared/guards/position-guard.ts`](src/shared/guards/position-guard.ts)) reads it. `authGuard` / `guestGuard` ([`shared/guards/`](src/shared/guards/)) gate the two shells on authentication state.

Planned but not yet implemented: `/statistics`, `/settings`.

## Architecture & Patterns

### Component Convention

- **Standalone only** — no NgModules. Every component declares its `imports` array.
- Components use **inline selector** (`selector: 'component-name'`), **external template** (`templateUrl`), and **external SCSS** (`styleUrl`).
- File naming: `component-name.ts`, `component-name.html`, `component-name.scss` (no `.component` suffix).
- `protected` for template-bound properties; `private readonly` for injected services; inputs/outputs are public (`readonly` with no visibility keyword).

### Semantic HTML

Reach for the element that describes the content. `<div>` is correct **only** for a generic box with no semantic meaning (a flex/grid wrapper, a card body, a scrim/spacer/decorative layer) — that's the majority of layout markup and stays a `<div>`. Use a real element wherever one fits:

- **Landmarks** — `<header>` / `<footer>` for page or app top/bottom bars, `<main>` for the primary content region (once per page), `<nav>` for a set of navigation links (sidebar, header nav, breadcrumbs), `<aside>` for a complementary region (e.g. the sidebar shell). See [`layout/app-layout/app-layout.html`](src/layout/app-layout/app-layout.html) (`<header>` + `<main>`) and [`components/sidebar/sidebar.html`](src/components/sidebar/sidebar.html) (`<aside>` shell + `<nav>` link list).
- **`<section>`** — a titled region that **contains a heading** (`<h2>`–`<h4>`). A dashboard panel, a profile card, a named stat group. **Never** add `<section>` to a wrapper with no heading — an empty `<section>` is noise for screen readers; use a `<div>` there.
- **`<ul>`/`<li>`** — any repeated list of items (an `@for` rendering cards/rows that read as a list). The `@for` goes on the `<li>` inside a `<ul>`; keep the list classes, just swap the tags.
- **Inline / interactive** — `<button>` for actions, `<a routerLink>` for navigation, `<h1>`–`<h6>` for headings, `<form>`/`<label>` for forms. These are already used correctly across the app — don't downgrade them to `<div>` + `(click)`.

Do **not** do a blanket "replace every div" sweep — over-applying `<section>`/`<article>` is as wrong as everything-a-div. Convert in a focused landmark/list pass, and **verify the build after each file** (the Angular template compiler flags mismatched closing tags). When swapping a tag, check the SCSS for any tag-qualified selector (`div.foo`) — Cinefy's are class-based, so tag swaps are normally safe and cause no layout change (`<section>`/`<nav>`/`<aside>` are all `display: block` like `<div>`).

### Class Member Order

All component classes follow the order set by [`hall-config-modal.ts`](src/components/halls/hall-config-modal/hall-config-modal.ts). New components should match it; touching an existing one is a good time to bring it in line.

**Constants live at module scope, not as class fields.** A value that's a pure constant (a literal, a config number, a static array/map, or anything derived purely from those — e.g. `MAX_GRID_DIMENSION`, `AUTO_HALL_STATUSES`, `SELECTABLE_HALL_STATUS_ENTRIES` in `hall-config-modal.ts`) is declared as a module-level `const` in `SCREAMING_SNAKE_CASE` above the `@Component` decorator (after imports / any interfaces), **not** as a `private static readonly` field. References inside the class use the bare name. Only keep a thin in-class `protected readonly` bridge field (e.g. `maxGridDimension = MAX_GRID_DIMENSION`) when the template needs to bind the value — that bridge goes in bucket 4 below.

1. `protected readonly icons = { ... }` — lucide icon map / UI dict.
2. `private readonly` injected services (`inject(...)`) and `DestroyRef`.
3. `private readonly` `viewChild` / `contentChild` / `ElementRef` references.
4. `protected readonly` template bridges to module constants (e.g. `maxGridDimension = MAX_GRID_DIMENSION`) and any `protected readonly` computeds derived purely from module constants (keep them adjacent).
5. Public **signal inputs** (`input()` / `input.required()`), then **outputs** (`output()`).
6. **Signal state** (`signal(...)`) — public → protected → private, grouped by feature.
7. **Reactive forms** (`protected readonly someForm = new FormGroup({ ... })`).
8. **Computeds / `toSignal`-derived state** — keep related ones adjacent (e.g., a `toSignal` and the `computed` that consumes it).
9. **Arrow-fn template helpers** — `displayFn`, `valueFn`, `compareWith`, etc. They're fields, so they go with the field declarations, not with the methods.
10. **`constructor()`** — `effect()` blocks + `afterNextRender` init.
11. **Private init / data-loader methods** called from the constructor.
12. **Protected event handlers** (methods called from the template — `onXxxChange`, `saveXxx`, etc.).
13. **Private helper methods** (utilities called only from inside the class).

Within each bucket, preserve the existing order — don't alphabetize. Visibility follows usage: template-bound → `protected`; only-used-internally → `private`; component API (inputs/outputs) → public.

### Dependency Injection

```typescript
private readonly service = inject(SomeService);
private readonly destroyRef = inject(DestroyRef);
```

Always use `inject()` — never constructor injection.

### State Management

- **Angular Signals** for all UI state — no NgRx, no external store.
- `signal()` for mutable state, `computed()` for derived, `effect()` for side effects.
- `input()` / `output()` signal-based for component I/O.
- **RxJS** is used only for HTTP streams and combining/debouncing observables.
- `toSignal()` / `toObservable()` to bridge between the two.

#### Prefer `linkedSignal` over `signal` + a re-seeding `effect`

When a writable signal's only `effect` (or input-setter / `ngOnChanges`) re-seeds it **synchronously** from another reactive source — a "derived default + local override" — use `linkedSignal` instead of a `signal` paired with an `effect` that calls `.set()`. This collapses two members into one and makes the derive-from-source intent explicit. The signal stays writable, so user interactions still `.set()`/`.update()` it; the value is recomputed (overwriting any manual write) whenever the source changes.

Use it when **all** hold:

1. The signal has a default derived from a source (`signal`, `input()`, or `computed`).
2. That default is **re-seeded synchronously** when the source changes.
3. The signal is also written independently by user interaction (so a read-only `computed` won't do).

```typescript
// Before — signal + constructor effect
protected readonly testResult = signal<TestResultState>({ testStatus: 'UNTESTED' });
constructor() {
  effect(() => {
    const initial = this.initialTestResult();
    if (initial) this.testResult.set({ ...initial, fromPriorSession: true });
  });
}

// After — one linkedSignal
protected readonly testResult = linkedSignal<TestResultState>(() => {
  const initial = this.initialTestResult();
  return initial ? { ...initial, fromPriorSession: true } : { testStatus: 'UNTESTED' };
});
```

Use the `{ source, computation }` form when the computation needs the **previous** value (e.g. preserving existing entries when a grid resizes) — `computation: (source, previous) => ...`, with `previous` `undefined` on first run. See [`hall-layout-editor.ts`](src/components/halls/hall-layout-editor/hall-layout-editor.ts) (`_seatLayout`, previous-value form) and [`book-seats.ts`](src/components/movies/book-seats/book-seats.ts) (`activeBooking`, simple form).

**Do NOT** reach for `linkedSignal` when the re-seed is **asynchronous** — i.e. the value lands from an HTTP response inside a `.subscribe()`. `linkedSignal`'s computation is synchronous and can't await, so those stay as `signal` + `effect` (the effect fires the request and `.set()`s the result). Also skip it when collapsing the `.set()` would leave the `effect` in place anyway (because the effect does other work, e.g. patching a form) and the net reduction is one or two lines — the phantom dependency-read needed to keep the reset reactive is easy to misread as dead code, so a plain `signal` is clearer there.

### When to use `takeUntilDestroyed`

`takeUntilDestroyed(this.destroyRef)` is **only** needed when the source observable doesn't complete on its own. Adding it everywhere is cargo-cult — `HttpClient` observables emit once and complete, so they cannot leak.

**Required** for:

- `FormControl.valueChanges` / `FormGroup.valueChanges` (never completes).
- `toObservable(signal)` derived streams.
- Custom `Subject` / `BehaviorSubject` (e.g., the current-user cache in `StaffService`).
- Combinators (`merge`, `combineLatest`, `switchMap`, ...) over any of the above.
- `fromEvent`, `interval`, `timer`, websockets — anything continuous.

**Allowed (but as a cancellation guard, not a leak fix)** for one-shot HTTP when a late response after destroy would cause observable side effects — emitting an `output()`, firing a toast, calling `close()`, mutating shared state. Typical cases: modal **save / delete / publish** flows and detail loads inside an `effect()` keyed by id (so a stale id's response can't clobber the new one). Setting a signal on a destroyed component is a no-op, so a read-only fetch that only `.set()`s local state does **not** need it.

**Not needed** for one-shot HTTP that only writes local state (`getStatistics()`, `getDetail()` in `afterNextRender`, an initial list load). Subscribe directly:

```typescript
this.service.getThing().subscribe({ next: ..., error: ... });
```

Reference: [`hall-config-modal.ts`](src/components/halls/hall-config-modal/hall-config-modal.ts) uses it only on the create/update path (which fires `hallCreated` / `hallUpdated` outputs and calls `close()`), not on the initial loads.

### Forms

- **Reactive Forms** with `nonNullable: true` on FormGroup/FormControl.
- Complex cross-field validation done in `effect()` blocks.
- `FieldErrorComponent` displays validation messages.

### HTTP & API

- Four functional interceptors run in order (registered in [`app.config.ts`](src/app/app.config.ts)): `baseUrlInterceptor` (prepends `environment.apiUrl` to relative URLs **and sets `withCredentials: true`**) → `csrfInterceptor` (attaches the CSRF token to mutating requests) → `authRetryInterceptor` (on a 401, calls the refresh endpoint once and retries; skips the login/refresh/session calls themselves, and redirects to `/login` if the retry also 401s) → `errorToastInterceptor` (on an error response, surfaces a toast unless the request carries the `SKIP_ERROR_TOAST` context; **401s are always silent** — `authRetryInterceptor` owns them).
- **Suppressing the toast is the caller's call, not the endpoint's.** When a component renders the failure itself (an inline `<empty-state>`, a field error), it passes `skipErrorToast()` as the request's `HttpContext` — so the service method takes an optional `context?: HttpContext` parameter and forwards it, rather than hard-coding the skip. See `BookingService.getSeatSelection` / `book-seats.ts`. Otherwise you get the message twice, in a toast and in the panel.
- **Auth is JWT-in-cookie** — tokens are HTTP-only cookies set/cleared by the backend; the frontend never reads or stores them. `AuthService` exposes login/logout/refresh/forgot-verify-reset; the refresh call is de-duplicated (`refresh$ ??= …`).
- Services return `Observable<T>` — components subscribe or convert with `toSignal()`.
- API uses **zero-indexed pages**; UI displays **1-indexed**.
- Backend entity IDs exposed via API are UUIDs (strings), not numeric.

### API Endpoints (currently used)

```
# Halls
GET    /halls                            # Unpaged list (filters: excludeHallId, statuses)
GET    /halls/:id                        # Hall detail
GET    /halls/:id/layout                 # Hall layout (seats + pricing)
POST   /halls                            # Create hall
PUT    /halls/:id                        # Update hall
DELETE /halls/:id                        # Delete hall

# Hall types
GET    /halls/types
POST   /halls/types
PUT    /halls/types/:id
DELETE /halls/types/:id

# Movies (TMDB-backed search)
GET    /movies/search                    # Paginated movie search
GET    /movies/upcoming                  # Upcoming-release list
GET    /movies/:id                       # Movie detail
POST   /movies/:id/announcement          # Toggle isAnnounced
POST   /movies/:id/highlight             # Toggle isHighlighted

# Showtimes
GET    /showtimes/movies                 # Movies with grouped showtimes
GET    /showtimes/statistics             # Showtime stats
GET    /showtimes/movie-dates            # Dates a movie has showtimes on
GET    /showtimes/movie-day              # Showtimes for a movie on a given day
POST   /showtimes                        # Create showtime
PUT    /showtimes/:id                    # Update showtime
DELETE /showtimes/:id                    # Delete a single showtime
DELETE /showtimes/movies/:movieId        # Delete all showtimes for a movie
POST   /showtimes/publish                # Publish a batch of showtimes

# Staff
GET    /staff                            # Paginated list
GET    /staff/position-coverage          # Coverage by position
GET    /staff/:id                        # Staff detail
POST   /staff                            # Create
PUT    /staff/:id                        # Update
DELETE /staff/:id                        # Delete

# Staff (self-service — any authenticated staff)
GET    /staff/me                         # Current user (cached BehaviorSubject in StaffService)
PUT    /staff/me                         # Update own profile (name/phone)
PUT    /staff/me/password                # Change own password

# Auth (management — JWT cookies, mostly @PublicApi)
POST   /management/auth/login            # Sets access/refresh cookies
POST   /management/auth/logout           # Clears cookies (requires auth)
POST   /management/auth/refresh          # Rotates access cookie
GET    /management/auth/session          # Validates current session
POST   /management/auth/forgot-password  # Emails reset OTP
POST   /management/auth/verify-reset-code
POST   /management/auth/reset-password

# Payment gateways
GET    /payment-gateways
GET    /payment-gateways/:id
POST   /payment-gateways
PUT    /payment-gateways/:id
DELETE /payment-gateways/:id             # Rejected while the gateway is active
POST   /payment-gateways/:id/status      # Toggle active/inactive (409 if another is active)

# Booking (on-site, via book-seats / active-bookings-list)
GET    /booking/active                   # This staff member's in-progress holds
GET    /booking/showtimes/:showtimeId    # Seat selection (layout + active booking)
POST   /booking                          # Create booking (sends Idempotency-Key header)
POST   /booking/:id/settle               # Record on-site payment → BookingConfirmation
DELETE /booking/:id                      # Cancel booking
```

## Styling

### Approach

- **Custom SCSS** — no Tailwind, no CSS framework.
- **ng-primitives** provides unstyled, accessible component primitives (dialog, combobox, menu, toast, switch, popover, tooltip, pagination, button, input).
- **lucide-angular** for SVG icons.
- Component styles are scoped via Angular encapsulation.

### SCSS Conventions

- Import colors: `@use 'shared/styles/colors' as *;`
- Import shadows: `@use 'shared/styles/shadows' as *;`
- Button styles (`btn-primary`, `btn-secondary`, `btn-danger`, `btn-success`) are emitted globally by `@use 'cinefy-ui/styles/buttons';` in `src/styles.scss` — apply via `class="btn-*"`, no per-file import needed.
- Import management-only mixins (`icon-box`): `@use 'shared/styles/mixins' as *;`
- Import shared mixins (`flex-*`, `lucide-icon-fix`, `text-truncate`): `@use 'cinefy-ui/styles/mixins' as *;`
- Import breakpoints (`below-*` / `from-*`): `@use 'cinefy-ui/styles/breakpoints' as *;`
- A file may `@use` both `shared/styles/mixins` and `cinefy-ui/styles/mixins` when it needs both project-specific and shared mixins.
- Use `$color-*` and `$gray/blue/red/etc-*` from `_colors.scss` — never hardcode colors.
- Use `$radius-sm/md/lg/xl/full` for border-radius.
- Use `$shadow-xs/sm/md/lg` and `$shadow-focus-ring[-error]` from `_shadows.scss` — never hardcode `box-shadow` values.
- cinefy-ui's components consume runtime `var(--cui-*)` tokens (theming contract). Management's `src/styles.scss` maps its SCSS palette to those tokens once in a `:root { ... }` block — that's the single bridge. Component SCSS in management uses plain `$variables`, not `var()`.
- Layout mixins: `flex-center`, `flex-align`, `flex-between`, `flex-column` (cinefy-ui).
- Icon mixins: `icon-box($size)` (management), `lucide-icon-fix` (cinefy-ui, applied on the **parent** of `<lucide-icon>`, never inside a `lucide-icon { }` block).
- Other mixins: `text-truncate` (cinefy-ui). The empty-state styling is baked into cinefy-ui's `<empty-state>` component (no mixin).
- Responsive mixins: `below-phone/mobile/tablet/desktop` and `from-phone/mobile/tablet/desktop` (mobile-first by default).
- **Flag new raw values before adding them** — if a color, shadow, gradient, or other "designed" value is not already in `src/shared/styles/`, surface it before writing: name the value, the closest existing token, and how they differ, then wait for the user to choose keep / replace with token / extract to shared. Doesn't apply to plain layout numbers (paddings, gaps, line-heights).

### Nested SCSS

**Write SCSS nested, not flat.** A rule for a child element belongs **inside** its parent's block, not as a sibling selector at the top level. This mirrors the template's structure in the stylesheet, so a block reads as one self-contained region and its parts can't drift away from it as the file grows.

Nest by the **element's place in the template**, not by the class-name prefix. A `.rs-done-icon` that renders inside `.rs-done` nests under it — the shared prefix is a hint, but the template is what decides. Element selectors (`svg`, `p`, `span`) and state selectors (`&:hover`, `&:disabled`, `&.expiring`) nest the same way, as do responsive mixins (`@include below-tablet { ... }`).

```scss
// ✅ Nested — children live inside the parent
.rs-done {
  @include flex-center;

  flex-direction: column;
  padding: 48px 24px;

  .rs-done-icon {
    @include flex-center;

    width: 64px;
    height: 64px;
    border-radius: $radius-full;
    background-color: $green-100;
  }

  .rs-done-title {
    font-size: 20px;
    font-weight: 700;
  }
}

// ❌ Flat — siblings at the top level, structure lost
.rs-done { ... }
.rs-done-icon { ... }
.rs-done-title { ... }
```

Two limits:

- **Don't use `&-` name concatenation** (`&-icon { }` to build `.rs-done-icon`). It saves a few characters but makes the full class name ungreppable — searching `rs-done-icon` finds nothing. Write the selector out in full inside the parent.
- **Don't nest past ~3 levels.** Deep nesting produces long, high-specificity selectors that are hard to override. If a block gets that deep, the markup usually wants a flatter class instead.

**Top-level siblings are still correct** for genuinely sibling regions — the stage-level blocks (`.bs-loading`, `.bs-layout`, `.bs-done`) or `:host`. Nesting expresses containment; it isn't a mandate to bury every rule.

### Prettier

Configured in `package.json`: 100-char width, single quotes, Angular HTML parser.

## Domain Model

```
HallStatus:    ACTIVE | SCHEDULED | UNDER_MAINTENANCE | INACTIVE
SeatCategory:  NORMAL | VIP | AISLE

Hall      → has HallType (by typeId), TicketPricing[] (per SeatCategory),
            seat layout (map of SeatCategory → seatId[])
Movie     → TMDB-backed metadata; referenced by id from Showtimes
Showtime  → ties a Movie + Hall + start time; published in batches;
            carries bookedSeats / myOnHoldSeats / totalSeats counts for occupancy,
            plus `bookable` — the server's verdict on whether seats may still be
            sold (COMMITTED status AND more than the booking cutoff before it ends).
            Never re-derive it client-side; drive the Book button off this flag.
            Same fields on MovieShowtimeListItem (the per-day list row).
Booking   → holds seats for a Showtime (expiresAt), then settled on-site via
            StaffPaymentRequest { isCash: boolean; transactionId?: string }
            (transactionId required only when isCash === false — the reference
            printed on the card receipt; entered by hand, so the backend rejects
            a transactionId already recorded on another booking).
            POST /booking/:uuid/settle returns a BookingConfirmation
            { paymentState, bookingReference, ticketToken, seats, totalPrice, ... }
            which is what <booking-ticket> prints. PaymentState is
            'CONFIRMED' | 'PENDING' | 'FAILED' | 'EXPIRED' | 'REFUNDED'.
Staff     → has StaffPosition, EmploymentType, working days (start/end WeekDay),
            working hours, phone (digits only — frontend owns the `+`)
PaymentGateway → has a provider (PAYMOB), credentials, and PaymentChannel[]
            (each with a currency + provider integration ids). At most one gateway
            is active at a time; `active` is toggled separately from the CRUD form.
```

Seat IDs follow `{RowLabel}{ColumnNumber}` format — rows cycle A-Z then AA-ZZ.

## Rendering

- **Client-side only** — no SSR. This is an authenticated admin/staff app: no SEO value, no anonymous-user first-paint win, and HTML can't be CDN-cached anyway.
- Browser bundle output: `dist/cinefy-management/browser/`
- Browser-only APIs (`window`, `localStorage`, `IntersectionObserver`) and `afterNextRender` can be used freely without SSR guards.
- If SSR/prerendering is ever needed for a public-facing surface, that belongs in the separate `cinefy-client` project, not here.

## Code Navigation

Always reach for the **LSP tool first** when navigating code — `documentSymbol`, `workspaceSymbol`, `findReferences`, `goToDefinition`, `goToImplementation`, `hover`. It returns semantic, type-aware results instead of plain text matches, so it avoids false positives from comments, strings, or unrelated identifiers.

Fall back to `grep` / `rg` / `find` only when:

- LSP returns an error (e.g., the language server isn't running for that file type).
- LSP returns an empty/clearly-wrong result for a legitimate query.
- The search is non-semantic by nature (e.g., finding a string literal, a config value, a CSS class name, a TODO comment, a filename pattern) — LSP doesn't help there, so grep is the right tool.

LSP coverage in this repo: TypeScript files (Angular components, services, types) via `typescript-language-server`. SCSS, HTML templates, and JSON go straight to grep.

## Key Conventions

1. Always use **pnpm**.
2. Always use **standalone components** with `inject()`.
3. Prefer **signals** over RxJS for UI state.
4. Use **barrel exports** — import from `../components`, `../services`, `../shared/types`.
5. Keep types in `shared/types/` with barrel re-exports.
6. Use the existing **color palette, shadows, and mixins** — don't introduce new color or shadow values.
7. Use **ng-primitives** directives for interactive UI (buttons, dialogs, selects, etc.).
8. Use **lucide-angular** for all icons. Re-export new icons through `shared/icons.ts`. Size icons via `[size]="N"` — never via SCSS `svg { width/height }`.
9. Filenames use kebab-case without `.component`/`.service` suffixes (e.g., `halls-list.ts`, not `halls-list.component.ts`).
10. Tests are skipped by default in schematics (`skipTests: true` in angular.json).
11. **LSP-first for code navigation** — see _Code Navigation_ above; grep is the fallback, not the default.
12. **Class member order** — follow the canonical order in [_Class Member Order_](#class-member-order) above (modeled on `hall-config-modal.ts`).
