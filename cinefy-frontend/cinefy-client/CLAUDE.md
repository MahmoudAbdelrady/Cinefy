# CLAUDE.md — cinefy-client

## Overview

Angular 21 **public-facing booking app** for the Cinefy cinema platform. Standalone components, signal-based state, **server-side rendered** (`@angular/ssr` with an Express host) — this is the customer-facing site where people browse movies and book seats, as opposed to the CSR-only `cinefy-management` admin dashboard. Custom SCSS design system; consumes the shared `cinefy-ui` library.

> **Current state:** early skeleton. The real Angular app under `src/app/` is still the generated scaffold (`app.ts`, an empty `routes`, `Client App` placeholder template). The fully-designed product lives as a **React reference mock** in `mvp-version/` and is ported screen-by-screen into the Angular app via the `mvp-to-real` skill. Most "build a page" work means mapping from `mvp-version/`, not writing from scratch.

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

## Project Structure

```
src/
├── app/
│   ├── app.ts                  # Root component (scaffold)
│   ├── app.html               # Template (placeholder)
│   ├── app.routes.ts          # Client route definitions (empty — fill as pages are ported)
│   ├── app.config.ts          # Browser providers (router, hydration)
│   ├── app.config.server.ts   # Server providers merged onto appConfig
│   └── app.routes.server.ts   # Per-route SSR render modes
├── main.ts                     # Browser bootstrap
├── main.server.ts             # Server bootstrap
├── server.ts                  # Express SSR host
├── styles.scss                 # Global styles (currently empty)
└── index.html

mvp-version/                    # React 19 + Vite + Tailwind v4 + shadcn/ui design mock (the reference)
```

### Shared styles do not exist yet

`src/shared/styles/` is not created yet and `src/styles.scss` is effectively empty. The **first** mvp mapping that needs design tokens is responsible for creating the shared SCSS partials (`_colors.scss`, radius, typography — Geist sans + Geist Mono) by porting the `oklch(...)` tokens from `mvp-version/src/styles/index.css`. After they exist, **always reuse** them via `@use '../../shared/styles/colors' as *;` rather than duplicating raw values. Prefer cinefy-ui's `var(--cui-*)` tokens / components / mixins where they already cover the need.

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
- **Class member order** — component classes follow the canonical order documented in [`../cinefy-management/CLAUDE.md`](../cinefy-management/CLAUDE.md#class-member-order) (modeled on `hall-config-modal.ts`): `icons` map → injected services (`inject`) → `viewChild`/`ElementRef` → static constants + their derived computeds → signal **inputs** then **outputs** → signal **state** → reactive **forms** → **computeds**/`toSignal` (kept adjacent to the state they consume) → arrow-fn template helpers → `constructor()` (`effect`/`afterNextRender`) → private init methods → protected event handlers → private helpers. Within a bucket, preserve existing order — don't alphabetize. New components match it; touching an existing one is a good time to bring it in line.
- New components default to **SCSS styles** and **skip tests** (per `angular.json` schematics).
- **Reactive forms** (`FormGroup` + `[formGroup]`) for any `<form (ngSubmit)>`; signal/template forms must import `FormsModule` so `<form>` has a directive.
- **No accessibility attributes** (`aria-*`, `role`, `title`) and **no explanatory comments** unless explicitly requested. Write self-documenting code.
- Shared form regexes live in a flat `src/shared/validation.ts` (create if reused).
- Prettier: `printWidth: 100`, `singleQuote: true`; HTML uses the angular parser.
- TypeScript is **strict** (`strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `strictTemplates`).
- After adding cinefy-ui exports, clear `.angular/cache` — Vite caches the lib pre-bundle and throws "does not provide an export named" until cleared (dev only).

## Backend contract

The only contract with `cinefy-backend` is the HTTP API (documented in the backend `CLAUDE.md`). Frontend and backend version/deploy independently. Frontend branches on JSON `errorCode` (an `ApiErrorCode` union), not message text, when multiple 400s need distinct UI handling.
