# CLAUDE.md — cinefy-client

Angular 22 public booking site, **server-side rendered** (`@angular/ssr` + Express host in `src/server.ts`, hydration with event replay). Dark theme only. Frontend-wide rules are in [`../CLAUDE.md`](../CLAUDE.md); run pnpm from `cinefy-frontend/` (`pnpm client:dev`, `pnpm client:build`, `pnpm --filter cinefy-client serve:ssr:cinefy-client`). Vitest is wired but there are no spec files yet.

## Reference docs

| Working on                                                  | Read                                                                          |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Where things live, services, interceptor specifics, barrels | [structure.md](../../.claude/docs/frontend/client/structure.md)               |
| Layouts, routes, guards, render mode per page               | [routes-and-pages.md](../../.claude/docs/frontend/client/routes-and-pages.md) |
| Palette and token rules                                     | [styling.md](../../.claude/docs/frontend/client/styling.md)                   |
| Error codes, payment flow, empty-vs-404                     | [backend-contract.md](../../.claude/docs/frontend/client/backend-contract.md) |
| Shared conventions, HTTP, styling, cinefy-ui                | [`.claude/docs/frontend/`](../../.claude/docs/frontend/)                      |

## SSR rules

**Render modes follow the auth boundary** (`src/app/app.routes.server.ts`): the auth-gated routes are `RenderMode.Client` — `membership/**`, `movies/:movieId/seats/:showtimeId`, `checkout/:bookingId`, `booking-confirmation/:bookingId`, `profile` — and everything else (`**`) is `RenderMode.Server`. Auth is client state, so auth-gated pages render in the browser where the cookie lives. **Never forward cookies into SSR.** A new auth-gated page gets a `RenderMode.Client` entry.

**Decide where a fetch runs by "does it belong in the server render?"**

- Public, identical-for-everyone reads (movie lists, detail pages) **should** render on the server: load them with `rxResource`, whose default runs during SSR.
- Per-user or browser-only data (auth/session, anything reading cookies, `localStorage` or `window`) **must not**: load it in `afterNextRender` with a plain `.subscribe()` — not `rxResource`. See `layout/app-layout/app-layout.ts`, where the server renders a neutral spinner and the browser does the one real auth check.

**Be SSR-safe:**

- Guard browser-only APIs (`window`, `document`, `localStorage`, `IntersectionObserver`) with `afterNextRender` / `isPlatformBrowser`.
- Prefer CSS-driven effects (hover, reveal, scrims) over JS measurement.
- Remote poster/backdrop images stay plain `<img>` (with `loading`).
- Use semantic landmarks and headings — on this public, server-rendered app they matter for SEO.

## Rules

- `rxResource` states render in a fixed order: **loading → error → resolved**, with `@for … @empty` for empty lists (details in [conventions.md](../../.claude/docs/frontend/conventions.md#async-data)).
- List endpoints return `[]` rather than 404 when empty — don't treat empty as an error.
- `src/styles.scss` is the only `--cui-*` bridge; the accent lives only in `$color-primary`.
- **Porting from `mvp-version/`** (the local, gitignored React design mock) goes through the **`mvp-to-real`** skill — invoke it when asked to map or migrate a page or component.
