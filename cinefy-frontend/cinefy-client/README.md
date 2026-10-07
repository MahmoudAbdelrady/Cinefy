# Cinefy Client

The public booking site. Moviegoers use it to browse movies, pick seats, pay and get their tickets.

For an overview of the project and its features, see the [main README](../../README.md).

## Running

Run every command from the `cinefy-frontend/` folder, not from inside this one.

```bash
pnpm install
pnpm ui:build       # build the shared UI library first
pnpm client:dev     # http://localhost:4200
```

The app expects the [backend](../../cinefy-backend/README.md) to be running. In development it calls the API at `http://localhost:8080`; this is set in `src/environments/environment.ts`. Production builds use `environment.prod.ts` instead.

## Server-side rendering

The app is rendered on the server, so public pages load quickly and show content before any JavaScript runs.

- **Server-rendered pages:** home, movie catalog, movie details, privacy policy, and the not-found page.
- **Browser-rendered pages:** everything to do with a customer's account: sign in, sign up, password reset, the OAuth sign-in callback, seat selection, checkout, booking confirmation and profile.

The split is set in `src/app/app.routes.server.ts`.

## Building and running in production

```bash
pnpm client:build
pnpm --filter cinefy-client serve:ssr:cinefy-client
```

The server reads these environment variables:

| Variable           | Purpose                                                                                                                                                                    | Default                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `PORT`             | Port the server listens on                                                                                                                                                 | `4000`                  |
| `API_ORIGIN`       | Backend address the server calls directly when rendering pages, in place of the browser's `/api` path. In Docker it's the backend service (`http://cinefy-backend:<port>`) | `http://localhost:8080` |
| `NG_ALLOWED_HOSTS` | Comma-separated host names the server accepts requests for                                                                                                                 | none                    |

## Project structure

| Folder                       | Contents                                                                    |
| ---------------------------- | --------------------------------------------------------------------------- |
| `src/pages/`                 | One folder per page                                                         |
| `src/components/`            | Components used by the pages                                                |
| `src/layout/`                | Page shells: the main layout with header and footer, and the sign-in layout |
| `src/services/`              | API calls, one service per area                                             |
| `src/app/core/interceptors/` | HTTP interceptors: API address, CSRF token, session refresh                 |
| `src/shared/`                | Route guards, types, icons and SCSS partials                                |
| `src/utils/`                 | Small helper functions                                                      |
| `src/server.ts`              | The Express server used for server-side rendering                           |

Shared components such as the seat map and dialogs come from [`cinefy-ui`](../cinefy-ui/README.md).
