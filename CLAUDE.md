# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cinefy is a cinema booking platform with two modules:
- **`cinefy-backend/`** — Spring Boot 4 REST API (Java 21, PostgreSQL)
- **`cinefy-management/`** — Angular 21 management dashboard (SSR enabled)

## Commands

### Backend (from `cinefy-backend/`)
```bash
mvn spring-boot:run          # Start dev server on :8080
mvn clean package            # Build
mvn test                     # Run all tests
mvn test -Dtest=ClassName    # Run a single test class
```

### Frontend (from `cinefy-management/`)
```bash
pnpm start                   # Dev server on :4200 (ng serve)
pnpm build                   # Production build
pnpm test                    # Run tests (Karma)
pnpm run serve:ssr:cinefy-management  # SSR server
```

> The frontend uses **pnpm** (v10.28.1) as the package manager — do not use npm or yarn.

## Architecture

### Backend Layers
```
Controller → Service → Repository → Entity
```
- **Entities** extend `BaseEntity` which provides: `id` (Long, DB PK), `uuid` (String, API-facing PK), `createdAt`, `updatedAt`, `version` (optimistic locking), and `@Audited` (Hibernate Envers).
- **Naming strategy**: `CinefyTableNamingStrategy` maps entity names to `UPPER_PLURAL` table names and camelCase fields to `UPPER_SNAKE_CASE` columns.
- **Audit tables** use `_REVISIONS` suffix.
- Profile `local` is used for local development (`application-local.properties`): PostgreSQL on `localhost:3306`, frontend CORS at `http://localhost:4200`.

### Frontend Architecture
- **Standalone components** (Angular 16+ style) — no NgModules.
- **Angular Signals** for state management (no NgRx).
- **ng-primitives** for headless UI primitives; **lucide-angular** for icons.
- **SSR** is configured via `@angular/ssr`.
- Components are split into `components/` (reusable) and `pages/` (route-level).

### Domain Model
```
Hall (code derived from name, unique)
 ├── HallType (ManyToOne)
 ├── HallCategoryPrice[] (OneToMany) — price per SeatCategory
 └── Seat[] — rowPosition + columnPosition + SeatCategory

Enums:
  HallStatus: SCHEDULED | NOW_SHOWING | ACTIVE | INACTIVE | UNDER_MAINTENANCE
  SeatCategory: NORMAL | VIP | AISLE
```

All entities are audited with Hibernate Envers.

## Key Config
- **Spring profile**: activate `local` for local dev (`-Dspring.profiles.active=local`)
- **DDL mode**: `update` (Hibernate auto-creates/updates schema)
- **Prettier** (frontend): 100-char width, single quotes, enforced via config in `package.json`
