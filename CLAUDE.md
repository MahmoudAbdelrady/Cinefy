# CLAUDE.md — Cinefy (repo root)

Cinefy is a cinema management & booking platform. The repository is split into two top-level groups — a backend and a frontend workspace — under one git root.

## Layout

```
Cinefy/
├── cinefy-backend/      # Spring Boot 4 REST API (Java 25, Maven, PostgreSQL)
└── cinefy-frontend/     # pnpm workspace (the frontend monorepo)
    ├── cinefy-management/   # Angular 22 admin/staff dashboard (the app behind /login)
    ├── cinefy-ui/           # Shared Angular component library (ng-packagr)
    └── cinefy-client/       # Angular 22 public-facing booking app (SSR)
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

  Both `cinefy-management` and `cinefy-client` depend on `cinefy-ui` via `"cinefy-ui": "link:../cinefy-ui/dist"`, so build the library before running either app. **pnpm only** (v12.3.4).

  **Every pnpm command runs from `cinefy-frontend/` — never from inside `cinefy-management/`, `cinefy-client/`, or `cinefy-ui/`.** Those packages have a `package.json` but no lockfile; running pnpm inside one makes it re-resolve all dependencies as a standalone project, leaving a stray lockfile and a private `node_modules` on a different Angular patch than the workspace pins. That breaks the build with hundreds of confusing `InputSignal` type errors. To run one package's script, use `pnpm --filter <package> <script>` from the root. See [`cinefy-management/CLAUDE.md`](cinefy-frontend/cinefy-management/CLAUDE.md#commands) for the details and recovery steps.

## Report problems, don't fix them unasked

**When you discover a problem outside the task you were given, stop and report it. Do not implement a fix.** Describe what you found, why it matters, and what you'd propose — then wait. The user decides whether it gets fixed, and how.

This covers anything you notice that wasn't what you were asked to work on: a latent bug, a design flaw, a redundant or now-wrong piece of code, a duplicated constant, a related-but-separate defect in a file you happened to open. It applies even when the fix looks small, obvious, or strictly-better — "it was only three lines" is not a reason to skip the conversation.

It does **not** apply to errors in your own in-progress work. A compile error, a missing import, a wrong path, or a typo in code you are actively writing is part of finishing the task — fix those and move on.

If the discovered problem **blocks** the task you were asked to do, say so explicitly and wait for direction rather than working around it.

Two things to be honest about when reporting:

- **Whether you actually observed the problem**, or only reasoned that it could happen. Say which. A defect reproduced in the real code path is a different claim from one inferred from a synthetic test.
- **Whether the fix is reachable in this app today**, or is defensive against a future caller. Trace it before asserting it's real.

## Conventions

- `.gitignore` is per-subtree (`cinefy-backend/.gitignore`, `cinefy-frontend/.gitignore`); there is no root one — nothing is built at the repo root.
- The frontend and backend version and deploy independently; they share no build tooling. The only contract between them is the HTTP API (documented in the backend `CLAUDE.md`).
