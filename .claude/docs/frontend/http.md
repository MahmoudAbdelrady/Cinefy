# Frontend HTTP, auth and error toasts

## Interceptor chain

Both apps register five functional interceptors in `src/app/app.config.ts`, in this order. The first three live in each app's `src/app/core/interceptors/`; the last two are shared and come from `cinefy-ui/http`.

1. **`baseUrlInterceptor`** — prepends `environment.apiUrl` to relative URLs (absolute URLs are skipped), sets `withCredentials: true`, and adds `X-Auth-Context: management` or `client` (the backend uses it to pick the cookie set). The client's version also prefixes a relative `apiUrl` with `process.env.API_ORIGIN` during SSR — see the client's `ssr` notes in its CLAUDE.md.
2. **`csrfInterceptor`** — on non-GET/HEAD/OPTIONS/TRACE requests, copies the app's XSRF cookie (`mgmt_XSRF-TOKEN` / `client_XSRF-TOKEN`) into the `X-XSRF-TOKEN` header. Browser only in the client.
3. **`authRetryInterceptor`** — on a 401, calls the refresh endpoint once and retries. Concurrent 401s share one refresh (`refresh$ ??= …` / `shareReplay`). Skips the login, refresh and session calls. If the retry also 401s, it calls `clearAuthState()` and navigates to the login page (`/login` or `/membership/login`).
4. **`errorToastInterceptor`** — toasts `error.error.message` on an error response, unless the request's context skips it. **401s are always silent** (the retry interceptor owns them); the client's version is also silent during SSR.
5. **`networkErrorInterceptor`** — when the server is unreachable — status `0` (dev: connection refused, "Failed to fetch") or `502`/`503`/`504` (prod: the proxy answering for a down backend) — replaces the body with `{ message: 'Could not reach the server. Please try again later.' }`. A genuine `500`/`501` keeps the backend's message.

**`networkErrorInterceptor` must stay last.** Errors travel back through the chain in reverse, so the interceptor nearest the backend sees them first — it must rewrite the message before `errorToastInterceptor` reads it.

## Skipping the error toast

**Suppressing the toast is the caller's call, not the endpoint's.** Service methods take an optional `context?: HttpContext` and forward it. Helpers from `cinefy-ui/http` (which also exports the `SKIP_ERROR_TOAST` / `SKIP_SERVER_ERROR_TOAST` tokens):

- **`skipServerErrorToast()`** — the default for any load that renders an inline error state (a `<cui-error-state>`, an `rxResource` `error()` branch, a stats panel falling back to `-`). Silences only server errors (status `0` or `>= 500`); a 4xx still toasts, since its message is usually specific. Pass it inside an `rxResource`'s `stream:`.
- **`skipErrorToast()`** — silences **every** status. Only for components that render **all** failures themselves, usually with the backend's message. Management: `book-seats`, `active-gateway` (404 means "no gateway active"). Client: checkout's booking load, `movie-detail`, `seat-selection`, `booking-confirmation`, `login`, `oauth-callback`.
- Loads with **no** inline error state (e.g. management's `hall-config-modal` dropdown sources, `movie-picker`'s "Load more") pass nothing — the toast is their only feedback.

**Forms that stay on screen after a failed submit** branch on the same server-error check: the password forms (`profile-password`, the forgot-password `reset-step`) reset the whole form on `status === 0 || status >= 500`, and management's `login.ts` raises its "Invalid email or password" toast only when the status is **not** a server error.

## Auth

- **JWT in HttpOnly cookies**, set and cleared by the backend. The frontend never reads or stores tokens.
- **Auth status is three-state.** `AuthService.getAuthStatus()` resolves `GET /…/auth/session` to `AuthStatus` (`cinefy-ui/types`): `'AUTHENTICATED' | 'UNAUTHENTICATED' | 'UNAVAILABLE'`. Status `0` or `>= 500` is `UNAVAILABLE` ("couldn't tell"); any other error is `UNAUTHENTICATED`.
  - Only `UNAUTHENTICATED` redirects to login, and only `AUTHENTICATED` redirects away from the guest pages. **`UNAVAILABLE` lets navigation through**, and both layouts render `<cui-server-unavailable>` (with a "Try again" reload) in place of their `<router-outlet>` while `authService.serverUnavailable()` is true.
  - Every resolved status is cached, `UNAVAILABLE` included, so `/session` is called at most once per page load — the reload clears it. The session request carries `skipServerErrorToast()` so the fallback isn't doubled by a toast.
- Guards: `authGuard` redirects to the login page with `?redirectUrl=…`; `guestGuard` sends signed-in users away. Login sanitizes `redirectUrl` with `toSafeRedirect` from `cinefy-ui/utils`.
- `AuthService.clearAuthState()` resets the cached status (used on logout and failed refresh).

## Conventions

- Services return `Observable<T>`; components subscribe (with `takeUntilDestroyed`) or use `rxResource` / `toSignal()`.
- The API pages are **zero-indexed** (Spring `Pageable`); `cui-paginator`'s `[(page)]` is 0-indexed too, so pass it straight through.
- Entity ids from the API are UUID strings. Movies use the numeric TMDB id.
- Branch on the JSON `errorCode` (an `ApiErrorCode` union in `shared/types/api.ts`), never on message text, when several errors need distinct UI handling.
