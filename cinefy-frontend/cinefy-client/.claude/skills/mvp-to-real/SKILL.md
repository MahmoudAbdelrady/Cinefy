---
name: mvp-to-real
description: Maps components, pages, or parts of the MVP React+Tailwind version into the current Angular+SCSS client project. Only invoke when the user explicitly asks to map or migrate from the mvp-version folder.
disable-model-invocation: false
---

The user will provide a prompt describing which components, pages, or specific parts of a page/component should be mapped from the `mvp-version/` folder into the current Angular client app (`cinefy-client`).

The MVP is a **multi-folder React 19 + Vite + Tailwind v4 + shadcn/ui** design mock (not a single-file export). Source is organized as:

```
mvp-version/src/
├── pages/<page>/<Page>.tsx        # route-level screens (home, movies, movie-detail,
│                                  #   seat-selection, checkout, confirmation, profile, not-found)
├── components/<name>/<Name>.tsx   # shared pieces (navbar, footer, movie-card, poster,
│                                  #   section-heading, my-tickets, qr-stub)
├── components/ui/*.tsx            # shadcn/ui primitives (button, dialog, select, tabs, …)
├── data/*.ts                      # mock data + helpers (movies, bookings, hall)
├── lib/utils.ts                   # cn() class-merge helper
└── styles/index.css               # design tokens — Tailwind v4 @theme + :root oklch vars
```

Read the referenced MVP source files (e.g. `mvp-version/src/pages/home/HomePage.tsx` and any `components/` it imports), then perform the mapping while strictly following all rules below.

## MVP Extraction Rules

### No Tailwind in Output

- **Never** carry over Tailwind utility classes (`className="..."`) from the MVP components into the Angular project.
- All visual styling must be written manually as SCSS in the component's corresponding `.scss` file (referenced via `styleUrl` in the Angular component).
- Translate Tailwind utilities (e.g. `rounded-xl`, `bg-card`, `flex items-center gap-4`, `aspect-2/3`, `backdrop-blur`) into their equivalent CSS/SCSS properties.
- The MVP's design tokens are **Tailwind v4 theme tokens + CSS custom properties** defined in `mvp-version/src/styles/index.css` (a `:root { --background; --foreground; --primary; … }` block of `oklch(...)` values, plus a `@theme inline` mapping). These are the source of truth for color, radius, and fonts — map them to the project's SCSS variables/partials in `src/shared/styles/` (see _Establishing Shared Styles_).
- Class names referenced in templates (`bg-amber`, `text-muted-foreground`, `border-border`, `font-mono`, etc.) all resolve to those tokens — translate the *token*, not the literal utility string.

### Establishing Shared Styles

The client app is an early-stage skeleton: **`src/shared/styles/` does not exist yet**, and `src/styles.scss` is effectively empty. Unlike a mature codebase, there is no pre-built palette to reuse on the first mapping.

- On the **first** mapping (or the first time a token category is needed), **create** the shared partials under `src/shared/styles/` — at minimum `_colors.scss` (the grayscale + amber palette), `_radius.scss` (or fold radius into colors), and `_typography.scss`/font tokens (Geist sans + Geist Mono) — by porting the values from `mvp-version/src/styles/index.css`. Convert `oklch(...)` tokens to the equivalent hex/`oklch` SCSS variables; keep the same names where reasonable (`$background`, `$foreground`, `$primary`/`$amber`, `$muted-foreground`, `$border`, `$card`, …).
- After the partials exist, **always reuse them** — before writing any raw color, border-radius, shadow, or repeated layout pattern, check `src/shared/styles/` for an existing variable or mixin and use it instead of duplicating a value.
- Import the shared partials at the top of a component's `.scss` via `@use` (e.g. `@use '../../shared/styles/colors' as *;`).
- If a needed value does **not** yet exist in `src/shared/styles/`, decide by reuse: if it appears multiple times across the MVP, add it to the shared partials first, then use it; if it's a genuine one-off, write it inline — don't create a token for a single use.
- **Prefer cinefy-ui where it already covers the need.** The client links the shared library (`"cinefy-ui": "link:../cinefy-ui/dist"`). If cinefy-ui already exposes a matching component, pipe, or style partial (its `var(--cui-*)` tokens, shared mixins, button styles), use that rather than re-porting it from the MVP — and surface the choice to the user when it's not obvious.
- **Flag new "designed" values before adding them.** If a color, shadow, gradient, or font token isn't already in `src/shared/styles/` (or cinefy-ui), surface it before writing: name the value, the closest existing token, and how they differ, then wait for the user to choose keep / replace-with-token / extract-to-shared. This does **not** apply to plain layout numbers (paddings, gaps, line-heights) — write those directly.

### Visual & Behavioral Parity

- The final result **must** be visually identical to the MVP version — colors, spacing, typography, border radii, shadows, gradients, hover/zoom effects, and layout must all match.
- All animations, transitions, hover effects, focus states, and interactive behaviors present in the MVP must be faithfully reproduced in the Angular version (e.g. the movie-card poster hover-zoom, the `reveal` fade-up page-load animation, the My Tickets dialog).
- The MVP is **dark-theme only** (the `.dark` class is on `<html>`, and the tokens are the dark palette). Reproduce that — don't introduce a light theme unless asked.
- Preserve CSS custom properties where the MVP relies on them, or map them to the project's equivalent SCSS variables / `var(--cui-*)` tokens.

### General Mapping Guidance

- Translate React component logic into Angular equivalents: `useState` → `signal()`, `useMemo`/derived → `computed()`, `useEffect` → `effect()` / lifecycle hooks, event handlers → template event bindings, `props` → signal `input()` / `output()`.
- React Router → Angular Router: `react-router` routes become Angular route definitions; `<Link to>` → `routerLink`; `useNavigate()` → `inject(Router).navigate(...)`; `useParams()`/`useSearchParams()` → `ActivatedRoute` (or `input()` with `withComponentInputBinding`); `<Outlet/>` → `<router-outlet>`.
- The MVP's in-memory mock state (the `BookingsProvider` React context, the `data/*.ts` arrays) is placeholder. Map UI/markup/styling faithfully, but **do not hardwire the mock data layer into the real app** — when a component's data should come from a service/HTTP instead of the mock arrays, treat that as a data-shape decision and ask before inventing a contract (see the repo guidance on not changing data shapes without asking).
- Preserve the same HTML structure and semantics from the MVP templates. The Angular project may use a different structure, but the styling must match; if a given MVP style can't be achieved with the Angular structure, use the closest MVP structure to achieve it.
- **shadcn/ui & Radix primitives:** any element that comes from `mvp-version/src/components/ui/*` (button, dialog, select, tabs, badge, dropdown-menu, separator, input, label, …) originates from shadcn/ui (Radix under the hood). **Stop the mapping and ask** whether to use an Angular-compatible equivalent — first check whether **cinefy-ui** already provides it; otherwise ask before installing a headless library (e.g. ng-primitives) or re-implementing. Do **not** hand-roll these primitives silently.
- Use the **`LucideAngularModule`** for icons (the MVP uses `lucide-react`; map each icon to its lucide-angular equivalent). Size icons via the `[size]` input — never via SCSS `svg { width/height }`.
- Use **pixels** for all measurements instead of rems.

### Responsive Design

- Responsive design **must** always be considered for every component.
- The MVP uses Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) extensively — translate each faithfully into equivalent SCSS media queries with matching breakpoints (Tailwind defaults: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px), or the project's breakpoint mixins if cinefy-ui's are adopted.
- Several MVP screens are responsive by design (e.g. the profile tabs are a left sidebar on `sm+` and stack on mobile; grids step from `grid-cols-2` up to `xl:grid-cols-5`) — preserve that behavior.
- If a piece of the MVP does **not** include responsive styles, add appropriate responsive behavior independently so the component works well across mobile, tablet, and desktop.

### SSR Awareness

`cinefy-client` is **server-side rendered** (`@angular/ssr` — it's the public-facing booking app, unlike the CSR-only management dashboard). When mapping:

- Guard browser-only APIs (`window`, `document`, `localStorage`, `IntersectionObserver`) — use `afterNextRender`/`afterRender`, `isPlatformBrowser`, or `@angular/ssr` patterns so they don't run during server rendering.
- Prefer CSS-driven effects over JS measurement where the MVP allows (the MVP's hover-zoom, reveal animation, and scrims are pure CSS — keep them that way; they SSR cleanly).
- Real `<img>` posters/backdrops come from remote (TMDB) URLs in the MVP — keep them as plain `<img>` (with appropriate `loading`) so they render server-side without client-only image libraries.
