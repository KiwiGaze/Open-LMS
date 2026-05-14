# Open-LMS Backend and AI Architecture

Open-LMS is a modular TypeScript monorepo. This branch intentionally completes backend and AI foundation logic only; frontend logic lives outside this lane.

## Packages

```text
packages/contracts  Shared Zod schemas and TypeScript contracts.
packages/core       Authoritative LMS backend state, DB schema, repositories, auth/session guards.
packages/ai         Provider-agnostic AI action registry and gateway logic.
```

## Boundary

Core owns truth: tenants, users, memberships, provider settings, sessions, policy inputs, audit-ready records, and all official state transitions.

AI owns suggestions: task registration, provider gateway behavior, model selection, quota enforcement, and structured generation metadata. AI does not own grades, permissions, or final educational decisions.

## Data

Postgres is the system database. Drizzle schema modules live in `packages/core/src/db/schema`. Tables are tenant-scoped where domain data belongs to an institution. Provider API keys are encrypted before storage; plaintext keys should never be returned from Core APIs.

## Tests

Each package owns its own Vitest suite. Repository integration tests should use a local Postgres test database; pure domain logic should stay fast and isolated.
