# CLAUDE.md — cinefy-management

Angular 22 staff dashboard. Client-side rendered only (no SSR — an authenticated app with no SEO value), light theme only. Frontend-wide rules are in [`../CLAUDE.md`](../CLAUDE.md); run pnpm from `cinefy-frontend/` (`pnpm mgmt:dev`, `pnpm mgmt:build`). There is no test runner.

## Reference docs

| Working on                                                                 | Read                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Where things live, services, barrels                                       | [structure.md](../../.claude/docs/frontend/management/structure.md)                               |
| Routes, position access, adding a page, profile                            | [routes-and-access.md](../../.claude/docs/frontend/management/routes-and-access.md)               |
| Palette, shadows, SCSS imports                                             | [styling.md](../../.claude/docs/frontend/management/styling.md)                                   |
| Type semantics (halls, showtimes `bookable`, on-site settlement, gateways) | [domain.md](../../.claude/docs/frontend/management/domain.md)                                     |
| Dashboard widgets                                                          | [features/dashboard.md](../../.claude/docs/frontend/management/features/dashboard.md)             |
| Statistics page                                                            | [features/statistics.md](../../.claude/docs/frontend/management/features/statistics.md)           |
| Ticket scanning                                                            | [features/ticket-scanning.md](../../.claude/docs/frontend/management/features/ticket-scanning.md) |
| Shared conventions, HTTP, styling, cinefy-ui                               | [`.claude/docs/frontend/`](../../.claude/docs/frontend/)                                          |

## Rules

- **A protected route is declared twice** in `app.routes.ts`: once with `canMatch: [positionCanMatch]`, then the same path rendering `AccessDeniedPage`. Add its allowed positions to `ROUTE_ACCESS` in `shared/access.ts` — every position rule lives in that file.
- **Dashboard widget gates must match their endpoint's roles** — ungating a manager widget produces a 403 toast, not a hidden card.
- Drive the Book button off the server's `bookable` flag; don't re-derive it.
- Component SCSS imports `shared/styles/*` by **relative path** (no include path is configured).
- Use the palette, shadow and radius tokens — never hardcoded colors or `box-shadow`s. **Flag any new raw designed value** (color, shadow, gradient) and wait for the user's choice before adding it.
- An `output()` that announces an initial value must emit from `afterNextRender`, not the constructor.
- Reference implementation for member order and `takeUntilDestroyed`: `components/halls/hall-config-modal/hall-config-modal.ts`.
