# Client styling

Shared rules (approach, cinefy-ui partials, token bridge, nested SCSS) are in [../styling.md](../styling.md).

The client is **dark-theme only**.

## The single partial

The shared SCSS under `src/shared/styles/` is **one partial**, `_colors.scss` (unlike management's `_colors` / `_shadows` / `_mixins` split). It holds the color palette **and** the typography vars (`$font-sans` = Geist, `$font-mono` = Geist Mono), and `@forward`s cinefy-ui's tokens, so `$radius-*` and `$transition-fast` come from the same import. Tokens were ported from the mock's `styles/index.css` (`oklch(...)` → hex).

Import it with a depth-adjusted relative path (`@use '../../shared/styles/colors' as *;`). One component-local exception: `src/components/auth/forgot-password/_fp-shared.scss`, shared by the forgot-password steps.

## Token rules

- **Semantic tokens are the source of truth.** The accent lives only in `$color-primary`; a role that matches it (focus ring, selected seat, accent text/borders) references `$color-primary` rather than redeclaring its hex. Don't reintroduce `$color-amber` / `$color-ring` / `$color-seat-selected`.
- A raw `rgba(...)` equal to an existing token's color references the token — `rgba($color-border, 0.4)`, not `rgba(38, 38, 38, 0.4)`.
- `$color-black` (`#000000`) is its own primitive (scrims/shadows), distinct from `$color-background` (`#0a0a0a`). `$shadow-overlay` is the shared dropdown/modal shadow.
- Never hardcode raw values.
- The **`scss-dedup`** skill audits the SCSS for repeated raw values and extracts them into `_colors.scss` — use it when asked to dedupe or audit styles.
