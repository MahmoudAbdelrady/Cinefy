# UI Design Patterns Reference

## Responsive Layout Patterns

### Holy Grail Layout
```css
.layout {
  display: grid;
  grid-template: "header header" auto
                 "sidebar main" 1fr
                 "footer footer" auto
                 / 260px 1fr;
  min-height: 100dvh;
}

@media (max-width: 768px) {
  .layout {
    grid-template: "header" auto
                   "main" 1fr
                   "footer" auto
                   / 1fr;
  }
}
```

### Card Grid (Auto-Responsive)
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
  gap: 24px;
}
```

## Common Component Patterns

### Button Variants
```
Primary:    Filled background, white text. Main CTA per section.
Secondary:  Outlined with border, transparent background. Supporting actions.
Tertiary:   No border/background, text + optional icon. Low-emphasis actions.
Danger:     Red-toned primary. Destructive actions, always with confirmation.
```

Size scale: `sm` (32px height), `md` (40px), `lg` (48px).

### Form Field Anatomy
```
┌─ Label (always visible, above field) ─────────────────┐
│ ┌─ Input Container ─────────────────────────────────┐  │
│ │ [Icon]  Placeholder text              [Action] │  │
│ └────────────────────────────────────────────────────┘  │
│ Helper text or error message                            │
└─────────────────────────────────────────────────────────┘
```

### Toast Notification
- Position: top-right or bottom-right, 24px from edges.
- Stack vertically with 8px gap.
- Auto-dismiss: info/success 3–5s, errors persist until dismissed.
- Include icon (checkmark, warning, X) + message + optional action link.

### Data Table
- Sticky header row on scroll.
- Sortable columns: show arrow icon indicating direction.
- Pagination or infinite scroll — not both.
- Row hover highlight.
- Bulk selection checkbox in header.
- Responsive: switch to card layout below `md` breakpoint.

### Modal Dialog
- Max-width: 480px (alert), 640px (form), 960px (complex content).
- Overlay: `rgba(0,0,0,0.5)` or backdrop-blur.
- Enter: fade-in + scale from 95% (200ms ease-out).
- Exit: fade-out + scale to 95% (150ms ease-in).
- Focus trap: tab cycles within modal. Auto-focus first interactive element.
- Close triggers: X button, Escape key, overlay click.

### Sidebar Navigation
- Width: 240–280px expanded, 64–72px collapsed (icon-only).
- Active item: highlighted background + bold text or accent border.
- Group related items under collapsible sections.
- Tooltip on collapsed icons.
- Mobile: full-width overlay with backdrop, slide-in from left.

## Loading States

### Skeleton Screens
- Match the shape of the content they replace.
- Use neutral-200 background with a shimmer animation (left-to-right gradient sweep).
- Animate with `@keyframes` and `background-position`, not JS.

### Progress Indicators
- **Determinate**: progress bar with percentage for uploads, multi-step forms.
- **Indeterminate**: spinner or pulsing dot for unknown duration.
- Place inline near the triggering action, not centered on page.

## Empty States
- Illustration or icon (muted, not distracting).
- Short headline: "No projects yet"
- Brief description: "Create your first project to get started."
- Primary CTA button.

## Error States
- Inline field errors: red text below field, red border on input.
- Page-level errors: centered message with retry button.
- Network errors: banner at top with "Retry" action.
- 404: friendly message + search or navigation links.

## Dark Mode Guidelines
- Background hierarchy: `#0a0a0a` → `#141414` → `#1f1f1f` → `#2a2a2a`
- Text: `#fafafa` (primary), `#a3a3a3` (secondary), `#6b6b6b` (muted)
- Borders: `rgba(255,255,255,0.1)`
- Shadows: reduce opacity or remove — use border separation instead.
- Images/illustrations: reduce brightness slightly with `filter: brightness(0.9)`.
