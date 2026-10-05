# cinefy-ui

The shared Angular component library used by both Cinefy web apps, the [booking site](../cinefy-client/README.md) and the [staff dashboard](../cinefy-management/README.md). It holds the pieces both apps need, such as the seat map, dialogs, form controls and error handling, so they look and behave the same in both.

For an overview of the project, see the [main README](../../README.md).

## Building

Run every command from the `cinefy-frontend/` folder, not from inside this one.

```bash
pnpm ui:build       # build once
pnpm ui:watch       # rebuild on every change
```

Both apps use the built output in `cinefy-ui/dist/`, so build the library before running either app.

## Entry points

The library has no main entry point. Import from the sub-path that matches what you need:

| Import from            | Contents                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cinefy-ui/components` | UI components: inputs, selects, date and time pickers, dialog, menu, paginator, toast, switch, empty and error states, seat map, hold timer and more |
| `cinefy-ui/services`   | The toast service                                                                                                                                    |
| `cinefy-ui/pipes`      | Formatting pipes: duration, phone number, relative time, 12-hour time                                                                                |
| `cinefy-ui/types`      | Shared types, such as paginated responses and seats                                                                                                  |
| `cinefy-ui/forms`      | Form validators and validation patterns                                                                                                              |
| `cinefy-ui/http`       | HTTP interceptors that show error toasts and handle an unreachable server                                                                            |
| `cinefy-ui/constants`  | Shared constants                                                                                                                                     |
| `cinefy-ui/utils`      | Small helpers                                                                                                                                        |
| `cinefy-ui/styles/*`   | SCSS partials: breakpoints, buttons, mixins, design tokens                                                                                           |

Every component's selector starts with `cui-` and its class with `Cinefy`, for example `<cui-dialog>` and `CinefyDialog`.

## Theming tokens

The library's components reference these `--cui-*` runtime tokens via `var()` and never use literal colors. Each consuming app owns its full SCSS palette (`_colors.scss`, `_shadows.scss`, etc.) and maps it to the tokens below **once** in a `:root { ... }` bridge inside the app's global `styles.scss`.

This document is the source of truth for which tokens the bridge must define. A token the bridge omits resolves to nothing, so the declaration that reads it is dropped silently.

### Surfaces

| Token                 | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `--cui-surface-base`  | Base surface (secondary/neutral buttons, checklist rows) |
| `--cui-surface-hover` | Hover background for neutral buttons                     |

### Text

| Token                  | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `--cui-text-primary`   | Field values, labels                            |
| `--cui-text-muted`     | Placeholders, secondary labels, leading icons   |
| `--cui-text-faint`     | De-emphasized icons (menu item icons)           |
| `--cui-text-hint`      | Hint/help text below fields                     |
| `--cui-text-strong`    | Emphasized text (input labels, not-found title) |
| `--cui-text-error`     | Validation messages, required asterisk          |
| `--cui-text-on-accent` | Text drawn on top of the accent color           |

### Borders & focus

| Token                  | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `--cui-border-default` | Resting field/panel border                      |
| `--cui-border-subtle`  | Secondary border (dividers, pills, seat legend) |
| `--cui-icon-disabled`  | Disabled / unmet icon color                     |
| `--cui-ring`           | Focus ring color                                |

### Accent / status colors

| Token                  | Purpose                                                       |
| ---------------------- | ------------------------------------------------------------- |
| `--cui-accent`         | Primary brand action color (`.btn-primary` surface)           |
| `--cui-accent-hover`   | Primary brand action color, hover state                       |
| `--cui-accent-subtle`  | Soft accent tint (select header action button)                |
| `--cui-highlight`      | Secondary emphasis color (`<cui-switch color="highlight">`)   |
| `--cui-highlight-ring` | Focus ring for highlight-colored switches                     |
| `--cui-danger`         | Destructive action color (`.btn-danger` surface)              |
| `--cui-danger-hover`   | Destructive action color, hover state                         |
| `--cui-danger-subtle`  | Soft danger tint (select "clear" action)                      |
| `--cui-danger-text`    | Text drawn on top of the danger color                         |
| `--cui-success`        | Positive action color (`.btn-success` surface, met checklist) |
| `--cui-success-hover`  | Positive action color, hover state                            |

### Buttons

| Token                           | Purpose                           |
| ------------------------------- | --------------------------------- |
| `--cui-button-secondary-border` | `.btn-secondary` border           |
| `--cui-button-secondary-hover`  | `.btn-secondary` hover background |

### Options (menu / select rows)

| Token               | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `--cui-option-text` | Resting option text (menu items, `.btn-neutral`) |

### Media image

| Token                          | Purpose                                     |
| ------------------------------ | ------------------------------------------- |
| `--cui-media-placeholder-bg`   | Poster/backdrop/profile placeholder surface |
| `--cui-media-placeholder-icon` | Placeholder icon color                      |

### Seat map

| Token                            | Purpose                   |
| -------------------------------- | ------------------------- |
| `--cui-seat-normal-surface`      | Normal seat background    |
| `--cui-seat-normal-border`       | Normal seat border        |
| `--cui-seat-normal-hover-border` | Normal seat border, hover |
| `--cui-seat-normal-text`         | Normal seat label         |
| `--cui-seat-vip-surface`         | VIP seat background       |
| `--cui-seat-vip-border`          | VIP seat border           |
| `--cui-seat-vip-hover-border`    | VIP seat border, hover    |
| `--cui-seat-vip-text`            | VIP seat label            |
| `--cui-seat-selected-surface`    | Selected seat background  |
| `--cui-seat-selected-border`     | Selected seat border      |
| `--cui-seat-selected-text`       | Selected seat label       |
| `--cui-seat-taken-surface`       | Taken seat background     |
| `--cui-seat-taken-border`        | Taken seat border         |
| `--cui-seat-legend-surface`      | Legend pill background    |

### Hold timer

| Token                               | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| `--cui-hold-timer-surface`          | Timer pill background                   |
| `--cui-hold-timer-expiring-surface` | Background once the hold is near expiry |
| `--cui-hold-timer-expiring-border`  | Border once the hold is near expiry     |
| `--cui-hold-timer-expiring-text`    | Text once the hold is near expiry       |

### Misc

| Token                   | Purpose                      |
| ----------------------- | ---------------------------- |
| `--cui-scrollbar-thumb` | Custom scrollbar thumb color |

### Reference implementations

Both apps define every token above: [`cinefy-management/src/styles.scss`](../cinefy-management/src/styles.scss) maps management's light palette, and [`cinefy-client/src/styles.scss`](../cinefy-client/src/styles.scss) maps the client's dark palette.
