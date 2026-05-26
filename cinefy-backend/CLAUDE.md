# CLAUDE.md — cinefy-backend

## Code Style

- Always declare explicit access modifiers (`public`, `protected`, `private`) on every class, field, method, and constructor. Do not leave anything package-private.
- In DTO classes, separate each field with a blank line — never stack fields without spacing.
- For method ordering within a class (public API layout, helper grouping by role, mapper placement), follow [.claude/rules/file-methods-order.md](.claude/rules/file-methods-order.md) — check it at the start of each session.

## Required Configuration

The app won't boot without these (typically set in `application-local.properties` for dev):

- `cinefy.encryption.key` — Base64-encoded 32-byte AES key for `CredentialCipher` (payment-method secret encryption). `CredentialCipher` throws at construction time if missing or wrong length.
- `cinefy.mail.username` / `cinefy.mail.password` — Gmail SMTP creds for the `JavaMailSender` bean in `AppConfig`.
- `app.frontend.url` — single allowed CORS origin (read by `SecurityConfig`).
- `app.tmdb.api-base-url`, `app.tmdb.image-base-url` — defaulted in `application.properties` to TMDB v3; the TMDB API key itself is read by `TmdbMovieService` from configuration.
- `app.paymob.api-base-url` — defaulted in `application.properties` to `https://accept.paymob.com`.

## Stack

- **Spring Boot 4.0.5**, Java 25, Maven
- **PostgreSQL** (runtime), Hibernate with `hibernate.ddl-auto=update`
- **Lombok** for boilerplate (`@Getter`, `@Setter`, `@RequiredArgsConstructor`)
- **Hibernate Envers** for entity auditing (all entities via `BaseEntity`); configured with `store_data_at_delete=true` and `global_with_modified_flag=true`
- **Jakarta Validation** for request DTOs
- **commons-lang3** for string utilities (`StringUtils`)
- **Spring Security** — wired in `SecurityConfig` (CSRF off, CORS allow-list of `app.frontend.url`, stateless sessions, `@EnableMethodSecurity`). Authentication is JWT-in-cookie: `JwtAuthenticationFilter` reads the access-token cookie, validates it (with an `InvalidJwtService` blocklist check), and populates a `UserPrincipal`. `CinefyApiAuthorizationManager` gates `anyRequest()` — every endpoint requires an authenticated user **unless** the controller/handler is annotated `@PublicApi` (e.g. login, forgot-password). Position/role authorization is enforced per-endpoint via `@PreAuthorize("hasAnyRole(...)")` on controllers (roles map to the `StaffPosition` enum: ADMIN/MANAGER/CASHIER/USHER). Login uses a `DaoAuthenticationProvider` over `StaffMemberService` + `BCryptPasswordEncoder`.
- **Spring Mail + Thymeleaf** starters present (mail bean wired in `AppConfig`, no email flows yet)
- **Scheduling** — `@EnableScheduling` on `CinefyApplication`; jobs live under `job/` (`ShowtimeStatusJob` every 60s; `TmdbSyncJob` cron `0 0 3 * * *`)
- **AOP** — `RequestLoggingAspect` (around any `@RestController`) and `TransactionLoggingAspect` (around any `@Transactional`) under `aspect/`, both delegating to `LoggingUtil`
- **TMDB integration** — `TmdbMovieService` calls TheMovieDB via `RestClient` (`app.tmdb.api-base-url`), caches results in the local `TmdbMovie` table
- **Paymob integration** — `PaymobClient` under `shared/payment/` performs connection tests against `app.paymob.api-base-url` using `RestClient`
- **Credential encryption** — `CredentialCipher` under `shared/security/` (AES-256-GCM); requires `cinefy.encryption.key` (Base64 of 32 bytes). Used to encrypt payment-method secrets before persisting.
- **libphonenumber** (Google) — phone validation/normalization for `StaffMember`
- `@EnableJpaAuditing`, `@EnableScheduling`, and `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)` on `CinefyApplication`

## Package Structure

```
com.mdevs.cinefy
├── config/
│   ├── database/   — CinefyTableNamingStrategy
│   └── general/    — AppConfig (mail, env, password encoder), SecurityConfig (CORS + filter chain)
├── controller/     — REST controllers (@RestController)
│                     Hall, Showtime, StaffMember, PaymentMethod, TmdbMovie, ManagementAuth
├── filter/         — JwtAuthenticationFilter (cookie JWT → SecurityContext)
├── dto/            — Request/response DTOs, grouped per domain
│   ├── hall/       — HallDTO, HallDetailDTO, HallLayoutDTO, HallSummaryDTO,
│   │                  HallReferenceDTO, HallTypeDTO, HallStatisticsDTO,
│   │                  SeatLayoutDTO, TicketPricingDTO
│   ├── movie/      — MovieSearchResultDTO, MovieDetailDTO
│   ├── showtime/   — ShowtimeDTO, ShowtimeSummaryDTO, MovieShowtimesDTO,
│   │                  MovieShowtimeDatesDTO, MovieShowtimeListItemDTO,
│   │                  MovieShowtimeCountProjection, MovieWithShowtimesDTO,
│   │                  ShowtimesStatisticsDTO, PublishShowtimesDTO
│   ├── staff/      — StaffMemberDTO, StaffMemberDetailDTO, StaffMemberSummaryDTO,
│   │                  PositionCoverageDTO, PositionCoverageItemDTO, PositionCoverageProjection
│   ├── payment/    — PaymentMethodDTO, PaymentMethodDetailDTO, PaymentMethodSummaryDTO,
│   │                  PaymentMethodStatusRequestDTO, PaymentMethodTestResultDTO,
│   │                  TestConnectionRequestDTO
│   └── auth/       — ManagementLoginDTO, ForgotPasswordDTO, VerifyResetCodeDTO,
│                      ResetPasswordDTO, TokenPairDTO
├── entity/         — JPA entities (@Entity / @MappedSuperclass)
│                     Hall, HallType, HallCategoryPrice, Seat, Showtime, TmdbMovie,
│                     User (MappedSuperclass), StaffMember, PaymentMethod, InvalidJwt, Otp
│   └── enums/      — domain enums (all enums live here, not beside their entity)
│                     HallStatus, SeatCategory, ShowtimeStatus, StaffPosition,
│                     EmploymentType, PaymentMethodStatus, PaymentMethodTestStatus,
│                     PaymentMethodType, PaymentProvider, UserType, OtpType
├── repository/     — Spring Data JPA repositories (extend BaseRepository)
├── service/        — Business logic (HallService, ShowtimeService, StaffMemberService,
│                     PaymentMethodService, TmdbMovieService, ManagementAuthService,
│                     OtpService, EmailService, InvalidJwtService)
├── aspect/         — RequestLoggingAspect, TransactionLoggingAspect
├── job/            — Scheduled jobs: ShowtimeStatusJob, TmdbSyncJob
├── shared/
│   ├── annotation/ — @PublicApi (marks endpoints that skip authentication)
│   ├── exception/  — Global @RestControllerAdvice + exception types
│   │                 (Business, NotFound, Forbidden, Unauthorized) + ErrorCode
│   ├── payment/    — PaymobClient (RestClient wrapper for Paymob test-connection)
│   ├── security/   — JwtUtil, JwtClaims, TokenType, UserPrincipal, SecurityUtil,
│   │                 CinefyApiAuthorizationManager, CinefyAuthenticationEntryPoint,
│   │                 CredentialCipher (AES-256-GCM for payment secrets)
│   └── validation/ — ValidationPatterns (shared regex constants for DTO @Pattern)
└── utils/          — ExceptionResponseMaker, LoggingUtil, TmdbGenres, CookieUtil
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

`HallRepository` uses `@EntityGraph(attributePaths = {"type", "categoryPrices", "seats"})` on `findByUuid` and `JOIN FETCH` in its custom paged query to avoid N+1 on hall loads. Apply the same pattern when adding new finders that need associations.

### Entity Code Pattern

Entities with user-facing names (Hall, HallType) derive a `code` field via a static `toCode(String name)` method (lowercased, spaces → underscores). Used for uniqueness checks and search.

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

### Exception Handling

Global `@RestControllerAdvice` in `CinefyExceptionHandler`:

- `BusinessException` → 400
- `NotFoundException` → 404
- `UnauthorizedException` → 401
- `ForbiddenException` → 403
- `MethodArgumentNotValidException` → 400 with field-level errors
- Generic `Exception` → 500 (message hidden in production)

### Scheduled Jobs

Under `job/`:

- **`ShowtimeStatusJob`** — `@Scheduled(fixedDelay = 60_000)`; calls `ShowtimeRepository.markRunningAsOf(now)` / `markFinishedAsOf(now)` to advance `Showtime.status` based on `startDateTime` / `endDateTime`.
- **`TmdbSyncJob`** — cron `0 0 3 * * *` (daily 03:00); deletes orphan `TmdbMovie` rows that no `Showtime` references, then refreshes the rest in batches of 50 against the TMDB API.

When adding a new scheduled job: place it under `job/`, use `@Slf4j` + `@Scheduled`, and inject repositories/services through `@RequiredArgsConstructor`.

### Logging Aspects

- `RequestLoggingAspect` — pointcut `within(@RestController *)`; logs `(METHOD) Request URI: ...` around every controller call.
- `TransactionLoggingAspect` — pointcut `@annotation(...Transactional)`; logs `Transaction with method: Class.method` around every `@Transactional` invocation.

Both delegate to `LoggingUtil.proceedWithLogging(...)`. Don't add ad-hoc `log.info(...)` around controller/transaction entry points — the aspects already cover that.

### Security & Encryption

- `SecurityConfig` builds the `SecurityFilterChain`: CSRF disabled, CORS allow-list bound to `AppConfig.getFrontendUrl()`, stateless sessions, `@EnableMethodSecurity`, a custom `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`, and `anyRequest().access(apiAuthorizationManager)`.
- `CinefyApiAuthorizationManager` (`AuthorizationManager<RequestAuthorizationContext>`) resolves the target handler and allows the request when it (or its controller) carries `@PublicApi`; otherwise it requires a non-anonymous authenticated principal. Mark new unauthenticated endpoints with `@PublicApi`.
- `JwtAuthenticationFilter` extracts the access token from the `ACCESS_TOKEN_COOKIE`, parses it via `JwtUtil`, skips blocklisted tokens (`InvalidJwtService`), and sets a `UserPrincipal` authentication. Auth is stateless — no server session.
- Endpoint authorization uses `@PreAuthorize("hasAnyRole(...)")` on controllers, keyed to `StaffPosition` (`ADMIN`, `MANAGER`, `CASHIER`, `USHER`). When adding an endpoint, put the role rule on the controller method/class (not the service) to match the existing pattern. `CinefyAuthenticationEntryPoint` returns the 401 body for unauthenticated requests.
- `BCryptPasswordEncoder` bean (in `AppConfig`) — used by `StaffMemberService` when storing/updating `password`.
- `CredentialCipher` (AES-256-GCM, `cinefy.encryption.key` required, Base64-encoded 32-byte key) — encrypts payment-method secrets (`secretKey`, `hmacKey`) at rest. The cipher output prepends a fresh IV per call and tags the value with the GCM authentication tag.

### Naming Strategy

`CinefyTableNamingStrategy` maps:

- Entity names → `UPPER_PLURAL` table names
- camelCase fields → `UPPER_SNAKE_CASE` columns
- Audit tables use `_REVISIONS` suffix

### Relationships

- `CascadeType.ALL` + `orphanRemoval = true` on parent-owned collections
- `FetchType.LAZY` on all `@ManyToOne` associations
- Collections use `Set`, not `List`

## Current Domain

```
Hall
 ├── name, code (unique, derived)
 ├── totalRows, totalColumns
 ├── status (HallStatus enum)
 ├── type → HallType (ManyToOne)
 ├── supports3D
 ├── categoryPrices → Set<HallCategoryPrice> (OneToMany, orphanRemoval)
 └── seats → Set<Seat> (OneToMany, orphanRemoval)

Seat
 ├── hall → Hall (ManyToOne)
 ├── category (SeatCategory enum)
 ├── rowPosition (String, e.g. "A", "AA")
 ├── columnPosition (String, e.g. "1", "15")
 ├── onSiteOnly (boolean)
 └── getPosition() → rowPosition + columnPosition

HallCategoryPrice
 ├── hall → Hall (ManyToOne)
 ├── category (SeatCategory enum)
 └── ticketPrice (BigDecimal)

TmdbMovie  (NOT a BaseEntity — TMDB id is the @Id; no UUID, no audit)
 ├── id (Long, from TMDB)
 ├── title, synopsis, genres, contentRating
 ├── releaseDate, durationMinutes
 ├── posterUrl, backdropUrl
 └── lastSyncedAt (refreshed by TmdbSyncJob)

Showtime
 ├── startDateTime, endDateTime (TIMESTAMP(0))
 ├── hall → Hall (ManyToOne)
 ├── tmdbMovie → TmdbMovie (ManyToOne)
 ├── specialNotes
 ├── is3D
 └── status (ShowtimeStatus enum, default DRAFT)

User (@MappedSuperclass — abstract; no table)
 ├── firstName, lastName, fullName (derived)
 ├── username (unique), email (unique)
 ├── phoneNumber (digits only — frontend owns the +)
 └── password (bcrypt-hashed)

StaffMember extends User
 ├── position (StaffPosition enum)
 ├── employmentType (EmploymentType enum)
 ├── workingDayStart, workingDayEnd (java.time.DayOfWeek)
 └── workingHourStart, workingHourEnd (LocalTime)

PaymentMethod
 ├── name
 ├── provider (PaymentProvider enum — currently PAYMOB only)
 ├── type (PaymentMethodType enum)
 ├── status (PaymentMethodStatus, default DRAFT)
 ├── isTest
 ├── secretKey, hmacKey (TEXT, AES-encrypted via CredentialCipher)
 ├── publicKey, integrationId, currency
 ├── testStatus (PaymentMethodTestStatus, default UNTESTED)
 ├── testFailureReason, testedAt
 └── credentialsRotatedAt

Enums:
  HallStatus:              SCHEDULED | NOW_SHOWING | ACTIVE | INACTIVE | UNDER_MAINTENANCE
  SeatCategory:            NORMAL | VIP | AISLE
  ShowtimeStatus:          DRAFT | PUBLISHED | RUNNING | FINISHED | CANCELLED
  StaffPosition:           ADMIN | MANAGER | CASHIER | USHER
  EmploymentType:          FULL_TIME | PART_TIME
  PaymentProvider:         PAYMOB
  PaymentMethodType:       CARD | WALLET | INSTALLMENT
  PaymentMethodStatus:     DRAFT | ACTIVE | INACTIVE
  PaymentMethodTestStatus: UNTESTED | SUCCESS | FAILURE
```

Enums expose a static `fromString(String)` for parsing from API input — use it instead of `valueOf` so bad values raise `BusinessException` consistently.

### Seat Layout Conventions

Seat positions are strings matching `^([A-Z]+)([0-9]+)$` (e.g. `A1`, `AA15`). `HallService` defines `POSITION_PATTERN`, `toRowIndex(label)`, and `toRowLabel(index)` for converting between Excel-style row labels and 1-based indices. `mergeSeats` and `mergeCategoryPrices` perform in-place upserts (mutate matching rows, add new ones, `removeIf` the leftovers) so Envers doesn't record delete+insert churn on every update.

## API Endpoints

### `/management/auth` — ManagementAuthController

All endpoints `@PublicApi` (skip authentication) **except** `/logout`. Tokens are set/cleared as HTTP-only cookies (`ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`).

| Method | Path                                 | Input                  | Output / Effect                                  |
| ------ | ------------------------------------ | ---------------------- | ------------------------------------------------ |
| POST   | `/management/auth/login`             | ManagementLoginDTO     | 200 + sets access/refresh cookies                |
| POST   | `/management/auth/refresh`           | refresh cookie         | 200 + new access cookie (rotates refresh if any) |
| GET    | `/management/auth/session`           | refresh cookie         | 200 if valid, else 401                           |
| POST   | `/management/auth/logout`            | access/refresh cookies | 200 + clears cookies (blocklists tokens)         |
| POST   | `/management/auth/forgot-password`   | ForgotPasswordDTO      | 204 (emails reset OTP)                           |
| POST   | `/management/auth/verify-reset-code` | VerifyResetCodeDTO     | 204 (validates OTP)                              |
| POST   | `/management/auth/reset-password`    | ResetPasswordDTO       | 204 (consumes OTP, sets new password)            |

### `/halls` — HallController

| Method | Path                   | Input                         | Output                                                     |
| ------ | ---------------------- | ----------------------------- | ---------------------------------------------------------- |
| GET    | `/halls`               | ?search, ?excludeHallId, page | Page<HallSummaryDTO>                                       |
| GET    | `/halls/statistics`    |                               | HallStatisticsDTO (totalHalls, activeHalls, totalCapacity) |
| GET    | `/halls/{uuid}`        |                               | HallDetailDTO                                              |
| GET    | `/halls/{uuid}/layout` |                               | HallLayoutDTO                                              |
| POST   | `/halls`               | HallDTO                       | HallSummaryDTO                                             |
| PUT    | `/halls/{uuid}`        | HallDTO                       | HallSummaryDTO                                             |
| DELETE | `/halls/{uuid}`        |                               | 204                                                        |
| GET    | `/halls/types`         |                               | List<HallTypeDTO>                                          |
| POST   | `/halls/types`         | HallTypeDTO                   | HallTypeDTO                                                |
| PUT    | `/halls/types/{uuid}`  | HallTypeDTO                   | HallTypeDTO                                                |
| DELETE | `/halls/types/{uuid}`  |                               | 204                                                        |

### `/movies` — TmdbMovieController

| Method | Path               | Input           | Output                     |
| ------ | ------------------ | --------------- | -------------------------- |
| GET    | `/movies/search`   | ?query, page    | Page<MovieSearchResultDTO> |
| GET    | `/movies/upcoming` | ?limit          | List<MovieSearchResultDTO> |
| GET    | `/movies/{id}`     | (TMDB id, Long) | MovieDetailDTO             |

Note: `{id}` is the raw TMDB id, **not** a uuid — `TmdbMovie` isn't a `BaseEntity`.

### `/showtimes` — ShowtimeController

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

| Method | Path                       | Input          | Output                      |
| ------ | -------------------------- | -------------- | --------------------------- |
| GET    | `/staff`                   | ?search, page  | Page<StaffMemberSummaryDTO> |
| GET    | `/staff/position-coverage` |                | PositionCoverageDTO         |
| GET    | `/staff/{uuid}`            |                | StaffMemberDetailDTO        |
| POST   | `/staff`                   | StaffMemberDTO | StaffMemberSummaryDTO       |
| PUT    | `/staff/{uuid}`            | StaffMemberDTO | StaffMemberSummaryDTO       |
| DELETE | `/staff/{uuid}`            |                | 204                         |

Phone numbers in `StaffMemberDTO` are validated/normalized with Google libphonenumber before persistence.

### `/payment-methods` — PaymentMethodController

| Method | Path                                      | Input                         | Output                        |
| ------ | ----------------------------------------- | ----------------------------- | ----------------------------- |
| GET    | `/payment-methods`                        |                               | List<PaymentMethodSummaryDTO> |
| GET    | `/payment-methods/{uuid}`                 |                               | PaymentMethodDetailDTO        |
| POST   | `/payment-methods`                        | PaymentMethodDTO              | PaymentMethodSummaryDTO       |
| PUT    | `/payment-methods/{uuid}`                 | PaymentMethodDTO              | PaymentMethodSummaryDTO       |
| DELETE | `/payment-methods/{uuid}`                 |                               | 204                           |
| POST   | `/payment-methods/test-connection`        | TestConnectionRequestDTO      | 204 / error (pre-save test)   |
| POST   | `/payment-methods/{uuid}/test-connection` |                               | PaymentMethodTestResultDTO    |
| POST   | `/payment-methods/{uuid}/status`          | PaymentMethodStatusRequestDTO | 204                           |

Secrets in `PaymentMethodDTO` are encrypted with `CredentialCipher` before being written to `secretKey`/`hmacKey`. The pre-save `test-connection` endpoint lets the UI verify credentials before creating the row; the per-id variant re-tests using the stored (decrypted) credentials and writes `testStatus` / `testFailureReason` / `testedAt` back to the entity.
