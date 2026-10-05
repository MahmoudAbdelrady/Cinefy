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
