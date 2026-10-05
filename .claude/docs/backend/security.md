# Security

## Filter chain

`SecurityConfig` builds the `SecurityFilterChain`:

- Spring's built-in CSRF **off**, replaced by `CsrfValidationFilter` (double-submit, see below).
- CORS allow-list of `AppConfig.getFrontendManagementUrl()` + `getFrontendClientUrl()`.
- Stateless sessions, `@EnableMethodSecurity`.
- `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`, `CsrfValidationFilter` after it.
- `anyRequest().access(apiAuthorizationManager)`; the health matcher and the springdoc base URL are `permitAll()`.

**`JwtAuthenticationFilter`** resolves the `AuthContext` from the `X-Auth-Context` header, reads **that context's** access-token cookie, parses it via `JwtUtil`, skips blocklisted tokens (`InvalidJwtService`), checks the token's `userType` claim against the context, and sets a `UserPrincipal`. **No header (or an unknown value) means no authentication** — the chain continues unauthenticated, exactly as for a missing cookie, so `@PublicApi` endpoints still work and protected ones 401.

**`CsrfValidationFilter`** compares the context's XSRF cookie (`mgmt_XSRF-TOKEN` / `client_XSRF-TOKEN`) with the shared `X-XSRF-TOKEN` header on authenticated, non-safe, non-`@PublicApi` requests (`CsrfProtectionMatcher`). A mismatch returns 403 `"Invalid CSRF token"`.

**`CinefyApiAuthorizationManager`** resolves the target handler and allows the request when it (or its controller) carries `@PublicApi`; otherwise it requires an authenticated principal. `CinefyAuthenticationEntryPoint` returns the 401 body (`"Authentication required"`).

**Authentication managers:** the `CinefyAuthManagers` bean (defined in `SecurityConfig`) holds two `DaoAuthenticationProvider` managers, one over `StaffMemberService` and one over `ClientService`, both with the `BCryptPasswordEncoder` bean from `AppConfig`.

## Authorization

Position/role rules are `@PreAuthorize` on the **controller** (class or method), never the service. Authorities are the `StaffPosition` values (`ADMIN`, `MANAGER`, `CASHIER`, `USHER`) plus `CLIENT`.

**Authorities are stored bare, with no `ROLE_` prefix** (`UserPrincipal.buildAuthorities` emits `"ADMIN"`, not `"ROLE_ADMIN"`). Always use `hasAuthority` / `hasAnyAuthority`. `hasRole` / `hasAnyRole` silently look up `ROLE_x`, which doesn't exist, and deny every request — it looks like a permissions bug, not a typo. There is no `GrantedAuthorityDefaults` bean re-introducing a prefix.

**`@PublicApi` under a class-level `@PreAuthorize` still 403s.** `@PublicApi` only satisfies `CinefyApiAuthorizationManager`; method security still applies the class-level rule. The public endpoint also needs a method-level `@PreAuthorize("permitAll()")`.

**Staff-only endpoints spell out all four positions.** `isAuthenticated()` lets a logged-in `CLIENT` through, and `UserPrincipal.getPosition()` is `null` for clients — staff services that dereference it then break.

### Access per controller

| Controller                         | Rule                                                                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `/management/auth`, `/client/auth` | All `@PublicApi` except `/logout`                                                                                                              |
| `/halls`                           | Class: ADMIN/MANAGER. `GET /halls/types` is `@PublicApi` + `permitAll()` (the client reads it)                                                 |
| `/movies`                          | Class: ADMIN/MANAGER. Public: `/announced-upcoming`, `/highlighted`, `/now-showing`, `GET /{id}`                                               |
| `/showtimes`                       | Class: ADMIN/MANAGER. `GET /movies`, `/movie-dates`, `/movie-day`, `/schedule` also allow CASHIER (counter booking and the dashboard schedule) |
| `/staff`                           | Class: ADMIN/MANAGER. `/me` endpoints and `GET /{uuid}` allow all four positions; row-level rules in [staff.md](staff.md)                      |
| `/payment-gateways`, `/statistics` | ADMIN/MANAGER                                                                                                                                  |
| `/client`                          | `CLIENT`                                                                                                                                       |
| `/booking`                         | Mixed — see [bookings.md](bookings.md#access)                                                                                                  |

## Auth contexts

Both frontends run on the same host, so one set of cookie names meant logging into one app silently overwrote the other's session (the original tab then got 403 — a valid token with the wrong role). `AuthContext` (`shared/security/`) gives each frontend its own cookies:

| Context      | Access               | Refresh               | CSRF                | Expected `UserType` |
| ------------ | -------------------- | --------------------- | ------------------- | ------------------- |
| `MANAGEMENT` | `mgmt_accessToken`   | `mgmt_refreshToken`   | `mgmt_XSRF-TOKEN`   | `STAFF_MEMBER`      |
| `CLIENT`     | `client_accessToken` | `client_refreshToken` | `client_XSRF-TOKEN` | `CLIENT`            |

- **`AuthContext` is the single source of truth for cookie names** — use `accessTokenCookie()` / `refreshTokenCookie()` / `csrfTokenCookie()`, never a literal. `CookieUtil` is a dumb builder taking a plain name.
- **The `X-Auth-Context` header is a selector, not a credential.** Each frontend's `baseUrlInterceptor` stamps it; `AuthContext.fromHeader` is case-insensitive and returns `null` for blank/unknown. It only chooses which cookie to read — authority comes from the signed JWT, and a token whose `userType` disagrees with the header is rejected.
- **Why a header, not a URL prefix:** endpoints shared by both apps (`POST /booking`, `GET /booking/active`, `DELETE /booking/{uuid}`) receive **both** cookies from a user logged into both apps, and only the browser knows which UI sent the request. A "prefer staff" rule is wrong: a cashier buying their own ticket in the client tab would get a counter sale (`bookedBy`) instead of a client booking.
- **No service code branches on the context.** Client-vs-staff decisions key off the principal (`BookingService.buildBooking`'s `instanceof`, `validateBookingOwnership`, `CurrentUserService.loadCurrentUser`), so selecting the right cookie is enough.
- **`@CookieValue` can't be used for these cookies** — annotation values must be compile-time constants, and `AUTH_CONTEXT.accessTokenCookie()` isn't one. Auth controllers take `HttpServletRequest` and call `CookieUtil.readCookie(request, ...)`. Because `@CookieValue`'s implicit 400-when-missing is gone, `JwtSessionService.logout` guards both tokens itself. For an authenticated caller, logout is idempotent and still clears cookies (logout itself requires a valid access cookie and the CSRF header).
- **The CSRF header stays one shared name** (`X-XSRF-TOKEN`). Cookies needed splitting because the browser sends them automatically; a header is set per request by the app making it.
- **Renaming the cookies logs everyone out** — the stale cookies linger until they expire.

## API docs

springdoc (`springdoc-openapi-starter-webmvc-ui`) is configured from a custom `springdoc.base-url` (set by the profile files — see [configuration.md](configuration.md)): `swagger-ui.path` = `${springdoc.base-url}/swagger-ui.html`, `api-docs.path` = `${springdoc.base-url}/api-docs`. `SecurityConfig` `permitAll()`s only `<base-url>/**`.

- Keep both springdoc paths derived from the base URL — one set outside it falls back to 401.
- **Never let the base URL be empty**: the matcher would become `/**` and open every endpoint.
- `CinefyApiAuthorizationManager` can't open these itself: springdoc's handlers have no `@PublicApi`, and its static assets aren't handler methods at all.

## Encryption

`CredentialCipher` (AES-256-GCM, key `cinefy.encryption.key`) prepends a fresh IV per call and outputs `base64:base64`. It encrypts the whole `PaymentGateway.credentials` JSON blob (which is why that column is TEXT, not JSONB) and the stateless OAuth registration token.
