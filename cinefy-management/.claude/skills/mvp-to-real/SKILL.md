---
name: mvp-to-real
description: Maps components, pages, or parts of the MVP React+Tailwind version into the current Angular+SCSS project. Only invoke when the user explicitly asks to map or migrate from the mvp-version folder.
disable-model-invocation: false
---

The user will provide a prompt describing which components, pages, or specific parts of a page/component should be mapped from the `mvp-version/` folder into the current Angular project.

Read the referenced MVP source files (`mvp-version/src/app/App.tsx`), then perform the mapping while strictly following all rules below.

## MVP Extraction Rules

### No Tailwind in Output

- **Never** carry over Tailwind utility classes (`className="..."`) from the MVP components into the Angular project.
- All visual styling must be written manually as SCSS in the component's corresponding `.scss` file (referenced via `styleUrl` in the Angular component).
- Translate Tailwind utilities (e.g. `rounded-2xl`, `bg-[--color-primary]`, `flex items-center gap-4`) into their equivalent CSS/SCSS properties.
- Tailwind theme values (CSS custom properties defined in `mvp-version/src/styles/theme.css`) should be mapped to the project's SCSS variables/partials in `src/shared/styles/`.

### Use Shared Styles

- Before writing any raw color hex value, border-radius, or layout pattern, **check `src/shared/styles/`** for an existing SCSS variable or mixin that matches.
- If a matching variable or mixin exists (e.g. `$gray-900` instead of `#111827`, `$radius-lg` instead of `12px`, `@include flex-align` instead of `display: flex; align-items: center`), **always use it**. Never duplicate a value that already has a shared token.
- Import the shared partials at the top of the component's `.scss` file via `@use` (e.g. `@use '../../shared/styles/colors' as *;` and `@use '../../shared/styles/mixins' as *;`).
- If a needed color or pattern does **not** yet exist in `src/shared/styles/`, check whether it appears multiple times across the MVP codebase. If it does, add it to the shared partials first, then use it. If it's a single-use value, just write it inline — don't create a variable/mixin for one-off cases.

### Visual & Behavioral Parity

- The final result **must** be visually identical to the MVP version — colors, spacing, typography, border radii, shadows, gradients, and layout must all match.
- All animations, transitions, hover effects, focus states, and interactive behaviors present in the MVP must be faithfully reproduced in the Angular version.
- If the MVP uses CSS custom properties (e.g. `var(--color-primary)`), preserve them or map them to the project's equivalent SCSS variables/custom properties.

### General Mapping Guidance

- Translate React component logic (state, effects, event handlers) into Angular equivalents (signals, lifecycle hooks, event bindings).
- Preserve the same HTML structure and semantics from the MVP templates.
- If a component or element originates from a third-party UI library (e.g. shadcn/ui, Radix, Headless UI), **stop the mapping process** and ask me whether to install an Angular-compatible equivalent before proceeding — do not attempt to re-implement those components manually.
- Use the `LucideAngularModule` for icons.
- Use pixels for all measurements instead of rems.
- The Angular project may have a different HTML structure than the MVP project, but the styling should be the same.
- If a certain styling in the MVP is not possible to achieve with the Angular project's HTML structure, use the closest possible HTML structure from the MVP in the Angular project to achieve the same styling.

### Responsive Design

- Responsive design **must** always be considered for every component.
- If the MVP version includes responsive styles (e.g. media queries, Tailwind responsive prefixes like `sm:`, `md:`, `lg:`), translate them faithfully into equivalent SCSS media queries with matching breakpoints.
- If the MVP version does **not** include responsive styles, add appropriate responsive behavior independently — ensure the component looks and functions well across common screen sizes (mobile, tablet, desktop) without relying on the MVP as a reference.
