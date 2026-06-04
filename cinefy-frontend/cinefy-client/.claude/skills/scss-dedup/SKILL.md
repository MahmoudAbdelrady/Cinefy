---
name: scss-dedup
description: Scans SCSS files under src/ for repeated raw values (colors, radii, layout patterns, property clusters) and extracts them into shared variables/mixins in src/shared/styles/. Only invoke when the user explicitly asks to dedupe, audit, or extract repeated SCSS values.
disable-model-invocation: false
---

When triggered, scan all `.scss` files under `src/` to find repeated raw values that should be extracted into `src/shared/styles/`.

## What to scan for

1. **Colors** — Raw hex values (e.g. `#0a0a0a`, `#fafafa`) and `rgba(...)` expressions that appear **3 or more times** across different files. Also flag a raw value or `rgba(...)` that equals an existing token's value even if it appears only once or twice (e.g. `rgba(242, 160, 41, 0.1)` is `rgba($color-primary, 0.1)`) — those should reference the token.
2. **Border radii** — Repeated `border-radius` values (e.g. `9999px`, `12px`) that appear **3 or more times** and aren't already covered by the `$radius-*` tokens forwarded from cinefy-ui.
3. **Layout patterns** — Identical multi-property blocks (e.g. `display: flex; align-items: center; justify-content: center`) that appear **3 or more times**. Prefer cinefy-ui's `flex-*` mixins if one already matches.
4. **Other repeated property groups** — Any cluster of 2+ properties that appears verbatim in 3+ places (e.g. `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` → cinefy-ui's `text-truncate`).

## Process

1. **Search** — Use grep/ripgrep across `src/**/*.scss` to count occurrences of each raw value or pattern.
2. **Check existing tokens** — Read `src/shared/styles/_colors.scss` (the client's single shared partial — it holds the color palette **and** typography vars, and `@forward`s cinefy-ui's radii). Also check what cinefy-ui already provides via `var(--cui-*)` tokens and its `styles/*` mixins before inventing a new token.
3. **Report** — List every repeated value that does **not** have a corresponding shared token, grouped by category (colors, radii, layout patterns, other). Include the occurrence count and the files where each appears.
4. **Extract** — For each reported value:
   - Add the new SCSS variable to `src/shared/styles/_colors.scss` (the only shared partial), or use an existing cinefy-ui mixin/token if one fits.
   - Update **every** `.scss` file that uses the raw value to import and use the new token instead.
5. **Verify** — Run `pnpm client:build` from the workspace root (`cinefy-frontend/`) and confirm it compiles with no SCSS errors after all replacements.

## Rules

- Never create a variable/mixin for a value that only appears once or twice — leave those inline. (Exception: a value that duplicates an existing token should reference that token regardless of count.)
- Semantic tokens are the source of truth. The accent value lives only in `$color-primary`; do not reintroduce duplicate accent tokens (`$color-amber`, `$color-ring`, `$color-seat-selected` were removed for this reason). A role that visually matches the accent should reference `$color-primary`, not redeclare its hex.
- Follow existing naming conventions in `_colors.scss` (e.g. `$color-background`, `$color-muted-foreground`, `$color-seat-premium`, `$radius-md`).
- Always use `@use 'shared/styles/colors' as *;` — never `@import`. For shared mixins use `@use 'cinefy-ui/styles/mixins' as *;`.
- Do not change any visual output — this is a pure refactor with zero visual diff.
- This app is **SSR / dark-theme only** — extraction is CSS-only and must not introduce browser-only or theme-switching logic.
