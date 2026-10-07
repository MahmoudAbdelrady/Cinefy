# Management styling

Shared rules (approach, cinefy-ui partials, token bridge, nested SCSS) are in [../styling.md](../styling.md).

Management is **light-only** (`providePrimeNG` sets `darkModeSelector: false`).

## Partials (`src/shared/styles/`)

| Partial         | Contents                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_colors.scss`  | Full color palette (`$color-*`, `$gray-*`, `$blue-*`, …) — project-owned; also `@forward`s `cinefy-ui/styles/tokens` (radii, `$transition-fast`) |
| `_shadows.scss` | `$shadow-xs/sm/md/card`, `$shadow-focus-ring[-error]` — project-owned                                                                            |
| `_mixins.scss`  | Management-only mixins: `icon-box($size)`                                                                                                        |

**No SCSS include path is configured**, so component files import these by **relative path** (depth-adjusted), e.g. `@use '../../../shared/styles/colors' as *;`. Only `src/styles.scss` can use the bare `shared/styles/...` form. A file may `@use` both `shared/styles/mixins` and `cinefy-ui/styles/mixins`.

## Rules

- Use `$color-*` and the `$gray/blue/red/…-*` scales — never hardcode colors.
- Use `$shadow-*` tokens — never hardcode `box-shadow` values.
- Use the radius tokens for border-radius.
- **Flag new raw values before adding them.** If a color, shadow, gradient or other "designed" value isn't already in `src/shared/styles/`, surface it first: name the value, the closest existing token, and how they differ, then wait for the user to choose keep / replace with the token / extract to shared. Plain layout numbers (paddings, gaps, line-heights) are exempt.
- `src/styles.scss` maps `$colors` / `$shadows` onto the `--cui-*` tokens in one `:root { ... }` block.
