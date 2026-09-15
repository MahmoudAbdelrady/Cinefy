# CLAUDE.md — cinefy-backend

## Code Style

- Always declare explicit access modifiers (`public`, `protected`, `private`) on every class, field, method, and constructor. Do not leave anything package-private.
- In DTO classes, separate each field with a blank line — never stack fields without spacing.
- For method ordering within a class (public API layout, helper grouping by role, mapper placement), follow [.claude/rules/file-methods-order.md](.claude/rules/file-methods-order.md) — check it at the start of each session.

## Required Configuration

The app won't boot without these (typically set in `application-local.properties` for dev):

- `cinefy.encryption.key` — Base64-encoded 32-byte AES key for `CredentialCipher` (payment-gateway credential encryption). `CredentialCipher` throws at construction time if missing or wrong length.
- `cinefy.mail.username` / `cinefy.mail.password` — Gmail SMTP creds for the `JavaMailSender` bean in `AppConfig`.
- `cinefy.jwt.secret`, `cinefy.jwt.access-token-expiration`, `cinefy.jwt.refresh-token-expiration`, `cinefy.jwt.refresh-token-rotation-threshold` — JWT signing key + token lifetimes (read by `JwtUtil` / `AuthCookieResponseFactory` / `JwtSessionService`).
- `cinefy.cookie.secure`, `cinefy.cookie.same-site` — auth-cookie flags (read by `CookieUtil`). Cookie **names** are not configurable — they come from `AuthContext` (see _Auth contexts_).
- `cinefy.admin.email` (required), `cinefy.admin.password` (optional — the admin seed is skipped with a warning if empty) — bootstrap admin account (`CinefyApplication`).
- `cinefy.otp.expiration-minutes` — OTP lifetime in **minutes**, read by `OtpService`. No default in `application.properties`, so the app won't boot without it. (Renamed from the older millisecond-valued `cinefy.otp.expiration`; a deployment still setting the old key fails to start.)
- `cinefy.oauth.redirect-uri` — the OAuth callback **path** (e.g. `/membership/oauth/callback`), concatenated onto `AppConfig.getFrontendClientUrl()`. The provider redirects the browser to the **frontend**, not to a backend endpoint.
- `cinefy.oauth.google.client-id` / `cinefy.oauth.google.client-secret`, `cinefy.oauth.microsoft.client-id` / `cinefy.oauth.microsoft.client-secret` — per-provider OAuth credentials.
- `cinefy.oauth.registration-token-expiration-minutes` — lifetime of the encrypted OAuth registration token issued to a first-time social sign-in.
- `app.frontend.mgmt.url`, `app.frontend.client.url` — the two allowed CORS origins (management + client), read by `SecurityConfig` into a CORS allow-list of both.
- `app.tmdb.api-base-url`, `app.tmdb.image-base-url` — defaulted in `application.properties` to TMDB v3; the TMDB bearer token `app.tmdb.access-token` is read by `TmdbMovieService`.
- `app.paymob.api-base-url` — defaulted in `application.properties` to `https://accept.paymob.com`.

## Stack

- **Spring Boot 4.0.5**, Java 25, Maven
- **PostgreSQL** (runtime), Hibernate with `hibernate.ddl-auto=update`
- **Lombok** for boilerplate (`@Getter`, `@Setter`, `@RequiredArgsConstructor`)
- **Hibernate Envers** for entity auditing (all entities via `BaseEntity`); configured with `store_data_at_delete=true` and `global_with_modified_flag=true`
- **Jakarta Validation** for request DTOs
- **commons-lang3** for string utilities (`StringUtils`)
- **Spring Security** — wired in `SecurityConfig` (Spring's built-in CSRF off, replaced by a custom double-submit token; CORS allow-list of both `app.frontend.mgmt.url` and `app.frontend.client.url`; stateless sessions; `@EnableMethodSecurity`). Authentication is JWT-in-cookie, **partitioned per frontend by `AuthContext`** (see _Auth contexts_ below): `JwtAuthenticationFilter` resolves the caller's context from the `X-Auth-Context` header, reads that context's access-token cookie (`mgmt_accessToken` / `client_accessToken`), validates it (with an `InvalidJwtService` blocklist check), verifies the token's `userType` claim matches the context, and populates a `UserPrincipal`; a `CsrfValidationFilter` (after `UsernamePasswordAuthenticationFilter`) enforces a double-submit CSRF token (the context's `mgmt_XSRF-TOKEN` / `client_XSRF-TOKEN` cookie vs. the shared `X-XSRF-TOKEN` header) for authenticated non-safe, non-`@PublicApi` requests (`CsrfProtectionMatcher`). `CinefyApiAuthorizationManager` gates `anyRequest()` — every endpoint requires an authenticated user **unless** the controller/handler is annotated `@PublicApi` (e.g. login, forgot-password). Position/role authorization is enforced per-endpoint via `@PreAuthorize("hasAnyRole(...)")` on controllers (roles map to the `StaffPosition` enum — ADMIN/MANAGER/CASHIER/USHER — plus the `CLIENT` role for client users). There are **two** `DaoAuthenticationProvider`-backed managers (a `CinefyAuthManagers` bean): one over `StaffMemberService`, one over `ClientService`, both with `BCryptPasswordEncoder`.
- **Spring Mail + Thymeleaf** — `EmailService` sends email-verification and password-reset OTP emails (`sendEmailVerificationOtp` / `sendPasswordResetOtp`); mail bean wired in `AppConfig`.
- **Scheduling** — `@EnableScheduling` on `CinefyApplication`; jobs live under `job/`: `ShowtimeStatusJob` (cron `0 * * * * *`), `TmdbSyncJob` (cron `0 0 3 * * *`), `BookingCleanupJob` (cron `0 * * * * *`), `OtpCleanupJob` (cron `0 0 3 * * *`), `InvalidJwtCleanupJob` (cron `0 0 3 * * *`)
- **AOP** — `RequestLoggingAspect` (around any `@RestController`) and `TransactionLoggingAspect` (around any `@Transactional`) under `aspect/`, both delegating to `LoggingUtil`
- **TMDB integration** — `TmdbMovieService` calls TheMovieDB via `RestClient` (`app.tmdb.api-base-url`), caches results in the local `TmdbMovie` table
- **Paymob integration** — `PaymobClient` under `shared/payment/` is a full Unified Checkout client over `RestClient` (`app.paymob.api-base-url`): `createIntention`, `getUnifiedCheckoutUrl`, `pay` (saved-card charge via `source.subtype = TOKEN`), `refund` (tries **void** first, falls back to **refund**), `parseRedirect` (flat browser query params), `parseCallback` (webhook JSON → the sealed `PaymentCallbackData`: `TRANSACTION` → `TransactionCallbackDTO`, else `CardTokenCallbackDTO`), plus the config-time `resolveCredentials` / `readPublicCredentials` / `validateChannelConfig`. Every inbound payload is **HMAC-SHA512 verified** over an ordered field concatenation compared with `MessageDigest.isEqual`; a mismatch throws `BusinessException("Invalid payment signature")`. `PaymentService` sits above it and owns the booking-facing flow (`createCheckout`, `payWithSavedCard`, `refundTransaction`, `handleCallback`, `handleRedirect`); `ClientPaymentMethodService` persists tokenized cards.

  **Every secret-taking `PaymobClient` method takes `GatewayProviderCredentials`, never a raw key string** — it casts to `PaymobGateway.Credentials` on the first line of the body. That keeps `PaymobGateway.*` types out of `PaymentService`, so a second provider only needs a new spec + client, not changes at the call sites. `createIntention` also takes the gateway's `List<PaymentGatewayChannel<?>>` and derives `currency` + `payment_methods` from the **active** channels itself (private `readChannelCurrency` / `readIntegrationIds`); those two fields are absent from `PaymobIntentionRequestDTO` and are injected into the JSON body at send time via `objectMapper.valueToTree`. A gateway whose active channels disagree on currency throws — one intention carries exactly one currency.

- **OAuth2 social sign-in (client app only)** — `shared/oauth/` holds an abstract `OAuthProviderClient` over `RestClient` with two `@Component` subclasses, `GoogleOAuthClient` and `MicrosoftOAuthClient`; `OAuthProviderClientFactory.getClient(OAuthProvider)` resolves between them with an exhaustive `switch` (no `default`, so a new enum constant breaks the build until handled). The base class owns the CSRF-style `state` handshake, the `oauthState` cookie constants, and the 5s/10s connect/read timeouts; subclasses supply only endpoints, scopes, and the provider's JSON field names. Google additionally **requires `email_verified`**; Microsoft reads `mail` with a `userPrincipalName` fallback. JSON is parsed with `tools.jackson.databind.JsonNode` (**Jackson 3**).

- **Credential encryption** — `CredentialCipher` under `shared/security/` (AES-256-GCM); requires `cinefy.encryption.key` (Base64 of 32 bytes). Encrypts the `PaymentGateway.credentials` JSON blob before persisting.
- **libphonenumber** (Google) — phone validation/normalization for `StaffMember` and `Client`
- `@EnableJpaAuditing`, `@EnableScheduling`, `@EnableAsync`, and `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)` on `CinefyApplication`

## Package Structure

```
com.mdevs.cinefy
├── config/
│   ├── database/   — CinefyTableNamingStrategy
│   └── general/    — AppConfig (mail, env, password encoder), SecurityConfig (CORS + filter chain)
├── controller/     — REST controllers (@RestController)
│                     Hall, Showtime, StaffMember, PaymentGateway, TmdbMovie,
│                     ManagementAuth, Booking, Client, ClientAuth, Statistics
├── filter/         — JwtAuthenticationFilter (context-scoped cookie JWT → SecurityContext),
│                     CsrfValidationFilter (context-scoped double-submit CSRF check)
├── dto/            — Request/response DTOs, grouped per domain.
│                     `RedirectionDTO` (a bare `record RedirectionDTO(String url)`) sits at the
│                     top level, not under a domain folder — it is shared by the Paymob checkout
│                     redirect and the OAuth authorization-url response (renamed from the former
│                     `payment/PaymentRedirectionDTO`).
│   ├── hall/       — HallDTO, HallDetailDTO, HallLayoutDTO, HallSummaryDTO,
│   │                  HallReferenceDTO, HallTypeDTO, HallLayout (JSONB payload record),
│   │                  SeatLayoutDTO, TicketPricingDTO, HallStatusCountProjection
│   ├── movie/      — MovieBaseDTO, MovieSummaryDTO, MovieSearchResultDTO, MovieDetailDTO,
│   │                  MovieCredits, HighlightedMovieDTO, NowShowingMovieDTO, UpcomingMovieDTO,
│   │                  HighlightRequestDTO, AnnouncementRequestDTO,
│   │                  MovieWithCommittedShowtimeProjection, NowShowingProjection
│   ├── showtime/   — ShowtimeDTO, ShowtimeSummaryDTO, MovieShowtimesDTO,
│   │                  MovieShowtimeDatesDTO, MovieShowtimeListItemDTO,
│   │                  MovieShowtimeCountProjection, MovieWithShowtimesDTO,
│   │                  ShowtimesStatisticsDTO, PublishShowtimesDTO,
│   │                  BookingShowtimeDTO, HallTypeShowtimesDTO, ScheduledShowtimeDTO,
│   │                  ShowtimeBookedSeatsProjection, ShowtimeBookingCountsProjection
│   ├── booking/    — SeatSelectionDTO, ActiveBookingDTO, BookingRequestDTO,
│   │                  BookingDetailDTO, BookingSummaryDTO, BookedSeatDTO,
│   │                  BookingConfirmationDTO, OnSitePaymentDTO
│   ├── staff/      — StaffMemberDTO, StaffMemberDetailDTO, StaffMemberSummaryDTO,
│   │                  PositionCoverageDTO, PositionCoverageItemDTO, PositionCoverageProjection,
│   │                  OnShiftSummaryDTO,
│   │                  CurrentStaffMemberDTO, UpdateProfileDTO, ChangePasswordDTO (self-service /staff/me)
│   ├── client/     — CurrentClientDTO, SignUpDTO
│   ├── payment/    — PaymentGatewayDTO, PaymentGatewaySummaryDTO, PaymentGatewayListDTO,
│   │                  PaymentGatewayStatusRequestDTO, PaymentGatewayChannel,
│   │                  GatewayProviderSpec, GatewayProviderCredentials,
│   │                  GatewayProviderChannelConfig, PaymobGateway (the Paymob spec),
│   │                  PaymentCallbackData (sealed interface, permits the two below),
│   │                  TransactionCallbackDTO, CardTokenCallbackDTO,
│   │                  SavedCardPaymentDTO, ClientPaymentMethodDTO,
│   │                  PaymobIntentionDTO, PaymobIntentionRequestDTO, PaymobPayResponseDTO
│   ├── statistics/ — DateRangeDTO (the shared ?from=&to= query DTO),
│   │                  StatisticsSummaryDTO, StatisticsPeriodTotalsDTO,
│   │                  SalesPointDTO, MoviePerformanceDTO,
│   │                  RevenueProjection, TicketsSoldProjection, HallPeriodProjection,
│   │                  DailyRevenueProjection, DailyTicketsSoldProjection, DailyHallProjection,
│   │                  MovieRevenueProjection, MovieTicketsSoldProjection, MovieHallProjection
│   └── auth/       — LoginDTO, ForgotPasswordDTO, OtpCodeDTO, SendOtpDTO,
│                      OAuthCallbackDTO, OAuthCallbackResultDTO, OAuthRegistrationDTO,
│                      OAuthSignUpDTO,
│                      ResetPasswordDTO, TokenPairDTO
├── entity/         — JPA entities (@Entity / @MappedSuperclass)
│                     Hall, HallType, Showtime, TmdbMovie, Booking, BookingSeat,
│                     User (MappedSuperclass), StaffMember, Client, PaymentGateway,
│                     ClientPaymentMethod, InvalidJwt, Otp
│   └── enums/      — domain enums (all enums live here, not beside their entity)
│                     HallStatus, SeatCategory, ShowtimeStatus, BookingStatus, PaymentState,
│                     StaffPosition, EmploymentType, PaymentProvider, UserType, OtpType
├── repository/     — Spring Data JPA repositories (extend BaseRepository)
├── service/        — Business logic (HallService, ShowtimeService, StaffMemberService,
│                     PaymentGatewayService, TmdbMovieService, ManagementAuthService,
│                     BookingService, PaymentService, ClientPaymentMethodService,
│                     ClientService, ClientAuthService, CurrentUserService,
│                     JwtSessionService, OtpService, EmailService, InvalidJwtService,
│                     StatisticsService)
├── aspect/         — RequestLoggingAspect, TransactionLoggingAspect
├── job/            — Scheduled jobs: ShowtimeStatusJob, TmdbSyncJob,
│                     BookingCleanupJob, OtpCleanupJob, InvalidJwtCleanupJob
├── shared/
│   ├── annotation/ — @PublicApi (marks endpoints that skip authentication)
│   ├── exception/  — Global @RestControllerAdvice (CinefyExceptionHandler) + CinefyExceptionResponse
│   │                 + exception types under types/ (Business, Conflict, NotFound, Forbidden, Unauthorized) + ErrorCode
│   ├── oauth/      — OAuthProviderClient (abstract base), GoogleOAuthClient,
│   │                  MicrosoftOAuthClient, OAuthProviderClientFactory,
│   │                  OAuthState, OAuthAuthorizationDTO, OAuthUserProfile,
│   │                  OAuthRegistrationToken
│   ├── payment/    — PaymobClient (RestClient client for the Paymob Unified Checkout API)
│   ├── security/   — JwtUtil, JwtClaims, TokenType, UserPrincipal, SecurityUtil, AuthContext,
│   │                 CinefyApiAuthorizationManager, CinefyAuthenticationEntryPoint,
│   │                 CinefyAuthManagers, AuthCookieResponseFactory, CsrfProtectionMatcher,
│   │                 CredentialCipher (AES-256-GCM for payment secrets)
│   └── validation/ — ValidationPatterns (shared regex constants for DTO @Pattern)
└── utils/          — ExceptionResponseMaker, LoggingUtil, CookieUtil
```

## Key Patterns

### BaseEntity

All entities extend `BaseEntity` which provides:

- `id` (Long) — DB primary key, `@GeneratedValue(IDENTITY)`
- `uuid` (String) — API-facing identifier, auto-generated in `@PrePersist`
- `version` (long) — optimistic locking via `@Version`
- `createdAt`, `updatedAt` — JPA auditing timestamps
- `@Audited` — Hibernate Envers on all entities

**`id` vs `uuid` for lookups:** use `uuid` only when the identifier comes from outside the server (e.g., path variables, request bodies, any API input) — that's the only place the caller can't know the DB id. Once you already have an entity in hand, pass its `id` to repository/service helpers, not its `uuid`. Using `uuid` internally adds a pointless string-indexed lookup when the entity (and its `id`) are already loaded.

### BaseRepository

All repositories extend `BaseRepository<T extends BaseEntity>` which extends `JpaRepository<T, Long>`. Adds a `default T findOne(Long id)` convenience.

`TmdbMovieRepository` is the one exception: `TmdbMovie` uses its TMDB id as the primary key (no UUID, no audit columns, no `BaseEntity`), so the repository extends `JpaRepository<TmdbMovie, Long>` directly.

`HallRepository` uses a dedicated `findByUuidWithType` (`JOIN FETCH h.type`) and `JOIN FETCH h.type` in `findAllFiltered` (an **unpaged** `List<Hall>` query filtered by `excludeHallId` / `statuses`) to avoid N+1 on the `type` association. (The former seat/price collections are gone — `Hall.layout` and `Hall.categoryPrices` are JSONB columns loaded with the row, so there's nothing else to fetch.) Apply the same `JOIN FETCH` pattern when adding new finders that need the `type`.

### Entity Code Pattern

Entities with user-facing names (Hall, HallType) derive a `code` field via a static `toCode(String name)` method (lowercased, spaces → underscores). Used for uniqueness checks (`existsByCode` / `existsByCodeAndIdNot`).

### DTOs

- **Input DTOs** (e.g., `HallDTO`) — use Jakarta Validation annotations (`@NotBlank`, `@NotNull`, `@Min`, `@Valid`)
- **Output DTOs** — separate classes per use case:
  - `*SummaryDTO` — list/table views
  - `*DetailDTO` — full entity details
  - `*LayoutDTO` — domain-specific projections
- **Class vs. record** is decided by binding/mutability needs, not a blanket ban:
  - Use a Lombok `@Getter`/`@Setter` class when the DTO is deserialized by Jackson (request bodies), carries Bean Validation annotations, or is populated field-by-field with setters in a service mapper. This covers all input DTOs and the large `*SummaryDTO`/`*DetailDTO`/`*LayoutDTO` outputs.
  - Use a `record` for small, immutable, read-only projections constructed in one shot (e.g. `CurrentStaffMemberDTO`, `TokenPairDTO`, `*Projection`).
- Procedural validation in services for business rules beyond annotation capabilities

### Controller Conventions

- `@RestController` with `@RequestMapping("/resource")`
- Constructor injection via `@RequiredArgsConstructor`
- Input DTOs validated with `@Valid @RequestBody`
- Returns `ResponseEntity<T>` with explicit status codes
- UUID used as path variable for entity lookup (never the DB `id`)

### Service Conventions

- `@Service` with `@RequiredArgsConstructor`
- `@Transactional` on mutating methods only
- Private `find*` helpers throw `NotFoundException`
- Private `validate*` helpers throw `BusinessException`
- Entity-to-DTO mapping done in private helper methods within the service (no separate mapper layer)

**Where a domain predicate lives.** Put it on the entity when the entity holds every value it needs — `Booking.hasExpired()` compares its own stored `expiresAt`, so it belongs there. Put it with the policy owner when an external threshold has to be supplied: bookability depends on `BOOKING_CUTOFF_MINUTES`, which is booking policy, so it's `BookingService.isBookable(Showtime)` (a `public static`) rather than a method on `Showtime` taking a cutoff parameter. Parameterizing the entity method looks like decoupling but isn't — every caller would still have to reach into `BookingService` for the number.

`ShowtimeService` calls `BookingService.isBookable(showtime)` when mapping `bookable` onto `MovieShowtimeListItemDTO` / `ShowtimeSummaryDTO`. Note the same rule is _also_ expressed in SQL (`findDistinctBookableShowtimeDates`, `findBookableByMovieAndDateRangeWithHall` take a `cutOffDate` param) — if you change the rule, both the Java predicate and those queries have to move together.

### Exception Handling

Global `@RestControllerAdvice` in `CinefyExceptionHandler`:

- `BusinessException` → 400 (carries an optional `ErrorCode`: `OTP_INVALID`, `PASSWORD_REUSED`, `PASSWORD_INCORRECT`, `ACCOUNT_NOT_VERIFIED`, `PAYMENT_NOT_ATTEMPTED` — surfaced to the frontend as a JSON `errorCode`). Add an `ErrorCode` only when the frontend must branch on _which_ 400 it got; otherwise the message alone is enough.
- `NotFoundException` → 404
- `ConflictException` → 409 (same shape as `BusinessException`, optional `ErrorCode`). Thrown **only** from inside a `catch (DataIntegrityViolationException)` — i.e. a constraint the DB actually rejected, not a pre-check. An `existsBy*` pre-check that fails is ordinary validation and stays a `BusinessException` → 400.
- `DataIntegrityViolationException` → 409 `"A record with the same unique value already exists"`
- `UnauthorizedException` / `AuthenticationException` / `JwtException` → 401
- `ForbiddenException` / `AuthorizationDeniedException` → 403. `ForbiddenException` carries an optional `ErrorCode` **and an optional `Object data`** payload (3-arg constructor), serialized as `data` on the response — the OAuth callback uses `Map.of("email", ...)` with `ACCOUNT_NOT_VERIFIED` so the frontend can prefill its OTP screen.
- `BindException` / `ConstraintViolationException` → 400 with field-level errors.
  The handler is registered on `BindException` (not its subclass `MethodArgumentNotValidException`)
  so it covers **both** `@Valid @RequestBody` and `@Valid @ModelAttribute` query-param binding —
  the latter throws the superclass, and would otherwise fall through to the generic 500.
- Generic `Exception` → 500 (message hidden in production)

Responses use the `CinefyExceptionResponse` record.

### Scheduled Jobs

Under `job/`:

- **`ShowtimeStatusJob`** — cron `0 * * * * *` (every minute); calls `ShowtimeRepository.markRunningAsOf(now)` / `markFinishedAsOf(now)` to advance `Showtime.status` based on `startDateTime` / `endDateTime`.
- **`TmdbSyncJob`** — cron `0 0 3 * * *` (daily 03:00); deletes orphan `TmdbMovie` rows that no `Showtime` references, then refreshes the rest in batches of 50 against the TMDB API.
- **`BookingCleanupJob`** — cron `0 * * * * *`; delegates to `BookingService.deleteExpiredPendingBatch(cutOffDate, batchSize)` to release holds whose `expiresAt` has passed.
- **`OtpCleanupJob`** / **`InvalidJwtCleanupJob`** — cron `0 0 3 * * *`; prune expired OTPs and blocklisted JWTs.

When adding a new scheduled job: place it under `job/`, use `@Slf4j` + `@Scheduled`, and inject repositories/services through `@RequiredArgsConstructor`.

### Logging Aspects

- `RequestLoggingAspect` — pointcut `within(@RestController *)`; logs `(METHOD) Request URI: ...` around every controller call.
- `TransactionLoggingAspect` — pointcut `@annotation(...Transactional)`; logs `Transaction with method: Class.method` around every `@Transactional` invocation.

Both delegate to `LoggingUtil.proceedWithLogging(...)`. Don't add ad-hoc `log.info(...)` around controller/transaction entry points — the aspects already cover that.

### Security & Encryption

- `SecurityConfig` builds the `SecurityFilterChain`: Spring's built-in CSRF off (replaced by the `CsrfValidationFilter` double-submit check), CORS allow-list bound to `AppConfig.getFrontendManagementUrl()` + `getFrontendClientUrl()`, stateless sessions, `@EnableMethodSecurity`, a custom `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter` (and `CsrfValidationFilter` after it), and `anyRequest().access(apiAuthorizationManager)`.
- `CinefyApiAuthorizationManager` (`AuthorizationManager<RequestAuthorizationContext>`) resolves the target handler and allows the request when it (or its controller) carries `@PublicApi`; otherwise it requires a non-anonymous authenticated principal. Mark new unauthenticated endpoints with `@PublicApi`.
- `JwtAuthenticationFilter` resolves the `AuthContext` from the `X-Auth-Context` header, extracts the access token from **that context's** cookie, parses it via `JwtUtil`, skips blocklisted tokens (`InvalidJwtService`), checks the token's `userType` claim against the context, and sets a `UserPrincipal` authentication. **No header (or an unknown value) means no authentication** — the filter continues the chain unauthenticated, exactly as it does for a missing cookie, so `@PublicApi` endpoints still work and protected ones 401 at `CinefyApiAuthorizationManager`. Auth cookies also include the context's refresh and CSRF cookies (all built by `AuthCookieResponseFactory`). Auth is stateless — no server session.

### Auth contexts (per-frontend cookie partitioning)

Both frontends run on the same host, so a single set of cookie names at path `/` meant logging into one app silently overwrote the other's session (the second login's token replaced the first, and the original tab then got **403** — a valid token carrying the wrong role). `AuthContext` (`shared/security/`) fixes this by giving each frontend its own cookie names:

| Context      | Prefix   | Access               | Refresh               | CSRF                | Expected `UserType` |
| ------------ | -------- | -------------------- | --------------------- | ------------------- | ------------------- |
| `MANAGEMENT` | `mgmt`   | `mgmt_accessToken`   | `mgmt_refreshToken`   | `mgmt_XSRF-TOKEN`   | `STAFF_MEMBER`      |
| `CLIENT`     | `client` | `client_accessToken` | `client_refreshToken` | `client_XSRF-TOKEN` | `CLIENT`            |

**`AuthContext` is the single source of truth for cookie names** — build them with `accessTokenCookie()` / `refreshTokenCookie()` / `csrfTokenCookie()`, never by writing a literal. `CookieUtil` stays a dumb builder taking a plain `String name`; callers that hold a context resolve the name and pass it.

**The `X-Auth-Context` header is a selector, not a credential.** Each frontend's `baseUrlInterceptor` stamps it (`management` / `client`) on every request; `AuthContext.fromHeader` is case-insensitive and returns `null` for blank/unknown. It only chooses _which cookie to read_ — all authority still comes from the signed JWT, and the filter additionally rejects a token whose `userType` disagrees with the header. A client sending `X-Auth-Context: management` just causes a lookup for a cookie they don't have.

**Why a header and not a URL prefix.** On endpoints shared by both apps (`POST /booking`, `GET /booking/active`, `DELETE /booking/{uuid}` — all `CLIENT`+staff), a user logged into both sends _both_ cookies, and nothing server-side can tell which UI the request came from. A precedence rule ("prefer staff") is wrong: a cashier buying their own ticket in the client tab would have the booking written as a counter sale (`bookedBy` instead of `client`). That fact lives only in the browser, so it must be transmitted.

**No service-layer code branches on the context.** Every client-vs-staff decision already keys off the principal — `BookingService.buildBooking` (`instanceof Client` / `instanceof StaffMember`), `getActiveBookings`, `validateBookingOwnership` (`currentUser.getType()`), `CurrentUserService.loadCurrentUser`. Selecting the right cookie is therefore sufficient to make all of them correct.

**`@CookieValue` cannot be used for these cookies.** Annotation values must be Java _compile-time constants_, and `AUTH_CONTEXT.accessTokenCookie()` is not one even as a `static final` field. The auth controllers therefore take `HttpServletRequest` and call `CookieUtil.readCookie(request, AUTH_CONTEXT.refreshTokenCookie())` inline. One consequence: `@CookieValue`'s implicit 400-when-missing is gone, so `JwtSessionService.logout` guards both tokens for emptiness — logout is now idempotent and still clears cookies when called without them.

**The CSRF _header_ stays a single shared name** (`X-XSRF-TOKEN`). Cookies needed splitting because they are ambient — the browser stores them and sends them automatically. A request header is set per-request by the app making the call, so there is no shared store to collide in.

**Renaming the cookies invalidates every existing session.** Anyone holding the old `accessToken`/`XSRF-TOKEN` is silently logged out, and the stale cookies linger until they expire.

- Endpoint authorization uses `@PreAuthorize("hasAnyRole(...)")` on controllers, keyed to `StaffPosition` (`ADMIN`, `MANAGER`, `CASHIER`, `USHER`) plus the `CLIENT` role for client-facing endpoints. When adding an endpoint, put the role rule on the controller method/class (not the service) to match the existing pattern. `CinefyAuthenticationEntryPoint` returns the 401 body for unauthenticated requests.
- `BCryptPasswordEncoder` bean (in `AppConfig`) — used by `StaffMemberService` when storing/updating `password`.
- `CredentialCipher` (AES-256-GCM, `cinefy.encryption.key` required, Base64-encoded 32-byte key) — encrypts the whole `PaymentGateway.credentials` JSON blob at rest (for Paymob: `secretKey`, `publicKey`, `hmacKey`). The cipher output prepends a fresh IV per call and tags the value with the GCM authentication tag. Its `base64:base64` output is why `credentials` is a **TEXT** column, not JSONB.

### Admin Account Policy

The `ADMIN` `StaffMember` (the bootstrap account seeded by `ensureAdminExists`) is invisible and untouchable to everyone but itself. Enforce both rules whenever you add an endpoint or query that reads or writes staff members:

- **Not editable by anyone — including the admin itself.** Any mutation targeting an `ADMIN` row must throw `ForbiddenException` (403). Reuse `StaffMemberService.validateNotAdminAccount(...)` — call it at **every** staff-mutation entry point (currently `updateStaffMember`, `deleteStaffMember`, `updateProfile`, `changePassword`, and `updatePassword`), not just the ones reachable today. The guard belongs at the mutation site so the invariant doesn't depend on an upstream caller's check. `forgotPassword` additionally skips an admin target early (no OTP, no email), so the reset-password chain can't reach an admin — but `updatePassword` still guards independently as defense-in-depth.
- **Not viewable or retrievable by anyone except the admin itself.** A `MANAGER` (otherwise privileged) must **not** be able to view the admin's details. `validateCanViewStaffMember(StaffMember)` loads the target first, then: if the target is `ADMIN`, only the admin themselves may view it; otherwise admin/manager/self may view. List/aggregate queries exclude the admin at the SQL level (`findAllFiltered` has `WHERE s.position != 'ADMIN'`; `getPositionCoverage` excludes `ADMIN` from totals) — apply the same exclusion to any new staff-listing query.

When adding a new read of a single staff member, fetch the entity first and pass it to `validateCanViewStaffMember` (don't validate by uuid alone — the rule depends on the _target's_ position).

### Staff Position Hierarchy (manager tier)

Authority is tiered: `ADMIN` > `MANAGER` > `CASHIER`/`USHER`. A `MANAGER` may manage staff **below** them (cashiers/ushers) but **not** the manager tier — only an `ADMIN` can create, edit, delete, promote-to, or demote-from `MANAGER`.

- Enforced by `StaffMemberService.validateCanManageManagerTier(currentPosition, resultingPosition)`, called from `createStaffMember` (resulting only), `updateStaffMember` (current + resulting), and `deleteStaffMember` (current only). It throws `ForbiddenException` (403) when a non-admin caller touches a row whose **current** or **resulting** position is `MANAGER`.
- Covering both current and resulting position is what closes the backdoors: a manager can't promote a cashier to manager (resulting = MANAGER), can't edit a peer manager (current = MANAGER), and can't demote a peer to hide the change (current = MANAGER). Self-edits via `/staff/me` (`updateProfile`) are unaffected — a manager may still edit their own name/phone.
- When adding any new staff mutation, decide whether it can change or target the manager tier and call `validateCanManageManagerTier(...)` accordingly, passing the pre-mutation position as `currentPosition` (capture it before `populateFromDto` overwrites it).

### Naming Strategy

`CinefyTableNamingStrategy` maps:

- Entity names → `UPPER_PLURAL` table names
- camelCase fields → `UPPER_SNAKE_CASE` columns
- Audit tables use `_REVISIONS` suffix

### Relationships

- `CascadeType.ALL` + `orphanRemoval = true` on parent-owned collections (e.g. `Booking.seats → Set<BookingSeat>`)
- `FetchType.LAZY` on all `@ManyToOne` associations
- JPA entity **association** collections use `Set`, not `List`. (JSONB-mapped layout data is the exception — `Hall.layout` holds `Map<SeatCategory, List<String>>` and `Hall.categoryPrices` is a `Map<SeatCategory, BigDecimal>` — those aren't associations, they're serialized columns.)

## Current Domain

```
Hall
 ├── name, code (unique, derived)
 ├── totalRows, totalColumns
 ├── status (HallStatus enum)
 ├── type → HallType (ManyToOne)
 ├── supports3D
 ├── layout → HallLayout (JSONB: Map<SeatCategory, List<String>> categories + List<String> onSiteOnly)
 ├── categoryPrices → Map<SeatCategory, BigDecimal> (JSONB)
 └── getCapacity() → totalRows * totalColumns − (# AISLE positions in layout)

TmdbMovie  (NOT a BaseEntity — TMDB id is the @Id; no UUID, no audit)
 ├── id (Long, from TMDB)
 ├── title, synopsis, genres, contentRating
 ├── releaseDate, durationMinutes
 ├── posterUrl, backdropUrl
 ├── credits (MovieCredits, JSONB), trailerUrl
 ├── isAnnounced (default false), isHighlighted (default false)
 └── lastSyncedAt (refreshed by TmdbSyncJob)

Showtime
 ├── startDateTime, endDateTime (TIMESTAMP(0))
 ├── hall → Hall (ManyToOne)
 ├── tmdbMovie → TmdbMovie (ManyToOne)
 ├── specialNotes
 ├── is3D
 └── status (ShowtimeStatus enum, default DRAFT)

Booking
 ├── showtime → Showtime (ManyToOne), hall → Hall (ManyToOne)
 ├── hallName, hallType (denormalized snapshots)
 ├── client → Client (ManyToOne, nullable), bookedBy → StaffMember (ManyToOne, nullable)
 ├── seats → Set<BookingSeat> (OneToMany, cascade ALL, orphanRemoval)
 ├── idempotencyKey (unique), bookingReference (unique)
 ├── totalAmount (BigDecimal 10/2, nullable=false — the booking's own total, written
 │     the moment seats are established; NOT a gateway fact, so on-site bookings that
 │     never touch a gateway still have it. Read by the confirmation/summary mappers
 │     and by PaymentService when charging, so the gateway can't be charged a
 │     different number than the UI showed.)
 ├── status (BookingStatus enum, nullable — null while on-hold, PENDING_PAYMENT once
 │     a checkout starts, CONFIRMED/REFUNDED once settled)
 ├── paymentGateway → PaymentGateway (ManyToOne LAZY, nullable — on-site bookings
 │     never touch a gateway, so it stays null for them)
 ├── paymentTransactionId (unique, nullable)
 ├── onHold (Boolean, default true), expiresAt
 ├── ticketToken (unique), ticketUsed (boolean, default false)
 ├── helpers: hasExpired([asOf]), isActiveHold([asOf])
 └── unique (CLIENT_ID, SHOWTIME_ID, ON_HOLD)
      — settling sets onHold = null, and Postgres treats NULLs as distinct, so a
        settled booking frees the slot for a new hold on the same showtime.

ClientPaymentMethod   (a client's saved card, created from a Paymob token webhook)
 ├── client → Client (ManyToOne LAZY, optional=false)
 ├── token (unique, nullable=false)
 ├── maskedPan (nullable=false)
 └── cardBrand (nullable=false)

BookingSeat
 ├── booking → Booking (ManyToOne), showtime → Showtime (ManyToOne)
 ├── position, category (SeatCategory enum)
 ├── ticketPrice (BigDecimal, 10/2)
 ├── active (Boolean, default true — released seats set active=null)
 └── unique (SHOWTIME_ID, POSITION, ACTIVE) — partial-uniqueness over live seats

User (@MappedSuperclass — abstract; no table)
 ├── firstName, lastName, fullName (derived)
 ├── email (unique), phoneNumber (unique; digits only — frontend owns the +)
 └── password (bcrypt-hashed, NULLABLE — OAuth-registered clients never get one)

StaffMember extends User
 ├── position (StaffPosition enum)
 ├── employmentType (EmploymentType enum)
 ├── workingDayStart, workingDayEnd (java.time.DayOfWeek)
 └── workingHourStart, workingHourEnd (LocalTime)

Client extends User
 ├── isVerified (boolean, default false)
 └── hasPassword() — helper, not a column; drives "set password" vs "change password"

PaymentGateway   (one configured provider account; at most one is `active` at a time)
 ├── name, code (derived via static toCode(name) — the Hall pattern; unique only
 │     among non-deleted rows, enforced by a partial index, not a column constraint)
 ├── provider (PaymentProvider enum — currently PAYMOB only)
 ├── active (boolean, default false — the field is `active`, NOT `isActive`,
 │     so Lombok/Jackson emit exactly one JSON property)
 ├── credentials (TEXT, nullable=false — the provider's credential record serialized
 │     to JSON then AES-encrypted whole by CredentialCipher. TEXT and not JSONB
 │     because the cipher emits `base64:base64`, which Postgres rejects as JSONB.)
 ├── paymentChannels (JSONB, nullable — plaintext List<PaymentGatewayChannel<?>>;
 │     each channel is { name, currency, active, providerConfig })
 └── deletedAt (nullable — soft-delete marker; rows are never physically removed,
       so bookings keep a valid FK and old transactions stay refundable)

Enums:
  HallStatus:              SCHEDULED | ACTIVE | INACTIVE | UNDER_MAINTENANCE
  SeatCategory:            NORMAL | VIP | AISLE
  ShowtimeStatus:          DRAFT | PUBLISHED | RUNNING | FINISHED
                           (+ static sets: ACTIVE_STATUSES={DRAFT,PUBLISHED},
                            COMMITTED_STATUSES={PUBLISHED,RUNNING}, LIVE_STATUSES={DRAFT,PUBLISHED,RUNNING},
                            REPORTABLE_STATUSES={PUBLISHED,RUNNING,FINISHED} — every status except
                            DRAFT; used by all statistics queries. NOT interchangeable with
                            COMMITTED_STATUSES: ShowtimeStatusJob flips finished showtimes to
                            FINISHED, so a committed-only filter matches almost nothing in a
                            past date range.)
  BookingStatus:           PENDING_PAYMENT | CONFIRMED | REFUNDED
                           (+ SETTLED_STATUSES={CONFIRMED,REFUNDED} and a static
                            isSettled(status) — null-safe, use it instead of comparing)
  PaymentState:            CONFIRMED | PENDING | FAILED | EXPIRED | REFUNDED
                           (response-only, derived by BookingService.resolvePaymentState
                            for BookingConfirmationDTO — never parsed from input, so no
                            fromString)
  StaffPosition:           ADMIN | MANAGER | CASHIER | USHER
  EmploymentType:          FULL_TIME | PART_TIME
  UserType:                STAFF_MEMBER | CLIENT
  OtpType:                 RESET_PASSWORD | EMAIL_VERIFICATION
  OAuthProvider:           GOOGLE | MICROSOFT
  PaymentProvider:         PAYMOB
                           (carries its own GatewayProviderSpec — PAYMOB(new PaymobGateway())
                            + Lombok @Getter, so provider.getSpec() answers credentialsType() /
                            channelConfigType() / supportsChannels() / channelsRequired().
                            Consequence: entity/enums imports from dto/payment, and specs
                            cannot be Spring beans.)
```

Most enums parsed from API input expose a static `fromString(String)` — use it instead of `valueOf` so bad values raise `BusinessException` consistently. (Internal-only enums that never come from request bodies, e.g. `UserType`, are bare enums without `fromString`.)

### Seat Layout Conventions

Seat positions are strings matching `^([A-Z]+)([0-9]+)$` (e.g. `A1`, `AA15`). `HallService` defines `POSITION_PATTERN` and `toRowIndex(label)` (Excel-style row label → 1-based index). `mergeSeats` and `mergeCategoryPrices` build a fresh `HallLayout` / price `Map` from the incoming DTO and replace the JSONB columns wholesale (`hall.setLayout(...)` / `hall.setCategoryPrices(...)`) — the layout is a single JSONB value now, so there are no per-row associations to upsert.

## API Endpoints

### `/management/auth` — ManagementAuthController

All endpoints `@PublicApi` (skip authentication) **except** `/logout`. Session/refresh/logout are delegated to `JwtSessionService`; cookies are built by `AuthCookieResponseFactory` under `AuthContext.MANAGEMENT` — access (`mgmt_accessToken`), refresh (`mgmt_refreshToken`), and a CSRF (`mgmt_XSRF-TOKEN`) cookie — all set/cleared together. The cookie-reading endpoints take `HttpServletRequest` rather than `@CookieValue` (see _Auth contexts_).

| Method | Path                                 | Input                  | Output / Effect                                  |
| ------ | ------------------------------------ | ---------------------- | ------------------------------------------------ |
| POST   | `/management/auth/login`             | LoginDTO               | 200 + sets access/refresh/CSRF cookies           |
| POST   | `/management/auth/refresh`           | refresh cookie         | 200 + new access cookie (rotates refresh if any) |
| GET    | `/management/auth/session`           | refresh cookie         | 200 if valid, else 401                           |
| POST   | `/management/auth/logout`            | access/refresh cookies | 200 + clears cookies (blocklists tokens)         |
| POST   | `/management/auth/forgot-password`   | ForgotPasswordDTO      | 204 (emails reset OTP)                           |
| POST   | `/management/auth/verify-reset-code` | OtpCodeDTO             | 204 (validates OTP)                              |
| POST   | `/management/auth/reset-password`    | ResetPasswordDTO       | 204 (consumes OTP, sets new password)            |

### `/halls` — HallController

Class-level `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")`, **except** `GET /halls/types` which is `@PublicApi` + `permitAll()` (the client reads hall types unauthenticated).

| Method | Path                   | Input                     | Output                         |
| ------ | ---------------------- | ------------------------- | ------------------------------ |
| GET    | `/halls`               | ?excludeHallId, ?statuses | List<HallSummaryDTO> (unpaged) |
| GET    | `/halls/status-counts` |                           | Map<HallStatus, Long>          |
| GET    | `/halls/{uuid}`        |                           | HallDetailDTO                  |
| GET    | `/halls/{uuid}/layout` |                           | HallLayoutDTO                  |
| POST   | `/halls`               | HallDTO                   | HallSummaryDTO                 |
| PUT    | `/halls/{uuid}`        | HallDTO                   | HallSummaryDTO                 |
| DELETE | `/halls/{uuid}`        |                           | 204                            |
| GET    | `/halls/types`         |                           | List<HallTypeDTO>              |
| POST   | `/halls/types`         | HallTypeDTO               | HallTypeDTO                    |
| PUT    | `/halls/types/{uuid}`  | HallTypeDTO               | HallTypeDTO                    |
| DELETE | `/halls/types/{uuid}`  |                           | 204                            |

### `/movies` — TmdbMovieController

Class-level `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")`; the three client-facing reads and `GET /movies/{id}` are `@PublicApi`.

| Method | Path                         | Input                  | Output / Effect            | Access        |
| ------ | ---------------------------- | ---------------------- | -------------------------- | ------------- |
| GET    | `/movies/search`             | ?query, page           | Page<MovieSearchResultDTO> | ADMIN/MANAGER |
| GET    | `/movies/upcoming`           | ?limit                 | List<UpcomingMovieDTO>     | ADMIN/MANAGER |
| GET    | `/movies/announced-upcoming` |                        | List<MovieSearchResultDTO> | @PublicApi    |
| GET    | `/movies/highlighted`        |                        | List<HighlightedMovieDTO>  | @PublicApi    |
| GET    | `/movies/now-showing`        | ?limit                 | List<NowShowingMovieDTO>   | @PublicApi    |
| GET    | `/movies/{id}`               | (TMDB id, Long)        | MovieDetailDTO             | @PublicApi    |
| POST   | `/movies/{id}/announcement`  | AnnouncementRequestDTO | 204 (toggle isAnnounced)   | ADMIN/MANAGER |
| POST   | `/movies/{id}/highlight`     | HighlightRequestDTO    | 204 (toggle isHighlighted) | ADMIN/MANAGER |

Note: `{id}` is the raw TMDB id, **not** a uuid — `TmdbMovie` isn't a `BaseEntity`.

### `/showtimes` — ShowtimeController

Class-level `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")`; the three read endpoints `GET /showtimes/movies`, `/movie-dates`, and `/movie-day` widen to also allow `CASHIER` (they back the booking flow).

| Method | Path                          | Input                       | Output                          |
| ------ | ----------------------------- | --------------------------- | ------------------------------- |
| GET    | `/showtimes/movies`           |                             | List<MovieWithShowtimesDTO>     |
| GET    | `/showtimes/schedule`         | ?day (LocalDate)            | List<ScheduledShowtimeDTO>      |
| GET    | `/showtimes/statistics`       |                             | ShowtimesStatisticsDTO          |
| GET    | `/showtimes/movie-dates`      | ?movieId (TMDB id)          | MovieShowtimeDatesDTO           |
| GET    | `/showtimes/movie-day`        | ?movieId, ?date (LocalDate) | MovieShowtimesDTO               |
| POST   | `/showtimes`                  | ShowtimeDTO                 | ShowtimeSummaryDTO              |
| PUT    | `/showtimes/{uuid}`           | ShowtimeDTO                 | ShowtimeSummaryDTO              |
| DELETE | `/showtimes/{uuid}`           |                             | 204                             |
| DELETE | `/showtimes/movies/{movieId}` | (TMDB id, Long)             | 204 (delete all for that movie) |
| POST   | `/showtimes/publish`          | PublishShowtimesDTO         | 204 (DRAFT → PUBLISHED batch)   |

### `/staff` — StaffMemberController

Class-level `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")`. The self-service `/staff/me` endpoints and `GET /staff/{uuid}` override it with `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER', 'USHER')")` so any logged-in **staff member** can reach them (the per-row view/edit rules are then enforced in the service — see _Admin Account Policy_).

> These four were previously `isAuthenticated()`, which a logged-in **CLIENT** also satisfies — `ROLE_CLIENT` passed the authorization layer and reached the service. Do **not** use `isAuthenticated()` on a staff endpoint: spell out the four positions. It is load-bearing beyond access control, because `UserPrincipal.getPosition()` is `null` for clients and `validateCanViewStaffMember` dereferences it.

| Method | Path                       | Input                  | Output / Effect                              |
| ------ | -------------------------- | ---------------------- | -------------------------------------------- |
| GET    | `/staff`                   | ?name, ?position, page | Page<StaffMemberSummaryDTO> (ADMIN/MANAGER)  |
| GET    | `/staff/me`                | —                      | CurrentStaffMemberDTO (any staff position)   |
| PUT    | `/staff/me`                | UpdateProfileDTO       | StaffMemberDetailDTO (own name/phone)        |
| PUT    | `/staff/me/password`       | ChangePasswordDTO      | 204 (own password; `updatePassword`)         |
| GET    | `/staff/position-coverage` |                        | PositionCoverageDTO (ADMIN/MANAGER)          |
| GET    | `/staff/on-shift`          |                        | OnShiftSummaryDTO (ADMIN/MANAGER)            |
| GET    | `/staff/{uuid}`            |                        | StaffMemberDetailDTO (any staff + view rule) |
| POST   | `/staff`                   | StaffMemberDTO         | StaffMemberSummaryDTO (ADMIN/MANAGER)        |
| PUT    | `/staff/{uuid}`            | StaffMemberDTO         | StaffMemberSummaryDTO (ADMIN/MANAGER)        |
| DELETE | `/staff/{uuid}`            |                        | 204 (ADMIN/MANAGER)                          |

Phone numbers in `StaffMemberDTO` / `UpdateProfileDTO` are validated/normalized with Google libphonenumber before persistence. The `/staff/me` mutations (`updateProfile`, `updatePassword`) still call `validateNotAdminAccount(...)` — the admin row is not self-editable even by the admin.

### `/payment-gateways` — PaymentGatewayController

Class-level `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")`.

| Method | Path                              | Input              | Output                       |
| ------ | --------------------------------- | ------------------ | ---------------------------- |
| GET    | `/payment-gateways`               |                    | PaymentGatewayListDTO        |
| GET    | `/payment-gateways/active`        |                    | PaymentGatewaySummaryDTO     |
| POST   | `/payment-gateways`               | PaymentGatewayDTO  | 201 PaymentGatewaySummaryDTO |
| PUT    | `/payment-gateways/{uuid}`        | PaymentGatewayDTO  | PaymentGatewaySummaryDTO     |
| POST   | `/payment-gateways/{uuid}/status` | `{"active": bool}` | 204                          |
| DELETE | `/payment-gateways/{uuid}`        |                    | 204                          |

Wire format for create/update (`active` is **not** an input — a new gateway is always created inactive, and activation is the separate `/status` endpoint):

```json
{
  "name": "Main Paymob",
  "provider": "PAYMOB",
  "credentials": { "secretKey": "...", "publicKey": "...", "hmacKey": "..." },
  "paymentChannels": [
    { "name": "Cards", "currency": "EGP", "active": true, "providerConfig": { "integrationId": 12345 } }
  ]
}
```

- `GET` returns `PaymentGatewayListDTO { active, standBy }` — partitioned server-side in a single pass. `@JsonInclude(NON_NULL)`, so `active` is **omitted** when no gateway is active.
- **Responses never contain `secretKey`/`hmacKey`**, not even as nulls: mappers run credentials through `PaymobClient.readPublicCredentials(...)`, which rebuilds the record with only `publicKey`, and `PaymobGateway.Credentials` is `@JsonInclude(NON_NULL)`.
- On **update**, a blank `secretKey`/`hmacKey` means "keep the stored one" (`resolveCredentials`); `publicKey` must always be supplied since it isn't a secret.
- `credentials` on the write DTO is a `Map<String, Object>`, deliberately **not** generic — a generic `PaymentGatewayDTO<C, K>` cannot deserialize at all, because `C` erases to a marker interface Jackson can't instantiate.
- Channel validation (`validateChannels`): name required and ≤ 30 chars, currency in `{EGP, USD}`, `providerConfig` required and provider-validated, and both names and configs must be unique within the gateway.
- **`PaymentGatewayService.getActivePaymentGatewayForPayment()`** is the runtime read used by `PaymentService`. Unlike the list/CRUD mappers it returns **unmasked** credentials, so it must never be serialized to a response. It throws `BusinessException("Online payment is currently unavailable")` when no gateway is active, or when the active gateway has channels but none are active.

**Deletion is soft.** `deletePaymentGateway` sets `deletedAt` instead of removing the row — bookings keep a valid `PAYMENT_GATEWAY_ID`, and the encrypted credentials survive so an old transaction can still be refunded or settled. It still refuses to delete an **active** gateway, or one with a payment in progress / settled within `SETTLED_BOOKING_RETENTION_DAYS` (14).

Every read excludes soft-deleted rows via `...DeletedAtIsNull` derived queries (`findByActiveTrueAndDeletedAtIsNull`, `findAllByDeletedAtIsNullOrderByCreatedAtDesc`, `existsByCodeAndDeletedAtIsNull[AndIdNot]`, and `findByUuidForUpdate`). The **one exception is `findByUuid`**, used by `getPaymentGatewayForPayment(uuid)` — it deliberately returns deleted gateways so `PaymentService.resolveGateway` can still settle/refund transactions taken before the deletion. Don't "fix" it by adding the filter.

**Two partial unique indexes — neither can be generated by JPA** (Hibernate has no annotation emitting a standalone `CREATE UNIQUE INDEX`; `@Index(unique=true)` renders as an invalid inline table constraint), and the project has no Flyway/Liquibase, so both are applied by hand:

```sql
-- single-active rule (applied)
CREATE UNIQUE INDEX UK_PAYMENT_GATEWAYS_ACTIVE
  ON PAYMENT_GATEWAYS (ACTIVE)
  WHERE ACTIVE;

-- code is unique only among live rows, so a deleted gateway frees its name
ALTER TABLE PAYMENT_GATEWAYS DROP CONSTRAINT <generated_code_unique_constraint>;

CREATE UNIQUE INDEX UK_PAYMENT_GATEWAYS_CODE
  ON PAYMENT_GATEWAYS (CODE)
  WHERE DELETED_AT IS NULL;
```

`code` lost its column-level `unique = true` for this reason — `ddl-auto=update` never drops the constraint it already generated, so the `ALTER TABLE` above is required or soft-deleted names stay permanently taken.

`updatePaymentGatewayStatus` relies on the ACTIVE index: it deactivates the incumbent with `saveAndFlush` first, then wraps the activation in a `catch (DataIntegrityViolationException)` that rethrows as `ConflictException` (409). That catch is **load-bearing** — the row lock only serializes activations of the _same_ gateway, so two admins activating _different_ gateways still collide on the index.

### `/booking` — BookingController

Access is **not** uniform here — check the column. Five handlers are `@PublicApi` + `permitAll()` (the three browse reads **plus the two Paymob callbacks**, which arrive unauthenticated and are instead authenticated by HMAC); the booking lifecycle is `hasAnyRole('CLIENT', 'ADMIN', 'MANAGER', 'CASHIER')`; the online-payment endpoints are **`hasRole('CLIENT')`** only; and on-site settle is **staff-only** (no CLIENT). Ticket scanning is the **only** endpoint in the app that grants `USHER` — it is `hasAnyRole('ADMIN', 'MANAGER', 'CASHIER', 'USHER')`, since verifying tickets at the door is the usher's job. The class is `@Validated` (needed for the `@Pattern` on the `Idempotency-Key` header **and** on the `bookingReference` path variable).

| Method | Path                             | Input                                            | Output / Effect               | Access                                 |
| ------ | -------------------------------- | ------------------------------------------------ | ----------------------------- | -------------------------------------- |
| GET    | `/booking/movies/{id}/dates`     | (TMDB id)                                        | List<String> (bookable dates) | @PublicApi                             |
| GET    | `/booking/movies/{id}/showtimes` | ?date (LocalDate)                                | List<HallTypeShowtimesDTO>    | @PublicApi                             |
| GET    | `/booking/showtimes/{uuid}`      |                                                  | SeatSelectionDTO              | @PublicApi                             |
| GET    | `/booking/active`                |                                                  | List<BookingSummaryDTO>       | CLIENT+staff                           |
| GET    | `/booking/active/{uuid}`         |                                                  | BookingDetailDTO              | CLIENT+staff                           |
| GET    | `/booking/{uuid}/confirmation`   |                                                  | BookingConfirmationDTO        | CLIENT+staff                           |
| POST   | `/booking`                       | BookingRequestDTO + `Idempotency-Key` hdr (UUID) | 201 BookingDetailDTO          | CLIENT+staff                           |
| DELETE | `/booking/{uuid}`                |                                                  | 204 (cancel/release hold)     | CLIENT+staff                           |
| POST   | `/booking/{uuid}/settle`         | OnSitePaymentDTO `{isCash, transactionId?}`      | BookingConfirmationDTO        | **staff only** (ADMIN/MANAGER/CASHIER) |
| POST   | `/booking/tickets/{ref}/scan`    | (bookingReference, no whitespace)                | BookingConfirmationDTO        | **staff only** (+USHER)                |
| POST   | `/booking/{uuid}/pay`            |                                                  | RedirectionDTO                | **CLIENT only**                        |
| POST   | `/booking/{uuid}/pay-saved-card` | SavedCardPaymentDTO                              | RedirectionDTO                | **CLIENT only**                        |
| GET    | `/booking/payment-redirect`      | flat `Map<String,String>` query params           | 302 FOUND + `Location`        | @PublicApi (HMAC)                      |
| POST   | `/booking/payment-callback`      | JsonNode body + ?hmac                            | 200 (Paymob webhook)          | @PublicApi (HMAC)                      |

`handlePaymentCallback` pattern-matches the sealed `PaymentCallbackData` to route a `TransactionCallbackDTO` to `bookingService.applyPaymentResult(...)` and a `CardTokenCallbackDTO` to `clientPaymentMethodService.createMethod(...)`. Note the body is `tools.jackson.databind.JsonNode` — **Jackson 3**, not `com.fasterxml.jackson` (its annotations, however, still live under `com.fasterxml.jackson.annotation`).

**`payment-redirect` is the browser's return leg, not the source of truth.** Paymob's "cancel" button calls it with an _empty_ param map, so `handleRedirect` returns null on empty input and the booking service falls back to the client's home URL rather than failing HMAC verification. Settlement itself comes from the webhook.

### `/clients` — ClientController

Class-level `@PreAuthorize("hasRole('CLIENT')")`.

| Method | Path                                 | Input                   | Output / Effect                   |
| ------ | ------------------------------------ | ----------------------- | --------------------------------- |
| GET    | `/clients/me`                        |                         | CurrentClientDTO                  |
| PUT    | `/clients/me`                        | UpdateClientProfileDTO  | CurrentClientDTO (own name/phone) |
| PUT    | `/clients/me/password`               | ChangeClientPasswordDTO | 204 (own password)                |
| GET    | `/clients/me/payment-methods`        |                         | List<ClientPaymentMethodDTO>      |
| DELETE | `/clients/me/payment-methods/{uuid}` |                         | 204 (removes a saved card)        |

Phone numbers in `UpdateClientProfileDTO` are validated/normalized with libphonenumber before persistence (`normalizePhoneNumber`), then checked for uniqueness with `existsByPhoneNumberAndIdNot` so the client's own row doesn't collide with itself. `changePassword` verifies `currentPassword` (`PASSWORD_INCORRECT` on mismatch) and shares `applyNewPassword` with the OTP-reset path `updatePassword` — that helper owns the `PASSWORD_REUSED` check and the encode/save.

`deleteMethod` reuses `findOwnedByCurrentClient(uuid)` (the same guard `BookingService` uses before a saved-card charge): the lookup is scoped by uuid **and** the current client's id, so a card belonging to someone else raises `NotFoundException` → **404, not 403** — the response must not reveal that another client's card exists. Deletion is a **hard** delete, unlike `PaymentGateway`'s soft-delete: no entity holds an FK to `ClientPaymentMethod` (the token is only read live during a charge), so removing a row can't orphan a booking.

### `/clients/auth` — ClientAuthController

All endpoints `@PublicApi` **except** `/logout`. Cookies (`client_accessToken` / `client_refreshToken` / `client_XSRF-TOKEN`) are set via `AuthCookieResponseFactory` under `AuthContext.CLIENT`; session/refresh/logout delegate to `JwtSessionService`. Sign-up requires email verification (OTP) before login.

| Method | Path                           | Input                  | Output / Effect                             |
| ------ | ------------------------------ | ---------------------- | ------------------------------------------- |
| POST   | `/clients/auth/sign-up`        | SignUpDTO              | 201 (creates unverified client, emails OTP) |
| POST   | `/clients/auth/send-otp`       | SendOtpDTO             | 204 (emails an OTP)                         |
| POST   | `/clients/auth/verify-otp`     | OtpCodeDTO             | 204 (validates OTP)                         |
| POST   | `/clients/auth/reset-password` | ResetPasswordDTO       | 204 (consumes OTP, sets new password)       |
| POST   | `/clients/auth/verify-account` | OtpCodeDTO             | 200 + cookies if verified, else 204         |
| POST   | `/clients/auth/login`          | LoginDTO               | 200 + sets access/refresh/CSRF cookies      |
| GET    | `/clients/auth/session`        | refresh cookie         | 200 if valid, else 401                      |
| POST   | `/clients/auth/refresh`        | refresh cookie         | 200 + new access cookie                     |
| POST   | `/clients/auth/logout`         | access/refresh cookies | 200 + clears cookies (requires auth)        |

**OAuth2 social sign-in** — three additional `@PublicApi` endpoints:

| Method | Path                                               | Input                                             | Output / Effect                                       |
| ------ | -------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| GET    | `/clients/auth/oauth/{provider}/authorization-url` | provider = `GOOGLE` \| `MICROSOFT`                | 200 RedirectionDTO + sets `oauthState` cookie         |
| POST   | `/clients/auth/oauth/callback`                     | OAuthCallbackDTO + `oauthState` cookie            | 200 (auth cookies) or 200 OAuthRegistrationDTO or 403 |
| POST   | `/clients/auth/oauth/sign-up`                      | OAuthSignUpDTO `{registrationToken, phoneNumber}` | 200 + sets auth cookies                               |

**The redirect target is the frontend, not the backend.** `cinefy.oauth.redirect-uri` is a _path_
appended to `AppConfig.getFrontendClientUrl()`, so the provider bounces the browser to an Angular
route that reads `code`/`state` from the query string and POSTs them to `/oauth/callback`. There is
no backend GET callback endpoint.

**`state` is split across the wire and a cookie.** `getAuthorizationUrl()` sends
`state=<PROVIDER>:<uuid>` to the provider but stores only the `uuid` in the HttpOnly `oauthState`
cookie (10-minute max-age). On callback, `parseState` recovers the provider from the query value and
`validateState` compares the token halves with `MessageDigest.isEqual` (constant-time). The cookie is
cleared on **every** callback outcome, success or failure.

**The callback has three outcomes**, all keyed on the provider's email:

- **Known + verified** → tokens, logged in.
- **Known + unverified** → sends an `EMAIL_VERIFICATION` OTP and throws `ForbiddenException` (403)
  with `ACCOUNT_NOT_VERIFIED` and `data.email`.
- **Unknown** → 200 with an `OAuthRegistrationDTO` carrying an **encrypted registration token**.

**The registration token is stateless.** `issueRegistrationToken` serializes an
`OAuthRegistrationToken(email, firstName, lastName, expiresAt)` and encrypts it whole with
`CredentialCipher` (the same AES-256-GCM helper used for gateway credentials, so
`cinefy.encryption.key` is load-bearing for OAuth too). Nothing is persisted and no cookie is set —
the token round-trips through the client and is decrypted on `/oauth/sign-up`, which rejects it if
it fails to decrypt or its `expiresAt` has passed. Sign-up only needs the one field the providers
don't supply: `phoneNumber`.

**OAuth clients are created verified and password-less.** `ClientService.createOAuthClient` sets
`isVerified = true` (the provider already vouched for the email) and never calls `setPassword`,
which is why `User.password` is nullable. `changePassword` branches on `Client.hasPassword()`: a
password-less client may set an initial password without supplying a current one; everyone else
still gets the `PASSWORD_INCORRECT` check. `CurrentClientDTO` exposes `hasPassword` so the profile
UI can render "set" vs "change".

> **Existing databases need a manual migration.** `ddl-auto=update` never drops the `NOT NULL` that
> was already generated for `PASSWORD`, so OAuth sign-up fails on any pre-existing database until
> you run `ALTER TABLE USERS ALTER COLUMN PASSWORD DROP NOT NULL` (per concrete table — `CLIENTS`,
> and `STAFF_MEMBERS` if it inherited the constraint).

### `/statistics` — StatisticsController

Class-level `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")`. All three endpoints bind the same
`DateRangeDTO` via `@Valid @ModelAttribute` (query params, not a body).

| Method | Path                  | Input                | Output                      |
| ------ | --------------------- | -------------------- | --------------------------- |
| GET    | `/statistics/summary` | ?from, ?to           | StatisticsSummaryDTO        |
| GET    | `/statistics/sales`   | ?from, ?to           | List\<SalesPointDTO\>       |
| GET    | `/statistics/movies`  | ?from, ?to, Pageable | Page\<MoviePerformanceDTO\> |

`from`/`to` are ISO `yyyy-MM-dd` (`@DateTimeFormat(ISO.DATE)`), both `@NotNull`. `@ModelAttribute`
binding failures raise **`BindException`**, not `MethodArgumentNotValidException` — the global
handler is registered on `BindException` (the superclass) so both query-param and request-body
validation produce the same field-level 400.

### Statistics conventions

**One validator, four rules.** `StatisticsService.validateDateRange(DateRangeDTO)` is `public
static` so every statistics endpoint calls the same rules: `from <= to`, span ≤ 1 year, `from` not
before the start of last calendar year, and `to` not after today. The `@NotNull` checks stay on the
DTO; these four are `BusinessException` → 400.

**Every statistics query filters `s.status IN REPORTABLE_STATUSES`.** DRAFT showtimes are excluded
from revenue, ticket counts, and capacity alike — an unpublished schedule with test bookings must
not appear as real sales. All seven queries carry the filter; adding a new one means adding it too.

**Everything is keyed to `Showtime.startDateTime`, never `Booking.createdAt`.** The statistics
answer "how did the screenings in this window perform", so numerator and denominator share one
clock. A ticket sold in July for an August screening counts in August. A consequence worth knowing:
`validateDateRange` caps `to` at today, so advance sales for future showtimes appear in no period
until the screening date arrives — the summary deliberately does not reconcile against total cash
taken.

**Occupancy denominators are per-showtime, not per-hall.** `totalSeats` sums `Hall.getCapacity()`
once for **each showtime**, so a 200-seat hall running four shows contributes 800. The hall queries
therefore return one row per showtime and deliberately carry **no `GROUP BY`** — an earlier
`GROUP BY h` deduped halls and produced occupancy above 100%. `getCapacity()` subtracts AISLE
positions from the JSONB layout, which SQL cannot compute, so these queries must return `Hall`
entities and sum in Java rather than `SUM(totalRows * totalColumns)`.

**Occupancy is a percentage, scaled to `OCCUPANCY_SCALE` (2).** `67.60`, not `0.676` — the frontend
appends `%` without multiplying. Zero denominators short-circuit to `BigDecimal.ZERO`.

**`SUM` needs `ELSE 0` + an outer `COALESCE`; `COUNT` needs neither.** `SUM(CASE WHEN c THEN x ELSE
0 END)` skips non-matching rows, and `COALESCE(..., 0)` covers the empty-result case where `SUM`
returns null. `COUNT(CASE WHEN c THEN 1 END)` has **no** `ELSE` on purpose — `COUNT` ignores nulls,
so adding `ELSE 0` would count every row.

**Watch the fan-out when joining bookings or seats.** `b.totalAmount` lives on the booking row, so
joining `BookingSeat` (or `LEFT JOIN Booking` under a showtime) repeats it once per child and
inflates `SUM`. `MovieRevenueProjection` counts showtimes with `COUNT(DISTINCT s.id)` for exactly
this reason, and its `countQuery` uses `COUNT(DISTINCT m.id)`. This is also why revenue and ticket
counts stay in **separate queries** rather than one joined query.

**Summary returns both periods from one query each.** The previous window is the N days immediately
before `from`, derived in the service. Rather than running six queries, each of the three splits the
windows inside the aggregate with `CASE WHEN ... >= :from` over a single contiguous
`BETWEEN :previousFrom AND :to` scan.

**Sales zero-fills.** `getSales` walks every date from `from` to `to` and emits a point per day,
defaulting missing days to zero, because the chart's bar heights are peak-relative and would
misrepresent the shape if days were absent. `SalesPointDTO.date` is a `LocalDate` — Jackson
serializes ISO `yyyy-MM-dd`, so no manual formatting.

**Movie performance pages on the revenue query only.** `findMoviePerformanceBetween` drives the row
set (pre-sorted `netRevenue DESC`); the tickets and seats queries are then scoped by
`movieIds IN (...)` for just that page. A caller-supplied `sort` param would append after the
built-in `ORDER BY` — restrict it if the frontend ever sends one.

**`@Query` strings are not checked by `mvn compile`.** They are parsed at bean-creation time, so a
broken JPQL constructor expression compiles fine and fails at startup. When adding or reshaping a
statistics query, boot the app (or generate its SQL) rather than trusting a clean compile. Two
traps met in practice: `MAX(...)` returns `Integer`, so projecting into a `boolean` record
component needs `MAX(...) > 0` in the query (a type mismatch surfaces as the unhelpful
`Missing constructor for type '...'`); and Hibernate expands `GROUP BY <entity>` to the primary key
alone, which is what keeps the JSONB `LAYOUT`/`CATEGORY_PRICES` columns out of the `GROUP BY` —
Postgres has no equality operator for `jsonb` and would otherwise reject the query.

### Dashboard aggregate endpoints

Four endpoints exist purely to back the management dashboard's widgets:
`GET /halls/status-counts`, `GET /staff/on-shift`, `GET /showtimes/schedule?day=`, and
`GET /payment-gateways/active`.

**Count-by-enum responses seed every key.** A bare `GROUP BY` returns **no row** for an enum
constant with zero matches, which would silently drop keys from the JSON. Both
`HallService.getHallStatusCounts` and `StaffMemberService.getOnShiftSummary` therefore pre-fill an
`EnumMap` with every constant at `0L` and overlay the query results on top. `EnumMap` also fixes
iteration to enum-declaration order, so key order in the response is stable. `getOnShiftSummary`
skips `ADMIN` when seeding (the admin is excluded from all staff aggregates — see _Admin Account
Policy_), so its `details` map holds exactly `MANAGER`/`CASHIER`/`USHER`, always present, possibly
zero. Adding a constant to either enum surfaces it automatically; a hardcoded key list would not.

**On-shift is a two-stage filter: hours in SQL, days in Java.** `findAllOnShiftAt(time)` matches on
working hours only, handling the wrap-around case (`workingHourStart > workingHourEnd` = a night
shift crossing midnight). The **day** check can't be expressed the same way, because a night shift
that began yesterday evening is still yesterday's shift after midnight — so
`StaffMemberService.isWorkingDay` shifts the current day back by one when the shift wraps _and_ the
current time is before `workingHourStart` (which is exactly the post-midnight half, given the row
already matched the hours filter). `isDayInRange` then compares `DayOfWeek.getValue()` manually,
because a working week may itself wrap (Saturday → Wednesday) and no built-in range check handles
that. Changing either half means changing both.

**`ScheduledShowtimeDTO` filters on `COMMITTED_STATUSES`,** so `FINISHED` screenings drop off the
list as the day progresses — the widget answers "what is on now and later", not "the full day's
plan". Switch to `REPORTABLE_STATUSES` if completed screenings should remain visible.

**`findByMovieStatusesAndDateRangeWithHall` takes an optional `movieId`** (`:movieId IS NULL OR …`)
so the per-movie day view and the whole-cinema schedule share one query. It also `JOIN FETCH`es
`s.tmdbMovie` — the schedule response reads the movie for every row and the association is `LAZY`,
so omitting it reintroduces an N+1.

**`GET /payment-gateways/active` 404s when nothing is active,** unlike `GET /payment-gateways`,
which simply omits its `active` field. It reuses the masking `toSummaryDTO(gateway)`, **not**
`getActivePaymentGatewayForPayment()` — the latter returns unmasked credentials and must never be
serialized to a response.
