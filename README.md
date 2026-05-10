# Open-LMS

An AI-native, open-source Learning Management System.

## Status

Backend and AI foundation logic is complete for this branch. Frontend logic is owned separately and remains intentionally out of scope.

## Stack

TypeScript, Postgres 16 with `pgvector` and `pg_trgm`, Drizzle ORM, Better Auth schema primitives, Vercel AI SDK, pnpm workspaces, Vitest, and Biome.

## Quick Start

Prerequisites: Node 20+, pnpm 9+, Docker Desktop or a local Postgres 16+ install with `pgvector` and `pg_trgm`.

```sh
pnpm install
docker compose up -d
pnpm --filter @openlms/core db:generate
pnpm --filter @openlms/core db:migrate
pnpm test
```

## License

Apache-2.0. See `LICENSE`.
