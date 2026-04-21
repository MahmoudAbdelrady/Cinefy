# CLAUDE.md — cinefy-backend

## Code Style

- Always declare explicit access modifiers (`public`, `protected`, `private`) on every class, field, method, and constructor. Do not leave anything package-private.
- In DTO classes, separate each field with a blank line — never stack fields without spacing.

## Stack

- **Spring Boot 4.0.5**, Java 25, Maven
- **PostgreSQL** (runtime), Hibernate with `hibernate.ddl-auto=update`
- **Lombok** for boilerplate (`@Getter`, `@Setter`, `@RequiredArgsConstructor`)
- **Hibernate Envers** for entity auditing (all entities via `BaseEntity`); configured with `store_data_at_delete=true` and `global_with_modified_flag=true`
- **Jakarta Validation** for request DTOs
- **commons-lang3** for string utilities (`StringUtils`)
- **Spring Mail + Thymeleaf** starters present (mail bean wired in `AppConfig`, no email flows yet)
- `@EnableJpaAuditing` and `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)` on `CinefyApplication`

## Package Structure

```
com.mdevs.cinefy
├── config/
│   ├── database/   — CinefyTableNamingStrategy
│   └── general/    — WebConfig (CORS), AppConfig (env detection)
├── controller/     — REST controllers (@RestController)
├── dto/            — Request/response DTOs
├── entity/         — JPA entities
├── repository/     — Spring Data JPA repositories
├── service/        — Business logic
├── shared/
│   └── exception/  — Global exception handler + exception types
└── utils/          — ExceptionResponseMaker
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

`HallRepository` uses `@EntityGraph(attributePaths = {"type", "categoryPrices", "seats"})` on `findByUuid` and `JOIN FETCH` in its custom paged query to avoid N+1 on hall loads. Apply the same pattern when adding new finders that need associations.

### Entity Code Pattern

Entities with user-facing names (Hall, HallType) derive a `code` field via a static `toCode(String name)` method (lowercased, spaces → underscores). Used for uniqueness checks and search.

### DTOs

- **Input DTOs** (e.g., `HallDTO`) — use Jakarta Validation annotations (`@NotBlank`, `@NotNull`, `@Min`, `@Valid`)
- **Output DTOs** — separate classes per use case:
  - `*SummaryDTO` — list/table views
  - `*DetailDTO` — full entity details
  - `*LayoutDTO` — domain-specific projections
- DTOs are plain Lombok `@Getter`/`@Setter` classes, no records
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
- `MethodArgumentNotValidException` → 400 with field-level errors
- Generic `Exception` → 500 (message hidden in production)

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

Enums:
  HallStatus:   SCHEDULED | NOW_SHOWING | ACTIVE | INACTIVE | UNDER_MAINTENANCE
  SeatCategory: NORMAL | VIP | AISLE
```

Both enums expose a static `fromString(String)` for parsing from API input — use it instead of `valueOf` so bad values raise `BusinessException` consistently.

### Seat Layout Conventions

Seat positions are strings matching `^([A-Z]+)([0-9]+)$` (e.g. `A1`, `AA15`). `HallService` defines `POSITION_PATTERN`, `toRowIndex(label)`, and `toRowLabel(index)` for converting between Excel-style row labels and 1-based indices. `mergeSeats` and `mergeCategoryPrices` perform in-place upserts (mutate matching rows, add new ones, `removeIf` the leftovers) so Envers doesn't record delete+insert churn on every update.

## API Endpoints

All under `/halls`:

| Method | Path                | Input          | Output          |
|--------|---------------------|----------------|-----------------|
| GET    | `/halls`            | ?search, ?excludeHallId, page | Page<HallSummaryDTO> |
| GET    | `/halls/statistics` |                | HallStatisticsDTO (totalHalls, activeHalls, totalCapacity) |
| GET    | `/halls/{uuid}`     |                | HallDetailDTO   |
| GET    | `/halls/{uuid}/layout` |             | HallLayoutDTO   |
| POST   | `/halls`            | HallDTO        | HallSummaryDTO  |
| PUT    | `/halls/{uuid}`     | HallDTO        | HallSummaryDTO  |
| DELETE | `/halls/{uuid}`     |                | 204             |
| GET    | `/halls/types`      |                | List<HallTypeDTO> |
| POST   | `/halls/types`      | HallTypeDTO    | HallTypeDTO     |
| PUT    | `/halls/types/{uuid}` | HallTypeDTO  | HallTypeDTO     |
| DELETE | `/halls/types/{uuid}` |              | 204             |