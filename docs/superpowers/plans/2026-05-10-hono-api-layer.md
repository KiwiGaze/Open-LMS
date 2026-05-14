# Hono API Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real Hono-based HTTP API layer in `packages/api`, backed by `packages/core` repositories and exposed through generated OpenAPI.

**Architecture:** `packages/api` owns HTTP concerns: routing, request validation, response serialization, error mapping, server startup, and OpenAPI generation. `packages/core` remains framework-free and owns database/domain behavior. The first API slice is intentionally small: health, OpenAPI JSON, tenants, and tenant courses.

**Tech Stack:** Hono, `@hono/node-server`, `@hono/zod-openapi`, Zod, Vitest, TypeScript, Drizzle-backed core repositories.

---

## File Structure

- Modify `packages/api/package.json`: add Hono dependencies and dev scripts.
- Modify `packages/api/src/openapi.ts`: replace the hand-registered `zod-to-openapi` registry with Hono route-driven OpenAPI generation.
- Create `packages/api/src/http-error.ts`: define API error helpers and status mapping.
- Create `packages/api/src/dependencies.ts`: define dependency interfaces plus real core-backed dependency factory.
- Create `packages/api/src/routes/health.ts`: health route definition and handler.
- Create `packages/api/src/routes/tenants.ts`: tenant list route definition and handler.
- Create `packages/api/src/routes/courses.ts`: tenant course list route definition and handler.
- Create `packages/api/src/app.ts`: compose the Hono app, register routes, register OpenAPI document route.
- Create `packages/api/src/server.ts`: Node server startup entrypoint.
- Modify `packages/api/src/index.ts`: export app factory, dependencies, and OpenAPI helpers.
- Modify `packages/core/src/courses/repository.ts`: add `listCourses` because the API needs a real backing query.
- Modify `packages/core/tests/course-content.test.ts`: cover `listCourses`.
- Modify `packages/api/tests/openapi.test.ts`: assert route-driven OpenAPI output.
- Create `packages/api/tests/app.test.ts`: test HTTP responses through `app.request()`.
- Modify `openapi/openapi.json`: regenerated artifact from the actual Hono app.

## Scope

This plan sets up the API layer and implements the first read-only HTTP slice. It does not implement auth enforcement, mutations, assignments, submissions, AI workflows, or frontend work. Those should follow as separate vertical slices once the API foundation is real.

## Target Routes

```text
GET /health
GET /api/v1/openapi.json
GET /api/v1/tenants
GET /api/v1/tenants/{tenantId}/courses
```

## Response Contract

Success responses return the Zod contract shape directly:

```json
[
  {
    "id": "01J9QW7B6N5W2YH3D3A1V0KE2X",
    "slug": "demo-university",
    "displayName": "Demo University",
    "createdAt": "2026-05-10T00:00:00.000Z",
    "updatedAt": "2026-05-10T00:00:00.000Z"
  }
]
```

Error responses use one stable JSON shape:

```json
{
  "error": {
    "code": "bad_request",
    "message": "Request validation failed. Check the request path, query, and body."
  }
}
```

---

## Task 1: Add Hono Dependencies and Keep the Existing Tests Red

**Files:**
- Modify: `packages/api/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install dependencies**

Run:

```bash
pnpm --filter @openlms/api add hono @hono/node-server @hono/zod-openapi
```

Expected: `packages/api/package.json` includes the three dependencies and `pnpm-lock.yaml` is updated.

- [ ] **Step 2: Remove direct OpenAPI generator dependency if no longer used**

If `packages/api/src/openapi.ts` no longer imports `@asteasolutions/zod-to-openapi` after Task 6, run:

```bash
pnpm --filter @openlms/api remove @asteasolutions/zod-to-openapi
```

Expected: `@asteasolutions/zod-to-openapi` is absent from `packages/api/package.json`.

- [ ] **Step 3: Run current API tests**

Run:

```bash
pnpm --filter @openlms/api test
```

Expected: tests still pass before implementation changes. If dependency installation changes peer behavior, capture the exact failure before modifying code.

- [ ] **Step 4: Commit dependency changes**

```bash
git add packages/api/package.json pnpm-lock.yaml
git commit -m "chore: add hono api dependencies"
```

---

## Task 2: Add Core `listCourses`

**Files:**
- Modify: `packages/core/src/courses/repository.ts`
- Modify: `packages/core/tests/course-content.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test to `packages/core/tests/course-content.test.ts` near the existing course repository tests:

```ts
import { listCourses } from '../src/courses/repository.ts';

it('lists courses for a tenant in code order', async () => {
  const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
  const otherTenantId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';

  await saveCourse(db, {
    id: '01J9QW7B6N5W2YH3D3A1V0KE2A',
    tenantId,
    code: 'SCI201',
    title: 'Science',
    status: 'active',
    startsAt: null,
    endsAt: null,
    createdAt: now,
    updatedAt: now,
  });
  await saveCourse(db, {
    id: '01J9QW7B6N5W2YH3D3A1V0KE2B',
    tenantId,
    code: 'ART101',
    title: 'Art',
    status: 'active',
    startsAt: null,
    endsAt: null,
    createdAt: now,
    updatedAt: now,
  });
  await saveCourse(db, {
    id: '01J9QW7B6N5W2YH3D3A1V0KE2C',
    tenantId: otherTenantId,
    code: 'HIS101',
    title: 'History',
    status: 'active',
    startsAt: null,
    endsAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const courses = await listCourses(db, tenantId);

  expect(courses.map((course) => course.code)).toEqual(['ART101', 'SCI201']);
  expect(courses.every((course) => course.tenantId === tenantId)).toBe(true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @openlms/core test -- course-content
```

Expected: FAIL because `listCourses` is not exported from `packages/core/src/courses/repository.ts`.

- [ ] **Step 3: Implement `listCourses`**

Add this to `packages/core/src/courses/repository.ts` after `getCourseById`:

```ts
export const listCourses = async (
  db: Database,
  tenantId: string,
): Promise<CourseContract[]> => {
  const rows = await db
    .select()
    .from(course)
    .where(eq(course.tenantId, tenantId))
    .orderBy(asc(course.code));

  return rows.map((row) => Course.parse(row));
};
```

- [ ] **Step 4: Run the core test**

Run:

```bash
pnpm --filter @openlms/core test -- course-content
```

Expected: PASS for `course-content`.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/courses/repository.ts packages/core/tests/course-content.test.ts
git commit -m "feat: list courses by tenant"
```

---

## Task 3: Add API Error Helpers

**Files:**
- Create: `packages/api/src/http-error.ts`
- Create: `packages/api/tests/http-error.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/api/tests/http-error.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ApiError, errorResponseBody, statusCodeForError } from '../src/http-error.ts';

describe('API error mapping', () => {
  it('maps known API errors to stable response bodies', () => {
    const error = new ApiError('not_found', 'Tenant was not found.');

    expect(statusCodeForError(error)).toBe(404);
    expect(errorResponseBody(error)).toEqual({
      error: {
        code: 'not_found',
        message: 'Tenant was not found.',
      },
    });
  });

  it('maps unknown errors to internal server error without leaking details', () => {
    const error = new Error('database password appeared in a stack trace');

    expect(statusCodeForError(error)).toBe(500);
    expect(errorResponseBody(error)).toEqual({
      error: {
        code: 'internal_error',
        message: 'The request could not be completed. Retry the request or contact support.',
      },
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @openlms/api test -- http-error
```

Expected: FAIL because `packages/api/src/http-error.ts` does not exist.

- [ ] **Step 3: Implement error helpers**

Create `packages/api/src/http-error.ts`:

```ts
export type ApiErrorCode = 'bad_request' | 'not_found' | 'internal_error';

export type ApiErrorResponseBody = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

const errorStatusCodes: Record<ApiErrorCode, 400 | 404 | 500> = {
  bad_request: 400,
  not_found: 404,
  internal_error: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export const statusCodeForError = (error: unknown): 400 | 404 | 500 => {
  if (error instanceof ApiError) {
    return errorStatusCodes[error.code];
  }

  return 500;
};

export const errorResponseBody = (error: unknown): ApiErrorResponseBody => {
  if (error instanceof ApiError) {
    return {
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  return {
    error: {
      code: 'internal_error',
      message: 'The request could not be completed. Retry the request or contact support.',
    },
  };
};
```

- [ ] **Step 4: Run the test**

Run:

```bash
pnpm --filter @openlms/api test -- http-error
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/http-error.ts packages/api/tests/http-error.test.ts
git commit -m "feat: add api error mapping"
```

---

## Task 4: Add API Dependency Boundary

**Files:**
- Create: `packages/api/src/dependencies.ts`
- Create: `packages/api/tests/dependencies.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/api/tests/dependencies.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

describe('API dependencies', () => {
  it('requires a database connection string for real dependencies', () => {
    expect(() => createApiDependencies({})).toThrow(
      'DATABASE_CONNECTION_STRING is required to start the API server.',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @openlms/api test -- dependencies
```

Expected: FAIL because `packages/api/src/dependencies.ts` does not exist.

- [ ] **Step 3: Implement dependency boundary**

Create `packages/api/src/dependencies.ts`:

```ts
import type { Course, Tenant } from '@openlms/contracts';
import { createDbHandle, listCourses, listTenants } from '@openlms/core';

export type ApiDependencies = {
  listTenants: () => Promise<Tenant[]>;
  listCourses: (tenantId: string) => Promise<Course[]>;
  close: () => Promise<void>;
};

export type ApiEnvironment = {
  DATABASE_CONNECTION_STRING?: string;
};

export const createApiDependencies = (environment: ApiEnvironment): ApiDependencies => {
  if (!environment.DATABASE_CONNECTION_STRING) {
    throw new Error('DATABASE_CONNECTION_STRING is required to start the API server.');
  }

  const dbHandle = createDbHandle(environment.DATABASE_CONNECTION_STRING);

  return {
    listTenants: () => listTenants(dbHandle.db),
    listCourses: (tenantId) => listCourses(dbHandle.db, tenantId),
    close: () => dbHandle.close(),
  };
};
```

- [ ] **Step 4: Run the test**

Run:

```bash
pnpm --filter @openlms/api test -- dependencies
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/dependencies.ts packages/api/tests/dependencies.test.ts
git commit -m "feat: add api dependency boundary"
```

---

## Task 5: Add Health Route and Hono App Factory

**Files:**
- Create: `packages/api/src/routes/health.ts`
- Create: `packages/api/src/app.ts`
- Create: `packages/api/tests/app.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/api/tests/app.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createApiApp } from '../src/app.ts';

const dependencies = {
  listTenants: async () => [],
  listCourses: async () => [],
  close: async () => undefined,
};

describe('API app', () => {
  it('responds to health checks', async () => {
    const app = createApiApp({ dependencies });

    const response = await app.request('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      service: 'open-lms-api',
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @openlms/api test -- app
```

Expected: FAIL because `createApiApp` does not exist.

- [ ] **Step 3: Implement the health route**

Create `packages/api/src/routes/health.ts`:

```ts
import { createRoute, z } from '@hono/zod-openapi';

export const HealthResponse = z
  .object({
    status: z.literal('ok'),
    service: z.literal('open-lms-api'),
  })
  .openapi('HealthResponse');

export const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  operationId: 'getHealth',
  responses: {
    200: {
      description: 'API process is running.',
      content: {
        'application/json': {
          schema: HealthResponse,
        },
      },
    },
  },
});
```

- [ ] **Step 4: Implement app factory**

Create `packages/api/src/app.ts`:

```ts
import { OpenAPIHono } from '@hono/zod-openapi';
import type { ApiDependencies } from './dependencies.ts';
import { errorResponseBody, statusCodeForError } from './http-error.ts';
import { healthRoute } from './routes/health.ts';

export type ApiAppOptions = {
  dependencies: ApiDependencies;
};

export const createApiApp = (_options: ApiAppOptions): OpenAPIHono => {
  const app = new OpenAPIHono();

  app.openapi(healthRoute, (context) =>
    context.json({
      status: 'ok',
      service: 'open-lms-api',
    }),
  );

  app.onError((error, context) => {
    const status = statusCodeForError(error);
    return context.json(errorResponseBody(error), status);
  });

  return app;
};
```

- [ ] **Step 5: Run the test**

Run:

```bash
pnpm --filter @openlms/api test -- app
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/app.ts packages/api/src/routes/health.ts packages/api/tests/app.test.ts
git commit -m "feat: add hono api app"
```

---

## Task 6: Add Tenant and Course Routes

**Files:**
- Create: `packages/api/src/routes/tenants.ts`
- Create: `packages/api/src/routes/courses.ts`
- Modify: `packages/api/src/app.ts`
- Modify: `packages/api/tests/app.test.ts`

- [ ] **Step 1: Extend app tests first**

Add these tests to `packages/api/tests/app.test.ts`:

```ts
const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';

it('lists tenants through the API prefix', async () => {
  const app = createApiApp({
    dependencies: {
      ...dependencies,
      listTenants: async () => [
        {
          id: tenantId,
          slug: 'demo-university',
          displayName: 'Demo University',
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
  });

  const response = await app.request('/api/v1/tenants');

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([
    {
      id: tenantId,
      slug: 'demo-university',
      displayName: 'Demo University',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    },
  ]);
});

it('lists tenant courses through the API prefix', async () => {
  const app = createApiApp({
    dependencies: {
      ...dependencies,
      listCourses: async (requestedTenantId) => {
        expect(requestedTenantId).toBe(tenantId);
        return [
          {
            id: courseId,
            tenantId,
            code: 'ENG101',
            title: 'Writing Studio',
            status: 'active',
            startsAt: null,
            endsAt: null,
            createdAt: now,
            updatedAt: now,
          },
        ];
      },
    },
  });

  const response = await app.request(`/api/v1/tenants/${tenantId}/courses`);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([
    {
      id: courseId,
      tenantId,
      code: 'ENG101',
      title: 'Writing Studio',
      status: 'active',
      startsAt: null,
      endsAt: null,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    },
  ]);
});

it('rejects invalid tenant ids before calling dependencies', async () => {
  let dependencyCalled = false;
  const app = createApiApp({
    dependencies: {
      ...dependencies,
      listCourses: async () => {
        dependencyCalled = true;
        return [];
      },
    },
  });

  const response = await app.request('/api/v1/tenants/not-a-ulid/courses');

  expect(response.status).toBe(400);
  expect(dependencyCalled).toBe(false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --filter @openlms/api test -- app
```

Expected: FAIL because tenant and course routes do not exist.

- [ ] **Step 3: Implement tenant route**

Create `packages/api/src/routes/tenants.ts`:

```ts
import { createRoute } from '@hono/zod-openapi';
import { Tenant } from '@openlms/contracts';

export const listTenantsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants',
  tags: ['Tenants'],
  operationId: 'listTenants',
  responses: {
    200: {
      description: 'Tenants visible to the authenticated user.',
      content: {
        'application/json': {
          schema: Tenant.array(),
        },
      },
    },
  },
});
```

- [ ] **Step 4: Implement course route**

Create `packages/api/src/routes/courses.ts`:

```ts
import { createRoute, z } from '@hono/zod-openapi';
import { Course, TenantId } from '@openlms/contracts';

export const TenantPathParams = z.object({
  tenantId: TenantId.openapi({
    param: {
      name: 'tenantId',
      in: 'path',
      description: 'Tenant identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  }),
});

export const listCoursesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses',
  tags: ['Courses'],
  operationId: 'listCourses',
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'Courses in the tenant.',
      content: {
        'application/json': {
          schema: Course.array(),
        },
      },
    },
  },
});
```

- [ ] **Step 5: Register routes in app factory**

Modify `packages/api/src/app.ts`:

```ts
import { OpenAPIHono } from '@hono/zod-openapi';
import type { ApiDependencies } from './dependencies.ts';
import { errorResponseBody, statusCodeForError } from './http-error.ts';
import { listCoursesRoute } from './routes/courses.ts';
import { healthRoute } from './routes/health.ts';
import { listTenantsRoute } from './routes/tenants.ts';

export type ApiAppOptions = {
  dependencies: ApiDependencies;
};

export const createApiApp = (options: ApiAppOptions): OpenAPIHono => {
  const app = new OpenAPIHono();

  app.openapi(healthRoute, (context) =>
    context.json({
      status: 'ok',
      service: 'open-lms-api',
    }),
  );

  app.openapi(listTenantsRoute, async (context) => {
    const tenants = await options.dependencies.listTenants();
    return context.json(tenants);
  });

  app.openapi(listCoursesRoute, async (context) => {
    const { tenantId } = context.req.valid('param');
    const courses = await options.dependencies.listCourses(tenantId);
    return context.json(courses);
  });

  app.onError((error, context) => {
    const status = statusCodeForError(error);
    return context.json(errorResponseBody(error), status);
  });

  return app;
};
```

- [ ] **Step 6: Run the tests**

Run:

```bash
pnpm --filter @openlms/api test -- app
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/app.ts packages/api/src/routes/tenants.ts packages/api/src/routes/courses.ts packages/api/tests/app.test.ts
git commit -m "feat: add tenant and course api routes"
```

---

## Task 7: Generate OpenAPI From the Hono App

**Files:**
- Modify: `packages/api/src/openapi.ts`
- Modify: `packages/api/scripts/generate-openapi.ts`
- Modify: `packages/api/tests/openapi.test.ts`
- Modify: `openapi/openapi.json`

- [ ] **Step 1: Update OpenAPI tests first**

Replace the path assertion in `packages/api/tests/openapi.test.ts` with:

```ts
expect(Object.keys(document.paths)).toEqual([
  '/health',
  '/api/v1/tenants',
  '/api/v1/tenants/{tenantId}/courses',
]);
```

Add this assertion:

```ts
expect(document.paths['/api/v1/openapi.json']).toBeUndefined();
```

This keeps the generated API contract focused on application routes and avoids documenting the documentation endpoint as part of the product API.

- [ ] **Step 2: Run OpenAPI tests to verify they fail**

Run:

```bash
pnpm --filter @openlms/api test -- openapi
```

Expected: FAIL because `openapi.ts` still uses the hand-written registry.

- [ ] **Step 3: Implement Hono-driven OpenAPI document generation**

Replace `packages/api/src/openapi.ts` with:

```ts
import type { OpenAPIObject } from 'openapi3-ts/oas30';
import { createApiApp } from './app.ts';
import type { ApiDependencies } from './dependencies.ts';

const apiVersion = '0.0.0';

const emptyDependencies: ApiDependencies = {
  listTenants: async () => [],
  listCourses: async () => [],
  close: async () => undefined,
};

export type OpenLmsOpenApiDocument = OpenAPIObject;

export const generateOpenApiDocument = (): OpenLmsOpenApiDocument => {
  const app = createApiApp({ dependencies: emptyDependencies });

  return app.getOpenAPIDocument({
    openapi: '3.0.3',
    info: {
      title: 'Open-LMS API',
      version: apiVersion,
      description: 'HTTP API contract generated from Open-LMS Hono route definitions.',
    },
    servers: [{ url: '/' }],
  });
};
```

- [ ] **Step 4: Register OpenAPI JSON endpoint in app**

Modify `packages/api/src/app.ts` to add this after route registration:

```ts
app.doc('/api/v1/openapi.json', {
  openapi: '3.0.3',
  info: {
    title: 'Open-LMS API',
    version: '0.0.0',
    description: 'HTTP API contract generated from Open-LMS Hono route definitions.',
  },
  servers: [{ url: '/' }],
});
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @openlms/api test -- openapi app
```

Expected: PASS.

- [ ] **Step 6: Regenerate the artifact**

Run:

```bash
pnpm --filter @openlms/api generate:openapi
```

Expected: `openapi/openapi.json` contains `/health`, `/api/v1/tenants`, and `/api/v1/tenants/{tenantId}/courses`.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/openapi.ts packages/api/src/app.ts packages/api/scripts/generate-openapi.ts packages/api/tests/openapi.test.ts openapi/openapi.json
git commit -m "feat: generate openapi from hono routes"
```

---

## Task 8: Add Node Server Entrypoint

**Files:**
- Create: `packages/api/src/server.ts`
- Modify: `packages/api/package.json`
- Modify: `packages/api/src/index.ts`
- Create: `packages/api/tests/server.test.ts`

- [ ] **Step 1: Write server config test**

Create `packages/api/tests/server.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readServerPort } from '../src/server.ts';

describe('server configuration', () => {
  it('uses port 3000 by default', () => {
    expect(readServerPort({})).toBe(3000);
  });

  it('uses PORT when it is a valid integer', () => {
    expect(readServerPort({ PORT: '4317' })).toBe(4317);
  });

  it('rejects invalid PORT values', () => {
    expect(() => readServerPort({ PORT: 'not-a-port' })).toThrow(
      'PORT must be a positive integer.',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @openlms/api test -- server
```

Expected: FAIL because `server.ts` does not exist.

- [ ] **Step 3: Implement server entrypoint**

Create `packages/api/src/server.ts`:

```ts
import { serve } from '@hono/node-server';
import { createApiApp } from './app.ts';
import { createApiDependencies } from './dependencies.ts';

export type ServerEnvironment = {
  PORT?: string;
  DATABASE_CONNECTION_STRING?: string;
};

export const readServerPort = (environment: ServerEnvironment): number => {
  if (!environment.PORT) {
    return 3000;
  }

  const port = Number.parseInt(environment.PORT, 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer.');
  }

  return port;
};

export const startServer = (environment: ServerEnvironment): void => {
  const dependencies = createApiDependencies(environment);
  const app = createApiApp({ dependencies });
  const port = readServerPort(environment);

  serve({ fetch: app.fetch, port });
  console.log(`Open-LMS API listening on http://localhost:${port}`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer(process.env);
}
```

- [ ] **Step 4: Add scripts and exports**

Modify `packages/api/package.json` scripts:

```json
{
  "dev": "tsx watch src/server.ts",
  "start": "tsx src/server.ts"
}
```

Keep existing scripts: `build`, `typecheck`, `lint`, `test`, and `generate:openapi`.

Modify `packages/api/src/index.ts`:

```ts
export { createApiApp, type ApiAppOptions } from './app.ts';
export {
  createApiDependencies,
  type ApiDependencies,
  type ApiEnvironment,
} from './dependencies.ts';
export { generateOpenApiDocument, type OpenLmsOpenApiDocument } from './openapi.ts';
export { readServerPort, startServer, type ServerEnvironment } from './server.ts';
```

- [ ] **Step 5: Run server tests**

Run:

```bash
pnpm --filter @openlms/api test -- server
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/server.ts packages/api/src/index.ts packages/api/package.json packages/api/tests/server.test.ts
git commit -m "feat: add api server entrypoint"
```

---

## Task 9: Verify End to End

**Files:**
- Read: all changed files

- [ ] **Step 1: Run API package checks**

Run:

```bash
pnpm --filter @openlms/api typecheck
pnpm --filter @openlms/api lint
pnpm --filter @openlms/api test
```

Expected: all pass.

- [ ] **Step 2: Run core package checks**

Run:

```bash
pnpm --filter @openlms/core test -- course-content
pnpm --filter @openlms/core typecheck
```

Expected: all pass.

- [ ] **Step 3: Run workspace checks**

Run:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Expected: all pass.

- [ ] **Step 4: Regenerate and inspect OpenAPI**

Run:

```bash
pnpm --filter @openlms/api generate:openapi
node -e "const fs=require('fs'); const doc=JSON.parse(fs.readFileSync('openapi/openapi.json','utf8')); console.log(Object.keys(doc.paths).join('\n'))"
```

Expected output:

```text
/health
/api/v1/tenants
/api/v1/tenants/{tenantId}/courses
```

- [ ] **Step 5: Optional local smoke test**

Start the server with a real local database:

```bash
DATABASE_CONNECTION_STRING='postgres://postgres:postgres@localhost:5432/postgres' pnpm --filter @openlms/api dev
```

In another terminal:

```bash
curl -s http://localhost:3000/health
curl -s http://localhost:3000/api/v1/openapi.json
```

Expected: `/health` returns `{"status":"ok","service":"open-lms-api"}` and `/api/v1/openapi.json` returns a valid OpenAPI JSON document.

- [ ] **Step 6: Final commit**

If verification produced artifact changes:

```bash
git add openapi/openapi.json
git commit -m "chore: update generated openapi document"
```

---

## Follow-Up Plans After This Slice

After this foundation lands, add new vertical slices in this order:

1. Auth/session context for authenticated requests.
2. Course content read routes: modules, units, resources, pages, learning objectives.
3. Assignment and submission routes.
4. Instructor feedback and gradebook routes.
5. Provider config write and validation routes, with secret redaction tests.
6. AI workflow request routes: precheck, feedback draft, trend card, rubric clarity, page explanation.

Each follow-up slice should add routes, tests, core calls, and OpenAPI output together.

---

## Self-Review

- Spec coverage: The plan creates a real API package, keeps core framework-free, backs routes with core repositories, and generates OpenAPI from actual Hono route definitions.
- Placeholder scan: No task uses placeholder instructions. Each code-changing task includes concrete code and exact commands.
- Type consistency: `ApiDependencies`, `createApiApp`, `generateOpenApiDocument`, and route names are consistent across tasks.
- Scope control: The plan stops at health, tenants, and courses. Larger LMS workflows are listed as follow-up slices instead of being smuggled into setup.
