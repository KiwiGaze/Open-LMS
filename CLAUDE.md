# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope of this branch

Backend + AI foundation only. Frontend logic is intentionally out of this lane — do not introduce frontend code, do not add UI-shaped abstractions, do not assume a renderer. See `ARCHITECTURE.md` for the boundary statement.

## Commands

Local setup (Postgres 16 + `pgvector` + `pg_trgm`) is in `README.md` — don't restate it here.

| Task | Command |
| --- | --- |
| Full check (matches CI) | `pnpm typecheck && pnpm lint && pnpm test` |
| One package | `pnpm --filter @openlms/<pkg> test` |
| One test file / pattern | `pnpm --filter @openlms/core test -- session` (pass `--` so pnpm forwards to `vitest run`) |
| Run API server | `pnpm --filter @openlms/api dev` (watch) or `start` |
| Generate Drizzle migration | `pnpm --filter @openlms/core db:generate` |
| Apply migrations | `pnpm --filter @openlms/core db:migrate` |
| Regenerate `openapi/openapi.json` | `pnpm --filter @openlms/api generate:openapi` (committed file — refresh whenever you change a route or contract) |
| Drizzle Studio | `pnpm --filter @openlms/core db:studio` |
| Format | `pnpm format` |

`simple-git-hooks` runs `pnpm typecheck && pnpm lint` on every commit. Do not bypass.

## Packages and dependency direction

```
contracts  ← ai  ← core  ← api
```

- `@openlms/contracts` — Zod schemas and branded ULID types. Single source of truth for IDs (`TenantId`, `UserId`, `CourseId`, …) and entity shapes. No runtime dependencies on other workspace packages.
- `@openlms/ai` — Provider-agnostic AI gateway, action registry (`actions.ts`), prompt registry, model registry, guardrails, structured-output parser, RAG, jobs/worker. Has no DB and no auth — it consumes `ProviderConfig` and returns generation results plus usage records.
- `@openlms/core` — Authoritative LMS state. Drizzle schema + migrations, repositories per domain (`tenants/`, `courses/`, `assignments/`, …), Better Auth integration, RBAC (`permissions/evaluator.ts`), AI policy/consent evaluator (`ai-policy/evaluator.ts`), audit outbox, crypto. **AI may suggest; core decides.** Grades, permissions, and any official state transition live here.
- `@openlms/api` — Hono (`@hono/zod-openapi`) HTTP surface. Routes are declared per resource in `packages/api/src/routes/`; the seam between routes and core is `ApiDependencies` in `dependencies.ts`.

Never reach across the direction of these arrows. If `ai` needs to look at LMS state, it gets a context package built by `core/src/context/`.

## Imports

- TypeScript is configured with `verbatimModuleSyntax` + `allowImportingTsExtensions`. **Every import keeps the `.ts` extension**, including in package `exports` maps (see `packages/core/package.json`). Don't write `import { x } from './foo'` — write `'./foo.ts'`.
- `@openlms/core` ships subpath exports (`./auth/session`, `./auth/admin`, `./db`, `./db/schema`, `./crypto`, `./logger`, `./tenants`, `./memberships`, `./provider-configs`). Prefer these over deep relative paths from another package.
- Branded ID schemas exist so the type system enforces tenant/user/course scoping. Parse strings through e.g. `TenantId.parse(...)` at the system boundary; downstream code accepts the branded type.

## Database

- Drizzle ORM with `postgres-js`. Client lives in `packages/core/src/db/client.ts` and is configured with `casing: 'snake_case'` — repository code uses camelCase fields, the DB uses snake_case, conversion is automatic. Don't add manual `column_name` mappings unless you genuinely need a name that doesn't snake-case cleanly.
- Schema files in `packages/core/src/db/schema/` — one file per domain, re-exported by `index.ts`.
- Migrations in `packages/core/drizzle/` (numbered SQL). `pgvector` and `pg_trgm` are required extensions. Their canonical list lives in `packages/core/src/db/extensions.sql`; `tests/migration-extensions.test.ts` asserts every extension in the manifest is installed by some migration. When you add an extension, update both.
- Data is tenant-scoped: most tables carry `tenant_id`. Repository queries take a `tenantId` first; never query a domain table without it.
- AI provider credentials are stored encrypted (`@openlms/core/crypto` — AES-GCM with `ENCRYPTION_KEY_BASE64`). Core APIs must not return plaintext `apiKey`.

## Auth and sessions

- Better Auth (`packages/core/src/auth/better-auth.ts`) with email/password, ULID identity generation, 7-day session expiry.
- Sessions carry a custom `activeTenantId` field. Use `assertActiveTenantSession` (`auth/session.ts`) to require an active tenant; `setActiveTenant` rejects switching to a tenant the user has no membership in.
- The API server reads `Authorization: Bearer <sessionToken>`, looks up the session via `ApiDependencies.getSessionByToken`, validates expiry, and passes `actorUserId` into the dependency call. Permission and tenant-membership checks live inside `createApiDependencies` (see `permissions/evaluator.ts` for the role→permission matrix).

## HTTP layer

- Routes are typed via `@hono/zod-openapi`. Each route file in `packages/api/src/routes/` exports a `createRoute(...)` object plus a Zod response schema; `app.ts` registers them and wires the handler to `options.dependencies.<method>`.
- All errors should be thrown as `ApiError(code, message)` (`http-error.ts`); the response shape is `{ error: { code, message } }` and `code` is one of `bad_request | unauthorized | forbidden | not_found | internal_error`.
- The OpenAPI document at `/api/v1/openapi.json` is produced by `getOpenAPIDocument` plus post-processing that injects the `bearerAuth` security scheme and adds `format: date-time` to any string property whose name ends in `At` (see `openapi-document.ts`). The committed `openapi/openapi.json` is the build artifact — regenerate it whenever you change a route or contract.

## AI gateway and policy

- The set of AI actions is declared in `packages/ai/src/actions.ts` (`submission_precheck`, `feedback_draft`, `assignment_trend_card`, `rubric_clarity_review`, `page_explanation`). Each action carries required context, output contract, risk level, human-review flag, allowed audience, and scope. Adding a new action means: declaring it here, defining its output contract in `contracts`, and adding the policy evaluation path.
- `createAiGateway` (`gateway.ts`) handles provider dispatch, retries, fallback, structured output parsing, guardrails, and emits a `GatewayUsageRecord` for accounting. Token quotas are read from `ProviderConfig.quota` (`softWarnTokensPerPeriod`, `hardCapTokensPerPeriod`, `period`).
- Consent is evaluated by `consentActionTypeFor(action)` + the rule + the consent list (`core/ai-policy/evaluator.ts`). Cohort actions need cohort-size signals to be supplied. AI must not generate without a passing policy decision.

## Env vars (gotcha)

`.env.example` defines both:

- `DATABASE_URL` — read by **drizzle-kit** (migrations, studio) via `packages/core/drizzle.config.ts`.
- `DATABASE_CONNECTION_STRING` — read by the **API server** in `packages/api/src/server.ts` / `dependencies.ts`.

They point at the same Postgres locally but they are distinct lookups. Setting only one will break either migrations or the server.

Also required: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ENCRYPTION_KEY_BASE64`. The logger reads `LOG_LEVEL` and redacts `apiKey` / `authorization` paths automatically (`core/logger.ts`).

## Tests

- Vitest. The `core` package sets `sequence.concurrent: false` and `fileParallelism: false` with a 30s timeout — its tests share Drizzle-mocked state and must run serially. Other packages run in parallel.
- Repository tests do **not** hit a real database. They pass mocked `Database` objects (`createSelectOnlyDb`, `createInsertOnlyDb`, etc. — see `tests/lms-domain-repositories.test.ts`) that intercept the Drizzle query builder. The docker-compose Postgres is only needed for `db:generate` / `db:migrate` and for running the API server, not for `pnpm test`.
- Migration-shape tests use `sql.js` (in-memory SQLite) to apply migration SQL slices and assert structural properties (e.g. that legacy backfills run before adding a foreign key). See `tests/migration-extensions.test.ts` for the pattern.
- API "dependencies" tests construct `createApiDependencies({ DATABASE_CONNECTION_STRING: ... })` with a fake URL — they exercise visibility/permission predicates and wiring without opening a connection.
