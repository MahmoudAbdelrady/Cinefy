# CLAUDE.md — cinefy-client

## Overview

Angular 22 **public-facing booking app** for the Cinefy cinema platform. Standalone components, signal-based state, **server-side rendered** (`@angular/ssr` with an Express host) — this is the customer-facing site where people browse movies and book seats, as opposed to the CSR-only `cinefy-management` admin dashboard. Custom SCSS design system; consumes the shared `cinefy-ui` library.

> **Current state:** the browse, booking, and auth flows are all built and routed. The fully-designed product lives as a **React reference mock** in `mvp-version/` and is ported screen-by-screen into the Angular app via the `mvp-to-real` skill. Most "build a page" work means mapping from `mvp-version/`, not writing from scratch. Two layout shells: the public **`AppLayout`** (header — logo/nav, a "My Tickets" dialog, and an authenticated user-info menu **or** Login/Sign-up buttons for anonymous users — plus a footer) and the **`AuthLayout`** shell for the `/membership/*` auth pages. Pages built: **Home** (`/`) — a `featured-carousel` hero (auto-advancing highlighted-movie slides), a "Now Showing" rail, and a "Coming Soon"/upcoming rail; **Movies** (`/movies`) — a filterable grid (title search + experience/genre/rating selects); **Movie Detail** (`/movies/:movieId`) — backdrop, cast/crew, trailer dialog, and a `booking-section` (date strip + showtimes grouped by hall type); **Seat Selection** (`/movies/:movieId/seats/:showtimeId`, `authGuard`); **Checkout** (`/checkout/:bookingId`, `authGuard`) — pay via redirect or a saved card; **Booking Confirmation** (`/booking-confirmation/:bookingId`, `authGuard`) — the post-payment result page, which **polls** while the payment state is `PENDING` (flat 2.5s for the first minute, then ×1.5 backoff capped at 30s); and the auth pages under `/membership` — **Login**, **Sign-up**, **Forgot-password**. **Profile** (`/profile`, `authGuard`) — personal details, password, saved cards, and paged booking history; and a `**` wildcard route rendering `NotFoundPage`. Data comes from `MoviesService`, `HallsService`, `BookingService`, `AuthService`, and `ClientService` (`services/`); browse reads load with `rxResource`, while auth/current-user data loads via `afterNextRender` + `.subscribe()` (see the SSR note below).

## Workspace Layout

This app lives in the pnpm workspace rooted at `cinefy-frontend/` (sibling of `cinefy-backend/` at the repo root). The workspace holds three packages: `cinefy-management` (admin app), `cinefy-ui` (shared component library), and `cinefy-client` (this app). Run `pnpm install` from `cinefy-frontend/`. This app consumes the **built** library via `"cinefy-ui": "link:../cinefy-ui/dist"`, so the library must be built before/alongside the app.

See also: [`../cinefy-management/CLAUDE.md`](../cinefy-management/CLAUDE.md) for the broader Angular conventions, signals patterns, SCSS design-system approach, and the cinefy-ui import contract shared across the frontend.

## Commands

**Always run pnpm from `cinefy-frontend/` (the workspace root) — never from inside a package directory.**

```bash
# ALWAYS from cinefy-frontend/ (workspace root):
pnpm install                   # Restore all workspace packages
pnpm ui:build                  # Build cinefy-ui (ng-packagr → cinefy-ui/dist) — required before running
pnpm client:dev                # Dev server (defaults to :4200 — pass --port to run alongside mgmt)
pnpm client:build              # Production SSR build
pnpm app:build                 # Build ui, then management, then client

# To run a single package's own script, use --filter (still from the root):
pnpm --filter cinefy-client build                 # Production build (SSR — browser + server bundles)
pnpm --filter cinefy-client test                  # Run tests (Vitest, jsdom)
pnpm --filter cinefy-client serve:ssr:cinefy-client  # Run the built SSR server
```

> **pnpm only** (v12.3.4) — do not use npm or yarn. Both apps default to port 4200; pass `--port` to run them side by side.

Running pnpm from inside `cinefy-client/` makes pnpm treat it as a standalone project and re-resolve every dependency, producing a stray lockfile and a private `node_modules` that drifts off the workspace's pinned Angular version. See [the management CLAUDE.md](../cinefy-management/CLAUDE.md#commands) for the full explanation and the recovery steps.

## SSR — this app is server-rendered

`cinefy-client` ships browser **and** server bundles. `src/server.ts` is the Express host; `src/app/app.routes.server.ts` declares render modes; `src/app/app.config.server.ts` merges server providers onto the shared `appConfig`. Hydration is enabled with event replay (`provideClientHydration(withEventReplay())`).

Render modes reflect the auth boundary: the identity-bearing / auth-gated routes are `RenderMode.Client` — `membership/**` (login/signup/forgot-password), `movies/:movieId/seats/:showtimeId` (seat selection), `checkout/:bookingId`, and `booking-confirmation/:bookingId` — while everything else (`**`, the public browse pages) stays `RenderMode.Server`. This is the render-mode side of the fetch-placement rule below: auth is client state, so auth-gated pages render in-browser where the cookie lives (no flash, no cookie-forwarding into SSR).

When writing or porting components, **be SSR-safe**:

- Guard browser-only APIs (`window`, `document`, `localStorage`, `IntersectionObserver`) — use `afterNextRender`/`afterRender`, `isPlatformBrowser`, or `@angular/ssr` patterns so they don't execute during server render.
- Prefer CSS-driven effects over JS measurement (hover, reveal, scrims) — they SSR cleanly.
- Remote poster/backdrop images stay as plain `<img>` (with `loading`) so they render server-side without client-only image libraries.
- **Decide where a fetch belongs by "does it belong in the server render?"** — public, SEO-relevant, identical-for-everyone reads (movie lists, detail pages) **should** render server-side: load them with `rxResource` (its default runs during SSR — that's correct here). Per-user / identity-bearing / browser-only data (auth/session, anything reading cookies/`localStorage`/`window`) **must not** render server-side: do it in `afterNextRender` with a plain `.subscribe()` or direct call — **not** `rxResource`. Forcing `rxResource` to be client-only means idle-gating its `params` on a browser flag, which adds more state than a simple `afterNextRender` subscription saves (see `app-layout.ts`: the auth/`getCurrentUser` chain runs in `afterNextRender` so the server renders the neutral spinner and the browser — which has the cookies — does the one real check).

## Project Structure

```
src/
├── app/
│   ├── core/interceptors/     # HTTP interceptors (registered in app.config.ts, in order; barrel: index.ts)
│   │   ├── base-url.ts        # Prepends environment apiUrl (browser) / API_ORIGIN (SSR) to relative requests
│   │   ├── csrf.ts            # Attaches CSRF token to mutating requests
│   │   ├── auth-retry.ts      # On 401, refreshes the access token once (single-flight) and retries
│   │   ├── error-toast.ts     # On HTTP error, shows a toast — skippable via the SKIP_ERROR_TOAST context
│   │   └── error-toast-context.ts # SKIP_ERROR_TOAST token + skipErrorToast() helper
│   ├── app.ts                  # Root component (hosts <router-outlet> + the single <cui-toast>)
│   ├── app.routes.ts          # Route definitions (AuthLayout /membership shell + AppLayout shell + ** NotFound)
│   ├── app.config.ts          # Browser providers: router, hydration, HttpClient + 4 interceptors, toast, PrimeNG
│   ├── app.config.server.ts   # Server providers merged onto appConfig
│   └── app.routes.server.ts   # Per-route SSR render modes (auth-gated routes → Client; ** → Server)
├── layout/
│   ├── app-layout/            # Public shell: header (logo, nav, "My Tickets" dialog, user-info menu or Login/Sign-up) + <router-outlet> + footer
│   └── auth-layout/           # Guest shell for /membership/* (login, signup, forgot-password): logo + <router-outlet>
├── pages/                      # Route-level components (barrel: pages/index.ts)
│   ├── home/                  # HomePage (/) — featured-carousel hero + "Now Showing" + upcoming rails
│   ├── movies/                # MoviesPage (/movies) — filterable grid (search + experience/genre/rating selects)
│   ├── movie-detail/          # MovieDetailPage (/movies/:movieId) — backdrop, cast/crew, trailer + <booking-section>
│   ├── seat-selection/        # SeatSelectionPage (/movies/:movieId/seats/:showtimeId, authGuard) — seat map + summary
│   ├── checkout/              # CheckoutPage (/checkout/:bookingId, authGuard) — pay by redirect or saved card
│   ├── booking-confirmation/  # BookingConfirmationPage (/booking-confirmation/:bookingId, authGuard)
│   │                          #   payment result keyed on PaymentState; polls while PENDING (backoff)
│   ├── profile/               # ProfilePage (/profile, authGuard) — details, password, billing, history
│   ├── not-found/             # NotFoundPage (wildcard ** route)
│   └── auth/                  # LoginPage, SignUpPage, ForgotPasswordPage (under /membership/*)
├── components/                 # Reusable UI components (barrel: components/index.ts)
│   ├── home/featured-carousel/ # Auto-advancing hero carousel of highlighted-movie slides (backdrop, scrims, meta, Play CTA)
│   ├── movies/trailer-modal/   # YouTube/trailer player dialog (trailerUrl + title inputs; (closed) output)
│   ├── movies/booking-section/ # Date strip + showtimes (grouped by hall type) on the detail page; fetches BookingService
│   ├── movies/booking-cancelled/ # Booking-cancelled state
│   ├── seat-selection/booking-summary/ # Selected-seats summary panel on the seat-selection page
│   ├── header/my-tickets-list/ # In-progress bookings list; is itself the header's "My Tickets" <cui-dialog>
│   ├── profile/               # personal-details, profile-password, profile-billing (saved cards),
│   │                          #   profile-history (paged past bookings) + past-booking-details-modal
│   └── auth/                  # oauth-buttons/, otp-step/, and forgot-password/ (multi-step: progress-dots + steps/{request,reset,done}, own barrel + _fp-shared.scss)
├── services/                   # HTTP services (barrel: services/index.ts)
│   ├── movies.ts              # MoviesService — getHighlighted / getNowShowing / getAnnouncedUpcoming / getMovieDetails
│   ├── halls.ts              # HallsService — getHallTypes
│   ├── booking.ts            # BookingService — getBookableDates/getBookableShowtimes (public) + getSeatSelection/
│   │                          #   getActiveBookings/getActiveBookingDetails/getBookingConfirmation/createBooking/
│   │                          #   cancelBooking/payBooking/paySavedCard (authed). Several reads take an optional
│   │                          #   HttpContext so the caller can pass skipErrorToast() when it renders the error itself.
│   ├── auth.ts               # AuthService — sign-up/verify-account/send-otp/login/logout/verify-otp/reset-password/session/refresh (refresh single-flighted)
│   └── clients.ts            # ClientService — getCurrentUser (/client/me) + updateCurrentUser (PUT /client/me) + changeCurrentUserPassword (PUT /client/me/password) + getPaymentMethods (/client/me/payment-methods) + clearCurrentUser
├── shared/
│   ├── icons.ts               # Re-exports of lucide icons from @lucide/angular — sole source of glyphs (alias `X as XIcon`)
│   ├── guards/                # auth-guard (authGuard), guest-guard (guestGuard) (barrel: index.ts)
│   ├── seat-position.ts       # comparePositions() seat-sorting helper
│   ├── validation.ts          # Shared form regexes: EMAIL_PATTERN, NAME_PATTERN, PASSWORD_PATTERN
│   ├── types/                 # Client-facing data shapes (barrel: types/index.ts) — movies, halls, booking, auth, clients, api (ApiError/ApiErrorCode), seats
│   └── styles/
│       └── _colors.scss       # Color palette + typography vars; @forwards cinefy-ui tokens — the single shared partial under shared/styles (see also the forgot-password _fp-shared.scss)
├── environments/
│   ├── environment.ts         # Dev: apiUrl = http://localhost:8080
│   └── environment.prod.ts    # Prod: apiUrl = /api
├── main.ts                     # Browser bootstrap
├── main.server.ts             # Server bootstrap
├── server.ts                  # Express SSR host
├── styles.scss                 # Global reset + the cinefy-ui --cui-* token bridge + global helpers (.reveal, .scrollbar-hide)
└── index.html

mvp-version/                    # React 19 + Vite + Tailwind v4 + shadcn/ui design mock (the reference)
```

Barrel exports exist at `components/index.ts` (+ a nested `components/auth/forgot-password/index.ts`), `pages/index.ts`, `services/index.ts`, `shared/types/index.ts`, and `shared/guards/index.ts` — import through them, not by deep path.

### Shared styles & the design system

The shared SCSS under `shared/styles/` is a **single partial**, `src/shared/styles/_colors.scss` (unlike management's `_colors`/`_shadows`/`_mixins` split). It holds the color palette **and** the typography vars (`$font-sans` = Geist, `$font-mono` = Geist Mono), and `@forward`s cinefy-ui's tokens so `$radius-*` and `$transition-fast` are available from the same import. Tokens were ported from `mvp-version/src/styles/index.css` (`oklch(...)` → hex). Dark-theme only. (One component-local exception: `src/components/auth/forgot-password/_fp-shared.scss`, shared across the forgot-password step components.)

Import it with `@use 'shared/styles/colors' as *;` (depth-adjust the relative prefix) — **never** hardcode raw values, and **never** `@import`. For shared mixins use `@use 'cinefy-ui/styles/mixins' as *;` (`flex-*`, `lucide-icon-fix`, `text-truncate`); for breakpoints `@use 'cinefy-ui/styles/breakpoints' as *;`. Prefer cinefy-ui's `var(--cui-*)` tokens / components / mixins where they already cover the need.

Token conventions:

- **Semantic tokens are the source of truth.** The accent value lives only in `$color-primary`; a role that visually matches the accent (focus ring, selected seat, accent text/borders) references `$color-primary` rather than redeclaring its hex. Don't reintroduce duplicate accent tokens like `$color-amber`/`$color-ring`/`$color-seat-selected`.
- A raw `rgba(...)` that equals an existing token's color should reference the token — e.g. `rgba($color-border, 0.4)`, not `rgba(38, 38, 38, 0.4)`. `$color-black` (`#000000`) is its own primitive (scrims/shadows) distinct from `$color-background` (`#0a0a0a`); `$shadow-overlay` is the shared dropdown/modal shadow.
- **`src/styles.scss` is the single bridge** that maps the SCSS palette to cinefy-ui's runtime `var(--cui-*)` contract in one `:root { ... }` block. Component SCSS uses plain `$variables`, not `var()`.
- The **`scss-dedup`** skill (`.claude/skills/scss-dedup/`) audits the SCSS for repeated raw values and extracts them into `_colors.scss` — invoke it when asked to dedupe/audit styles.
- **Write SCSS nested, not flat** — a child element's rule goes **inside** its parent's block, not as a top-level sibling. Nest by the element's place in the template (not by class-name prefix); no `&-` name concatenation (it makes class names ungreppable); don't nest past ~3 levels. Full rules and examples in [`../cinefy-management/CLAUDE.md`](../cinefy-management/CLAUDE.md#nested-scss).

## Porting from `mvp-version/` (the `mvp-to-real` skill)

`mvp-version/` is a **multi-folder React 19 + Vite + Tailwind v4 + shadcn/ui** mock (`pages/`, `components/`, `components/ui/` shadcn primitives, `data/` mock arrays, `styles/index.css` tokens). It is the design source of truth. When the user asks to map/migrate a page or component, invoke the **`mvp-to-real`** skill and follow its rules. Key constraints:

- **No Tailwind in output** — translate every utility to hand-written SCSS in the component's `.scss`; translate the underlying _token_, not the literal class string.
- **Visual & behavioral parity** — colors, spacing, radius, shadows, gradients, hover/zoom, reveal animations, dialogs must match. The MVP is **dark-theme only**.
- **Use pixels, not rems.** Always consider **responsive** design — translate `sm/md/lg/xl` (640/768/1024/1280) prefixes to SCSS media queries; add responsive behavior where the MVP lacks it.
- **Icons:** import `LucideDynamicIcon` from `@lucide/angular` and render `<svg [lucideIcon]="icons.XIcon" [size]="N">`; size via the `[size]` input — never via SCSS `svg { width/height }`.
- **shadcn/Radix primitives** (anything from `components/ui/*` — button, dialog, select, tabs, …): **stop and ask** — first check whether cinefy-ui provides it; otherwise ask before adding a headless lib or hand-rolling.
- **Mock data layer** (`BookingsProvider`, `data/*.ts`) is placeholder — map the UI faithfully but **do not hardwire the mock data into the real app**; treat real data shapes as a decision to ask about, not invent.
- React → Angular: `useState`→`signal()`, `useMemo`→`computed()`, `useEffect`→`effect()`/lifecycle; props→`input()`/`output()`; react-router→Angular router (`<Link to>`→`routerLink`, `useNavigate()`→`inject(Router)`, `useParams`/`useSearchParams`→`ActivatedRoute`, `<Outlet/>`→`<router-outlet>`).

## Conventions (frontend-wide)

These hold across the Cinefy frontend — see `cinefy-management/CLAUDE.md` for the full treatment:

- **Standalone components**, signal-based state (`signal`/`computed`/`effect`), `input()`/`output()` — **no `@Input`/`@Output` decorators**.
- **Prefer `linkedSignal` over `signal` + a re-seeding `effect`** when a writable signal's default is derived **synchronously** from a source (another `signal`/`input`/`computed`) but still needs independent user writes — the "derived default + local override" shape. It collapses the `signal` and its `.set()`-ing `effect` into one member. Does **not** apply when the re-seed is async (value lands from an HTTP `.subscribe()`) — keep `signal` + `effect` there. Full rules and examples in [`../cinefy-management/CLAUDE.md`](../cinefy-management/CLAUDE.md#state-management).
- **Async data via `rxResource`** — load remote data with `rxResource` (params signal + `stream` returning the service `Observable`), not a hand-rolled `signal` + `subscribe`. Render its states in a fixed outer order: **loading → error → resolved**. `isLoading()` → `<cui-loading-spinner variant="lg">` in a centered wrapper; `error()` → `<cui-empty-state [icon]="icons.TriangleAlertIcon">`; then the resolved branch. For the resolved empty-vs-data split, **prefer `@for … @empty`** — render the list and let `@empty` show the empty `<cui-empty-state>` (e.g. `pages/movies/movies.html`, `pages/home/home.html`). Only fall back to an explicit negated guard (`@else if (!rows().length)` with data in the final `@else`) when an empty result must **short-circuit a whole dependent section**, not just swap one list for an empty message — e.g. `booking-section.html`: empty _dates_ must show "Tickets not yet available" and suppress the showtimes block entirely, so `@empty` there would wrongly render "No showtimes for this date" when the real cause is that there are no dates at all. Gate a dependent second fetch by returning `undefined` from its `params` callback (the resource stays idle and fires no request) — see `booking-section.ts` (showtimes fetch keyed on the selected date).
- **Class member order** — component classes follow the canonical order documented in [`../cinefy-management/CLAUDE.md`](../cinefy-management/CLAUDE.md#class-member-order) (modeled on `hall-config-modal.ts`): `icons` map → injected services (`inject`) → `viewChild`/`ElementRef` → `protected readonly` template bridges to module constants + their derived computeds → signal **inputs** then **outputs** → signal **state** → reactive **forms** → **computeds**/`toSignal` (kept adjacent to the state they consume) → arrow-fn template helpers → `constructor()` (`effect`/`afterNextRender`) → private init methods → protected event handlers → private helpers. Within a bucket, preserve existing order — don't alphabetize. **Pure constants live at module scope** (a `SCREAMING_SNAKE_CASE` `const` above `@Component`), not as `private static readonly` class fields — see the management doc. New components match it; touching an existing one is a good time to bring it in line.
- **Semantic HTML** — reach for the element that describes the content; `<div>` is only for a generic box with no meaning (flex/grid wrapper, card body, scrim/spacer/decorative layer). This matters **more here than in management** — the client is SSR + public-facing, so landmarks and sectioning have real SEO and accessibility payoff for anonymous users and crawlers. Use `<header>`/`<main>`/`<footer>` for the shell ([`layout/app-layout/app-layout.html`](src/layout/app-layout/app-layout.html)), `<nav>` for link sets, `<section>` **only** for a titled region that contains a heading (the home rails in [`pages/home/home.html`](src/pages/home/home.html), the `<h3>` regions in `pages/movie-detail/movie-detail.html`, the `<h2>`-led `components/movies/booking-section/booking-section.html`), and `<ul>`/`<li>` for any `@for` list (the `@for` goes on the `<li>`). Never add an empty `<section>` (one with no heading) — that's noise for screen readers; keep it a `<div>`. Don't do a blanket "replace every div" sweep — convert in a focused landmark/list pass and **verify the build after each file** (the template compiler flags mismatched closing tags). Selectors are class-based, so tag swaps cause no layout change. Full treatment in [`../cinefy-management/CLAUDE.md`](../cinefy-management/CLAUDE.md#semantic-html).
- **A button's loading spinner always carries a label** — never a bare `<cui-loading-spinner>` inside a button. Show the **progressive form of the button's own action** so the user can tell what is in flight: `@if (submitting()) { <cui-loading-spinner variant="xs" /> <span>Signing in…</span> } @else { <span>Sign in</span> … }`. Use the progressive verb plus an ellipsis character (`Saving…`, `Cancelling…`, `Creating account…`, `Connecting…`), and `variant="xs"` for the in-button spinner. Two exceptions, both already correct here: **icon-only buttons** (icon + `pTooltip`, no visible text) keep a bare spinner, and buttons where the spinner replaces only a leading **icon** while the `<span>` label sits outside the `@if` already satisfy the rule. Page- and section-level loading blocks are unaffected — those stay a centered `<cui-loading-spinner variant="lg" />` with no label. Full treatment in [`../cinefy-management/CLAUDE.md`](../cinefy-management/CLAUDE.md#button-loading-states).
- **Toasts are `CinefyToastService`** (cinefy-ui, wrapping PrimeNG's `p-toast`). Inject it and call `success(message)` / `error(message)` — that two-method surface is the whole API. The container is a single `<cui-toast />` in [`app.ts`](src/app/app.ts) (one per app, never per page or layout shell), and `provideCinefyToast()` in [`app.config.ts`](src/app/app.config.ts) supplies PrimeNG's `MessageService` in the **root** injector — without it every toast silently no-ops. Both sides agree on `CINEFY_TOAST_KEY` from `cinefy-ui/constants`; never pass a key by hand. ng-primitives (and the old `ToastService`) are fully removed.
- **cinefy-ui components are `cui-<name>` / `Cinefy<Name>`** — the selector always carries the `cui-` prefix and the class the `Cinefy` prefix, with no `Component` suffix (`<cui-empty-state>` / `CinefyEmptyState`, `<cui-loading-spinner>` / `CinefyLoadingSpinner`). A new library component follows the same pair.
- **Dialogs are `<cui-dialog>`** (cinefy-ui, wrapping PrimeNG's `p-dialog`). Mounting opens it, so **every dialog renders behind an `@if`** and its `(closed)` output unmounts it — a component whose root is a `cui-dialog` satisfies this via the parent's `@if`. Inputs: `header` / `description` / `canClose` / `style` / `contentStyle`; slots `[customHeader]` / `[customFooter]` (import `CinefyDialogHeader` / `CinefyDialogFooter` or they silently vanish). To close from inside, call `close()` on a `viewChild(CinefyDialog)` — **never** clear the parent flag directly, which skips the leave animation and PrimeNG's `<body>` scroll-lock cleanup. A dialog inside an `@for` moves **out** of the loop, keyed on a signal holding the row's object (`bookingToView`, `methodToRemove`). Gate `canClose` on any in-flight request so the dialog can't be dismissed mid-save.
- New components default to **SCSS styles** and **skip tests** (per `angular.json` schematics). Inline `selector`, external `templateUrl` + `styleUrl`; files named `name.ts`/`name.html`/`name.scss` (no `.component` suffix).
- **Barrel exports** — pages and components are re-exported from `pages/index.ts` and `components/index.ts`; import through the barrel.
- **Icons** — all lucide glyphs are re-exported from `src/shared/icons.ts` (aliased `Foo as FooIcon`, from `@lucide/angular`); import from there, never from `@lucide/angular` directly. Add new glyphs to that file. Size via the `[size]` input.
- **Reactive forms** (`FormGroup` + `[formGroup]`) for any `<form (ngSubmit)>`; signal/template forms must import `FormsModule` so `<form>` has a directive.
- **No accessibility attributes** (`aria-*`, `role`, `title`) and **no explanatory comments** unless explicitly requested. Write self-documenting code.
- **No `-webkit-` prefixes / legacy fallbacks** — target modern browsers, write the standard property directly. The one exception is multi-line truncation: `display: -webkit-box` + `-webkit-box-orient: vertical` + `-webkit-line-clamp` are the only implemented mechanism, so they're load-bearing (pair `-webkit-line-clamp` with the standard `line-clamp` for the linter and future-proofing).
- Shared form regexes live in a flat `src/shared/validation.ts` (`EMAIL_PATTERN`, `NAME_PATTERN`, `PASSWORD_PATTERN`).
- Prettier: `printWidth: 100`, `singleQuote: true`; HTML uses the angular parser.
- TypeScript is **strict** (`strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `strictTemplates`).
- After adding cinefy-ui exports, clear `.angular/cache` — Vite caches the lib pre-bundle and throws "does not provide an export named" until cleared (dev only).

## Backend contract

The only contract with `cinefy-backend` is the HTTP API (documented in the backend `CLAUDE.md`). Frontend and backend version/deploy independently. Frontend branches on JSON `errorCode` (the `ApiErrorCode` union, `shared/types/api.ts` — currently `'ACCOUNT_NOT_VERIFIED' | 'OTP_INVALID' | 'PASSWORD_INCORRECT' | 'PASSWORD_REUSED' | 'PAYMENT_NOT_ATTEMPTED'`), not message text, when multiple 400s need distinct UI handling. `PAYMENT_NOT_ATTEMPTED` is what `booking-confirmation.ts` branches on to tell "no payment was ever started" apart from a genuine failure.

This app is now **auth-bearing** (JWT-in-cookie), so it consumes both public and authenticated endpoints:

- **Public** (`@PublicApi`, unauthenticated) reads: `/movies/highlighted`, `/movies/now-showing`, `/movies/announced-upcoming`, `/movies/{id}` (raw TMDB id, not a uuid), `/halls/types`, and `/booking/movies/{id}/dates` + `/booking/movies/{id}/showtimes?date=`.
- **Auth** (`AuthService`, `client/auth/*`): `sign-up`, `verify-account`, `send-otp`, `login`, `logout`, `verify-otp`, `reset-password`, `GET session`, `refresh` (the refresh call is single-flighted). Current user: `GET /client/me` (`ClientService`).
- **Authenticated booking** (`BookingService`): `GET /booking/showtimes/{id}` (seat selection), `GET /booking/active`, `GET /booking/active/{uuid}`, `GET /booking/{uuid}/confirmation`, `POST /booking` (sends an `Idempotency-Key` header), `DELETE /booking/{uuid}`.
- **Payment** (`BookingService` + `ClientService`): `POST /booking/{uuid}/pay` and `POST /booking/{uuid}/pay-saved-card` both return a `PaymentRedirection` (`{ redirectionUrl }`) that the checkout page navigates to; `GET /client/me/payment-methods` lists the client's saved cards (`ClientPaymentMethod`). A card is only tokenized as a side effect of paying, so the saved-card list is refetched on return to checkout.

**The payment result is asynchronous.** Paymob redirects back to `/booking-confirmation/:bookingId`, but the authoritative settlement arrives on a server-side webhook, so the confirmation page may first read `paymentState: 'PENDING'` and must poll until it resolves. The `PaymentState` union is `'CONFIRMED' | 'PENDING' | 'FAILED' | 'EXPIRED' | 'REFUNDED'`.

**The client-facing list endpoints return an empty array, never 404, when there's nothing** (a movie with no bookable dates, a date with no showtimes) — the empty state is driven off `length === 0`, so don't treat empty as an error. A genuine 404 means the resource itself is absent (e.g. an unknown movie id on `/movies/{id}`) and is handled distinctly (see `movie-detail.ts`, which branches on `HttpErrorResponse.status === 404`).
