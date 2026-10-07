# Frontend workspace

`cinefy-frontend/` is a pnpm workspace (pnpm **12.3.4**, set by `packageManager`; Node 24 in CI and Docker) with three packages:

| Package             | What it is                                | Built with                                            |
| ------------------- | ----------------------------------------- | ----------------------------------------------------- |
| `cinefy-management` | Staff dashboard, client-side rendered     | `@angular/build:application` (browser only)           |
| `cinefy-client`     | Public booking site, server-side rendered | `@angular/build:application` (`outputMode: "server"`) |
| `cinefy-ui`         | Shared component library                  | ng-packagr → `cinefy-ui/dist`                         |

Both apps depend on the **built** library via `"cinefy-ui": "link:../cinefy-ui/dist"`, so build it before running either app.

## Commands

Run every command from `cinefy-frontend/`. To run one package's own script, use `pnpm --filter <package> <script>` from the root.

| Script                                                | What it does                                                                                  |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm install`                                        | Restore all workspace packages                                                                |
| `pnpm ui:build` / `pnpm ui:watch`                     | Build cinefy-ui once / on every change                                                        |
| `pnpm mgmt:dev` / `pnpm mgmt:build`                   | Management dev server (:4200) / production build (`dist/cinefy-management/browser/`)          |
| `pnpm client:dev` / `pnpm client:build`               | Client dev server (also defaults to :4200 — pass `--port` to run both) / production SSR build |
| `pnpm app:build`                                      | Build cinefy-ui, then management, then client                                                 |
| `pnpm --filter cinefy-client serve:ssr:cinefy-client` | Run the built SSR server                                                                      |

**Tests:** there are no `*.spec.ts` files anywhere. The client has Vitest + jsdom wired (`@angular/build:unit-test`). Management has no test runner: its `test` script has no target in `angular.json`, and `tsconfig.spec.json` is a leftover Vitest stub. Schematics in both apps set `skipTests: true`.

## Why the working directory matters

The packages have a `package.json` but no **pnpm** lockfile of their own — the only real lockfile is `cinefy-frontend/pnpm-lock.yaml`. (`cinefy-management/` carries a stray npm `package-lock.json`, and `cinefy-management/` and `cinefy-ui/` each carry a local `pnpm-workspace.yaml`; the workspace uses none of them.)

Running `pnpm install` or `pnpm build` from inside a package makes pnpm treat it as a standalone project: it re-resolves every dependency from the registry, writes a stray `pnpm-lock.yaml` there, and creates a private `node_modules/.pnpm` store. Because the deps are carets (`^22.1.5`), that resolution picks up newer patch releases than the workspace pinned, so the app ends up on a different Angular than `cinefy-ui`. Angular version-stamps its `InputSignal` brand symbol, so every binding into a cinefy-ui component then fails to typecheck with hundreds of `__@ɵINPUT_SIGNAL_BRAND_WRITE_TYPE@<n>` errors — a broken build that looks like a code bug but is purely an install artifact.

Recover with:

```bash
rm -rf cinefy-management/pnpm-lock.yaml cinefy-management/node_modules   # or the affected package
pnpm install --frozen-lockfile                                         # from cinefy-frontend/
```

`--frozen-lockfile` is the safe default for any install that shouldn't change dependencies — it fails rather than silently rewriting the lockfile.

## Vite cache after new cinefy-ui exports

The dev servers use Vite, which caches the cinefy-ui pre-bundle. After adding an export to the library, rebuild it and delete the app's `.angular/cache`, or the dev server throws "does not provide an export named …". Production builds aren't affected.

## Environments

Both apps: `src/environments/environment.ts` (dev, `apiUrl: 'http://localhost:8080'`) and `environment.prod.ts` (`apiUrl: '/api'`, swapped in by `fileReplacements`). Both files also carry `primeuiLicenseKey`, passed to `providePrimeNG({ license })`.
