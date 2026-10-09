# CLAUDE.md — cinefy-backend

Spring Boot 4.1.1 REST API: Java 25, Maven, PostgreSQL (schema via Hibernate `ddl-auto=update`), Hibernate Envers auditing, Lombok, Jackson 3, JWT-in-cookie security, springdoc.

## Reference docs

Detailed docs live in [`../.claude/docs/backend/`](../.claude/docs/backend/). Read the one for the area you're changing before you change it.

| Working on                                                         | Read                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Config properties, profiles, a new setting                         | [configuration.md](../.claude/docs/backend/configuration.md) |
| Where a new class goes                                             | [structure.md](../.claude/docs/backend/structure.md)         |
| Entities, repositories, queries, DTO shape                         | [persistence.md](../.claude/docs/backend/persistence.md)     |
| Entity semantics, enums, seat positions                            | [domain-model.md](../.claude/docs/backend/domain-model.md)   |
| Security config, filters, auth contexts, endpoint access, API docs | [security.md](../.claude/docs/backend/security.md)           |
| Login, sessions, OTP, OAuth, client profile                        | [auth.md](../.claude/docs/backend/auth.md)                   |
| Staff endpoints, admin and manager rules, on-shift                 | [staff.md](../.claude/docs/backend/staff.md)                 |
| Bookings, holds, tickets, saved cards                              | [bookings.md](../.claude/docs/backend/bookings.md)           |
| Payment gateways, Paymob, callbacks                                | [payments.md](../.claude/docs/backend/payments.md)           |
| Statistics, dashboard aggregate endpoints                          | [statistics.md](../.claude/docs/backend/statistics.md)       |
| Exceptions and status codes                                        | [errors.md](../.claude/docs/backend/errors.md)               |
| Scheduled jobs, logging aspects                                    | [jobs.md](../.claude/docs/backend/jobs.md)                   |

## Code style

- Always declare explicit access modifiers (`public`, `protected`, `private`) on every class, field, method, and constructor. Do not leave anything package-private.
- In DTO classes, separate each field with a blank line — never stack fields without spacing.
- For method ordering within a class (public API layout, helper grouping by role, mapper placement), follow [.claude/rules/file-methods-order.md](.claude/rules/file-methods-order.md) — check it at the start of each session.

## Rules

### Controllers

- `@RestController` + `@RequestMapping("/resource")`, `@RequiredArgsConstructor`, `@Valid @RequestBody`, `ResponseEntity<T>` with an explicit status. Entity path variables are UUIDs, never the DB `id`. Exceptions: movies use the raw TMDB id, ticket scanning uses the booking reference, and OAuth uses the provider name.
- Authorization is `@PreAuthorize` on the controller, never the service. Use `hasAuthority` / `hasAnyAuthority` — **never `hasRole` / `hasAnyRole`**: authorities have no `ROLE_` prefix, so those deny every request.
- An unauthenticated endpoint needs `@PublicApi`. Under a class-level `@PreAuthorize`, it also needs a method-level `@PreAuthorize("permitAll()")`.
- Staff-only endpoints list all four positions — never `isAuthenticated()`, which a `CLIENT` also passes.
- An empty response body is **204** (`ResponseEntity.noContent()`), never 200. An empty list is **200 `[]`**. (`POST /client/auth/sign-up` currently returns 201 with no body.)

### Services

- `@Service` + `@RequiredArgsConstructor`; `@Transactional` on mutating methods only; private `find*` helpers throw `NotFoundException`, private `validate*` helpers throw `BusinessException`; entity↔DTO mapping in private helpers (no mapper layer).
- Use `uuid` only for identifiers that come from outside (path variables, bodies). Once you hold an entity, pass its `id`.

### Errors

- `BusinessException` and field validation → **422**. 400 is only for unparseable bodies. Add an `ErrorCode` only when the frontend must branch on which 422 it got.
- `ConflictException` (409) is thrown only inside a `catch (DataIntegrityViolationException …)` — a constraint the DB actually rejected. A failed `existsBy*` pre-check is a `BusinessException`.
- Wrong content types and missing or mistyped request parameters have no handler and currently return 500.

### Persistence

- Fetch every association a mapper reads (`JOIN FETCH` / `@EntityGraph`) — no N+1. The `/backend-rules` command has the details.
- `@ManyToOne` is `LAZY`; association collections are `Set`; domain enums live in `entity/enums/` and expose `fromString` when parsed from input.
- `@Query` strings aren't checked by `mvn compile` — boot the app after adding or changing one.
- Schema changes `ddl-auto=update` can't make (dropping constraints, partial indexes) are applied by hand.

### Security

- `AuthContext` is the only source of auth-cookie names — never write a cookie-name literal.
- springdoc paths stay derived from `springdoc.base-url`, and that base must never be empty (the permit-all matcher would become `/**`).

### Staff

- Every mutation of an existing staff row calls `validateNotAdminAccount(...)`; creation and update reject the `ADMIN` position in `validateStaffMember`. A mutation that can touch the manager tier also calls `validateCanManageManagerTier(current, resulting)` with the pre-mutation position.
- New staff list or aggregate queries exclude `ADMIN`. A single-staff read passes the loaded entity to `validateCanViewStaffMember`.

### Payments

- Responses never include `secretKey` / `hmacKey`. `getActivePaymentGatewayForPayment()` returns unmasked credentials — never serialize it.
- `PaymentGatewayRepository.findByUuid` deliberately includes soft-deleted gateways. Don't add the `deletedAt` filter.

### Statistics

- Every statistics query filters `s.status IN REPORTABLE_STATUSES`.

### Logging and jobs

- Don't add ad-hoc `log.info` at controller or transaction entry points; the logging aspects cover them.
- New jobs go in `job/` with `@Slf4j` + `@Scheduled`.
