# Management routes and access

## Routes (`src/app/app.routes.ts`)

```
'' (AppLayout, canActivate: authGuard)        # redirects to /login if not authenticated
├── /           → DashboardPage     (canMatch: positionCanMatch)   all positions; gated per widget
├── /halls      → HallsPage         (canMatch: positionCanMatch)
├── /movies     → MoviesPage        (canMatch: positionCanMatch)   showtimes, counter booking, ticket scanning
├── /payment    → PaymentPage       (canMatch: positionCanMatch)   payment gateways
├── /staff      → StaffPage         (canMatch: positionCanMatch)
├── /statistics → StatisticsPage    (canMatch: positionCanMatch)
└── /profile    → ProfilePage       (no position gate)

'' (AuthLayout, canActivate: guestGuard)       # redirects away if already authenticated
├── /login           → LoginPage
└── /forgot-password → ForgotPasswordPage

**                 → NotFoundPage      (canActivate: authGuard)
```

The app is client-side rendered only (no SSR): browser APIs and `afterNextRender` need no SSR guards. Planned but not built: `/settings`.

## Position-based access

Staff positions are `ADMIN`, `MANAGER`, `CASHIER`, `USHER`. All rules live in `src/shared/access.ts`:

| Export                                            | Rule                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `ROUTE_ACCESS` / `canAccessRoute(path, position)` | `/` all; `/movies` ADMIN, MANAGER, CASHIER; `/halls`, `/statistics`, `/payment`, `/staff` ADMIN, MANAGER. Paths not listed are open |
| `canManage`                                       | ADMIN, MANAGER                                                                                                                      |
| `canBook`                                         | ADMIN, MANAGER, CASHIER                                                                                                             |
| `canManageStaffMember(user, target)`              | Managers can't manage MANAGERs; only ADMIN can                                                                                      |
| `assignableStaffPositions(user)`                  | ADMIN can assign MANAGER, CASHIER, USHER; others can't assign MANAGER                                                               |

`positionCanMatch` (`shared/guards/position-guard.ts`) loads `/staff/me` and checks `canAccessRoute`. The sidebar and mobile drawer (`nav-links`) show only accessible tabs.

**A protected route is declared twice:** once with `canMatch: [positionCanMatch]` (the real page), then again for the same path rendering `AccessDeniedPage`. `/halls`, `/movies`, `/payment`, `/staff` and `/statistics` follow this exactly. Two routes deviate:

- `/` has the `canMatch` but **no** `AccessDeniedPage` fallthrough, so a denied position would fall to `**` and get `NotFoundPage`.
- `/profile` has a fallthrough entry but **no** `canMatch`, so the `AccessDeniedPage` line is dead and profile is open to every signed-in staff member (intended).

**To add a protected page:** add the two route entries in `app.routes.ts`, then add the path and its allowed positions to `ROUTE_ACCESS`.

Auth status, guards and the server-unavailable fallback are in [../http.md](../http.md#auth).

## Profile

`/profile` shows the identity card, editable personal details (name, phone) and change password (hidden for ADMIN, whose account can't be edited). It's opened from the header's user menu, which also has Logout.
