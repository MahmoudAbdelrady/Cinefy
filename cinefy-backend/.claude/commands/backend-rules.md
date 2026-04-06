# Backend Rules

When working on the `cinefy-backend` module, always enforce these rules:

## 1. Avoid N+1 Queries

Any time a repository method returns a collection or a single entity whose associations are accessed afterwards, eagerly load those associations at the query level — never rely on lazy loading triggering separate queries in a loop.

**How to apply:**
- For `@ManyToOne` / `@OneToOne`: use `@EntityGraph(attributePaths = "fieldName")` on the repository method.
- For multiple `@OneToMany` collections fetched together on a single entity: declare fields as `Set<T>` (not `List<T>`) and use `@EntityGraph(attributePaths = {"col1", "col2"})`.
- For paginated queries (`Page<T>`): only use `@EntityGraph` on `@ManyToOne` associations — never on `@OneToMany` collections (causes in-memory pagination / `HHH90003004`).
- Alternative when filtering/ordering on the joined table is needed: use a custom `@Query` with `JOIN FETCH`.

**Example:**
```java
// Single entity — loads all needed associations in one query
@EntityGraph(attributePaths = {"type", "categoryPrices", "seats"})
Optional<Hall> findByUuid(String uuid);

// Paginated list — only ManyToOne is safe here
@EntityGraph(attributePaths = "type")
Page<Hall> findAll(Pageable pageable);
```

---

## 2. Index Every Foreign Key Column

Any `@ManyToOne` or `@OneToOne` field in an entity must have a corresponding `@Index` on the FK column in `@Table`. PostgreSQL does **not** create indexes for foreign keys automatically.

**Column naming:** follows `CinefyTableNamingStrategy` — camelCase field `hallType` → column `HALL_TYPE_ID`.

**How to apply:**
- If the entity already has `@Table`: add the index to the existing `indexes` array.
- If the entity has no `@Table`: add one.

**Example:**
```java
@Entity
@Table(indexes = {
    @Index(columnList = "HALL_TYPE_ID"),
    @Index(columnList = "ANOTHER_FK_ID")
})
public class MyEntity extends BaseEntity { ... }
```