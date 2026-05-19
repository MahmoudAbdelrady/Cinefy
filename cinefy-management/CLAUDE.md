# CLAUDE.md — cinefy-management

## Overview

Angular 21 management dashboard for the Cinefy cinema platform. Standalone components, signal-based state, client-side rendered (no SSR — admin app behind auth), custom SCSS design system with ng-primitives for accessible headless UI.

## Commands

```bash
pnpm start                                    # Dev server on :4200
pnpm build                                    # Production build (browser only)
pnpm test                                     # Run tests (Karma)
```

> **pnpm only** (v10.28.1) — do not use npm or yarn.

## Project Structure

```
src/
├── app/
│   ├── core/interceptors/base-url.ts   # Prepends environment apiUrl to HTTP requests
│   ├── app.ts                          # Root component
│   ├── app.routes.ts                   # Route definitions
│   └── app.config.ts                   # Providers (router, HTTP, toast)
├── components/                         # Reusable UI components
│   ├── dashboard/                      # now-showing, today-schedule, upcoming-movies-widget
│   ├── date-time/                      # date-picker, time-picker, date-time-picker
│   ├── drop-down/
│   │   ├── custom-select/              # Generic single-select dropdown
│   │   └── paginated-select/           # Lazy-loading paginated dropdown
│   ├── halls/
│   │   ├── hall-config-modal/          # Create/edit hall form + layout editor
│   │   ├── hall-layout-editor/         # Interactive seat grid editor
│   │   ├── halls-list/                 # Paginated searchable hall table
│   │   ├── halls-statistics/           # Stats cards
│   │   └── manage-hall-types-modal/    # Hall type CRUD
│   ├── movies/                         # movie-picker, current-showtimes, upcoming-movies,
│   │                                   #   movie-showtimes-modal, manage-showtime-modal,
│   │                                   #   movies-statistics
│   ├── payment/
│   │   ├── manage-payment-modal/       # Wizard for create/edit payment method
│   │   ├── payment-method-list/        # List + status toggles
│   │   └── steps/                      # identity, credentials, integration, review
│   ├── staff/
│   │   ├── manage-staff-modal/         # Create/edit staff member form
│   │   ├── staff-details/              # Read-only staff detail view
│   │   ├── staff-list/                 # Paginated searchable staff table
│   │   └── staff-position-coverage/    # Position coverage stats
│   ├── field-error/                    # Form validation error display
│   ├── header/                         # Top navigation bar
│   ├── help-hint/                      # Inline help tooltip
│   ├── input-field/                    # Wrapped text input + leading icon + validation
│   ├── loading-spinner/                # Animated loader
│   ├── modal/                          # ng-primitives dialog wrapper
│   ├── pagination/                     # Pagination with jump-to
│   ├── sidebar/                        # Navigation sidebar
│   ├── stats/                          # Generic stat-card component
│   ├── stepper/                        # Wizard step indicator
│   └── toast/                          # Success/error notifications
├── pages/                              # Route-level components
│   ├── dashboard/                      # Dashboard page (/)
│   ├── halls/                          # Hall management page (/halls)
│   ├── movies/                         # Movies / showtimes page (/movies)
│   ├── payment/                        # Payment methods page (/payment)
│   └── staff/                          # Staff management page (/staff)
├── layout/
│   └── app-layout.ts                   # Root layout: sidebar + header + <router-outlet>
├── services/
│   ├── halls.ts                        # Hall & hall-type CRUD (HttpClient)
│   ├── movies.ts                       # Movie search + detail
│   ├── showtimes.ts                    # Showtime CRUD + publish + stats
│   ├── showtime-events.ts              # Cross-component showtime update signals
│   ├── staff.ts                        # Staff CRUD + position coverage
│   ├── payment-method.ts               # Payment method CRUD + connection testing
│   ├── header-actions.ts               # Signal-based template injection for header
│   ├── sidebar.ts                      # Sidebar open/close state (signal)
│   └── toast.ts                        # Toast notification manager
├── shared/
│   ├── icons.ts                        # Re-exports of lucide icons used in the app
│   ├── pipes/                          # phone-format, relative-time, time-12h
│   ├── types/                          # halls, movies, showtimes, staff, payment, stats
│   └── styles/
│       ├── _colors.scss                # Full color palette + dark theme vars
│       ├── _mixins.scss                # flex-*, icon-box, lucide-icon-fix, text-truncate, empty-state-block
│       ├── _shadows.scss               # $shadow-xs/sm/md/lg + focus-ring tokens
│       ├── _buttons.scss               # Button base + primary/secondary mixins
│       └── _breakpoints.scss           # $bp-phone/mobile/tablet/desktop + below-* / from-* mixins
├── environments/
│   ├── environment.ts                  # Dev: apiUrl = http://localhost:8080
│   └── environment.prod.ts             # Prod: apiUrl = /api
└── styles.scss                         # Global reset + ng-primitives overrides (tooltip, dialog overlay)
```

Barrel exports exist at `components/index.ts`, `pages/index.ts`, `services/index.ts`, `shared/types/index.ts`, and `shared/pipes/index.ts` — always import through them.

## Routes

```
/ (AppLayout)
├── /           → DashboardPage
├── /halls      → HallsPage
├── /movies     → MoviesPage      (movie search + showtimes scheduling)
├── /payment    → PaymentPage     (payment methods)
└── /staff      → StaffPage       (staff management)
```

Planned but not yet implemented: `/statistics`, `/settings`.

## Architecture & Patterns

### Component Convention

- **Standalone only** — no NgModules. Every component declares its `imports` array.
- Components use **inline selector** (`selector: 'component-name'`), **external template** (`templateUrl`), and **external SCSS** (`styleUrl`).
- File naming: `component-name.ts`, `component-name.html`, `component-name.scss` (no `.component` suffix).
- `protected` for template-bound properties; `private readonly` for injected services; inputs/outputs are public (`readonly` with no visibility keyword).

### Class Member Order

All component classes follow the order set by [`hall-config-modal.ts`](src/components/halls/hall-config-modal/hall-config-modal.ts). New components should match it; touching an existing one is a good time to bring it in line.

1. `protected readonly icons = { ... }` — lucide icon map / UI dict.
2. `private readonly` injected services (`inject(...)`) and `DestroyRef`.
3. `private readonly` `viewChild` / `contentChild` / `ElementRef` references.
4. `private static readonly` constants and any `protected readonly` computeds derived purely from those constants (keep them adjacent).
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

### When to use `takeUntilDestroyed`

`takeUntilDestroyed(this.destroyRef)` is **only** needed when the source observable doesn't complete on its own. Adding it everywhere is cargo-cult — `HttpClient` observables emit once and complete, so they cannot leak.

**Required** for:

- `FormControl.valueChanges` / `FormGroup.valueChanges` (never completes).
- `toObservable(signal)` derived streams.
- Custom `Subject` / `BehaviorSubject` (e.g., a debounced search subject in a paginated select).
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

- `baseUrlInterceptor` prepends `environment.apiUrl` to relative URLs.
- Services return `Observable<T>` — components subscribe or convert with `toSignal()`.
- API uses **zero-indexed pages**; UI displays **1-indexed**.
- Backend entity IDs exposed via API are UUIDs (strings), not numeric.

### API Endpoints (currently used)

```
# Halls
GET    /halls                            # Paginated list (search, page, size)
GET    /halls/statistics                 # Aggregate stats for halls-statistics cards
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

# Payment methods
GET    /payment-methods
GET    /payment-methods/:id
POST   /payment-methods
PUT    /payment-methods/:id
DELETE /payment-methods/:id
POST   /payment-methods/test-connection  # Pre-save connection test
POST   /payment-methods/:id/test-connection
POST   /payment-methods/:id/status       # Toggle active/inactive
```

## Styling

### Approach

- **Custom SCSS** — no Tailwind, no CSS framework.
- **ng-primitives** provides unstyled, accessible component primitives (dialog, combobox, menu, toast, switch, popover, tooltip, pagination, button, input).
- **lucide-angular** for SVG icons.
- Component styles are scoped via Angular encapsulation.

### SCSS Conventions

- Import colors: `@use 'shared/styles/colors' as *;`
- Import mixins: `@use 'shared/styles/mixins' as *;`
- Import shadows: `@use 'shared/styles/shadows' as *;`
- Import buttons: `@use 'shared/styles/buttons' as *;`
- Import breakpoints: `@use 'shared/styles/breakpoints' as *;`
- Use `$color-*` variables from `_colors.scss` — never hardcode colors.
- Use `$radius-sm/md/lg/xl/full` for border-radius.
- Use `$shadow-xs/sm/md/lg` and `$shadow-focus-ring[-error]` from `_shadows.scss` — never hardcode `box-shadow` values.
- Layout mixins: `flex-center`, `flex-align`, `flex-between`, `flex-column`.
- Icon mixins: `icon-box($size)`, `lucide-icon-fix` (applied on the **parent** of `<lucide-icon>`, never inside a `lucide-icon { }` block).
- Other mixins: `text-truncate`, `empty-state-block`.
- Responsive mixins: `below-phone/mobile/tablet/desktop` and `from-phone/mobile/tablet/desktop` (mobile-first by default).
- **Flag new raw values before adding them** — if a color, shadow, gradient, or other "designed" value is not already in `src/shared/styles/`, surface it before writing: name the value, the closest existing token, and how they differ, then wait for the user to choose keep / replace with token / extract to shared. Doesn't apply to plain layout numbers (paddings, gaps, line-heights).

### Prettier

Configured in `package.json`: 100-char width, single quotes, Angular HTML parser.

## Domain Model

```
HallStatus:    ACTIVE | SCHEDULED | NOW_SHOWING | UNDER_MAINTENANCE | INACTIVE
SeatCategory:  NORMAL | VIP | AISLE

Hall      → has HallType (by typeId), TicketPricing[] (per SeatCategory),
            seat layout (map of SeatCategory → seatId[])
Movie     → TMDB-backed metadata; referenced by id from Showtimes
Showtime  → ties a Movie + Hall + start time; published in batches
Staff     → has StaffPosition, EmploymentType, working days (start/end WeekDay),
            working hours, phone (digits only — frontend owns the `+`)
PaymentMethod → has type, credentials, integration config; status toggled separately
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
4. Use **barrel exports** — import from `../components`, `../services`, `../shared/types`, `../shared/pipes`.
5. Keep types in `shared/types/` with barrel re-exports.
6. Use the existing **color palette, shadows, and mixins** — don't introduce new color or shadow values.
7. Use **ng-primitives** directives for interactive UI (buttons, dialogs, selects, etc.).
8. Use **lucide-angular** for all icons. Re-export new icons through `shared/icons.ts`. Size icons via `[size]="N"` — never via SCSS `svg { width/height }`.
9. Filenames use kebab-case without `.component`/`.service` suffixes (e.g., `halls-list.ts`, not `halls-list.component.ts`).
10. Tests are skipped by default in schematics (`skipTests: true` in angular.json).
11. **LSP-first for code navigation** — see _Code Navigation_ above; grep is the fallback, not the default.
12. **Class member order** — follow the canonical order in [_Class Member Order_](#class-member-order) above (modeled on `hall-config-modal.ts`).
