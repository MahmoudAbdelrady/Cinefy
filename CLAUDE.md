# CLAUDE.md — Cinefy (repo root)

Cinefy is a cinema management & booking platform. The repository is split into two top-level groups — a backend and a frontend workspace — under one git root.

## Layout

```
Cinefy/
├── cinefy-backend/      # Spring Boot 4 REST API (Java 25, Maven, PostgreSQL)
└── cinefy-frontend/     # pnpm workspace (the frontend monorepo)
    ├── cinefy-management/   # Angular 21 admin/staff dashboard (the app behind /login)
    ├── cinefy-ui/           # Shared Angular component library (ng-packagr)
    └── cinefy-client/       # Angular 21 public-facing booking app (SSR)
```

Each subtree has its own detailed `CLAUDE.md` — read the one for the area you're working in:

- **Backend:** [`cinefy-backend/CLAUDE.md`](cinefy-backend/CLAUDE.md) — stack, package structure, security model, entity/DTO patterns, API endpoints.
- **Frontend (management app):** [`cinefy-frontend/cinefy-management/CLAUDE.md`](cinefy-frontend/cinefy-management/CLAUDE.md) — Angular conventions, signals, SCSS design system, the cinefy-ui import contract. This is the canonical reference for the frontend-wide conventions (used by all three frontend packages).
- **Frontend (client app):** [`cinefy-frontend/cinefy-client/CLAUDE.md`](cinefy-frontend/cinefy-client/CLAUDE.md) — the SSR booking app: SSR-safety rules, structure, and porting from the `mvp-version/` React mock.

`cinefy-ui` (the shared component library) has no `CLAUDE.md` of its own — its import contract and conventions are documented in the management `CLAUDE.md`.

## Working in each half

- **Backend** — Maven via the wrapper, from `cinefy-backend/`:
  ```bash
  ./mvnw compile      # Java 25 required (the parent is Spring Boot 4.0.5)
  ./mvnw spring-boot:run
  ```
- **Frontend** — pnpm, from the workspace root `cinefy-frontend/`:
  ```bash
  pnpm install        # restores all workspace packages
  pnpm ui:build       # build cinefy-ui (both apps link its built dist)
  pnpm mgmt:dev       # management dev server on :4200
  pnpm client:dev     # client dev server (also defaults to :4200 — pass --port to run alongside mgmt)
  ```
  Both `cinefy-management` and `cinefy-client` depend on `cinefy-ui` via `"cinefy-ui": "link:../cinefy-ui/dist"`, so build the library before running either app. **pnpm only** (v11.4.0).

## Conventions

- `.gitignore` is per-subtree (`cinefy-backend/.gitignore`, `cinefy-frontend/.gitignore`); there is no root one — nothing is built at the repo root.
- The frontend and backend version and deploy independently; they share no build tooling. The only contract between them is the HTTP API (documented in the backend `CLAUDE.md`).
