# Cinefy Management

The staff dashboard. Cinema staff use it to set up halls, schedule showtimes, sell and check tickets, manage the team and follow sales.

For an overview of the project and its features, see the [main README](../../README.md).

## Running

Run every command from the `cinefy-frontend/` folder, not from inside this one.

```bash
pnpm install
pnpm ui:build                   # build the shared UI library first
pnpm mgmt:dev --port 4201       # http://localhost:4201
```

`--port 4201` lets the dashboard run next to the booking site, which uses the default port 4200.

The app expects the [backend](../../cinefy-backend/README.md) to be running. In development it calls the API at `http://localhost:8080`; this is set in `src/environments/environment.ts`. Production builds use `environment.prod.ts` instead.

Sign in with the admin account set in the backend's configuration.

To build for production:

```bash
pnpm mgmt:build
```

The output is a static site in `cinefy-management/dist/cinefy-management/browser/`.

## Roles and page access

Each staff member has one of four roles: Admin, Manager, Cashier or Usher. Which roles can open which page is defined in one place, `src/shared/access.ts`:

| Page                              | Roles                   |
| --------------------------------- | ----------------------- |
| Dashboard                         | All                     |
| Movies                            | Admin, Manager, Cashier |
| Halls, Statistics, Payment, Staff | Admin, Manager          |
| Profile                           | All                     |

The sidebar only shows the pages a role can open. A staff member who opens a page directly by URL without access sees an "access denied" page.

To add a new page:

1. Add its route in `src/app/app.routes.ts` with `canMatch: [positionCanMatch]`, followed by a second route for the same path that shows `AccessDeniedPage`.
2. Add its path and allowed roles to `ROUTE_ACCESS` in `src/shared/access.ts`.

## Project structure

| Folder                       | Contents                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `src/pages/`                 | One folder per page                                                                       |
| `src/components/`            | Components used by the pages, such as dialogs, the seat editor and the statistics widgets |
| `src/layout/`                | Page shells: the dashboard layout with sidebar, and the sign-in layout                    |
| `src/services/`              | API calls, one service per area                                                           |
| `src/app/core/interceptors/` | HTTP interceptors: API address, CSRF token, session refresh                               |
| `src/shared/`                | Role access rules, route guards, types, constants, icons and SCSS partials                |
| `src/utils/`                 | Small helper functions                                                                    |

Shared components such as the seat map, dialogs and form controls come from [`cinefy-ui`](../cinefy-ui/README.md).
