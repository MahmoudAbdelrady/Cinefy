# Dashboard page (`/`)

The dashboard is **position-gated per widget**, not per route — `/` is reachable by every position, and `DashboardPage` decides what to render from the current staff member:

| Widget                                                                    | Gate          |
| ------------------------------------------------------------------------- | ------------- |
| `today-statistics`, `halls-summary`, `active-gateway`, `on-shift-summary` | `canManage()` |
| `today-schedule`                                                          | `canBook()`   |
| `scan-ticket-modal` (inline card)                                         | `isUsher()`   |

`canManage` / `canBook` come from `shared/access.ts`; `isUsher` is a direct `position === 'USHER'` check. **Each gate must match the role its widget's endpoint requires** — every manage-gated widget calls an ADMIN/MANAGER-only endpoint, so ungating one produces a 403 toast on page load rather than a hidden card. All three computeds return `false` until `/staff/me` resolves, so widgets appear once instead of flashing. `today-schedule` also takes a `canManage` input from the page: its action reads "Manage showtimes" for ADMIN/MANAGER and "View showtimes" for a cashier.

`.dv-columns` sets its two-column desktop template behind `&:has(today-schedule):has(.dv-side)` — with one column gated away, the survivor would otherwise sit in a 1.9fr track with dead space beside it.

## Widget shape

Every widget is built on `dashboard-widget` (card shell; inputs `icon`, `header`, `subtitle`, `iconColor`, `actionLabel`, `actionIcon`, `actionLink`; `<ng-content>` body) and follows the same data shape:

- a `signal` holding the response (`null` / `[]` until loaded) and `computed`s deriving the view model;
- `loading` and `failed` signals;
- a fetch fired from `afterNextRender` with `skipServerErrorToast()`. The `error` handler sets `failed`, `finalize(...)` clears `loading`, and the template renders `loading → failed → data`, with `<cui-error-state header="Couldn't load …" />` as the failed branch.

Exceptions: `active-gateway` fetches with `skipErrorToast()` and sets `failed` only for non-404 errors (404 means "no gateway active" and falls through to its own empty state); `today-statistics` has no failed branch — it renders its four figures as `-`, like the `app-stats` cards.

Loading branches use `<cui-loading-spinner variant="lg" />` inside a block whose `min-height` matches the widget's loaded height, so cards don't collapse and jump.
