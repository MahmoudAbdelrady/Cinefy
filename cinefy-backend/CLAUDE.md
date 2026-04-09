# CLAUDE.md — cinefy-backend

## Stack

- **Spring Boot 4.0.5**, Java 25, Maven
- **PostgreSQL** (runtime), Hibernate with `hibernate.ddl-auto=update`
- **Lombok** for boilerplate (`@Getter`, `@Setter`, `@RequiredArgsConstructor`)
- **Hibernate Envers** for entity auditing (all entities via `BaseEntity`)
- **Jakarta Validation** for request DTOs
- **commons-lang3** for string utilities (`StringUtils`)

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

### BaseRepository

All repositories extend `BaseRepository<T extends BaseEntity>` which extends `JpaRepository<T, Long>`.

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

## API Endpoints

All under `/halls`:

| Method | Path                | Input          | Output          |
|--------|---------------------|----------------|-----------------|
| GET    | `/halls`            | ?search, page  | Page<HallSummaryDTO> |
| GET    | `/halls/{uuid}`     |                | HallDetailDTO   |
| GET    | `/halls/{uuid}/layout` |             | HallLayoutDTO   |
| POST   | `/halls`            | HallDTO        | HallSummaryDTO  |
| PUT    | `/halls/{uuid}`     | HallDTO        | HallSummaryDTO  |
| DELETE | `/halls/{uuid}`     |                | 204             |
| GET    | `/halls/types`      |                | List<HallTypeDTO> |
| POST   | `/halls/types`      | HallTypeDTO    | HallTypeDTO     |
| PUT    | `/halls/types/{uuid}` | HallTypeDTO  | HallTypeDTO     |
| DELETE | `/halls/types/{uuid}` |              | 204             |