# CLAUDE.md — cinefy-client

## Overview

Angular 21 **public-facing booking app** for the Cinefy cinema platform. Standalone components, signal-based state, **server-side rendered** (`@angular/ssr` with an Express host) — this is the customer-facing site where people browse movies and book seats, as opposed to the CSR-only `cinefy-management` admin dashboard. Custom SCSS design system; consumes the shared `cinefy-ui` library.

> **Current state:** the home, movies-listing, and movie-detail pages are built and routed; the rest (seat selection, checkout) is still being ported. The fully-designed product lives as a **React reference mock** in `mvp-version/` and is ported screen-by-screen into the Angular app via the `mvp-to-real` skill. Most "build a page" work means mapping from `mvp-version/`, not writing from scratch. Pages already mapped, all inside the `AppLayout` shell (header with a user-info menu + "My Tickets" dialog, and a footer): **Home** (`/`) — a `featured-carousel` hero (auto-advancing highlighted-movie slides), a "Now Showing" rail, and a "Coming Soon"/upcoming rail; **Movies** (`/movies`) — a filterable grid (title search + experience/genre/rating selects); **Movie Detail** (`/movies/:movieId`) — backdrop, cast/crew, trailer dialog, and a `booking-section` (date strip + showtimes grouped by hall type). Data comes from `MoviesService`, `HallsService`, and `BookingService` (`services/`), loaded with `rxResource`.

## Workspace Layout

This app lives in the pnpm workspace rooted at `cinefy-frontend/` (sibling of `cinefy-backend/` at the repo root). The workspace holds three packages: `cinefy-management` (admin app), `cinefy-ui` (shared component library), and `cinefy-client` (this app). Run `pnpm install` from `cinefy-frontend/`. This app consumes the **built** library via `"cinefy-ui": "link:../cinefy-ui/dist"`, so the library must be built before/alongside the app.

See also: [`../cinefy-management/CLAUDE.md`](../cinefy-management/CLAUDE.md) for the broader Angular conventions, signals patterns, SCSS design-system approach, and the cinefy-ui import contract shared across the frontend.

## Commands

```bash
# from cinefy-frontend/ (workspace root):
pnpm ui:build                  # Build cinefy-ui (ng-packagr → cinefy-ui/dist) — required before running
pnpm client:dev                # Dev server (defaults to :4200 — pass --port to run alongside mgmt)
pnpm client:build              # Production SSR build
pnpm app:build                 # Build ui, then management, then client

# from cinefy-client/:
pnpm start                     # Dev server (ng serve)
pnpm build                     # Production build (SSR — browser + server bundles)
pnpm test                      # Run tests (Vitest, jsdom)
pnpm serve:ssr:cinefy-client   # Run the built SSR server (node dist/cinefy-client/server/server.mjs)
```

> **pnpm only** (v11.4.0) — do not use npm or yarn. Both apps default to port 4200; pass `--port` to run them side by side.

## SSR — this app is server-rendered

`cinefy-client` ships browser **and** server bundles. `src/server.ts` is the Express host; `src/app/app.routes.server.ts` declares render modes (currently `RenderMode.Server` for `**`); `src/app/app.config.server.ts` merges server providers onto the shared `appConfig`. Hydration is enabled with event replay (`provideClientHydration(withEventReplay())`).

When writing or porting components, **be SSR-safe**:

- Guard browser-only APIs (`window`, `document`, `localStorage`, `IntersectionObserver`) — use `afterNextRender`/`afterRender`, `isPlatformBrowser`, or `@angular/ssr` patterns so they don't execute during server render.
- Prefer CSS-driven effects over JS measurement (hover, reveal, scrims) — they SSR cleanly.
- Remote poster/backdrop images stay as plain `<img>` (with `loading`) so they render server-side without client-only image libraries.
- **Decide where a fetch belongs by "does it belong in the server render?"** — public, SEO-relevant, identical-for-everyone reads (movie lists, detail pages) **should** render server-side: load them with `rxResource` (its default runs during SSR — that's correct here). Per-user / identity-bearing / browser-only data (auth/session, anything reading cookies/`localStorage`/`window`) **must not** render server-side: do it in `afterNextRender` with a plain `.subscribe()` or direct call — **not** `rxResource`. Forcing `rxResource` to be client-only means idle-gating its `params` on a browser flag, which adds more state than a simple `afterNextRender` subscription saves (see `app-layout.ts`: the auth/`getCurrentUser` chain runs in `afterNextRender` so the server renders the neutral spinner and the browser — which has the cookies — does the one real check).

## Project Structure

```
src/
├── app/
│   ├── app.ts                  # Root component (hosts <router-outlet>)
│   ├── app.routes.ts          # Client route definitions (AppLayout shell + child pages)
│   ├── app.config.ts          # Browser providers (router, hydration)
│   ├── app.config.server.ts   # Server providers merged onto appConfig
│   └── app.routes.server.ts   # Per-route SSR render modes (currently RenderMode.Server for **)
├── layout/
│   └── app-layout/            # Public shell: header (logo, nav, "My Tickets" dialog, user-info menu) + <router-outlet> + footer
├── pages/                      # Route-level components (barrel: pages/index.ts)
│   ├── home/                  # HomePage (/) — featured-carousel hero + "Now Showing" + upcoming rails
│   ├── movies/                # MoviesPage (/movies) — filterable grid (search + experience/genre/rating selects)
│   └── movie-detail/          # MovieDetailPage (/movies/:movieId) — backdrop, cast/crew, trailer + <booking-section>
├── components/                 # Reusable UI components (barrel: components/index.ts)
│   ├── home/featured-carousel/ # Auto-advancing hero carousel of highlighted-movie slides (backdrop, scrims, meta, Play CTA)
│   ├── movies/trailer-modal/   # YouTube/trailer player dialog (trailerUrl + title inputs)
│   ├── movies/booking-section/ # Date strip + showtimes (grouped by hall type) on the detail page; fetches BookingService
│   └── header/my-tickets-list/ # In-progress bookings list shown inside the header's "My Tickets" modal
├── services/                   # HTTP services (barrel: services/index.ts)
│   ├── movies.ts              # MoviesService — getHighlighted / getNowShowing / getAnnouncedUpcoming / getMovieDetails
│   ├── halls.ts              # HallsService — getHallTypes
│   └── booking.ts            # BookingService — getBookableDates / getBookableShowtimes (public /booking/* endpoints)
├── shared/
│   ├── icons.ts               # Re-exports of lucide icons used in the app — sole source of glyphs (alias `X as XIcon`)
│   ├── types/                 # Client-facing data shapes (barrel: types/index.ts) — movies.ts, halls.ts (HallType), booking.ts (BookingShowtime, HallTypeShowtimes)
│   └── styles/
│       └── _colors.scss       # Color palette + typography vars; @forwards cinefy-ui radii — the single shared SCSS partial
├── main.ts                     # Browser bootstrap
├── main.server.ts             # Server bootstrap
├── server.ts                  # Express SSR host
├── styles.scss                 # Global reset + the cinefy-ui --cui-* token bridge + global helpers (.reveal, .scrollbar-hide)
└── index.html

mvp-version/                    # React 19 + Vite + Tailwind v4 + shadcn/ui design mock (the reference)
```

Barrel exports exist at `components/index.ts`, `pages/index.ts`, `services/index.ts`, and `shared/types/index.ts` — import through them, not by deep path.

### Shared styles & the design system

The shared SCSS lives in a **single partial**, `src/shared/styles/_colors.scss` (unlike management's `_colors`/`_shadows`/`_mixins` split). It holds the color palette **and** the typography vars (`$font-sans` = Geist, `$font-mono` = Geist Mono), and `@forward`s cinefy-ui's radii so `$radius-*` are available from the same import. Tokens were ported from `mvp-version/src/styles/index.css` (`oklch(...)` → hex). Dark-theme only.

Import it with `@use 'shared/styles/colors' as *;` (depth-adjust the relative prefix) — **never** hardcode raw values, and **never** `@import`. For shared mixins use `@use 'cinefy-ui/styles/mixins' as *;` (`flex-*`, `lucide-icon-fix`, `text-truncate`); for breakpoints `@use 'cinefy-ui/styles/breakpoints' as *;`. Prefer cinefy-ui's `var(--cui-*)` tokens / components / mixins where they already cover the need.

Token conventions:

- **Semantic tokens are the source of truth.** The accent value lives only in `$color-primary`; a role that visually matches the accent (focus ring, selected seat, accent text/borders) references `$color-primary` rather than redeclaring its hex. Don't reintroduce duplicate accent tokens like `$color-amber`/`$color-ring`/`$color-seat-selected`.
- A raw `rgba(...)` that equals an existing token's color should reference the token — e.g. `rgba($color-border, 0.4)`, not `rgba(38, 38, 38, 0.4)`. `$color-black` (`#000000`) is its own primitive (scrims/shadows) distinct from `$color-background` (`#0a0a0a`); `$shadow-overlay` is the shared dropdown/modal shadow.
- **`src/styles.scss` is the single bridge** that maps the SCSS palette to cinefy-ui's runtime `var(--cui-*)` contract in one `:root { ... }` block. Component SCSS uses plain `$variables`, not `var()`.
- The **`scss-dedup`** skill (`.claude/skills/scss-dedup/`) audits the SCSS for repeated raw values and extracts them into `_colors.scss` — invoke it when asked to dedupe/audit styles.

## Porting from `mvp-version/` (the `mvp-to-real` skill)

`mvp-version/` is a **multi-folder React 19 + Vite + Tailwind v4 + shadcn/ui** mock (`pages/`, `components/`, `components/ui/` shadcn primitives, `data/` mock arrays, `styles/index.css` tokens). It is the design source of truth. When the user asks to map/migrate a page or component, invoke the **`mvp-to-real`** skill and follow its rules. Key constraints:

- **No Tailwind in output** — translate every utility to hand-written SCSS in the component's `.scss`; translate the underlying _token_, not the literal class string.
- **Visual & behavioral parity** — colors, spacing, radius, shadows, gradients, hover/zoom, reveal animations, dialogs must match. The MVP is **dark-theme only**.
- **Use pixels, not rems.** Always consider **responsive** design — translate `sm/md/lg/xl` (640/768/1024/1280) prefixes to SCSS media queries; add responsive behavior where the MVP lacks it.
- **Icons:** `LucideAngularModule`, size via the `[size]` input — never via SCSS `svg { width/height }`.
- **shadcn/Radix primitives** (anything from `components/ui/*` — button, dialog, select, tabs, …): **stop and ask** — first check whether cinefy-ui provides it; otherwise ask before adding a headless lib or hand-rolling.
- **Mock data layer** (`BookingsProvider`, `data/*.ts`) is placeholder — map the UI faithfully but **do not hardwire the mock data into the real app**; treat real data shapes as a decision to ask about, not invent.
- React → Angular: `useState`→`signal()`, `useMemo`→`computed()`, `useEffect`→`effect()`/lifecycle; props→`input()`/`output()`; react-router→Angular router (`<Link to>`→`routerLink`, `useNavigate()`→`inject(Router)`, `useParams`/`useSearchParams`→`ActivatedRoute`, `<Outlet/>`→`<router-outlet>`).

## Conventions (frontend-wide)

These hold across the Cinefy frontend — see `cinefy-management/CLAUDE.md` for the full treatment:

- **Standalone components**, signal-based state (`signal`/`computed`/`effect`), `input()`/`output()` — **no `@Input`/`@Output` decorators**.
- **Prefer `linkedSignal` over `signal` + a re-seeding `effect`** when a writable signal's default is derived **synchronously** from a source (another `signal`/`input`/`computed`) but still needs independent user writes — the "derived default + local override" shape. It collapses the `signal` and its `.set()`-ing `effect` into one member. Does **not** apply when the re-seed is async (value lands from an HTTP `.subscribe()`) — keep `signal` + `effect` there. Full rules and examples in [`../cinefy-management/CLAUDE.md`](../cinefy-management/CLAUDE.md#state-management).
- **Async data via `rxResource`** — load remote data with `rxResource` (params signal + `stream` returning the service `Observable`), not a hand-rolled `signal` + `subscribe`. Render its states in a fixed outer order: **loading → error → resolved**. `isLoading()` → `<loading-spinner variant="lg">` in a centered wrapper; `error()` → `<empty-state [icon]="icons.TriangleAlertIcon">`; then the resolved branch. For the resolved empty-vs-data split, **prefer `@for … @empty`** — render the list and let `@empty` show the empty `<empty-state>` (e.g. `pages/movies/movies.html`, `pages/home/home.html`). Only fall back to an explicit negated guard (`@else if (!rows().length)` with data in the final `@else`) when an empty result must **short-circuit a whole dependent section**, not just swap one list for an empty message — e.g. `booking-section.html`: empty _dates_ must show "Tickets not yet available" and suppress the showtimes block entirely, so `@empty` there would wrongly render "No showtimes for this date" when the real cause is that there are no dates at all. Gate a dependent second fetch by returning `undefined` from its `params` callback (the resource stays idle and fires no request) — see `booking-section.ts` (showtimes fetch keyed on the selected date).
- **Class member order** — component classes follow the canonical order documented in [`../cinefy-management/CLAUDE.md`](../cinefy-management/CLAUDE.md#class-member-order) (modeled on `hall-config-modal.ts`): `icons` map → injected services (`inject`) → `viewChild`/`ElementRef` → static constants + their derived computeds → signal **inputs** then **outputs** → signal **state** → reactive **forms** → **computeds**/`toSignal` (kept adjacent to the state they consume) → arrow-fn template helpers → `constructor()` (`effect`/`afterNextRender`) → private init methods → protected event handlers → private helpers. Within a bucket, preserve existing order — don't alphabetize. New components match it; touching an existing one is a good time to bring it in line.
- New components default to **SCSS styles** and **skip tests** (per `angular.json` schematics). Inline `selector`, external `templateUrl` + `styleUrl`; files named `name.ts`/`name.html`/`name.scss` (no `.component` suffix).
- **Barrel exports** — pages and components are re-exported from `pages/index.ts` and `components/index.ts`; import through the barrel.
- **Icons** — all lucide glyphs are re-exported from `src/shared/icons.ts` (aliased `Foo as FooIcon`); import from there, never from `lucide-angular` directly. Add new glyphs to that file. Size via the `[size]` input.
- **Reactive forms** (`FormGroup` + `[formGroup]`) for any `<form (ngSubmit)>`; signal/template forms must import `FormsModule` so `<form>` has a directive.
- **No accessibility attributes** (`aria-*`, `role`, `title`) and **no explanatory comments** unless explicitly requested. Write self-documenting code.
- **No `-webkit-` prefixes / legacy fallbacks** — target modern browsers, write the standard property directly. The one exception is multi-line truncation: `display: -webkit-box` + `-webkit-box-orient: vertical` + `-webkit-line-clamp` are the only implemented mechanism, so they're load-bearing (pair `-webkit-line-clamp` with the standard `line-clamp` for the linter and future-proofing).
- Shared form regexes live in a flat `src/shared/validation.ts` (create if reused).
- Prettier: `printWidth: 100`, `singleQuote: true`; HTML uses the angular parser.
- TypeScript is **strict** (`strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `strictTemplates`).
- After adding cinefy-ui exports, clear `.angular/cache` — Vite caches the lib pre-bundle and throws "does not provide an export named" until cleared (dev only).

## Backend contract

The only contract with `cinefy-backend` is the HTTP API (documented in the backend `CLAUDE.md`). Frontend and backend version/deploy independently. Frontend branches on JSON `errorCode` (an `ApiErrorCode` union), not message text, when multiple 400s need distinct UI handling.

This app consumes the **public** (`@PublicApi`, unauthenticated) read endpoints: `/movies/highlighted`, `/movies/now-showing`, `/movies/announced-upcoming`, `/movies/{id}` (raw TMDB id, not a uuid), and `/booking/movies/{id}/dates` + `/booking/movies/{id}/showtimes?date=`. **The client-facing list endpoints return an empty array, never 404, when there's nothing** (a movie with no bookable dates, a date with no showtimes) — the empty state is driven off `length === 0`, so don't treat empty as an error. A genuine 404 means the resource itself is absent (e.g. an unknown movie id on `/movies/{id}`) and is handled distinctly (see `movie-detail.ts`, which branches on `HttpErrorResponse.status === 404`).
