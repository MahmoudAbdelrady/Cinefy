# Frontend styling

App-specific palettes and partials are in [management/styling.md](management/styling.md) and [client/styling.md](client/styling.md).

## Approach

- **Custom SCSS** — no Tailwind, no CSS framework. Component styles are scoped by Angular view encapsulation.
- **PrimeNG 22** backs the shared cinefy-ui components (`cui-dialog`, `cui-select`, `cui-menu`, `cui-paginator`, `cui-toast`, date/time pickers, inputs). Prefer the cinefy-ui component when one exists. Importing `primeng/*` directly in app code is allowed for things cinefy-ui doesn't wrap (tooltip, popover, drawer, textarea, radio button, `providePrimeNG`).
- Each app has its own PrimeNG Aura preset (management: `src/app/cinefy-preset.ts`; client: `src/app/cinefy-client-preset.ts`).
- **ng-primitives is fully removed** from all three `package.json` files.
- **No `-webkit-` prefixes or legacy fallbacks** — target modern browsers. The one exception is multi-line truncation: `display: -webkit-box` + `-webkit-box-orient: vertical` + `-webkit-line-clamp` (paired with the standard `line-clamp`).

## Shared SCSS from cinefy-ui

| Import                                                                     | Provides                                                                                                                                                             |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@use 'cinefy-ui/styles/mixins' as *;`                                     | `flex-center`, `flex-align`, `flex-between`, `flex-column`, `lucide-icon-fix`, `text-truncate`, `disabled-state`, `dialog-header`, `dialog-footer`, `scrollbar-thin` |
| `@use 'cinefy-ui/styles/breakpoints' as *;`                                | `below-*` / `from-*` for `phone` 480, `mobile` 640, `tablet` 768, `desktop` 1024 (mobile-first by default)                                                           |
| `cinefy-ui/styles/tokens` (forwarded by each app's `_colors.scss`)         | `$radius-sm` (4px), `$radius-xs` (6px), `$radius-md`, `$radius-lg`, `$radius-xl`, `$radius-full`, `$radius-pill` (50%), `$transition-fast`                           |
| `@use 'cinefy-ui/styles/buttons';` (once, in each app's `src/styles.scss`) | Global `.btn-base`, `.btn-primary`, `.btn-secondary`, `.btn-neutral`, `.btn-danger`, `.btn-success` — apply via `class="btn-*"`                                      |

- **`lucide-icon-fix`** emits `svg { display: flex; }`. Apply it on the **parent** of the `<svg [lucideIcon]>`, never inside an `svg { }` block.
- **`disabled-state`** is the shared `opacity: 0.6` + `cursor: not-allowed` pair for `:disabled` / `:not([href])` / `:has(input:disabled)` — don't hand-write it.
- Empty-state styling lives in the `<cui-empty-state>` component (no mixin).

## The `--cui-*` token bridge

cinefy-ui's components read only runtime `var(--cui-*)` tokens. Each app maps its SCSS palette onto them **once**, in a `:root { ... }` block in `src/styles.scss` — the single bridge. Component SCSS in the apps uses plain `$variables`, not `var()`. The full token contract is in [`cinefy-frontend/cinefy-ui/README.md`](../../../cinefy-frontend/cinefy-ui/README.md#theming-tokens); a token the bridge omits resolves to nothing and its declaration is silently dropped.

## Nested SCSS

**Write SCSS nested, not flat.** A rule for a child element goes **inside** its parent's block, mirroring the template, so a block reads as one self-contained region.

Nest by the **element's place in the template**, not by class-name prefix. Element selectors (`svg`, `p`), state selectors (`&:hover`, `&.expiring`) and responsive mixins (`@include below-tablet { ... }`) nest the same way.

```scss
// ✅ Nested
.rs-done {
  @include flex-center;

  flex-direction: column;
  padding: 48px 24px;

  .rs-done-icon {
    @include flex-center;

    width: 64px;
    height: 64px;
    border-radius: $radius-full;
  }

  .rs-done-title {
    font-size: 20px;
    font-weight: 700;
  }
}

// ❌ Flat — structure lost
.rs-done { ... }
.rs-done-icon { ... }
.rs-done-title { ... }
```

- **Nest as deep as the template.** No depth limit — encapsulation makes the long selectors harmless.
- **No `&-` name concatenation** for child elements (`&-icon` to build `.rs-done-icon`) — it makes class names ungreppable. A BEM modifier `&--active` inside its own block is fine — don't rewrite it to `&.block--active`.
- **Top-level siblings only for genuinely sibling regions** (e.g. `book-seats`' `.bs-loading`, `.bs-layout`, `.bs-done`) or `:host`.
- **The card wrapper is an element, not `:host`.** Card chrome (background, border, radius, shadow) goes on a real wrapper element (`.tsch-card`, `.today`) with the contents nested inside. Reserve `:host` for how the component sits in its parent's layout.
- Never `@import`; always `@use`.
