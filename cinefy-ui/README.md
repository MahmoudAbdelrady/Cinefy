# cinefy-ui — Semantic Token Contract

The library's components reference these `--cui-*` runtime tokens via `var()` and never use literal colors. Each consuming app owns its full SCSS palette (`_colors.scss`, `_shadows.scss`, etc.) and maps it to the tokens below **once** in a `:root { ... }` bridge inside the app's global `styles.scss`.

This document is the source of truth for which tokens the bridge must define. cinefy-client will read this list when implementing its dark theme.

## Surfaces

| Token                           | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `--cui-surface-base`            | Base page-level surface (modal panel, plain backgrounds) |
| `--cui-surface-input`           | Input/select field background                            |
| `--cui-surface-overlay`         | Popover/dropdown panel background                        |
| `--cui-surface-hover`           | Hover background for interactive rows/toggles            |
| `--cui-surface-disabled`        | Disabled field background (light gray)                   |
| `--cui-surface-disabled-strong` | Disabled filled-button background (stronger gray)        |
| `--cui-surface-active`          | Pressed/active state background                          |

## Text

| Token                  | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `--cui-text-primary`   | Field values, labels                              |
| `--cui-text-emphasis`  | Body/cell text (slightly less heavy than primary) |
| `--cui-text-muted`     | Placeholders, leading icons                       |
| `--cui-text-hint`      | Hint/help text below fields                       |
| `--cui-text-strong`    | Hover-emphasis text                               |
| `--cui-text-error`     | Validation messages, required asterisk            |
| `--cui-text-on-accent` | Text drawn on top of the accent color             |

## Borders & focus

| Token                  | Purpose                              |
| ---------------------- | ------------------------------------ |
| `--cui-border-default` | Resting field/panel border           |
| `--cui-border-subtle`  | Secondary border (popover, dividers) |
| `--cui-border-strong`  | Hover-emphasis border                |
| `--cui-icon-disabled`  | Disabled icon/button color           |
| `--cui-ring`           | Focus ring color                     |
| `--cui-ring-error`     | Focus ring color in error state      |

## Accent / status colors

| Token                 | Purpose                                                           |
| --------------------- | ----------------------------------------------------------------- |
| `--cui-accent`        | Primary brand action color (selected day, `.btn-primary` surface) |
| `--cui-accent-hover`  | Primary brand action color, hover state                           |
| `--cui-accent-subtle` | Soft tint of accent (today's date outline)                        |
| `--cui-danger`        | Destructive action color (`.btn-danger` surface)                  |
| `--cui-danger-hover`  | Destructive action color, hover state                             |
| `--cui-success`       | Positive action color (`.btn-success` surface)                    |
| `--cui-success-hover` | Positive action color, hover state                                |

## Elevation

### Generic shadow scale

Use when the purpose isn't represented by a more specific token below.

| Token                           | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `--cui-shadow-xs`               | Minimal lift (badge, subtle button)             |
| `--cui-shadow-sm`               | Small card                                      |
| `--cui-shadow-md`               | Medium card / dropdown                          |
| `--cui-shadow-lg`               | Large overlay (date/time picker popover)        |
| `--cui-shadow-focus-ring`       | Standard focus ring around interactive elements |
| `--cui-shadow-focus-ring-error` | Error-state focus ring                          |

### Component-purpose shadow tokens

Overridable independently of the scale.

| Token                        | Purpose                                     |
| ---------------------------- | ------------------------------------------- |
| `--cui-overlay-shadow`       | Small popover / dropdown elevation          |
| `--cui-popover-shadow`       | Larger popover (date/time picker) elevation |
| `--cui-button-shadow`        | Subtle shadow under primary/success buttons |
| `--cui-button-shadow-strong` | Stronger shadow under destructive buttons   |

## Options (select rows)

| Token                           | Purpose                    |
| ------------------------------- | -------------------------- |
| `--cui-option-text`             | Resting option text        |
| `--cui-option-selected-surface` | Selected option background |
| `--cui-option-selected-text`    | Selected option text       |

## Modal

| Token                   | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `--cui-modal-backdrop`  | Modal overlay background                    |
| `--cui-modal-shadow`    | Modal panel elevation                       |
| `--cui-modal-header-bg` | Modal header background (may be a gradient) |
| `--cui-modal-footer-bg` | Modal footer background                     |

## Toast (success / error variants)

| Token                                 | Purpose            |
| ------------------------------------- | ------------------ |
| `--cui-toast-shadow`                  | Toast elevation    |
| `--cui-toast-{success,error}-surface` | Toast background   |
| `--cui-toast-{success,error}-border`  | Toast border       |
| `--cui-toast-{success,error}-text`    | Toast text         |
| `--cui-toast-{success,error}-icon`    | Toast leading icon |

## Misc

| Token                   | Purpose                      |
| ----------------------- | ---------------------------- |
| `--cui-scrollbar-thumb` | Custom scrollbar thumb color |

## Reference implementation

See [`cinefy-management/src/styles.scss`](../cinefy-management/src/styles.scss) for a complete bridge that maps every token above to management's light SCSS palette. cinefy-client will follow the same pattern with its dark palette.
