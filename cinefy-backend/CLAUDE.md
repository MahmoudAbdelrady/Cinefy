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
- `cinefy.cookie.secure`, `cinefy.cookie.same-site` — auth-cookie flags (read by `CookieUtil`).
- `cinefy.admin.email` (required), `cinefy.admin.password` (optional — the admin seed is skipped with a warning if empty) — bootstrap admin account (`CinefyApplication`).
- `cinefy.otp.expiration` — OTP lifetime in ms, read by `OtpService`. No default in `application.properties`, so the app won't boot without it.
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
- **Spring Security** — wired in `SecurityConfig` (Spring's built-in CSRF off, replaced by a custom double-submit token; CORS allow-list of both `app.frontend.mgmt.url` and `app.frontend.client.url`; stateless sessions; `@EnableMethodSecurity`). Authentication is JWT-in-cookie: `JwtAuthenticationFilter` reads the access-token cookie (`accessToken`), validates it (with an `InvalidJwtService` blocklist check), and populates a `UserPrincipal`; a `CsrfValidationFilter` (after `UsernamePasswordAuthenticationFilter`) enforces a double-submit CSRF token (`XSRF-TOKEN` cookie / `X-XSRF-TOKEN` header) for authenticated non-safe, non-`@PublicApi` requests (`CsrfProtectionMatcher`). `CinefyApiAuthorizationManager` gates `anyRequest()` — every endpoint requires an authenticated user **unless** the controller/handler is annotated `@PublicApi` (e.g. login, forgot-password). Position/role authorization is enforced per-endpoint via `@PreAuthorize("hasAnyRole(...)")` on controllers (roles map to the `StaffPosition` enum — ADMIN/MANAGER/CASHIER/USHER — plus the `CLIENT` role for client users). There are **two** `DaoAuthenticationProvider`-backed managers (a `CinefyAuthManagers` bean): one over `StaffMemberService`, one over `ClientService`, both with `BCryptPasswordEncoder`.
- **Spring Mail + Thymeleaf** — `EmailService` sends email-verification and password-reset OTP emails (`sendEmailVerificationOtp` / `sendPasswordResetOtp`); mail bean wired in `AppConfig`.
- **Scheduling** — `@EnableScheduling` on `CinefyApplication`; jobs live under `job/`: `ShowtimeStatusJob` (cron `0 * * * * *`), `TmdbSyncJob` (cron `0 0 3 * * *`), `BookingCleanupJob` (cron `0 * * * * *`), `OtpCleanupJob` (cron `0 0 3 * * *`), `InvalidJwtCleanupJob` (cron `0 0 3 * * *`)
- **AOP** — `RequestLoggingAspect` (around any `@RestController`) and `TransactionLoggingAspect` (around any `@Transactional`) under `aspect/`, both delegating to `LoggingUtil`
- **TMDB integration** — `TmdbMovieService` calls TheMovieDB via `RestClient` (`app.tmdb.api-base-url`), caches results in the local `TmdbMovie` table
- **Paymob integration** — `PaymobClient` under `shared/payment/` is a full Unified Checkout client over `RestClient` (`app.paymob.api-base-url`): `createIntention`, `getUnifiedCheckoutUrl`, `pay` (saved-card charge via `source.subtype = TOKEN`), `refund` (tries **void** first, falls back to **refund**), `parseRedirect` (flat browser query params), `parseCallback` (webhook JSON → the sealed `PaymentCallbackData`: `TRANSACTION` → `TransactionCallbackDTO`, else `CardTokenCallbackDTO`), plus the config-time `resolveCredentials` / `readPublicCredentials` / `validateChannelConfig`. Every inbound payload is **HMAC-SHA512 verified** over an ordered field concatenation compared with `MessageDigest.isEqual`; a mismatch throws `BusinessException("Invalid payment signature")`. `PaymentService` sits above it and owns the booking-facing flow (`createCheckout`, `payWithSavedCard`, `refundTransaction`, `handleCallback`, `handleRedirect`); `ClientPaymentMethodService` persists tokenized cards.

  **Every secret-taking `PaymobClient` method takes `GatewayProviderCredentials`, never a raw key string** — it casts to `PaymobGateway.Credentials` on the first line of the body. That keeps `PaymobGateway.*` types out of `PaymentService`, so a second provider only needs a new spec + client, not changes at the call sites. `createIntention` also takes the gateway's `List<PaymentGatewayChannel<?>>` and derives `currency` + `payment_methods` from the **active** channels itself (private `readChannelCurrency` / `readIntegrationIds`); those two fields are absent from `PaymobIntentionRequestDTO` and are injected into the JSON body at send time via `objectMapper.valueToTree`. A gateway whose active channels disagree on currency throws — one intention carries exactly one currency.

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
│                     ManagementAuth, Booking, Client, ClientAuth
├── filter/         — JwtAuthenticationFilter (cookie JWT → SecurityContext),
│                     CsrfValidationFilter (double-submit CSRF token check)
├── dto/            — Request/response DTOs, grouped per domain
│   ├── hall/       — HallDTO, HallDetailDTO, HallLayoutDTO, HallSummaryDTO,
│   │                  HallReferenceDTO, HallTypeDTO, HallLayout (JSONB payload record),
│   │                  SeatLayoutDTO, TicketPricingDTO
│   ├── movie/      — MovieBaseDTO, MovieSummaryDTO, MovieSearchResultDTO, MovieDetailDTO,
│   │                  MovieCredits, HighlightedMovieDTO, NowShowingMovieDTO, UpcomingMovieDTO,
│   │                  HighlightRequestDTO, AnnouncementRequestDTO,
│   │                  MovieWithCommittedShowtimeProjection, NowShowingProjection
│   ├── showtime/   — ShowtimeDTO, ShowtimeSummaryDTO, MovieShowtimesDTO,
│   │                  MovieShowtimeDatesDTO, MovieShowtimeListItemDTO,
│   │                  MovieShowtimeCountProjection, MovieWithShowtimesDTO,
│   │                  ShowtimesStatisticsDTO, PublishShowtimesDTO,
│   │                  BookingShowtimeDTO, HallTypeShowtimesDTO,
│   │                  ShowtimeBookedSeatsProjection, ShowtimeBookingCountsProjection
│   ├── booking/    — SeatSelectionDTO, ActiveBookingDTO, BookingRequestDTO,
│   │                  BookingDetailDTO, BookingSummaryDTO, BookedSeatDTO,
│   │                  BookingConfirmationDTO, OnSitePaymentDTO
│   ├── staff/      — StaffMemberDTO, StaffMemberDetailDTO, StaffMemberSummaryDTO,
│   │                  PositionCoverageDTO, PositionCoverageItemDTO, PositionCoverageProjection,
│   │                  CurrentStaffMemberDTO, UpdateProfileDTO, ChangePasswordDTO (self-service /staff/me)
│   ├── client/     — CurrentClientDTO, SignUpDTO
│   ├── payment/    — PaymentGatewayDTO, PaymentGatewaySummaryDTO, PaymentGatewayListDTO,
│   │                  PaymentGatewayStatusRequestDTO, PaymentGatewayChannel,
│   │                  GatewayProviderSpec, GatewayProviderCredentials,
│   │                  GatewayProviderChannelConfig, PaymobGateway (the Paymob spec),
│   │                  PaymentCallbackData (sealed interface, permits the two below),
│   │                  TransactionCallbackDTO, CardTokenCallbackDTO,
│   │                  PaymentRedirectionDTO, SavedCardPaymentDTO, ClientPaymentMethodDTO,
│   │                  PaymobIntentionDTO, PaymobIntentionRequestDTO, PaymobPayResponseDTO
│   └── auth/       — LoginDTO, ForgotPasswordDTO, OtpCodeDTO, SendOtpDTO,
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
│                     JwtSessionService, OtpService, EmailService, InvalidJwtService)
├── aspect/         — RequestLoggingAspect, TransactionLoggingAspect
├── job/            — Scheduled jobs: ShowtimeStatusJob, TmdbSyncJob,
│                     BookingCleanupJob, OtpCleanupJob, InvalidJwtCleanupJob
├── shared/
│   ├── annotation/ — @PublicApi (marks endpoints that skip authentication)
│   ├── exception/  — Global @RestControllerAdvice (CinefyExceptionHandler) + CinefyExceptionResponse
│   │                 + exception types under types/ (Business, Conflict, NotFound, Forbidden, Unauthorized) + ErrorCode
│   ├── payment/    — PaymobClient (RestClient client for the Paymob Unified Checkout API)
│   ├── security/   — JwtUtil, JwtClaims, TokenType, UserPrincipal, SecurityUtil,
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
- `ForbiddenException` / `AuthorizationDeniedException` → 403
- `MethodArgumentNotValidException` / `ConstraintViolationException` → 400 with field-level errors
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
- `JwtAuthenticationFilter` extracts the access token from the access-token cookie (`accessToken`), parses it via `JwtUtil`, skips blocklisted tokens (`InvalidJwtService`), and sets a `UserPrincipal` authentication. Auth cookies also include `refreshToken` and a `XSRF-TOKEN` CSRF cookie (all built by `AuthCookieResponseFactory`). Auth is stateless — no server session.
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
 ├── onHold (Boolean, default true), refundableUntil, expiresAt
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
 └── password (bcrypt-hashed)

StaffMember extends User
 ├── position (StaffPosition enum)
 ├── employmentType (EmploymentType enum)
 ├── workingDayStart, workingDayEnd (java.time.DayOfWeek)
 └── workingHourStart, workingHourEnd (LocalTime)

Client extends User
 └── isVerified (boolean, default false)

PaymentGateway   (one configured provider account; at most one is `active` at a time)
 ├── name, code (unique, derived via static toCode(name) — the Hall pattern)
 ├── provider (PaymentProvider enum — currently PAYMOB only)
 ├── active (boolean, default false — the field is `active`, NOT `isActive`,
 │     so Lombok/Jackson emit exactly one JSON property)
 ├── credentials (TEXT, nullable=false — the provider's credential record serialized
 │     to JSON then AES-encrypted whole by CredentialCipher. TEXT and not JSONB
 │     because the cipher emits `base64:base64`, which Postgres rejects as JSONB.)
 └── paymentChannels (JSONB, nullable — plaintext List<PaymentGatewayChannel<?>>;
       each channel is { name, currency, active, providerConfig })

Enums:
  HallStatus:              SCHEDULED | ACTIVE | INACTIVE | UNDER_MAINTENANCE
  SeatCategory:            NORMAL | VIP | AISLE
  ShowtimeStatus:          DRAFT | PUBLISHED | RUNNING | FINISHED
                           (+ static sets: ACTIVE_STATUSES={DRAFT,PUBLISHED},
                            COMMITTED_STATUSES={PUBLISHED,RUNNING}, LIVE_STATUSES={DRAFT,PUBLISHED,RUNNING})
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

All endpoints `@PublicApi` (skip authentication) **except** `/logout`. Session/refresh/logout are delegated to `JwtSessionService`; cookies are built by `AuthCookieResponseFactory` — access (`accessToken`), refresh (`refreshToken`), and a CSRF (`XSRF-TOKEN`) cookie — all set/cleared together.

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
| GET    | `/showtimes/statistics`       |                             | ShowtimesStatisticsDTO          |
| GET    | `/showtimes/movie-dates`      | ?movieId (TMDB id)          | MovieShowtimeDatesDTO           |
| GET    | `/showtimes/movie-day`        | ?movieId, ?date (LocalDate) | MovieShowtimesDTO               |
| POST   | `/showtimes`                  | ShowtimeDTO                 | ShowtimeSummaryDTO              |
| PUT    | `/showtimes/{uuid}`           | ShowtimeDTO                 | ShowtimeSummaryDTO              |
| DELETE | `/showtimes/{uuid}`           |                             | 204                             |
| DELETE | `/showtimes/movies/{movieId}` | (TMDB id, Long)             | 204 (delete all for that movie) |
| POST   | `/showtimes/publish`          | PublishShowtimesDTO         | 204 (DRAFT → PUBLISHED batch)   |

### `/staff` — StaffMemberController

Class-level `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")`. The self-service `/staff/me` endpoints and `GET /staff/{uuid}` override it with `@PreAuthorize("isAuthenticated()")` so any logged-in staff member can reach them (the per-row view/edit rules are then enforced in the service — see _Admin Account Policy_).

| Method | Path                       | Input                  | Output / Effect                                    |
| ------ | -------------------------- | ---------------------- | -------------------------------------------------- |
| GET    | `/staff`                   | ?name, ?position, page | Page<StaffMemberSummaryDTO> (ADMIN/MANAGER)        |
| GET    | `/staff/me`                | —                      | CurrentStaffMemberDTO (any authenticated staff)    |
| PUT    | `/staff/me`                | UpdateProfileDTO       | StaffMemberDetailDTO (own name/phone)              |
| PUT    | `/staff/me/password`       | ChangePasswordDTO      | 204 (own password; `updatePassword`)               |
| GET    | `/staff/position-coverage` |                        | PositionCoverageDTO (ADMIN/MANAGER)                |
| GET    | `/staff/{uuid}`            |                        | StaffMemberDetailDTO (isAuthenticated + view rule) |
| POST   | `/staff`                   | StaffMemberDTO         | StaffMemberSummaryDTO (ADMIN/MANAGER)              |
| PUT    | `/staff/{uuid}`            | StaffMemberDTO         | StaffMemberSummaryDTO (ADMIN/MANAGER)              |
| DELETE | `/staff/{uuid}`            |                        | 204 (ADMIN/MANAGER)                                |

Phone numbers in `StaffMemberDTO` / `UpdateProfileDTO` are validated/normalized with Google libphonenumber before persistence. The `/staff/me` mutations (`updateProfile`, `updatePassword`) still call `validateNotAdminAccount(...)` — the admin row is not self-editable even by the admin.

### `/payment-gateways` — PaymentGatewayController

Class-level `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")`.

| Method | Path                              | Input              | Output                       |
| ------ | --------------------------------- | ------------------ | ---------------------------- |
| GET    | `/payment-gateways`               |                    | PaymentGatewayListDTO        |
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

**Not yet created — a partial unique index enforcing the single-active rule.** JPA cannot generate it (Hibernate has no annotation emitting a standalone `CREATE UNIQUE INDEX`, and `@Index(unique=true)` renders as an invalid inline table constraint), and the project has no Flyway/Liquibase:

```sql
CREATE UNIQUE INDEX UK_PAYMENT_GATEWAYS_ACTIVE
  ON PAYMENT_GATEWAYS (ACTIVE)
  WHERE ACTIVE;
```

`updatePaymentGatewayStatus` already anticipates it — it deactivates the incumbent with `saveAndFlush` first, then wraps the activation in a `catch (DataIntegrityViolationException)` that rethrows as `ConflictException` (409). Until the index exists, concurrent activations can produce two active gateways.

### `/booking` — BookingController

Access is **not** uniform here — check the column. Five handlers are `@PublicApi` + `permitAll()` (the three browse reads **plus the two Paymob callbacks**, which arrive unauthenticated and are instead authenticated by HMAC); the booking lifecycle is `hasAnyRole('CLIENT', 'ADMIN', 'MANAGER', 'CASHIER')`; the online-payment endpoints are **`hasRole('CLIENT')`** only; and on-site settle is **staff-only** (no CLIENT). The class is `@Validated` (needed for the `@Pattern` on the `Idempotency-Key` header).

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
| POST   | `/booking/{uuid}/pay`            |                                                  | PaymentRedirectionDTO         | **CLIENT only**                        |
| POST   | `/booking/{uuid}/pay-saved-card` | SavedCardPaymentDTO                              | PaymentRedirectionDTO         | **CLIENT only**                        |
| GET    | `/booking/payment-redirect`      | flat `Map<String,String>` query params           | 302 FOUND + `Location`        | @PublicApi (HMAC)                      |
| POST   | `/booking/payment-callback`      | JsonNode body + ?hmac                            | 200 (Paymob webhook)          | @PublicApi (HMAC)                      |

`handlePaymentCallback` pattern-matches the sealed `PaymentCallbackData` to route a `TransactionCallbackDTO` to `bookingService.applyPaymentResult(...)` and a `CardTokenCallbackDTO` to `clientPaymentMethodService.createMethod(...)`. Note the body is `tools.jackson.databind.JsonNode` — **Jackson 3**, not `com.fasterxml.jackson` (its annotations, however, still live under `com.fasterxml.jackson.annotation`).

**`payment-redirect` is the browser's return leg, not the source of truth.** Paymob's "cancel" button calls it with an _empty_ param map, so `handleRedirect` returns null on empty input and the booking service falls back to the client's home URL rather than failing HMAC verification. Settlement itself comes from the webhook.

### `/clients` — ClientController

Class-level `@PreAuthorize("hasRole('CLIENT')")`.

| Method | Path                       | Input | Output                       |
| ------ | -------------------------- | ----- | ---------------------------- |
| GET    | `/clients/me`              |       | CurrentClientDTO             |
| GET    | `/clients/payment-methods` |       | List<ClientPaymentMethodDTO> |

### `/clients/auth` — ClientAuthController

All endpoints `@PublicApi` **except** `/logout`. Cookies (access/refresh/`XSRF-TOKEN`) are set via `AuthCookieResponseFactory`; session/refresh/logout delegate to `JwtSessionService`. Sign-up requires email verification (OTP) before login.

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
