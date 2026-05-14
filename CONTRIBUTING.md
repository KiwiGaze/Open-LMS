# Contributing

## Local Setup

```sh
pnpm install
docker compose up -d
pnpm --filter @openlms/core db:generate
pnpm --filter @openlms/core db:migrate
pnpm test
```

## Scope Rules

- Keep backend, AI, and frontend concerns separate.
- Do not touch frontend logic from backend/AI work.
- Keep tenant boundaries explicit in Core APIs.
- Store AI provider credentials encrypted at rest.
- Add tests for new backend and AI behavior before expanding implementation.

## Checks

Run these before handing off:

```sh
pnpm typecheck
pnpm lint
pnpm test
```
