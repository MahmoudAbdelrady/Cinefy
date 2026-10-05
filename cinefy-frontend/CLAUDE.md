# CLAUDE.md — cinefy-frontend (pnpm workspace)

Three Angular 22 packages: `cinefy-management` (staff dashboard, client-rendered), `cinefy-client` (public booking site, SSR), and `cinefy-ui` (shared component library, ng-packagr). Standalone components, signals, custom SCSS over PrimeNG-backed cinefy-ui components. Each app also has its own `CLAUDE.md`.

## Commands

**Run every pnpm command from `cinefy-frontend/`** — never from inside a package (that re-resolves the package as a standalone project and breaks the build with `InputSignal` type errors). Use `pnpm --filter <package> <script>` for one package's script. pnpm only (12.3.4).

```bash
pnpm install
pnpm ui:build        # build cinefy-ui first — both apps link its dist
pnpm mgmt:dev        # :4200
pnpm client:dev      # also :4200 — pass --port to run both
pnpm app:build       # ui, then management, then client
```

## Reference docs

Detailed docs live in [`../.claude/docs/frontend/`](../.claude/docs/frontend/). Read the one for the area you're changing.

| Working on                                                                                                                                               | Read                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Scripts, install problems, environments, tests, Vite cache                                                                                               | [workspace.md](../.claude/docs/frontend/workspace.md)       |
| Component structure, member order, signals / `linkedSignal`, `rxResource`, `takeUntilDestroyed`, forms, dialogs, semantic HTML, UI copy, button spinners | [conventions.md](../.claude/docs/frontend/conventions.md)   |
| Interceptors, error toasts, auth status and guards                                                                                                       | [http.md](../.claude/docs/frontend/http.md)                 |
| SCSS approach, cinefy-ui partials, the `--cui-*` bridge, nested SCSS                                                                                     | [styling.md](../.claude/docs/frontend/styling.md)           |
| cinefy-ui entry points, component APIs, toasts                                                                                                           | [cinefy-ui.md](../.claude/docs/frontend/cinefy-ui.md)       |
| cinefy-ui token contract                                                                                                                                 | [`cinefy-ui/README.md`](cinefy-ui/README.md#theming-tokens) |

## Rules

- Standalone components with `inject()`; signal `input()` / `output()` — never `@Input` / `@Output`.
- Follow the class member order in [conventions.md](../.claude/docs/frontend/conventions.md#class-member-order); pure constants are module-level `SCREAMING_SNAKE_CASE`, not static fields.
- Prefer `linkedSignal` over a `signal` re-seeded synchronously by an `effect`.
- Every manual `.subscribe()` in a component pipes `takeUntilDestroyed(this.destroyRef)` **last** — HTTP included.
- `<form (ngSubmit)>` always has a form directive (`[formGroup]`, or `FormsModule` for template forms).
- Dialogs are `<cui-dialog>` behind an `@if`; close from inside via `close()` on a `viewChild(CinefyDialog)`, never by clearing the parent flag.
- A load with an inline error state passes `skipServerErrorToast()`; only components that render every failure themselves pass `skipErrorToast()`. `networkErrorInterceptor` stays last in the chain.
- Branch on JSON `errorCode`, never on message text.
- Prefer cinefy-ui components (`cui-*` / `Cinefy*`); import `primeng/*` directly only for what cinefy-ui doesn't wrap.
- Icons come from the app's `shared/icons.ts`; size with `[size]`, never SCSS.
- UI copy is sentence case. A button spinner always has a progressive label (`Saving…`).
- Write SCSS nested as deep as the template, without `&-` name concatenation; card chrome goes on a wrapper element, not `:host`.
- No `-webkit-` prefixes or legacy fallbacks (multi-line `line-clamp` is the exception).
- No accessibility attributes and no explanatory comments unless asked.
- Use LSP first for TypeScript navigation.
- After adding a cinefy-ui export, rebuild it and clear the app's `.angular/cache`.
