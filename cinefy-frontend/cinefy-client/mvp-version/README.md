# Cinefy Client — MVP design

A throwaway **mock design** for the public-facing Cinefy booking app. Built here so the
interface can be iterated quickly before it's reimplemented in the real Angular
`cinefy-client` app. **Nothing here ships** — it's a design sandbox.

## Stack

- **React 19** + **Vite 6** (TypeScript)
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **react-router 7** for navigation
- **lucide-react** for icons
- **shadcn/ui** — added on demand via the CLI (not pre-bundled)

This is a **self-contained pnpm workspace** (its own `pnpm-workspace.yaml`), isolated from
the Angular monorepo around it.

## Running

```bash
pnpm install
pnpm dev        # Vite dev server
pnpm build      # type-check-free production build
```

## Structure

```
src/
├── main.tsx               # React entry, mounts the router
├── app/
│   ├── router.tsx         # route table
│   └── RootLayout.tsx     # shell (navbar + <Outlet/>)
├── pages/                 # one folder per page
│   ├── home/
│   ├── movie-detail/
│   └── not-found/
├── components/            # one folder per shared component
│   ├── navbar/
│   └── movie-card/
├── components/ui/         # shadcn components land here (added on demand)
├── data/                  # mock data for the design
├── lib/utils.ts           # cn() helper for shadcn
└── styles/index.css       # Tailwind v4 entry + theme tokens
```

## Adding shadcn components

shadcn copies component source into `src/components/ui/` — add only what you use:

```bash
pnpm dlx shadcn@latest add button card dialog
```

Then import via the `@` alias:

```tsx
import { Button } from '@/components/ui/button'
```
