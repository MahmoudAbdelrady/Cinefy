# File methods order

Ordering rules for methods within a single Java class (primarily services, but applicable to any class with public methods and private helpers).

## Top-level layout

Inside the class body, group members in this order:

1. **Injected dependencies** (`@RequiredArgsConstructor` `private final` fields).
2. **Static constants** (`private static final ...`).
3. **Public API methods** — separator comment: `// ========================= Public API =========================`.
4. **Private helpers** — separator comment: `// =========================== Helpers ===========================`.

## Public method order

Reads before mutations.

1. **Read methods** (no `@Transactional`): `get*`, `list*`, `find*` returning DTOs/data — things that only query and project.
2. **Mutation methods** (`@Transactional`): `create*`, `update*`, `delete*`, and domain actions like `publish*`, `cancel*`, `publish*`.

Within each sub-group, order by logical workflow:

- Read: list → detail → statistics → specialized projections. "Narrow to broad" or "simple to specialized" both work; pick what matches the domain flow.
- Mutation: `create` → `update` → `delete` → domain actions. CRUD first so newcomers find the expected verbs near the top; domain actions (`publish`, `cancel`, etc.) after.

## Private helper order

Group helpers by **role**, not by first-use. Within each group, order by first use from the public methods above.

Role groups, top-to-bottom:

1. **Lookup helpers** — `find*` methods that load an entity by uuid/id and throw `NotFoundException` on miss. These produce inputs consumed by everything else.
2. **Validators** — `validate*` methods that throw `BusinessException` for rule violations. Gatekeepers that decide whether a mutation may proceed.
3. **Side-effect helpers** — helpers that perform mutations or cascading state changes (e.g., `flipHallIfNoActiveShowtimes`, `publishOneShowtime`, `publishDraftsForMovie`). These contain the actual "do the thing" logic. If a helper mixes validation with mutation (e.g. `publishOneShowtime` checks status _and_ writes), it belongs in this group — the dominant role is the mutation.
4. **Mappers** — entity/DTO transformations. Placed after side-effect helpers because they're reference material: a reader skimming top-to-bottom sees control flow first, schema-shaped code next-to-last.
   - Within mappers: put **DTO → entity** mappers (e.g. `applyDtoToShowtime`) before **entity → DTO** mappers. The former is used during create/update; the latter during response shaping.
   - **Within each direction, order by first use from the public methods above.** If mapper A is called before mapper B in the file's public API section, A goes above B. Applies to both DTO→entity and entity→DTO groups independently.
5. **Utilities** — pure stateless helpers with no domain role (math, parsing, string manipulation, format conversions). Examples: `toRowIndex`, `toRowLabel`, regex-matching predicates used by multiple role groups. Placed last because they're the leaves of the call graph — referenced by everything above, depending on nothing.

## Why this order

The helper section mirrors how a mutation method executes:

1. Look up inputs (lookup helpers).
2. Check if the operation is legal (validators).
3. Perform the mutation (side-effect helpers).
4. Shape the response (mappers).
5. Utilities underpin everything above.

Top-to-bottom reads as: "how do I find stuff → how do I check it → how do I change it → how do I describe it → low-level building blocks." Each role group conceptually depends on the previous one (and on utilities); none depend on the next.

## Exceptions

- If a class has only one or two helpers, don't over-engineer — put them in a sensible order and move on. The structure above is for services with five or more helpers.
- If a helper is used by exactly one public method and has no reuse, consider inlining it instead of adding another helper row.
- If strict role grouping would separate two helpers that are always called together in the same pipeline (e.g., a validator and its companion mapper), you may place them adjacent — clarity beats rigid grouping.

## Reference implementation

See `ShowtimeService` for a class that applies all the rules end-to-end.
