# Backend configuration

Config files live in `src/main/resources/`:

| File                    | Role                                                                                                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `application.yml`       | Base config for every profile: JPA/Envers settings, actuator health probes, defaulted TMDB/Paymob base URLs and cinema time zone, Redis repositories disabled (`spring.data.redis.repositories.enabled: false`) |
| `application-local.yml` | Dev profile. Gitignored, holds real secrets. A fill-in template is in [`cinefy-backend/README.md`](../../../cinefy-backend/README.md#configuration)                                                             |
| `application-prod.yml`  | Prod profile. Reads most values from environment variables; `cinefy.cookie.secure: true`, `same-site: Lax`, `cinefy.rate-limit-enabled: true` and `app.base-url: /api` are hard-coded                           |

## Required at startup

The app won't boot without these (injected with no code default):

- `cinefy.encryption.key` — Base64-encoded 32-byte AES key for `CredentialCipher` (payment-gateway credentials and the OAuth registration token). `CredentialCipher` throws at construction time if missing or wrong length.
- `cinefy.mail.username` / `cinefy.mail.password` — Gmail SMTP creds for the `JavaMailSender` bean in `AppConfig`.
- `cinefy.jwt.secret`, `cinefy.jwt.access-token-expiration`, `cinefy.jwt.refresh-token-expiration`, `cinefy.jwt.refresh-token-rotation-threshold` — JWT signing key + token lifetimes (read by `JwtUtil` / `AuthCookieResponseFactory` / `JwtSessionService`).
- `cinefy.cookie.secure`, `cinefy.cookie.same-site` — auth-cookie flags (read by `CookieUtil`). Cookie **names** are not configurable — they come from `AuthContext` (see [security.md](security.md#auth-contexts)).
- `cinefy.admin.email`, and the `cinefy.admin.password` key — the bootstrap admin account (`CinefyApplication`). The password may be empty: the seed is then skipped with a warning.
- `cinefy.otp.expiration-minutes` — OTP lifetime in **minutes**, read by `OtpService`. (Renamed from the older millisecond-valued `cinefy.otp.expiration`; a config that sets only the old key fails to start.)
- `cinefy.oauth.redirect-uri` — the OAuth callback **path** (e.g. `/membership/oauth/callback`), concatenated onto the client frontend URL. The provider redirects the browser to the **frontend**, not to a backend endpoint.
- `cinefy.oauth.google.client-id` / `client-secret`, `cinefy.oauth.microsoft.client-id` / `client-secret` — per-provider OAuth credentials. Empty values boot, but OAuth sign-in then fails.
- `cinefy.oauth.registration-token-expiration-minutes` — lifetime of the encrypted OAuth registration token issued to a first-time social sign-in.
- `springdoc.base-url` — base for Swagger UI and the OpenAPI JSON. `SecurityConfig` injects it with no default and `application.yml` doesn't set it; local sets `/docs`, prod uses `${API_DOCS_BASE_URL:/docs}`. See [security.md](security.md#api-docs) for why it must never be empty. Spring's `:/docs` fallback applies only when the variable is **absent**, not when it's set to an empty string, so `docker-compose.yml` and `docker-compose.local.yml` pass `${API_DOCS_BASE_URL:-/docs}` (the `:-` form also covers empty) — keep that guard on any compose file that forwards it. `.env.example` lists it with `/docs`.
- `cinefy.rate-limit-enabled` — read by `CinefyRateLimiter`; `false` makes `tryConsume` allow every request without touching Redis. `false` locally, `true` in prod.
- `app.tmdb.access-token` — TMDB bearer token read by `TmdbMovieService`.
- `spring.data.redis.default-ttl-minutes` — TTL `CacheService.add` applies when the caller passes a `null` TTL. A custom key inside Spring's Redis block (like `springdoc.base-url`); Boot's `RedisProperties` ignores it.

## Read at request time

`app.frontend.mgmt.url` and `app.frontend.client.url` are read lazily through `Environment.getProperty` in `AppConfig`, so a missing value doesn't stop startup — it breaks at request time. They are the two CORS origins (`SecurityConfig`); the client URL also builds the OAuth `redirect_uri` and the payment redirect and confirmation URLs.

## Defaults

- Defaulted in `application.yml`: `app.tmdb.api-base-url`, `app.tmdb.image-base-url` (TMDB v3), `app.paymob.api-base-url` (`https://accept.paymob.com`), `app.cinema-time-zone` (`${CINEMA_TIME_ZONE:Africa/Cairo}`).
- `app.cinema-time-zone` is the IANA zone that defines a calendar day. `DateUtil` (`utils/`) reads it in its constructor and is the only class that uses it; it's applied in Java only, never to the DB session. See [persistence.md](persistence.md#timestamps). Neither compose file forwards `CINEMA_TIME_ZONE`; add it to the backend's `environment` before overriding the default in a container.
- Defaulted only in `application-prod.yml` (env var with fallback): `ACCESS_TOKEN_EXPIRATION` (900000), `REFRESH_TOKEN_EXPIRATION` (604800000), `REFRESH_TOKEN_ROTATION_THRESHOLD` (172800000), `OTP_EXPIRATION_MINUTES` (10), `REGISTRATION_TOKEN_EXPIRATION_MINUTES` (15), `OAUTH_REDIRECT_URI` (`/membership/oauth/callback`), `API_DOCS_BASE_URL` (`/docs`), `CACHE_DEFAULT_TTL_MINUTES` (60), plus `TMDB_API_BASE_URL`, `TMDB_IMAGE_BASE_URL`, `PAYMOB_API_BASE_URL`. Of these, only `API_DOCS_BASE_URL` is listed in the repo-root `.env.example`.
- `ADMIN_PASSWORD` has no prod fallback, so the env var must exist in prod (it may be empty).

## Other settings

- `app.base-url` — empty locally, `/api` in prod (the nginx prefix). Only used to build the auth controllers' cookie path.
- `server.port` — unset in base/local (Spring's 8080); `SERVER_PORT` in prod.
- `server.forward-headers-strategy` — `native` in prod only, so Tomcat takes the client IP, scheme and host from nginx's `X-Forwarded-*` headers (`request.getRemoteAddr()` is the real caller, which the rate limiter keys on). Local has no proxy and leaves it unset.
- `spring.data.redis.url` — `redis://localhost:6379` with no credentials locally; prod builds `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}`, all without fallbacks. `REDIS_HOST` is `host:port`. Empty username/password send no `AUTH` (Spring turns blank credentials into none). A password with URL-reserved characters (`@ : / # ?`) must be percent-encoded.
- Actuator exposes only `health`, with liveness/readiness probes; readiness includes the DB check.
