# cinefy-ui (shared component library)

Built with ng-packagr into `cinefy-ui/dist`; both apps link the dist. The primary entry point exports nothing — import from the secondary entry points:

| Import from            | Contents                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cinefy-ui/components` | The components below, plus `CinefyDialogHeader` / `CinefyDialogFooter` slot directives                                                                                                                                               |
| `cinefy-ui/services`   | `CinefyToastService`, `provideCinefyToast()`                                                                                                                                                                                         |
| `cinefy-ui/pipes`      | `DurationPipe` (minutes → "Xh Ym"), `PhoneFormatPipe`, `RelativeTimePipe`, `Time12hPipe`                                                                                                                                             |
| `cinefy-ui/types`      | `PaginatedResponse<T>`, `AuthStatus`, `CinefyMenuGroup` / `CinefyMenuItem`, `Seat` / `SeatCategory` / `SEAT_CATEGORY_LABEL`, seat-position helpers (`compareSeatPositions`, `seatRowLabel`, `seatRowIndex`, `SEAT_POSITION_PATTERN`) |
| `cinefy-ui/forms`      | `linkConfirmPassword()`, `EMAIL_PATTERN`, `NAME_PATTERN`, `PASSWORD_PATTERN`                                                                                                                                                         |
| `cinefy-ui/http`       | `errorToastInterceptor`, `networkErrorInterceptor`, `skipErrorToast()`, `skipServerErrorToast()`, `SKIP_ERROR_TOAST` / `SKIP_SERVER_ERROR_TOAST`                                                                                     |
| `cinefy-ui/constants`  | `CINEFY_TOAST_KEY`, `CINEFY_TOAST_LIFE` (4000 ms)                                                                                                                                                                                    |
| `cinefy-ui/utils`      | `toSafeRedirect()` (blocks open redirects)                                                                                                                                                                                           |
| `cinefy-ui/styles/*`   | SCSS partials — see [styling.md](styling.md#shared-scss-from-cinefy-ui)                                                                                                                                                              |

**Naming:** every component's selector is `cui-<name>` and its class `Cinefy<Name>`, with no `Component` suffix (`<cui-empty-state>` / `CinefyEmptyState`). A new library component follows the same pair.

Seat rows are labeled A–Z, then doubled letters AA, BB, CC… (`seatRowLabel`), matching the backend.

## Components

- **Feedback:** `cui-loading-spinner` (`variant` xs/sm/lg), `cui-empty-state`, `cui-error-state`, `cui-not-found`, `cui-server-unavailable`, `cui-toast`.
- **Inputs:** `cui-input`, `cui-field-error`, `cui-password-checklist`, `cui-input-otp`, `cui-select`, `cui-paginated-select`, `cui-phone-input`, `cui-date-picker`, `cui-time-picker`, `cui-switch`.
- **Navigation / overlays:** `cui-paginator`, `cui-menu`, `cui-dialog`.
- **Cinema / media:** `cui-media-image`, `cui-seat-map`, `cui-hold-timer`.

Notes on the ones with non-obvious APIs:

- **`cui-empty-state`** — inputs `[icon]`, `header` (required), `[description]`; add `class="fill"` to stretch to full height.
- **`cui-error-state`** — **the** way to render a failed load; never a `cui-empty-state` with a warning icon. Fixed triangle-alert icon; `header` (required) + `[description]` (defaults to "Something went wrong. Please try again later." — pass it only for a backend message). Shares empty-state's stylesheet, so the host is the box: `class="fill"` and parent padding classes work the same.
- **`cui-paginator`** — PrimeNG `p-paginator` wrapper. `[(page)]` is **0-indexed** (matches Spring `Pageable` — pass straight through, no -1); inputs `pageCount` / `totalItems` / `pageSize`. `:host` owns the chrome (padding + top border) — don't style it. Below tablet width it adds a "Go to page" select.
- **`cui-dialog`** — see [conventions.md](conventions.md#dialogs).
- **`cui-switch`** — size `md|sm`, color `accent|highlight`; bind a reactive `[control]` (the usual form) or `[checked]`/`[disabled]` + `(checkedChange)`.
- **`cui-select`** — PrimeNG-backed; static `items[]` + client-side search.
- **`cui-paginated-select`** — `fetchFn: (page, size) => Observable<PaginatedResponse<T>>`; loads page 0 on open and shows a "Load more" row while `page < totalPages`.
- **Both selects** write a `[control]` directly (no `selectionChange` output); `labelField` / `valueField` are field **names**; `[multi]` toggles multi-select.

## Toasts

Two pieces, both already wired in each app:

- **`provideCinefyToast()`** in `app.config.ts` provides PrimeNG's `MessageService` in the **root** injector. Without it every toast silently no-ops — `CinefyToastService` is `providedIn: 'root'` and can't see a component-level provider.
- **`<cui-toast />`** rendered **once** in `app.ts`, beside `<router-outlet>` — one per app, never per page or layout. It runs with `[autoZIndex]="false"` and a fixed `z-index: 10000`: PrimeNG's auto layering only stamped a z-index when none was set and cleared it once every message was gone, so a toast raised while an older one was visible stayed behind any dialog opened in between. Don't turn `autoZIndex` back on.

To raise a toast, inject `CinefyToastService` and call `success(message)` / `error(message)` — that's the whole API (no `warn`/`info`, no options). The service and container both read `CINEFY_TOAST_KEY`; PrimeNG matches messages to containers by exact key, so never pass a key by hand.

## Adding an export

After adding an export, rebuild the library and clear the apps' `.angular/cache` (see [workspace.md](workspace.md#vite-cache-after-new-cinefy-ui-exports)).
