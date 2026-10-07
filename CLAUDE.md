# CLAUDE.md — Cinefy (repo root)

Cinefy is a cinema management & booking platform. The repository is split into two top-level groups — a backend and a frontend workspace — under one git root.

## Layout

```
Cinefy/
├── .claude/docs/        # Detailed reference docs, read on demand (indexed from each subtree's CLAUDE.md)
├── .github/workflows/   # CI: pr-build, image-scan, build-deploy-prod
├── cinefy-backend/      # Spring Boot 4 REST API (Java 25, Maven, PostgreSQL)
├── cinefy-frontend/     # pnpm workspace (the frontend monorepo)
│   ├── cinefy-management/   # Angular 22 admin/staff dashboard (the app behind /login)
│   ├── cinefy-ui/           # Shared Angular component library (ng-packagr)
│   └── cinefy-client/       # Angular 22 public-facing booking app (SSR)
├── docker-compose.yml   # Production stack (nginx + backend + both apps; external Postgres and Redis)
├── docker-compose.local.yml # Local stack built from source, plus Postgres and Redis
├── nginx.Dockerfile     # Reverse-proxy image, built from the repo root
├── nginx.local.conf     # Proxy config for the local stack (the other nginx.*.conf files are gitignored)
└── .env.example         # Env vars, non-secret values filled in for the local stack
```

Each subtree has its own `CLAUDE.md` — read the one for the area you're working in:

- **Backend:** [`cinefy-backend/CLAUDE.md`](cinefy-backend/CLAUDE.md) — the backend rules, plus an index into the detailed docs under [`.claude/docs/backend/`](.claude/docs/backend/) (security, auth, bookings, payments, persistence, statistics, …).
- **Frontend (all packages):** [`cinefy-frontend/CLAUDE.md`](cinefy-frontend/CLAUDE.md) — the frontend-wide rules and commands, plus an index into [`.claude/docs/frontend/`](.claude/docs/frontend/) (conventions, HTTP, styling, cinefy-ui, workspace).
- **Frontend (management app):** [`cinefy-frontend/cinefy-management/CLAUDE.md`](cinefy-frontend/cinefy-management/CLAUDE.md) — dashboard-specific rules, indexing `.claude/docs/frontend/management/`.
- **Frontend (client app):** [`cinefy-frontend/cinefy-client/CLAUDE.md`](cinefy-frontend/cinefy-client/CLAUDE.md) — the SSR rules, indexing `.claude/docs/frontend/client/`.

`cinefy-ui` (the shared component library) has no `CLAUDE.md` of its own — it's covered by the frontend-wide `CLAUDE.md`, [`.claude/docs/frontend/cinefy-ui.md`](.claude/docs/frontend/cinefy-ui.md), and its README's token contract.

## Working in each half

- **Backend** — Maven via the wrapper, from `cinefy-backend/`:
  ```bash
  ./mvnw compile      # Java 25 required (the parent is Spring Boot 4.1.1)
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

  **Every pnpm command runs from `cinefy-frontend/` — never from inside `cinefy-management/`, `cinefy-client/`, or `cinefy-ui/`.** Those packages have a `package.json` but no pnpm lockfile of their own (the only real lockfile is `cinefy-frontend/pnpm-lock.yaml`; `cinefy-management/` also carries a stray npm `package-lock.json`, and `cinefy-management/` and `cinefy-ui/` each carry a local `pnpm-workspace.yaml`). Running pnpm inside one makes it re-resolve all dependencies as a standalone project, leaving a stray lockfile and a private `node_modules` on a different Angular patch than the workspace pins. That breaks the build with hundreds of confusing `InputSignal` type errors. To run one package's script, use `pnpm --filter <package> <script>` from the root. See [`.claude/docs/frontend/workspace.md`](.claude/docs/frontend/workspace.md#why-the-working-directory-matters) for the details and recovery steps.

## Report problems, don't fix them unasked

**When you discover a problem outside the task you were given, stop and report it. Do not implement a fix.** Describe what you found, why it matters, and what you'd propose — then wait. The user decides whether it gets fixed, and how.

This covers anything you notice that wasn't what you were asked to work on: a latent bug, a design flaw, a redundant or now-wrong piece of code, a duplicated constant, a related-but-separate defect in a file you happened to open. It applies even when the fix looks small, obvious, or strictly-better — "it was only three lines" is not a reason to skip the conversation.

It does **not** apply to errors in your own in-progress work. A compile error, a missing import, a wrong path, or a typo in code you are actively writing is part of finishing the task — fix those and move on.

If the discovered problem **blocks** the task you were asked to do, say so explicitly and wait for direction rather than working around it.

Two things to be honest about when reporting:

- **Whether you actually observed the problem**, or only reasoned that it could happen. Say which. A defect reproduced in the real code path is a different claim from one inferred from a synthetic test.
- **Whether the fix is reachable in this app today**, or is defensive against a future caller. Trace it before asserting it's real.

## Keep the docs in sync

**After every change you make, check whether a markdown file documents what you changed, and update it if it does.** Treat this as part of finishing the change, not a follow-up.

- Look in the `CLAUDE.md` for the area, the docs it indexes under [`.claude/docs/`](.claude/docs/), the package `README.md`, and any rule or command file under a `.claude/` folder (e.g. `cinefy-backend/.claude/rules/`, `.claude/commands/`).
- Update anything the change made wrong or incomplete: renamed or moved files, classes and methods; new or removed endpoints, routes, pages, components, services, config keys and env vars; changed rules, access, constants or behavior.
- If nothing documents the change, don't create a new doc unless asked. If a change adds a new area that clearly belongs in an existing doc, add it there.
- In your final message, say which docs you updated, or that none needed it.

## Conventions

- Each subtree has its own `.gitignore` (`cinefy-backend/.gitignore`, `cinefy-frontend/.gitignore`). The root `.gitignore` covers what lives at the root: env files (`.env`, `*.env`, except `.env.example`) and `nginx.*.conf` (except `nginx.local.conf`). `docker-compose.local.yml` is committed: it builds the full stack from source (plus PostgreSQL and Redis) and reads its variables from `local.env`, a copy of `.env.example`, whose non-secret values are filled in for that stack.
- The frontend and backend version independently and share no build tooling; the root only holds the deploy files (compose, nginx image, CI). The only contract between them is the HTTP API (documented in Swagger and the backend docs).
