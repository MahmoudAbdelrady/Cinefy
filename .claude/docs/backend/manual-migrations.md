# Manual migrations

The schema comes from `ddl-auto=update`, which only **adds** things. It never drops a constraint it already generated, and it can't emit partial (`WHERE`) indexes or standalone unique indexes. Plain `@Index` annotations do work. Everything below has to be applied by hand. Record any new hand-applied SQL here.

## Payment gateways: two partial unique indexes

Hibernate has no annotation for a standalone `CREATE UNIQUE INDEX` (`@Index(unique=true)` renders as an invalid inline table constraint), so both are applied by hand:

```sql
-- single-active rule
CREATE UNIQUE INDEX UK_PAYMENT_GATEWAYS_ACTIVE
  ON PAYMENT_GATEWAYS (ACTIVE)
  WHERE ACTIVE;

-- code is unique only among live rows, so a deleted gateway frees its name
ALTER TABLE PAYMENT_GATEWAYS DROP CONSTRAINT <generated_code_unique_constraint>;

CREATE UNIQUE INDEX UK_PAYMENT_GATEWAYS_CODE
  ON PAYMENT_GATEWAYS (CODE)
  WHERE DELETED_AT IS NULL;
```

`PaymentGateway.code` lost its column-level `unique = true` for this reason; without the `ALTER TABLE`, soft-deleted names stay taken forever. Why the ACTIVE index matters: see [payments.md](payments.md#activation).

## Nullable password (OAuth clients)

OAuth-registered clients have no password, so `User.password` is nullable. On a database created before that change, OAuth sign-up fails until you drop the generated `NOT NULL` on each concrete table:

```sql
ALTER TABLE CLIENTS ALTER COLUMN PASSWORD DROP NOT NULL;
-- and STAFF_MEMBERS if it inherited the constraint
```

## Seat category `NORMAL` renamed to `STANDARD`

`SeatCategory.NORMAL` became `STANDARD`. Existing rows still hold `NORMAL` in `BOOKING_SEATS.CATEGORY` and as a JSON key in `HALLS.LAYOUT -> categories` and `HALLS.CATEGORY_PRICES`, which Hibernate can no longer map. The generated check constraint on `BOOKING_SEATS.CATEGORY` also still lists the old value, and `ddl-auto=update` never replaces it:

```sql
ALTER TABLE BOOKING_SEATS DROP CONSTRAINT IF EXISTS BOOKING_SEATS_CATEGORY_CHECK;

UPDATE BOOKING_SEATS SET CATEGORY = 'STANDARD' WHERE CATEGORY = 'NORMAL';

ALTER TABLE BOOKING_SEATS
  ADD CONSTRAINT BOOKING_SEATS_CATEGORY_CHECK CHECK (CATEGORY IN ('STANDARD', 'VIP', 'AISLE'));

UPDATE HALLS
  SET CATEGORY_PRICES = (CATEGORY_PRICES - 'NORMAL') || jsonb_build_object('STANDARD', CATEGORY_PRICES -> 'NORMAL')
  WHERE CATEGORY_PRICES ? 'NORMAL';

UPDATE HALLS
  SET LAYOUT = jsonb_set(LAYOUT #- '{categories,NORMAL}', '{categories,STANDARD}', LAYOUT -> 'categories' -> 'NORMAL')
  WHERE LAYOUT -> 'categories' ? 'NORMAL';
```

## Timestamps `LocalDateTime` → `Instant` (`TIMESTAMPTZ`)

Point-in-time fields became `Instant` mapped to `TIMESTAMPTZ(0)`: `CREATED_AT` / `UPDATED_AT` (every `BaseEntity` table and its `_REVISIONS` copy), `BOOKINGS.EXPIRES_AT`, `INVALID_JWTS.EXPIRATION_DATE`, `PAYMENT_GATEWAYS.DELETED_AT`, `TMDB_MOVIES.LAST_SYNCED_AT`, and `SHOWTIMES.START_DATE_TIME` / `END_DATE_TIME`. `ddl-auto=update` never changes an existing column's type, so a database created before the change still has `timestamp without time zone` columns until you convert them.

The old values were wall-clock times without a zone, and they came from two different sources:

- **System timestamps** (everything except showtimes) were written by `LocalDateTime.now()`, i.e. in the backend JVM's zone. That's **UTC** for the prod image (eclipse-temurin alpine, no `TZ` set). For a local `spring-boot:run`, it's your machine's zone.
- **Showtime start/end** are what staff typed in the management app (`'2026-04-25T19:30:00'`, no offset), i.e. **cinema-local** time (`app.cinema-time-zone`, `Africa/Cairo` by default).

Stop the backend first (the scheduled jobs write to these columns every minute), then run with the right zones filled in:

```sql
BEGIN;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND data_type = 'timestamp without time zone'
      AND column_name IN ('created_at', 'updated_at', 'expires_at', 'expiration_date', 'deleted_at', 'last_synced_at')
  LOOP
    -- 'UTC' for prod; the machine's zone for a local database
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE TIMESTAMPTZ(0) USING %I AT TIME ZONE %L',
                   r.table_name, r.column_name, r.column_name, 'UTC');
  END LOOP;

  FOR r IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND data_type = 'timestamp without time zone'
      AND column_name IN ('start_date_time', 'end_date_time')
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE TIMESTAMPTZ(0) USING %I AT TIME ZONE %L',
                   r.table_name, r.column_name, r.column_name, 'Africa/Cairo');
  END LOOP;
END $$;

-- should return no rows
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND data_type = 'timestamp without time zone';

COMMIT;
```

The loops match on column name, so they also catch the Envers `_REVISIONS` copies and skip tables that don't exist. Indexes on these columns are rebuilt by the `ALTER`.
