# Staff members

`StaffMemberController` (`/staff`) + `StaffMemberService`. Access per endpoint is in [security.md](security.md#access-per-controller). Phone numbers are validated/normalized with libphonenumber before persistence.

## Admin account policy

The `ADMIN` staff member (the bootstrap account seeded by `ensureAdminExists`) is invisible and untouchable to everyone but itself.

- **Not editable by anyone, including the admin itself.** Any mutation targeting an `ADMIN` row throws `ForbiddenException` (403). Call `StaffMemberService.validateNotAdminAccount(...)` at **every** entry point that mutates an existing staff row — currently `updateStaffMember`, `deleteStaffMember`, `updateProfile`, `changePassword`, `updatePassword` — not only the ones reachable today. The guard belongs at the mutation site so it doesn't depend on an upstream check.
- **Nobody can be made an admin.** Creation and update reject the `ADMIN` position in `validateStaffMember` ("Assigning the admin position is not allowed", 422).
- **Not viewable except by the admin itself.** A `MANAGER` must not see the admin's details. `validateCanViewStaffMember(StaffMember)` loads the target first: an `ADMIN` target is visible only to itself; otherwise admin/manager/self may view. For a new single-staff read, fetch the entity and pass it in — the rule depends on the target's position, so a uuid alone isn't enough.
- **Excluded from lists and aggregates at the SQL level:** `findAllFiltered` has `WHERE s.position != 'ADMIN'` (it also excludes the caller's own row, `s.uuid != :currentUserUuid`), and position coverage / on-shift totals skip `ADMIN`. Apply the same exclusion to any new staff-listing query.

## Working week

`validateWorkingWeek` requires `FULL_TIME` staff to work 5–6 days and `PART_TIME` staff 2–4 days, with exactly 8 working hours a day.

## Manager tier

Authority is tiered: `ADMIN` > `MANAGER` > `CASHIER`/`USHER`. A manager may manage cashiers and ushers, but only an admin can create, edit, delete, promote to or demote from `MANAGER`.

`validateCanManageManagerTier(currentPosition, resultingPosition)` throws 403 when a non-admin touches a row whose **current** or **resulting** position is `MANAGER`. It's called from `createStaffMember` (resulting only), `updateStaffMember` (both) and `deleteStaffMember` (current only). Checking both closes the backdoors: no promoting a cashier to manager, no editing a peer manager, no demoting a peer to hide a change. Self-edits via `/staff/me` aren't affected.

For a new staff mutation, decide whether it can change or target the manager tier and call the validator, passing the **pre-mutation** position (capture it before `populateFromDto` overwrites it).

## On-shift summary

`GET /staff/on-shift` is a two-stage filter: hours in SQL, days in Java.

- `findAllOnShiftAt(time)` matches working hours, including wrap-around night shifts (`workingHourStart > workingHourEnd`).
- `StaffMemberService.isWorkingDay` shifts the current day back by one when the shift wraps **and** the time is before `workingHourStart` — after midnight, it's still yesterday's shift.
- `isDayInRange` compares `DayOfWeek.getValue()` manually, because a working week can wrap too (Saturday → Wednesday).

Changing either half means changing both. The response's `details` map holds exactly `MANAGER`/`CASHIER`/`USHER`, always present (see [statistics.md](statistics.md#count-by-enum-responses)).
