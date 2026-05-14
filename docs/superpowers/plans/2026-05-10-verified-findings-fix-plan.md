# Verified Findings Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the five verified repository, AI validation, OpenAPI, grade validation, and database referential-action issues.

**Architecture:** Keep the fixes at their existing ownership boundaries: contracts validate domain invariants, repositories preserve tenant isolation, API route definitions describe runtime auth, AI provider validation mirrors real gateway parsing, and Drizzle schema plus migrations describe database invariants. Do not introduce compatibility wrappers or new abstraction layers.

**Tech Stack:** TypeScript, Zod, Hono zod-openapi, Drizzle ORM, PostgreSQL migrations, Vitest, pnpm workspaces.

---

## Verification Summary

- Verified: `packages/core/src/submissions/repository.ts` upserts drafts using `target: draft.id` and updates only `blocks` and `updatedAt`. A focused probe returned `targetName: "id"` and `setKeys: ["blocks", "updatedAt"]`.
- Verified: `packages/ai/src/provider-validation.ts` accepts `text: "ok"` as valid, while `createAiGateway(...).generate(...)` rejects the same provider response for `page_explanation` with `AI action "page_explanation" returned invalid structured output JSON`.
- Verified: runtime API routes reject unauthenticated tenant and course listing requests with 401, but generated OpenAPI has no `securitySchemes`, no operation `security`, and only `200` responses for both routes.
- Verified: `Grade.safeParse({ score: 11, maxScore: 10, ... })` succeeds.
- Verified: nullable single-column FKs use `onDelete: 'set null'`, but matching tenant-scoped composite FKs currently use no action or restrict for course resource module/unit refs, published feedback human review/grade refs, and export storage file refs.

## File Map

- Modify: `packages/core/src/submissions/repository.ts` to target the tenant-scoped draft unique index.
- Modify: `packages/core/tests/lms-domain-repositories.test.ts` to lock the draft conflict target.
- Modify: `packages/ai/src/provider-validation.ts` to parse structured validation output the same way real generation does.
- Modify: `packages/ai/tests/provider-validation.test.ts` to reject plain text and accept minimal valid `PageExplanationResult` JSON.
- Modify: `packages/api/src/openapi-document.ts` to define bearer auth security scheme.
- Modify: `packages/api/src/routes/tenants.ts` and `packages/api/src/routes/courses.ts` to declare bearer auth and 401 responses.
- Modify: `packages/api/tests/openapi.test.ts` to assert security metadata and 401 docs.
- Modify: `packages/contracts/src/feedback.ts` to enforce `score <= maxScore`.
- Modify: `packages/contracts/tests/assignment-feedback.test.ts` to cover grade bounds.
- Modify: `packages/core/src/db/schema/feedback.ts`, `packages/core/src/db/schema/course.ts`, and `packages/core/src/db/schema/data-export.ts` to align composite FK delete behavior.
- Modify: `packages/core/tests/migration-extensions.test.ts` to assert generated migration SQL contains the required checks and partial `SET NULL` actions.
- Create: next generated Drizzle migration under `packages/core/drizzle/` and next snapshot under `packages/core/drizzle/meta/`.

### Task 1: Tenant-Scoped Draft Upsert

**Files:**
- Modify: `packages/core/src/submissions/repository.ts`
- Modify: `packages/core/tests/lms-domain-repositories.test.ts`

- [ ] **Step 1: Write a failing repository test for the conflict target**

Add a helper near the existing insert-only DB helpers:

```ts
const createDraftConflictCaptureDb = (capture: { options: unknown }): Database =>
  ({
    insert: () => ({
      values: (value: Draft) => ({
        onConflictDoUpdate: (options: unknown) => {
          capture.options = options;
          return {
            returning: async () => [value],
          };
        },
      }),
    }),
  }) as unknown as Database;
```

Add this test in `traditional LMS domain repositories`:

```ts
it('upserts drafts through the tenant-scoped draft identity', async () => {
  const capture = { options: null as unknown };

  await saveDraft(createDraftConflictCaptureDb(capture), draft);

  const target = getObjectProperty(capture.options, 'target');
  expect(Array.isArray(target)).toBe(true);
  expect((target as { name?: string }[]).map((column) => column.name)).toEqual([
    'tenant_id',
    'id',
  ]);
});
```

- [ ] **Step 2: Run the failing test**

Run: `pnpm --filter @openlms/core exec vitest run tests/lms-domain-repositories.test.ts`

Expected before implementation: FAIL because the conflict target is the single `id` column.

- [ ] **Step 3: Change the upsert target**

Update `saveDraft`:

```ts
.onConflictDoUpdate({
  target: [draft.tenantId, draft.id],
  set: {
    blocks: parsed.blocks,
    updatedAt: parsed.updatedAt,
  },
})
```

- [ ] **Step 4: Verify the repository test passes**

Run: `pnpm --filter @openlms/core exec vitest run tests/lms-domain-repositories.test.ts`

Expected after implementation: PASS.

### Task 2: Provider Validation Must Parse Structured Output

**Files:**
- Modify: `packages/ai/src/provider-validation.ts`
- Modify: `packages/ai/tests/provider-validation.test.ts`

- [ ] **Step 1: Replace the current success fixture**

In `marks provider configs valid after a successful provider test call`, return valid `PageExplanationResult` JSON:

```ts
text: JSON.stringify({
  answer: 'Provider validation succeeded.',
  keyPoints: ['The provider returned parseable structured output.'],
  citedResourceIds: ['provider-config-validation'],
  followUpQuestions: ['What should I review next?'],
}),
```

- [ ] **Step 2: Add a failing plain-text rejection test**

```ts
it('marks provider configs invalid when structured validation output is not JSON', async () => {
  const provider: ModelProvider = {
    generateText: async (request) => ({
      actionIdentifier: request.actionIdentifier,
      providerType: config.providerType,
      model: 'page-model',
      text: 'ok',
      usage: { inputTokens: 1, outputTokens: 1 },
      softQuotaExceeded: false,
    }),
  };

  const result = await validateProviderConfig(provider, config);

  expect(result.validationStatus).toBe('invalid');
  expect(result.validationError).toMatch(/structured output JSON/i);
});
```

- [ ] **Step 3: Run the failing AI validation tests**

Run: `pnpm --filter @openlms/ai exec vitest run tests/provider-validation.test.ts`

Expected before implementation: FAIL because plain text is still accepted.

- [ ] **Step 4: Parse validation output like gateway generation**

In `packages/ai/src/provider-validation.ts`, import `parseStructuredAiOutput` from `./structured-output.ts`. After `GatewayResponse.parse(...)`, parse `response.text` with `JSON.parse` and pass it to `parseStructuredAiOutput(request.actionIdentifier, parsedText)`. On JSON parse failure, throw an error with this user-actionable message:

```ts
`AI action "${request.actionIdentifier}" returned invalid structured output JSON. Choose a provider with structured output support and retry validation.`
```

Also update the validation prompt message to request the minimal JSON shape from Step 1.

- [ ] **Step 5: Verify AI validation**

Run: `pnpm --filter @openlms/ai exec vitest run tests/provider-validation.test.ts`

Expected after implementation: PASS.

### Task 3: Document Runtime Auth in OpenAPI

**Files:**
- Modify: `packages/api/src/openapi-document.ts`
- Modify: `packages/api/src/routes/tenants.ts`
- Modify: `packages/api/src/routes/courses.ts`
- Modify: `packages/api/tests/openapi.test.ts`

- [ ] **Step 1: Add OpenAPI assertions**

Add tests that assert:

```ts
expect(document.components?.securitySchemes).toMatchObject({
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
  },
});
expect(document.paths['/api/v1/tenants']?.get?.security).toEqual([{ bearerAuth: [] }]);
expect(document.paths['/api/v1/tenants/{tenantId}/courses']?.get?.security).toEqual([
  { bearerAuth: [] },
]);
expect(document.paths['/api/v1/tenants']?.get?.responses).toHaveProperty('401');
expect(document.paths['/api/v1/tenants/{tenantId}/courses']?.get?.responses).toHaveProperty('401');
```

- [ ] **Step 2: Run the failing OpenAPI tests**

Run: `pnpm --filter @openlms/api exec vitest run tests/openapi.test.ts`

Expected before implementation: FAIL because auth metadata and 401 responses are absent.

- [ ] **Step 3: Add bearer security scheme**

Extend `openApiDocumentBase`:

```ts
components: {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
    },
  },
},
```

- [ ] **Step 4: Add shared unauthorized response and route security**

In both protected routes add:

```ts
security: [{ bearerAuth: [] }],
```

Add a 401 response:

```ts
401: {
  description: 'Authentication is required.',
  content: {
    'application/json': {
      schema: z.object({
        error: z.object({
          code: z.literal('unauthorized'),
          message: z.string(),
        }),
      }),
    },
  },
},
```

Import `z` where needed. Keep `/health` unauthenticated.

- [ ] **Step 5: Verify API docs and runtime auth still agree**

Run: `pnpm --filter @openlms/api exec vitest run tests/app.test.ts tests/openapi.test.ts`

Expected after implementation: PASS.

### Task 4: Enforce Grade Score Bounds in Contracts and DB

**Files:**
- Modify: `packages/contracts/src/feedback.ts`
- Modify: `packages/contracts/tests/assignment-feedback.test.ts`
- Modify: `packages/core/src/db/schema/feedback.ts`
- Modify: `packages/core/tests/migration-extensions.test.ts`
- Create: next Drizzle migration and snapshot.

- [ ] **Step 1: Add contract tests**

Add grade tests:

```ts
it('rejects grades whose score exceeds max score', () => {
  expect(() =>
    Grade.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      score: 11,
      maxScore: 10,
      status: 'draft',
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    }),
  ).toThrow(/score cannot exceed max score/i);
});
```

- [ ] **Step 2: Run the failing contract test**

Run: `pnpm --filter @openlms/contracts exec vitest run tests/assignment-feedback.test.ts`

Expected before implementation: FAIL because the grade is accepted.

- [ ] **Step 3: Add the Zod invariant**

Wrap `Grade` with `.superRefine(...)`:

```ts
.superRefine((grade, context) => {
  if (grade.score > grade.maxScore) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Grade score cannot exceed max score.',
      path: ['score'],
    });
  }
});
```

- [ ] **Step 4: Add DB check constraints**

Import `check` in `packages/core/src/db/schema/feedback.ts` and add checks in the `grade` table callback:

```ts
scoreNonnegativeCheck: check('grade_score_nonnegative_check', sql`${table.score} >= 0`),
maxScorePositiveCheck: check('grade_max_score_positive_check', sql`${table.maxScore} > 0`),
scoreMaxScoreCheck: check('grade_score_lte_max_score_check', sql`${table.score} <= ${table.maxScore}`),
```

- [ ] **Step 5: Generate migration and assert SQL**

Run: `pnpm --filter @openlms/core db:generate`

Add migration assertions that the concatenated SQL contains:

```ts
'CONSTRAINT "grade_score_lte_max_score_check" CHECK'
'CONSTRAINT "grade_score_nonnegative_check" CHECK'
'CONSTRAINT "grade_max_score_positive_check" CHECK'
```

- [ ] **Step 6: Verify grade checks**

Run:

```bash
pnpm --filter @openlms/contracts exec vitest run tests/assignment-feedback.test.ts
pnpm --filter @openlms/core exec vitest run tests/migration-extensions.test.ts
```

Expected after implementation: PASS.

### Task 5: Align Nullable Tenant-Scoped FK Delete Actions

**Files:**
- Modify: `packages/core/src/db/schema/course.ts`
- Modify: `packages/core/src/db/schema/feedback.ts`
- Modify: `packages/core/src/db/schema/data-export.ts`
- Modify: `packages/core/tests/migration-extensions.test.ts`
- Create: next Drizzle migration and snapshot.

- [ ] **Step 1: Add migration assertions first**

Add assertions for these exact fragments:

```ts
'ADD CONSTRAINT "course_resource_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id") REFERENCES "public"."course_module"("tenant_id","id") ON DELETE SET NULL ("module_id") ON UPDATE no action'
'ADD CONSTRAINT "course_resource_tenant_unit_fk" FOREIGN KEY ("tenant_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","id") ON DELETE SET NULL ("unit_id") ON UPDATE no action'
'ADD CONSTRAINT "published_feedback_tenant_human_review_fk" FOREIGN KEY ("tenant_id","human_review_id") REFERENCES "public"."human_review"("tenant_id","id") ON DELETE SET NULL ("human_review_id") ON UPDATE no action'
'ADD CONSTRAINT "published_feedback_tenant_linked_grade_fk" FOREIGN KEY ("tenant_id","linked_grade_id") REFERENCES "public"."grade"("tenant_id","id") ON DELETE SET NULL ("linked_grade_id") ON UPDATE no action'
'ADD CONSTRAINT "export_job_tenant_storage_file_fk" FOREIGN KEY ("tenant_id","storage_file_id") REFERENCES "public"."file_resource"("tenant_id","id") ON DELETE SET NULL ("storage_file_id") ON UPDATE no action'
```

- [ ] **Step 2: Run the failing migration test**

Run: `pnpm --filter @openlms/core exec vitest run tests/migration-extensions.test.ts`

Expected before implementation: FAIL because current migrations use no action or restrict for those composite FKs.

- [ ] **Step 3: Update Drizzle schema**

Add `.onDelete('set null')` to:

```ts
courseResource.tenantModuleForeignKey
courseResource.tenantUnitForeignKey
publishedFeedback.tenantHumanReviewForeignKey
publishedFeedback.tenantLinkedGradeForeignKey
exportJob.tenantStorageFileForeignKey
```

- [ ] **Step 4: Generate migration**

Run: `pnpm --filter @openlms/core db:generate`

Review the generated migration to confirm it drops the old composite constraints before re-adding them with partial `ON DELETE SET NULL (...)` column lists.

- [ ] **Step 5: Verify FK delete behavior documentation**

Run: `pnpm --filter @openlms/core exec vitest run tests/migration-extensions.test.ts`

Expected after implementation: PASS.

### Task 6: Full Focused Verification

**Files:**
- No new files.

- [ ] **Step 1: Run all touched package tests**

Run:

```bash
pnpm --filter @openlms/contracts test
pnpm --filter @openlms/ai test
pnpm --filter @openlms/api test
pnpm --filter @openlms/core test
```

Expected: all four commands exit 0.

- [ ] **Step 2: Run typechecks for touched packages**

Run:

```bash
pnpm --filter @openlms/contracts typecheck
pnpm --filter @openlms/ai typecheck
pnpm --filter @openlms/api typecheck
pnpm --filter @openlms/core typecheck
```

Expected: all four commands exit 0.

- [ ] **Step 3: Review the diff for scope**

Run: `git diff -- packages/contracts packages/ai packages/api packages/core docs/superpowers/plans/2026-05-10-verified-findings-fix-plan.md`

Expected: changes are limited to the files listed above, plus generated Drizzle migration metadata.
