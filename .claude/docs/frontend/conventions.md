# Frontend code conventions

These apply to all three frontend packages. Reference implementations are in `cinefy-management` unless noted.

## Components

- **Standalone only** — no NgModules. Every component declares its `imports` array.
- Inline `selector`, external `templateUrl` + `styleUrl`. Files are `name.ts` / `name.html` / `name.scss` — no `.component` suffix.
- `protected` for template-bound members; `private readonly` for injected services; inputs/outputs are public `readonly` with no visibility keyword.
- Always `inject()`, never constructor injection:
  ```typescript
  private readonly service = inject(SomeService);
  private readonly destroyRef = inject(DestroyRef);
  ```
- Signal `input()` / `output()` everywhere — no `@Input` / `@Output` decorators.
- New components default to SCSS styles and skip tests (`angular.json` schematics).
- **Barrels:** pages, components, services, types, guards, constants, utils and interceptors are re-exported from `index.ts` files — import through them, not by deep path. Each app's `structure.md` lists its barrels and the few exceptions.
- **Icons:** every lucide glyph is re-exported from the app's `src/shared/icons.ts` (`LucideX as XIcon`, from `@lucide/angular`). Import from there, never from `@lucide/angular` directly; add new glyphs there. Render with `LucideDynamicIcon`: `<svg [lucideIcon]="icons.XIcon" [size]="N">`. Size via `[size]`, never SCSS `svg { width/height }`.
- **No accessibility attributes** (`aria-*`, `role`, `title`) and **no explanatory comments** unless explicitly requested.
- TypeScript is **strict** (`strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `strictTemplates`). Prettier: `printWidth: 100`, `singleQuote: true`, Angular parser for HTML.

## Class member order

All component classes follow the order set by `cinefy-management/src/components/halls/hall-config-modal/hall-config-modal.ts`. New components match it; touching an existing one is a good time to bring it in line.

**Constants live at module scope, not as class fields.** A pure constant (a literal, a config number, a static array/map, or anything derived purely from those — e.g. `MAX_GRID_DIMENSION`, `AUTO_HALL_STATUS`, `SELECTABLE_HALL_STATUS_ENTRIES` in `hall-config-modal.ts`) is a module-level `SCREAMING_SNAKE_CASE` `const` above `@Component` (after imports and interfaces), **not** a `private static readonly` field. The class uses the bare name. Keep a thin `protected readonly` bridge field (e.g. `maxGridDimension = MAX_GRID_DIMENSION`) only when the template binds the value — that bridge goes in bucket 4.

1. `protected readonly icons = { ... }` — lucide icon map / UI dict.
2. `private readonly` injected services (`inject(...)`) and `DestroyRef`.
3. `private readonly` `viewChild` / `contentChild` / `ElementRef` references.
4. `protected readonly` template bridges to module constants, and `protected readonly` computeds derived purely from module constants (kept adjacent).
5. Public **signal inputs** (`input()` / `input.required()`), then **outputs** (`output()`).
6. **Signal state** (`signal(...)`) — public → protected → private, grouped by feature.
7. **Reactive forms** (`protected readonly someForm = new FormGroup({ ... })`).
8. **Computeds / `toSignal`-derived state** — related ones adjacent (a `toSignal` and the `computed` that consumes it).
9. **Arrow-fn template helpers** — `displayFn`, `valueFn`, `compareWith`, etc. They're fields, so they sit with the field declarations.
10. **`constructor()`** — `effect()` blocks + `afterNextRender` init.
11. **Private init / data-loader methods** called from the constructor.
12. **Protected event handlers** (template-called methods — `onXxxChange`, `saveXxx`, …).
13. **Private helper methods**.

Within a bucket, preserve existing order — don't alphabetize.

## State

- **Angular signals** for all UI state — no NgRx or external store. `signal()` for mutable state, `computed()` for derived, `effect()` for side effects. RxJS only for HTTP streams and combining/debouncing observables; `toSignal()` / `toObservable()` bridge the two.

### Prefer `linkedSignal` over `signal` + a re-seeding `effect`

When a writable signal's only `effect` (or input-setter / `ngOnChanges`) re-seeds it **synchronously** from another reactive source — a "derived default + local override" — use `linkedSignal`. It stays writable, so user interactions still `.set()` / `.update()` it, and it's recomputed (overwriting manual writes) when the source changes.

Use it when **all** hold: (1) the default is derived from a source (`signal`, `input()`, or `computed`); (2) it's re-seeded synchronously when the source changes; (3) it's also written by user interaction (so a `computed` won't do).

```typescript
// Before — signal + constructor effect
protected readonly testResult = signal<TestResultState>({ testStatus: 'UNTESTED' });
constructor() {
  effect(() => {
    const initial = this.initialTestResult();
    if (initial) this.testResult.set({ ...initial, fromPriorSession: true });
  });
}

// After — one linkedSignal
protected readonly testResult = linkedSignal<TestResultState>(() => {
  const initial = this.initialTestResult();
  return initial ? { ...initial, fromPriorSession: true } : { testStatus: 'UNTESTED' };
});
```

Use the `{ source, computation }` form when the computation needs the **previous** value — `computation: (source, previous) => ...`, `previous` is `undefined` on first run. Examples: `hall-config-modal.ts` (`seatLayout`: `resizeGrid(previous?.value ?? [], rows, cols)`), `book-seats.ts` (`activeBooking`, simple form; also `stage` and `selectedSeats`).

**Don't** use `linkedSignal` when the re-seed is **asynchronous** — the value lands from an HTTP response inside a `.subscribe()`. Its computation is synchronous and can't await, so those stay `signal` + `effect`. Also skip it when the `effect` would stay anyway (it does other work, e.g. patching a form) and the saving is a line or two — the phantom dependency-read needed to keep the reset reactive is easy to misread as dead code.

## Async data

### `rxResource` (the client's default for loads)

Load remote data with `rxResource` (a params signal + `stream` returning the service `Observable`), not a hand-rolled `signal` + `subscribe`. Render its states in a fixed outer order: **loading → error → resolved**.

- `isLoading()` → `<cui-loading-spinner variant="lg">` in a centered wrapper.
- `error()` → `<cui-error-state header="Couldn't load …" />`. Its description defaults to "Something went wrong. Please try again later."; pass `[description]` only to show the backend's message.
- Resolved: for empty-vs-data, **prefer `@for … @empty`** with a `<cui-empty-state>` in `@empty`. Use an explicit negated guard (`@else if (!rows().length)`) only when an empty result must **short-circuit a whole dependent section** — e.g. the client's `booking-section.html`, where no _dates_ must show "Tickets not yet available" and suppress the showtimes block.
- Gate a dependent second fetch by returning `undefined` from its `params` callback — the resource stays idle (see the client's `booking-section.ts`).

### `takeUntilDestroyed`

**Every** manual `.subscribe()` in a component pipes `takeUntilDestroyed(this.destroyRef)` **last** (after `switchMap`, `debounceTime`, …) — including one-shot `HttpClient` calls. For HTTP it's **cancellation**: leaving a page or closing a dialog aborts the in-flight request. There's no "it only sets local state" exception. For streams that never complete (`valueChanges`, `toObservable`, custom `Subject`/`BehaviorSubject` like `StaffService`'s current-user cache, `fromEvent`/`interval`/`timer`, combinators over them) it's also the leak fix. `rxResource` needs nothing extra.

```typescript
this.service
  .getThing()
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe({ next: ..., error: ... });
```

Reference: `hall-config-modal.ts` (initial loads, `copyLayoutControl.valueChanges`, the create/update request).

## Forms

- Any `<form (ngSubmit)>` needs a form directive: reactive forms use `FormGroup` + `[formGroup]`; signal/template forms import `FormsModule` so `<form>` has a directive.
- Reactive forms use `nonNullable: true`. Complex cross-field validation runs in `effect()` blocks. `<cui-field-error>` shows messages.
- Shared regexes (`EMAIL_PATTERN`, `NAME_PATTERN`, `PASSWORD_PATTERN`) and `linkConfirmPassword()` come from `cinefy-ui/forms` — don't redeclare them. App-only regexes live in the app (management: `shared/constants/validation.ts`).

## Dialogs

`<cui-dialog>` wraps PrimeNG's `p-dialog`. **Mounting opens it**, so every dialog renders behind an `@if`, and its `(closed)` output unmounts it (a component whose root is a `cui-dialog` satisfies this via the parent's `@if`).

- Inputs: `header` / `description` / `canClose` / `style` / `contentStyle`; public `close()` method.
- Slots `[customHeader]` / `[customFooter]` — import `CinefyDialogHeader` / `CinefyDialogFooter` or they silently vanish.
- To close from inside, call `close()` on a `viewChild(CinefyDialog)` — **never** clear the parent flag directly, which skips the leave animation and PrimeNG's `<body>` scroll-lock cleanup.
- A dialog inside an `@for` moves **out** of the loop, keyed on a signal holding the row's object (`bookingToView`, `methodToRemove`).
- Gate `canClose` on any in-flight request so the dialog can't be dismissed mid-save.

## Semantic HTML

Reach for the element that describes the content. `<div>` is correct **only** for a generic box with no meaning (flex/grid wrapper, card body, scrim/spacer/decorative layer). This matters more in the client: it's SSR and public, so landmarks have real SEO payoff.

- **Landmarks** — `<header>` / `<footer>` for top/bottom bars, `<main>` once per page, `<nav>` for link sets, `<aside>` for a complementary region. Examples: management `layout/app-layout/app-layout.html` (`<header>` + `<main>`), `components/sidebar/sidebar.html` (`<aside>`), `components/nav-links/nav-links.html` (`<nav>`); client `layout/app-layout/app-layout.html`.
- **`<section>`** — only for a titled region that **contains a heading**. Never an empty `<section>`; use a `<div>`.
- **`<ul>`/`<li>`** — any repeated list; the `@for` goes on the `<li>`.
- **Interactive** — `<button>` for actions, `<a routerLink>` for navigation; don't downgrade to `<div>` + `(click)`.

Don't do a blanket "replace every div" sweep. Convert in focused passes and **verify the build after each file** (the template compiler flags mismatched closing tags). Selectors are class-based, so tag swaps don't change layout.

## UI copy

**All UI text is sentence case** — only the first word and proper nouns/acronyms are capitalized: titles, headings, buttons, links, labels, placeholders, tooltips, badges, table headers, stat labels, and label maps (e.g. `HALL_STATUS_LABELS`).

| ✅ Sentence case           | ❌ Title Case              |
| -------------------------- | -------------------------- |
| `Add staff member`         | `Add Staff Member`         |
| `Save changes`             | `Save Changes`             |
| `On-site only`             | `On-Site Only`             |
| `Special notes (optional)` | `Special Notes (Optional)` |

Keep original capitalization for acronyms and proper nouns (`VIP`, `ID`, `HMAC`, `3D`, `QR`, `Paymob`, `Cinefy`), external names quoted verbatim (Paymob's `Settings → Developers → API Keys` hints in management's `provider-spec.ts`; TMDB genre names like `Science Fiction`, which are data), and brand lockups (`Management Portal`, `Management Console`). When one app names a UI element of the other (management's toggle for the client's "Coming soon" rail), quote it exactly as the other app renders it.

## Button loading states

A button that shows `<cui-loading-spinner>` **must also show a label** — the progressive form of its own action:

```html
<button type="submit" class="btn-primary" [disabled]="saving()">
  @if (saving()) {
  <cui-loading-spinner variant="xs" />
  <span>Saving…</span>
  } @else {
  <svg [lucideIcon]="icons.CheckIcon" [size]="16"></svg>
  <span>Save changes</span>
  }
</button>
```

- Progressive verb + an ellipsis character (`…`, not three dots): `Saving…`, `Deleting…`, `Signing in…`, `Creating account…`. If the idle label branches, the loading label branches too.
- In-button spinners are `variant="xs"` (or `sm` on larger buttons); `lg` is for page/section loading.
- Exceptions: icon-only buttons (icon + `pTooltip`) keep a bare spinner; a spinner that replaces only a leading icon, with the `<span>` label outside the `@if`, already satisfies the rule.
- Page/section loading blocks use a centered `<cui-loading-spinner variant="lg" />` with no label.

## Code navigation

Use the **LSP tool first** (`documentSymbol`, `workspaceSymbol`, `findReferences`, `goToDefinition`, `goToImplementation`, `hover`) for TypeScript. Fall back to grep/rg/find when LSP errors or returns nothing useful, or for non-semantic searches (string literals, config values, CSS classes, filenames). SCSS, HTML templates and JSON go straight to grep.
