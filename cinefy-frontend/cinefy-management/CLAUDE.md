# CLAUDE.md — cinefy-management

## Overview

Angular 22 management dashboard for the Cinefy cinema platform. Standalone components, signal-based state, client-side rendered (no SSR — admin app behind auth), custom SCSS design system over PrimeNG-backed shared components from `cinefy-ui`.

## Workspace Layout

This app lives in a pnpm workspace rooted at `cinefy-frontend/` (a sibling of `cinefy-backend/` at the repo root). The workspace holds three packages — `cinefy-management` (this app), `cinefy-ui` (the shared component library), and `cinefy-client` (the public-facing SSR booking app). Run `pnpm install` from `cinefy-frontend/`. `cinefy-management` consumes the **built** library via `"cinefy-ui": "link:../cinefy-ui/dist"`, so the library must be built before/alongside the app.

## Commands

**Always run pnpm from `cinefy-frontend/` (the workspace root) — never from inside a package directory.**

```bash
# ALWAYS from cinefy-frontend/ (workspace root):
pnpm install                                  # Restore all workspace packages
pnpm ui:build                                 # Build cinefy-ui (ng-packagr → cinefy-ui/dist)
pnpm mgmt:dev                                 # Dev server on :4200
pnpm app:build                                # Build library, then the app

# To run a single package's own script, use --filter (still from the root):
pnpm --filter cinefy-management build         # Production build (browser only)
pnpm --filter cinefy-management start         # Dev server on :4200
pnpm --filter cinefy-management test          # Run tests (Karma)
```

> **pnpm only** (v12.3.4) — do not use npm or yarn.

**Why the working directory matters.** `cinefy-management/` has a `package.json` but no lockfile of its own — the only lockfile is `cinefy-frontend/pnpm-lock.yaml`. Running `pnpm install` or `pnpm build` from inside the package makes pnpm treat it as a standalone project: it re-resolves every dependency from the registry, writes a stray `cinefy-management/pnpm-lock.yaml`, and creates a private `cinefy-management/node_modules/.pnpm` store. Because the app's deps are carets (`^22.1.5`), that fresh resolution picks up newer patch releases than the workspace pinned, so the app ends up on a different Angular than `cinefy-ui`. Angular version-stamps its `InputSignal` brand symbol, so every binding into a cinefy-ui component then fails to typecheck with hundreds of `__@ɵINPUT_SIGNAL_BRAND_WRITE_TYPE@<n>` errors — a broken build that looks like a code bug but is purely an install artifact.

If that happens, recover with:

```bash
rm -rf cinefy-management/pnpm-lock.yaml cinefy-management/node_modules
pnpm install --frozen-lockfile                # from cinefy-frontend/
```

`--frozen-lockfile` is the safe default for any install you didn't intend to change dependencies — it fails rather than silently rewriting the lockfile.

## Project Structure

```
src/
├── app/
│   ├── core/interceptors/              # App-specific HTTP interceptors (registered in app.config.ts, in order)
│   │   ├── base-url.ts                 # Prepends environment apiUrl to relative HTTP requests
│   │   ├── csrf.ts                     # Attaches CSRF token to mutating requests
│   │   └── auth-retry.ts               # On 401, refreshes the access token and retries once
│   │                                   # (errorToastInterceptor, networkErrorInterceptor and the
│   │                                   #  skip-toast helpers are shared — they live in cinefy-ui/http)
│   ├── app.ts                          # Root component (<router-outlet> + the single <cui-toast>)
│   ├── app.routes.ts                   # Route definitions (AppLayout + AuthLayout, guarded)
│   └── app.config.ts                   # Providers (router, HTTP + interceptors, toast, PrimeNG)
├── components/                         # Reusable UI components
│   ├── auth/                           # forgot-password (progress-dots + steps: request/otp/reset/done)
│   │                                   #   — the OTP input itself is cinefy-ui's <cui-input-otp>, not local
│   ├── dashboard/                      # dashboard-widget (shared card shell: icon/title/subtitle/
│   │                                   #   iconColor/actionLabel/actionLink + <ng-content> body),
│   │                                   #   today-statistics, today-schedule, halls-summary,
│   │                                   #   active-gateway, on-shift-summary
│   ├── halls/
│   │   ├── hall-config-modal/          # Create/edit hall form + layout editor
│   │   ├── hall-layout-editor/         # Interactive seat grid editor
│   │   ├── halls-list/                 # Unpaged hall list (client-side search + status filter)
│   │   ├── halls-statistics/           # Stats cards (derived from halls-list, not a separate fetch)
│   │   ├── hall-types-list/            # Hall type list: owns the load + inline edit + delete popover.
│   │   │                               #   Public loadTypesError signal + add(type) for the modal.
│   │   └── manage-hall-types-modal/    # Dialog shell: <hall-types-list> + the add-type form
│   ├── movies/                         # movie-picker, current-showtimes, upcoming-movies,
│   │                                   #   movie-showtimes-modal, manage-showtime-modal,
│   │                                   #   movies-statistics, book-seats (seat selection + on-site payment),
│   │                                   #   booking-ticket (printable stub shown in book-seats' `done` stage),
│   │                                   #   active-bookings-list (staff's own in-progress holds),
│   │                                   #   scan-ticket-modal (ticket verification — despite the name it
│   │                                   #     renders NO <cui-dialog>; see "Ticket scanning" below)
│   ├── payment/
│   │   ├── gateway-list/               # Gateway list + active/inactive toggles
│   │   ├── manage-gateway-modal/       # Create/edit payment gateway form
│   │   ├── payment-channels/           # Per-gateway channel editor (currency + integration ids)
│   │   └── provider-spec.ts            # Provider field/channel specs driving the form
│   ├── profile/                        # profile-identity, profile-personal-details, profile-password
│   ├── statistics/
│   │   ├── date-range-selector/        # Preset pills (7/14/30) + custom-range popover.
│   │   │                               #   Owns the default range: emits it once via afterNextRender.
│   │   ├── summary-cards/              # Period totals + vs-previous deltas
│   │   ├── sales-chart/                # Daily bar chart + hover tooltip + View Details table
│   │   └── movie-performance/          # Paginated per-movie table ranked by net revenue
│   ├── staff/
│   │   ├── manage-staff-modal/         # Create/edit staff member form
│   │   ├── staff-details/              # Read-only staff detail view
│   │   ├── staff-list/                 # Paginated searchable staff table
│   │   └── staff-position-coverage/    # Position coverage stats
│   ├── header/                         # Top navigation bar
│   ├── help-hint/                      # Inline help tooltip
│   ├── sidebar/                        # Navigation sidebar
│   └── stats/                          # Generic stat-card component
│                                       # Shared UI lives in cinefy-ui. EVERY component's selector is
│                                       # `cui-*` and its class is `Cinefy*` (no `Component` suffix):
│                                       #   input, field-error, loading-spinner, select,
│                                       #   paginated-select, phone-input, toast, dialog, menu,
│                                       #   paginator, date-picker, time-picker, switch, empty-state,
│                                       #   error-state, seat-map, hold-timer, not-found, server-unavailable, input-otp,
│                                       #   password-checklist, media-image
│                                       #   (so <cui-empty-state> / CinefyEmptyState, and so on).
│                                       #   empty-state: inputs [icon]/header (required)/[description]; add class="fill" to stretch to full height.
│                                       #   error-state (<cui-error-state>): THE way to render a failed load — never hand-roll
│                                       #     <cui-empty-state> with a warning icon. Fixed triangle-alert icon; inputs
│                                       #     header (required) + [description] (defaults to "Something went wrong. Please
│                                       #     try again later." — pass it only for a backend message, e.g. book-seats).
│                                       #     Shares empty-state's stylesheet, so the host IS the box: class="fill" and
│                                       #     parent padding classes work exactly as on <cui-empty-state>.
│                                       #   paginator (<cui-paginator>): PrimeNG p-paginator wrapper.
│                                       #     [(page)] is 0-INDEXED (matches Spring Pageable — pass it straight
│                                       #     through, no -1); inputs pageCount/totalItems/pageSize.
│                                       #     :host owns the chrome (padding + top border) — don't style it.
│                                       #   toast (<cui-toast>): mounted ONCE in app.ts, not per page.
│                                       #     Toasts are raised through CinefyToastService, never by markup.
│                                       #   dialog (<cui-dialog>): PrimeNG p-dialog wrapper. Inputs header/description/
│                                       #     canClose/style/contentStyle; (closed) output; public close() method.
│                                       #     Mounting opens it — always render behind an @if; (closed) unmounts.
│                                       #     Slots: [customHeader]/[customFooter] (import CinefyDialogHeader/Footer).
│                                       #   switch (<cui-switch>): size md|sm, color accent|highlight;
│                                       #     [checked]/[disabled] inputs, (checkedChange) output.
│                                       #   cui-select: PrimeNG-backed; static items[] + client-side search.
│                                       #   cui-paginated-select: fetchFn (page, size) => PaginatedResponse<T>,
│                                       #     loads page 0 on open, "Load more" row while page < totalPages.
│                                       #   both selects: write a [control] directly (no selectionChange output);
│                                       #     labelField/valueField are field NAMES; [multi] toggles multi-select.
│                                       # Imports are grouped by subpath:
│                                       #   from 'cinefy-ui/components' — component classes
│                                       #   from 'cinefy-ui/services'   — CinefyToastService, provideCinefyToast
│                                       #   from 'cinefy-ui/pipes'      — PhoneFormat/RelativeTime/Time12h
│                                       #   from 'cinefy-ui/types'      — PaginatedResponse, PageFields
│                                       #   from 'cinefy-ui/constants'  — shared runtime constants (CINEFY_TOAST_KEY/LIFE)
│                                       #   from 'cinefy-ui/forms'      — linkConfirmPassword, EMAIL/NAME/PASSWORD_PATTERN
│                                       #   from 'cinefy-ui/http'       — errorToastInterceptor, networkErrorInterceptor,
│                                       #                                 skipErrorToast(), skipServerErrorToast()
│                                       #   from 'cinefy-ui/utils'      — toSafeRedirect (login's ?redirectUrl=)
├── pages/                              # Route-level components
│   ├── auth/                           # login (/login), forgot-password (/forgot-password)
│   ├── dashboard/                      # Dashboard page (/)
│   ├── halls/                          # Hall management page (/halls)
│   ├── movies/                         # Movies / showtimes page (/movies)
│   ├── payment/                        # Payment gateways page (/payment)
│   ├── staff/                          # Staff management page (/staff)
│   ├── statistics/                     # Sales & performance statistics page (/statistics)
│   ├── profile/                        # Current-user profile page (/profile)
│   ├── access-denied/                  # Shown when a route's position check fails
│   └── not-found/                      # 404 page (wildcard ** route, authed)
├── layout/
│   ├── app-layout/                     # Authed shell: sidebar + header + <router-outlet>
│   └── auth-layout/                    # Guest shell for /login + /forgot-password
├── services/
│   ├── auth.ts                         # Login, logout, refresh, forgot/verify/reset password
│   ├── halls.ts                        # Hall & hall-type CRUD + getHallStatusCounts (HttpClient)
│   ├── movies.ts                       # Movie search + detail
│   ├── showtimes.ts                    # Showtime CRUD + publish + stats + getScheduleForDate (dashboard)
│   ├── booking.ts                      # Seat-selection fetch + active bookings + create/cancel booking +
│   │                                   #   settlePayment (on-site) + scanTicket. getSeatSelection takes an
│   │                                   #   optional HttpContext so callers can pass skipErrorToast() when
│   │                                   #   they render the failure themselves (book-seats does).
│   ├── showtime-events.ts              # Cross-component event bus (RxJS Subjects): created$/updated$/published$/deleted$/singleDeleted$/committedChanged$/highlightChanged$/showtimeOccupancyChanged$
│   ├── staff.ts                        # Staff CRUD + position coverage + on-shift summary +
│   │                                   #   current-user (/staff/me) cache
│   ├── payment-gateways.ts             # Payment gateway CRUD + active-status toggle +
│   │                                   #   getActivePaymentGateway (optional HttpContext — the dashboard
│   │                                   #   widget passes skipErrorToast(), since 404 = "none active")
│   ├── statistics.ts                   # Summary / daily sales / movie performance (HttpClient).
│   ├── header-actions.ts               # Signal-based template injection for header
│   └── sidebar.ts                      # Sidebar open/close state (signal)
│                                       # (Toasts are NOT a local service — CinefyToastService comes from cinefy-ui/services.)
├── shared/
│   ├── icons.ts                        # Re-exports of lucide icons used in the app — sole source of glyphs
│   ├── access.ts                       # Position → allowed-route/action rules (canAccessRoute, canManage, ...)
│   ├── constants/                      # ui.ts (SEARCH_DEBOUNCE_MS, DEFAULT_PAGE_SIZE), formats.ts (TIME/DATE_FORMAT),
│   │                                   #   validation.ts — management-only regexes (RESOURCE_NAME/NO_WHITESPACE/
│   │                                   #   ALPHANUMERIC_PATTERN). EMAIL/NAME/PASSWORD_PATTERN live in cinefy-ui/forms.
│   ├── guards/                         # auth-guard, guest-guard, position-guard (route CanActivate/CanMatch)
│   ├── types/                          # halls, movies, showtimes, booking, staff, payment-gateway,
│   │                                   #   stats, statistics, auth, api
│   └── styles/
│       ├── _colors.scss                # Full color palette ($gray-*, $blue-*, etc.) — project-owned
│       ├── _shadows.scss                # $shadow-xs/sm/md/card + focus-ring tokens — project-owned
│       └── _mixins.scss                # Management-only mixins: icon-box. Shared flex-*/lucide-icon-fix/text-truncate come from cinefy-ui.
│                                       # Breakpoints, shared mixins, and button styles come from cinefy-ui via @use.
│                                       # src/styles.scss bridges $colors/$shadows → var(--cui-*) for the lib's components.
├── utils/                              # Pure helpers (barrel: index.ts)
│   └── sets.ts                         #   toggleInSet(set, value, include?) — immutable add/delete/flip for Set signals;
│                                       #   setsEqual(a, b)
├── environments/
│   ├── environment.ts                  # Dev: apiUrl = http://localhost:8080
│   └── environment.prod.ts             # Prod: apiUrl = /api
└── styles.scss                         # Global reset + --cui-* token bridge
```

Barrel exports exist at `components/index.ts`, `pages/index.ts`, `services/index.ts`, `shared/types/index.ts`, `shared/guards/index.ts`, `shared/constants/index.ts`, `utils/index.ts`, `app/core/interceptors/index.ts`, and a nested `components/auth/forgot-password/index.ts` — always import through them.

Not every shared file is a folder: `components/halls/seat-layout.ts` (seat-grid + `comparePositions` helpers), `components/halls/hall-type-form.ts` + `components/halls/_hall-type-row.scss` (`createHallTypeForm()` + name error messages, and row styles shared by `hall-types-list` and `manage-hall-types-modal`), `components/profile/_panel.scss`, and `components/staff/_position-colors.scss` sit beside their component folders.

## Routes

Two layout shells, each gated by a guard:

```
'' (AppLayout, canActivate: authGuard)        # redirects to /login if not authenticated
├── /           → DashboardPage     (canMatch: positionCanMatch)   all positions; gated per widget
├── /halls      → HallsPage         (canMatch: positionCanMatch)
├── /movies     → MoviesPage        (canMatch: positionCanMatch)   movie search + showtimes scheduling
├── /payment    → PaymentPage       (canMatch: positionCanMatch)   payment gateways
├── /staff      → StaffPage         (canMatch: positionCanMatch)   staff management
├── /statistics → StatisticsPage    (canMatch: positionCanMatch)   sales & movie performance
└── /profile    → ProfilePage       (current-user profile; no position gate)

'' (AuthLayout, canActivate: guestGuard)       # redirects away if already authenticated
├── /login           → LoginPage
└── /forgot-password → ForgotPasswordPage

**                 → NotFoundPage      (canActivate: authGuard)   catch-all 404
```

**Position-based access:** a protected route is declared twice — once with `canMatch: [positionCanMatch]` (renders the real page if the current staff position may access it) and once falling through to `AccessDeniedPage`. `/halls`, `/movies`, `/payment`, `/staff`, and `/statistics` follow this exactly. Two routes deviate today, so check before assuming: `/` (dashboard) has the `canMatch` but **no** `AccessDeniedPage` fallthrough — a denied position falls through to the `**` wildcard and gets `NotFoundPage` instead; `/profile` has the fallthrough entry but **no** `canMatch` on the first, so the `AccessDeniedPage` line is dead and profile is open to any authenticated staff member (which is the intent — it's the current user's own profile). The position → route mapping lives in [`shared/access.ts`](src/shared/access.ts) (`canAccessRoute`), and `positionCanMatch` ([`shared/guards/position-guard.ts`](src/shared/guards/position-guard.ts)) reads it. `authGuard` / `guestGuard` ([`shared/guards/`](src/shared/guards/)) gate the two shells on authentication state.

**Auth status is three-state, not a boolean.** `AuthService.getAuthStatus()` resolves `GET /management/auth/session` to `AuthStatus` — `'AUTHENTICATED' | 'UNAUTHENTICATED' | 'UNAVAILABLE'`. A network failure (status `0`) or a server error (`>= 500`) is `UNAVAILABLE` ("couldn't tell"), any other error is `UNAUTHENTICATED`. Only `UNAUTHENTICATED` redirects to `/login` and only `AUTHENTICATED` redirects away from the guest pages — **`UNAVAILABLE` lets navigation through**, and both `AppLayout` and `AuthLayout` render `<cui-server-unavailable>` (with a "Try again" reload) in place of their `<router-outlet>` while `authService.serverUnavailable()` is true. Every resolved status is cached, `UNAVAILABLE` included, so `/session` is called at most once per page load — the "Try again" reload is what clears it; the session request carries `skipServerErrorToast()` so the fallback isn't doubled by a toast.

Planned but not yet implemented: `/settings`.

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

**Always** pipe `takeUntilDestroyed(this.destroyRef)` before `.subscribe()` in a component — including one-shot `HttpClient` calls. Its job for HTTP is **cancellation**: unsubscribing aborts the in-flight request, so closing a modal or leaving a page before a response lands cancels the pending call instead of letting it finish against a destroyed component. There is no "it only sets local state, so skip it" exception — initial loads, detail fetches, list loads, and save/delete/publish flows all get it.

```typescript
this.service
  .getThing()
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe({ next: ..., error: ... });
```

For streams that never complete it is also the leak fix — `FormControl`/`FormGroup.valueChanges`, `toObservable(signal)`, custom `Subject`/`BehaviorSubject` (e.g. the current-user cache in `StaffService`), `fromEvent`/`interval`/`timer`/websockets, and any combinator (`merge`, `combineLatest`, `switchMap`, …) over them.

Put it **last** in the pipe (after `switchMap`, `debounceTime`, etc.) so it tears down the whole chain, and pass the injected `private readonly destroyRef = inject(DestroyRef)`.

Reference: [`hall-config-modal.ts`](src/components/halls/hall-config-modal/hall-config-modal.ts) — the initial loads (`getHallTypes`, `getHalls`, `getHall`), the `copyLayoutControl.valueChanges` stream, and the create/update request all use it.

### Forms

- **Reactive Forms** with `nonNullable: true` on FormGroup/FormControl.
- Complex cross-field validation done in `effect()` blocks.
- `CinefyFieldError` (`<cui-field-error>`) displays validation messages.

### HTTP & API

- Five functional interceptors run in order (registered in [`app.config.ts`](src/app/app.config.ts)). The first three are app-specific and live in `core/interceptors/`; the last two are shared with `cinefy-client` and come from `cinefy-ui/http`:
  `baseUrlInterceptor` (prepends `environment.apiUrl` to relative URLs **and sets `withCredentials: true`**) → `csrfInterceptor` (attaches the CSRF token to mutating requests) → `authRetryInterceptor` (on a 401, calls the refresh endpoint once and retries; skips the login/refresh/session calls themselves, and redirects to `/login` if the retry also 401s) → `errorToastInterceptor` (on an error response, surfaces a toast unless the request's context skips it; **401s are always silent** — `authRetryInterceptor` owns them) → `networkErrorInterceptor` (replaces the error body with `{ message: 'Could not reach the server. Please try again later.' }` when the server is unreachable — status `0` (dev: connection refused, where the browser's message is just "Failed to fetch") or `502`/`503`/`504` (prod: the proxy answering for a down backend). A genuine `500`/`501` keeps the backend's own message).
- **`networkErrorInterceptor` must stay last.** Errors travel back through the chain in reverse, so the interceptor nearest the backend sees them first — it has to rewrite the message before `errorToastInterceptor` reads it.
- **Suppressing the toast is the caller's call, not the endpoint's.** The service method takes an optional `context?: HttpContext` parameter and forwards it, rather than hard-coding the skip. Two helpers, both from `cinefy-ui/http`:
  - **`skipServerErrorToast()`** — the default for any load that renders an inline error state (a `<cui-error-state>`, a stats panel falling back to `-`). It silences the toast only for server errors (status `0` or `>= 500`), where the inline state is the whole message; a 4xx still toasts, since its message is usually specific. Nearly every list/detail load uses it.
  - **`skipErrorToast()`** — silences **every** status. Use it only when the component handles all failures itself: `book-seats.ts` shows the backend's message inline for any status, and `active-gateway.ts` treats `404` as "no gateway active" rather than an error. Passing `skipServerErrorToast()` there instead would add a toast for those 4xx cases.
  - Loads with **no** inline error state (e.g. `hall-config-modal`'s dropdown sources, `movie-picker`'s "Load more") pass nothing — the toast is their only feedback.
- **Forms that stay on screen after a failed submit** branch on the same server-error check in their `error` handler — e.g. the password forms (`profile-password`, the forgot-password `reset-step`) reset the whole form on `status === 0 || status >= 500`, and `login.ts` only raises its "Invalid email or password" toast when the status is **not** a server error (the interceptor's toast already covers that case).
- **Auth is JWT-in-cookie** — tokens are HTTP-only cookies set/cleared by the backend; the frontend never reads or stores them. `AuthService` exposes login/logout/refresh/forgot-verify-reset; the refresh call is de-duplicated (`refresh$ ??= …`).
- Services return `Observable<T>` — components subscribe or convert with `toSignal()`.
- API uses **zero-indexed pages**; UI displays **1-indexed**.
- Backend entity IDs exposed via API are UUIDs (strings), not numeric.

### API Endpoints (currently used)

```
# Halls
GET    /halls                            # Unpaged list (filters: excludeHallId, statuses)
GET    /halls/status-counts              # { HallStatus: count } — all 4 keys always present
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
GET    /showtimes/schedule?day=          # A day's committed screenings (dashboard)
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
GET    /staff/on-shift                   # { total, details: { MANAGER, CASHIER, USHER } }
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
GET    /payment-gateways/active          # 404 when none is active (not an empty body)
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
POST   /booking/tickets/:ref/scan        # Verify + mark used → BookingConfirmation (USHER allowed)
DELETE /booking/:id                      # Cancel booking

# Statistics (ADMIN/MANAGER only). All three take from=&to= as ISO yyyy-MM-dd.
GET    /statistics/summary               # Period totals + previous-period totals
GET    /statistics/sales                 # One point per day in range (zero-filled), ascending
GET    /statistics/movies?page=&size=    # Paginated movie performance, pre-sorted by netRevenue
```

### Statistics page

The `/statistics` page is four components driven by one `DateRange`, backed by the three
`/statistics/*` endpoints.

**The date range has exactly one owner.** `date-range-selector` holds the preset state _and_ the
default; `StatisticsPage.range` starts as `signal<DateRange | null>(null)` and is filled by the
selector's first emit. Don't re-derive the default in the page — that duplication was removed
deliberately.

**The initial emit must be deferred.** `output()` has no replay buffer, and a parent's
`(rangeChange)` listener is not attached until _after_ the child's constructor returns. Emitting
from the constructor fires into an emitter with zero subscribers and is silently dropped, leaving
the page's `range` permanently `null`. The selector therefore emits from `afterNextRender`. This
applies to any component that wants to announce an initial value through an `output()`.

**Panels are gated on a non-null range.** `summary-cards`, `sales-chart`, and `movie-performance`
all declare `range` as `input.required<DateRange>()`, so the page wraps them in
`@if (range(); as range)`. Rendering them before the first emit throws.

**Formatting lives in templates, not TypeScript.** These components deliberately carry no
`formatMoney` / `formatPercent` / `format(date, ...)` helpers — numbers go through `DecimalPipe`
(`| number`) and dates through `DatePipe` (`| date: 'd MMM'`), matching the rest of the app. The
backend sends pre-rounded values, so digit-format args are omitted; the pipe is still what supplies
thousands separators. Percentages carry two decimals to match the backend's `OCCUPANCY_SCALE`:
`movie-performance`'s occupancy is `| number: '1.2-2'` in a 60px fixed-width column, and
`summary-cards`' delta is `| number: '1.2-2'` (a pipe, not `.toFixed()` — deltas can reach four
digits when a metric grows from near-zero, and only the pipe adds thousands separators).

**Occupancy is a percentage number, not a fraction.** `StatisticsPeriodTotals.occupancy` is
`67.60`, not `0.676` — templates append `%` without multiplying. `movie-performance` has no
`occupancy` field on the wire and derives its own as `ticketsSold / totalSeats * 100`, guarded
against a zero denominator.

**Gross revenue is derived, never sent.** `grossRevenue = netRevenue + refunded`, computed the same
way in `summary-cards` and `sales-chart`. If the API ever returns a gross that isn't exactly that
sum, both panels will disagree with it.

**Movie performance does not sort.** The endpoint returns rows pre-sorted by `netRevenue`; rank is
`(page - 1) * pageSize + index + 1` so it stays continuous across pages. Its `page` is a
`linkedSignal` sourced from `range` (`computation: () => 1`) so a range change resets to page 1
while the pager can still write to it — a `signal` + reset `effect` would fire the fetch twice.

**No client-side date or gap-fill mapping.** `SalesPointDTO.date` is a Java `LocalDate`, which
Jackson serializes as ISO `yyyy-MM-dd`, so `sales-chart`'s `| date` binding parses it directly — an
earlier plan to send `DD-MM-YYYY` and convert in `getSales` was dropped, and the service passes
responses through untouched. The backend also emits one point per day across the whole range,
zero-filling days with no showtimes, which is what the chart's peak-relative bar heights assume.

**The page header collapses a single-day range.** `statistics.html` renders
`Showing {from} to {to}`, but wraps the `to` half in `@if (range.from !== range.to)` so a one-day
range reads `Showing 23 Aug 2026`. The comparison is a plain `===` because both are ISO strings.

### Dashboard page

The dashboard is **position-gated per widget**, not per route — `/` is reachable by every
position, and `DashboardPage` decides what to render from the current staff member:

| Widget                                                                    | Gate          |
| ------------------------------------------------------------------------- | ------------- |
| `today-statistics`, `halls-summary`, `active-gateway`, `on-shift-summary` | `canManage()` |
| `today-schedule`                                                          | `canBook()`   |
| `scan-ticket-modal` (inline card)                                         | `isUsher()`   |

`canManage`/`canBook` come from [`shared/access.ts`](src/shared/access.ts); `isUsher` is a direct
`position === 'USHER'` check, since scanning has no predicate there. **Each gate must match the
role its widget's endpoint requires** — every manage-gated widget calls an ADMIN/MANAGER-only
endpoint, so ungating one produces a 403 toast on page load rather than a hidden card. All three
computeds return `false` until `/staff/me` resolves, so widgets appear once rather than flashing.

`.dv-columns` sets its two-column desktop template behind `&:has(today-schedule):has(.dv-side)` —
with one column gated away the surviving one would otherwise sit in a 1.9fr track with dead space
beside it.

**Every widget follows the same data shape:** a `signal` holding the response (`null`/`[]` until
loaded), `computed`s deriving the view model from it, `loading` and `failed` signals, and a fetch
fired from `afterNextRender` with `skipServerErrorToast()`. The `error` handler sets `failed` and
clears `loading`, and the template renders `loading → failed → data` — the failed branch is a
`<cui-error-state header="Couldn't load …" />`. Two exceptions:
`active-gateway` fetches with `skipErrorToast()` and only sets `failed` for non-404 errors (404
means "no gateway active" and falls through to its own empty state), and `today-statistics` has no
failed branch — it renders its four
figures with `-` values instead, like the `app-stats` cards. Loading branches use a
`<cui-loading-spinner variant="lg" />` inside a block whose `min-height` matches that widget's loaded
height, so cards don't collapse and jump.

### Ticket scanning

`scan-ticket-modal` is used in **two** places and therefore renders **no** `<cui-dialog>` of its
own, despite the name:

- **`/movies`** — the page wraps it in a `<cui-dialog>` behind an `@if (scanTicketVisible())`.
- **Dashboard (usher)** — rendered inline in a plain card.

The `/movies` wrapper reads the component's `modalTitle()` / `modalDescription()` computeds through
a `#scanTicket` template reference, so the header text ("Scan Ticket" → "Ticket Info") stays in one
place. Those two computeds are **public** for exactly that reason — a template ref can only reach
public members. This works because content is projected in the **parent's** template scope, so the
ref is visible to the surrounding `cui-dialog`'s inputs.

Its `close` input is `input<(() => void) | null>(null)`, not required: the dashboard has nothing to
close, so the Cancel/Close button is wrapped in `@if (close(); as close)`. `.stm-actions` centers
its single remaining button via `&:has(> :only-child)`. `/movies` passes a `closeScanTicket` arrow
field that calls `dialog().close()` on a `viewChild(CinefyDialog)` — going through the dialog (not
setting the parent flag) is what runs the leave animation and PrimeNG's scroll-lock cleanup. The
buttons render in the dialog **body**, not a footer slot.

## Styling

### Approach

- **Custom SCSS** — no Tailwind, no CSS framework.
- **PrimeNG** backs the shared cinefy-ui components (`cui-dialog`, `cui-select`, `cui-menu`, `cui-paginator`, `cui-toast`, the date/time pickers, inputs) — always consume them through cinefy-ui, not by importing `primeng/*` directly.
- **ng-primitives is fully removed** — the migration to PrimeNG is complete and the dependency is gone from all three `package.json` files. Reach for a cinefy-ui component first; if none exists, wrap the PrimeNG one in cinefy-ui rather than importing `primeng/*` in app code.
- **lucide-angular** for SVG icons.
- Component styles are scoped via Angular encapsulation.

### UI copy

**All UI text is sentence case** — only the first word and proper nouns/acronyms are capitalized. This applies to every short label, not just sentences: dialog and page titles, section headings, buttons, links, field labels, placeholders, tooltips, badges, table headers, stat-card labels, and label maps (e.g. `HALL_STATUS_LABELS`). It holds across all three frontend packages (`cinefy-management`, `cinefy-client`, `cinefy-ui`).

| ✅ Sentence case           | ❌ Title Case              |
| -------------------------- | -------------------------- |
| `Add staff member`         | `Add Staff Member`         |
| `Save changes`             | `Save Changes`             |
| `Delete payment gateway`   | `Delete Payment Gateway`   |
| `Edit ${name} info`        | `Edit ${name} Info`        |
| `On-site only`             | `On-Site Only`             |
| `Special notes (optional)` | `Special Notes (Optional)` |

Keep the original capitalization for:

- **Acronyms and proper nouns** — `VIP`, `ID`, `HMAC`, `3D`, `QR`, `Paymob`, `Cinefy`.
- **External names quoted verbatim** — a third party's menu path the user must find (the Paymob `Settings → Developers → API Keys` hints in [`provider-spec.ts`](src/components/payment/provider-spec.ts)) and TMDB genre names (`Science Fiction`, `TV Movie`), which are data, not copy.
- **Brand lockups** — `Management Portal`, `Management Console`.

When one app names a UI element of the other (management's upcoming-movies toggle refers to the client's “Coming soon” rail), quote it exactly as the other app renders it.

### Button loading states

**A button that shows `<cui-loading-spinner>` must also show a label** — never a bare spinner. The label is a **progressive form of the button's own action**, so the user can tell what is in flight:

```html
<button type="submit" class="btn-primary" [disabled]="saving()">
  @if (saving()) {
  <cui-loading-spinner variant="xs" />
  <span>Saving…</span>
  } @else {
  <svg [lucideIcon]="icons.CheckIcon" [size]="16"></svg>
  <span>Save changes</span>
  }
</button>
```

Rules:

- Use the **progressive verb + `…`** (an ellipsis character, not three dots): `Saving…`, `Deleting…`, `Signing in…`, `Creating account…`, `Booking…`, `Canceling…`. Where the idle label branches, the loading label branches with it (`{{ isEditMode() ? 'Saving…' : 'Creating…' }}`).
- The spinner inside a button is **`variant="xs"`** (or `sm` on larger buttons) — `lg` is for page/section loading blocks, not buttons.
- **Two exceptions, both already correct in the codebase:**
  1. **Icon-only buttons** (a delete/edit icon with a `pTooltip` and no visible text) keep a bare spinner — there is no label to swap.
  2. When the spinner replaces only a **leading icon** and the `<span>` label sits _outside_ the `@if`, the label is already permanently visible — that satisfies the rule, so don't add a second one.
- Page-level and section-level loading (an `@if (loading())` block over a whole panel) is unaffected: those use a centered `<cui-loading-spinner variant="lg" />` with no label.

### Toasts

Toasts are PrimeNG-backed and live entirely in cinefy-ui. Two pieces, and both are already wired:

- **`provideCinefyToast()`** in [`app.config.ts`](src/app/app.config.ts) — this provides PrimeNG's
  `MessageService` in the root injector. Without it every toast silently no-ops, because
  `CinefyToastService` is `providedIn: 'root'` and resolves `MessageService` from the root injector
  (a component-level provider is **not** visible to it).
- **`<cui-toast />`** rendered **once** in [`app.ts`](src/app/app.ts), beside `<router-outlet>`.
  It is the container every message renders into — one per app, never per page or per layout shell.

To raise a toast, inject `CinefyToastService` and call `success(message)` / `error(message)`. That
two-method surface is the whole API — there is no `warn`/`info`, no options argument, and no
`ToastService` any more (the ng-primitives implementation was deleted).

The service and the container are coupled by `CINEFY_TOAST_KEY` from `cinefy-ui/constants`:
PrimeNG matches a message to its container by exact key equality, so a message with a different key
renders nowhere. Don't pass a key by hand — the service and component both read the constant.

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
- Use `$shadow-xs/sm/md/card` and `$shadow-focus-ring[-error]` from `_shadows.scss` — never hardcode `box-shadow` values.
- cinefy-ui's components consume runtime `var(--cui-*)` tokens (theming contract). Management's `src/styles.scss` maps its SCSS palette to those tokens once in a `:root { ... }` block — that's the single bridge. Component SCSS in management uses plain `$variables`, not `var()`.
- Layout mixins: `flex-center`, `flex-align`, `flex-between`, `flex-column` (cinefy-ui).
- Icon mixins: `icon-box($size)` (management), `lucide-icon-fix` (cinefy-ui, applied on the **parent** of `<lucide-icon>`, never inside a `lucide-icon { }` block).
- Other mixins: `text-truncate`, `disabled-state` (cinefy-ui) — `disabled-state` is the shared `opacity: 0.6` + `cursor: not-allowed` pair for `:disabled` / `:not([href])` / `:has(input:disabled)` states; don't hand-write it. The empty-state styling is baked into cinefy-ui's `<cui-empty-state>` component (no mixin).
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

**Nest as deep as the template does.** There is no depth limit — if the markup is five elements deep, the stylesheet is five blocks deep. Component styles are scoped by Angular's view encapsulation, so the long selector never competes with anything outside the component and the specificity is inert. Flattening a rule out to the top level just to save a level of indentation breaks the mirror between template and stylesheet, which is the whole point.

One limit: **don't use `&-` name concatenation** (`&-icon { }` to build `.rs-done-icon`). It saves a few characters but makes the full class name ungreppable — searching `rs-done-icon` finds nothing. Write the selector out in full inside the parent. This is about building **child element** names; a BEM modifier written as `&--active` directly inside its own block (`.fp-dot { &--active {} }`) is already correctly nested — leave it as is, don't rewrite it to `&.fp-dot--active`.

**Top-level siblings are only for genuinely sibling regions** — elements that really are siblings in the template, like the stage-level blocks in `book-seats` (`.bs-loading`, `.bs-layout`, `.bs-done`), or `:host`. A component whose template has a single root element therefore has a single top-level block, with everything else nested inside it.

**The card wrapper is an element, not `:host`.** A component that renders a card (background, border, radius, shadow) puts that chrome on a real wrapper element in the template — `.tsch-card`, `.today`, `.upcoming` — and nests the card's contents inside it. Reserve `:host` for how the component sits in its **parent's** layout (`align-self: start`, `display: block`), not for its own surface.

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
7. Use **cinefy-ui** components for interactive UI (`<cui-dialog>`, `<cui-select>`, `<cui-menu>`, `<cui-input>`, …) — they wrap PrimeNG. Don't import `primeng/*` directly in app code. **Every cinefy-ui component is `cui-<name>` in templates and `Cinefy<Name>` in TypeScript** — no `Component` suffix on the class. A new library component follows the same pair.
8. Use **lucide-angular** for all icons. Re-export new icons through `shared/icons.ts`. Size icons via `[size]="N"` — never via SCSS `svg { width/height }`.
9. Filenames use kebab-case without `.component`/`.service` suffixes (e.g., `halls-list.ts`, not `halls-list.component.ts`).
10. Tests are skipped by default in schematics (`skipTests: true` in angular.json).
11. **LSP-first for code navigation** — see _Code Navigation_ above; grep is the fallback, not the default.
12. **Class member order** — follow the canonical order in [_Class Member Order_](#class-member-order) above (modeled on `hall-config-modal.ts`).
13. **Sentence-case UI copy** — `Add staff member`, not `Add Staff Member`. See [_UI copy_](#ui-copy) above for the exceptions.
