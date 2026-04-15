# CLAUDE.md — cinefy-management

## Overview

Angular 21 management dashboard for the Cinefy cinema platform. Standalone components, signal-based state, SSR-enabled, custom SCSS design system with ng-primitives for accessible headless UI.

## Commands

```bash
pnpm start                                    # Dev server on :4200
pnpm build                                    # Production build (browser + SSR)
pnpm test                                     # Run tests (Karma)
pnpm run serve:ssr:cinefy-management          # SSR server on :4000
```

> **pnpm only** (v10.28.1) — do not use npm or yarn.

## Project Structure

```
src/
├── app/
│   ├── core/interceptors/base-url.ts   # Prepends environment apiUrl to HTTP requests
│   ├── app.ts                          # Root component
│   ├── app.routes.ts                   # Route definitions
│   ├── app.config.ts                   # Providers (router, HTTP, toast)
│   ├── app.config.server.ts            # SSR providers
│   └── app.routes.server.ts            # Server route config
├── components/                         # Reusable UI components
│   ├── dashboard/                      # now-showing, today-schedule, upcoming-movies
│   ├── drop-down/
│   │   ├── custom-select/              # Generic single-select dropdown
│   │   └── paginated-select/           # Lazy-loading paginated dropdown
│   ├── halls/
│   │   ├── hall-config-modal/          # Create/edit hall form + layout editor
│   │   ├── hall-layout-editor/         # Interactive seat grid editor
│   │   ├── halls-list/                 # Paginated searchable hall table
│   │   ├── halls-statistics/           # Stats cards
│   │   └── manage-hall-types-modal/    # Hall type CRUD
│   ├── field-error/                    # Form validation error display
│   ├── header/                         # Top navigation bar
│   ├── loading-spinner/                # Animated loader
│   ├── modal/                          # ng-primitives dialog wrapper
│   ├── pagination/                     # Pagination with jump-to
│   ├── sidebar/                        # Navigation sidebar
│   └── toast/                          # Success/error notifications
├── pages/                              # Route-level components
│   ├── dashboard/                      # Dashboard page (/)
│   └── halls/                          # Hall management page (/halls)
├── layout/
│   └── app-layout.ts                   # Root layout: sidebar + header + <router-outlet>
├── services/
│   ├── halls.ts                        # Hall & hall-type CRUD (HttpClient)
│   ├── header-actions.ts               # Signal-based template injection for header
│   ├── sidebar.ts                      # Sidebar open/close state (signal)
│   └── toast.ts                        # Toast notification manager
├── shared/
│   ├── types/
│   │   ├── halls.ts                    # Hall domain types & enums
│   │   └── index.ts                    # Generic types (PaginatedResponse, PageFields)
│   └── styles/
│       ├── _colors.scss                # Full color palette + dark theme vars
│       └── _mixins.scss                # flex-center, flex-align, flex-between, icon-box, text-truncate
├── environments/
│   ├── environment.ts                  # Dev: apiUrl = http://localhost:8080
│   └── environment.prod.ts             # Prod: apiUrl = /api
└── styles.scss                         # Global reset + ng-primitives overrides (tooltip, dialog overlay)
```

Barrel exports exist at `components/index.ts`, `pages/index.ts`, `services/index.ts`, and `shared/types/index.ts` — always import through them.

## Routes

```
/ (AppLayout)
├── /           → DashboardPage
└── /halls      → HallsPage
```

Planned but not yet implemented: `/movies`, `/payment`, `/statistics`, `/staff`, `/settings`.

## Architecture & Patterns

### Component Convention

- **Standalone only** — no NgModules. Every component declares its `imports` array.
- Components use **inline selector** (`selector: 'component-name'`), **external template** (`templateUrl`), and **external SCSS** (`styleUrl`).
- File naming: `component-name.ts`, `component-name.html`, `component-name.scss` (no `.component` suffix).
- `protected` for template-bound properties; `private readonly` for injected services.

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
- `takeUntilDestroyed()` for subscription cleanup.

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
GET    /halls                  # Paginated list (search, page, size)
GET    /halls/:id              # Hall detail
GET    /halls/:id/layout       # Hall layout (seats + pricing)
POST   /halls                  # Create hall
PUT    /halls/:id              # Update hall
DELETE /halls/:id              # Delete hall

GET    /halls/types            # List hall types
POST   /halls/types            # Create hall type
PUT    /halls/types/:id        # Update hall type
DELETE /halls/types/:id        # Delete hall type
```

## Styling

### Approach

- **Custom SCSS** — no Tailwind, no CSS framework.
- **ng-primitives** provides unstyled, accessible component primitives (dialog, select, menu, toast, switch, popover, tooltip, pagination, button, input).
- **lucide-angular** for SVG icons.
- Component styles are scoped via Angular encapsulation.

### SCSS Conventions

- Import colors: `@use 'shared/styles/colors' as *;`
- Import mixins: `@use 'shared/styles/mixins' as *;`
- Use `$color-*` variables from `_colors.scss` — never hardcode colors.
- Use `$radius-sm/md/lg/xl/full` for border-radius.
- Available mixins: `flex-center`, `flex-align`, `flex-between`, `icon-box($size)`, `lucide-icon-fix`, `text-truncate`.

### Prettier

Configured in `package.json`: 100-char width, single quotes, Angular HTML parser.

## Domain Model

```
HallStatus: ACTIVE | SCHEDULED | NOW_SHOWING | UNDER_MAINTENANCE | INACTIVE
SeatCategory: NORMAL | VIP | AISLE

Hall → has HallType (by typeId), TicketPricing[] (per SeatCategory), seat layout (map of SeatCategory → seatId[])
```

Seat IDs follow `{RowLabel}{ColumnNumber}` format — rows cycle A-Z then AA-ZZ.

## SSR

- Express server at `src/server.ts` using `AngularNodeAppEngine`.
- Browser bundle: `dist/cinefy-management/browser/`
- Server bundle: `dist/cinefy-management/server/server.mjs`
- Default port: 4000 (configurable via `PORT` env var).
- Client hydration enabled with event replay.

## Key Conventions

1. Always use **pnpm**.
2. Always use **standalone components** with `inject()`.
3. Prefer **signals** over RxJS for UI state.
4. Use **barrel exports** — import from `../components`, `../services`, `../shared/types`.
5. Keep types in `shared/types/` with barrel re-exports.
6. Use the existing **color palette and mixins** — don't introduce new color values.
7. Use **ng-primitives** directives for interactive UI (buttons, dialogs, selects, etc.).
8. Use **lucide-angular** for all icons.
9. Filenames use kebab-case without `.component`/`.service` suffixes (e.g., `halls-list.ts`, not `halls-list.component.ts`).
10. Tests are skipped by default in schematics (`skipTests: true` in angular.json).
