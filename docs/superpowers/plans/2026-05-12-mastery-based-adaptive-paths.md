# Mastery-Based Module Release (Adaptive Paths) Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Sequential dependency: each task builds on prior tasks; do not parallelize within a task. Do **not** add a feature flag — this is greenfield in a private monorepo.

**Goal:** Add mastery-based module release rules so instructors can gate `course_module` visibility behind objective mastery, prerequisite-module mastery, time-based opens, or per-student overrides — closing the Moodle "Restrict Access" / Canvas "Mastery Paths" gap. Provides a pure evaluator + repository + HTTP routes; AI-evidenced mastery scoring and `next_best_resource` recommendation are reserved for iteration 2.

**Architecture:**
- A new `course_module_release_rule` table holds per-module rule rows (typed config in JSONB). A sibling `course_module_release_policy` row per module stores the rule combinator (`all` / `any`). A `course_module_release_override` row pins a per-student release state (used for accommodations and instructor-granted early access).
- A pure `evaluateModuleRelease` function combines: `override → rules` precedence. Each rule is type-tagged (`prerequisite_modules`, `objective_mastery`, `date_after`, `manual_unlock`) with a typed config block and a deterministic per-rule evaluator.
- "Module completion" used by `prerequisite_modules` is derived from `learning_objective_mastery`: a prerequisite module is treated as completed when every objective on it has mastery status `proficient` or `mastered` for the student. Modules without objectives never satisfy this rule by mastery alone (instructor must add an objective or use `manual_unlock` instead).
- API surface: instructor CRUD on rules + policy + overrides; learner-visible per-course release status. Permissions extend `CorePermission` with `manage_module_release_rules` (staff) and `view_module_release_status` (everyone enrolled, scoped).

**Tech Stack:** TypeScript (strict, `verbatimModuleSyntax`), Drizzle ORM (PostgreSQL 16), Zod, Hono `@hono/zod-openapi`, Vitest. ULIDs for IDs.

**Conventions reminder:** Every relative import keeps the `.ts` extension. New schema files re-exported from `packages/core/src/db/schema/index.ts`. New contracts re-exported from `packages/contracts/src/index.ts`. Repository tests use mocked `Database` objects (see `packages/core/tests/lms-domain-repositories.test.ts`).

---

## Files Created / Modified

| Path | Purpose |
| --- | --- |
| `packages/core/drizzle/0078_module_release.sql` | New tables + checks + indexes (CREATE) |
| `packages/core/src/db/schema/module-release.ts` | Drizzle schema for the three tables (CREATE) |
| `packages/core/src/db/schema/index.ts` | Re-export new schema (MODIFY) |
| `packages/contracts/src/ids.ts` | Add three new branded IDs (MODIFY) |
| `packages/contracts/src/module-release.ts` | Zod contracts: rule, policy, override, decision (CREATE) |
| `packages/contracts/src/index.ts` | Re-export new contracts (MODIFY) |
| `packages/core/src/module-release/evaluator.ts` | Pure `evaluateModuleRelease` + helpers (CREATE) |
| `packages/core/src/module-release/repository.ts` | CRUD repositories for rule, policy, override (CREATE) |
| `packages/core/src/module-release/release-status.ts` | Service: builds inputs and runs evaluator per module (CREATE) |
| `packages/core/src/module-release/index.ts` | Re-exports (CREATE) |
| `packages/core/package.json` | Add `./module-release` subpath export (MODIFY) |
| `packages/core/src/permissions/evaluator.ts` | Add 2 permissions; grant to roles (MODIFY) |
| `packages/core/tests/module-release-evaluator.test.ts` | Pure-function unit tests (CREATE) |
| `packages/core/tests/module-release-repository.test.ts` | Repository tests with mocked DB (CREATE) |
| `packages/core/tests/module-release-permissions.test.ts` | Permission-matrix tests (CREATE) |
| `packages/core/tests/migration-extensions.test.ts` | (no change — verify still green) |
| `packages/api/src/routes/module-release.ts` | HTTP routes for rules / policy / overrides / release-status (CREATE) |
| `packages/api/src/dependencies.ts` | Wire repository methods + permission checks (MODIFY) |
| `packages/api/src/app.ts` | Register new routes (MODIFY) |
| `packages/api/tests/module-release-dependencies.test.ts` | Dependency-wiring + permission tests (CREATE) |
| `openapi/openapi.json` | Regenerate at end (MODIFY) |

---

## Task 1: Migration + Drizzle schema

**Files:**
- Create: `packages/core/drizzle/0078_module_release.sql`
- Create: `packages/core/src/db/schema/module-release.ts`
- Modify: `packages/core/src/db/schema/index.ts`

- [ ] **Step 1.1: Write the failing schema test**

Create `packages/core/tests/module-release-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  courseModuleReleaseOverride,
  courseModuleReleasePolicy,
  courseModuleReleaseRule,
} from '../src/db/schema/module-release.ts';

describe('module-release schema', () => {
  it('exposes the three release tables with primary keys', () => {
    expect(courseModuleReleaseRule).toBeDefined();
    expect(courseModuleReleasePolicy).toBeDefined();
    expect(courseModuleReleaseOverride).toBeDefined();
    expect(courseModuleReleaseRule.id.primary).toBe(true);
    expect(courseModuleReleasePolicy.id.primary).toBe(true);
    expect(courseModuleReleaseOverride.id.primary).toBe(true);
  });

  it('rule table has tenant + module FK columns', () => {
    expect(courseModuleReleaseRule.tenantId).toBeDefined();
    expect(courseModuleReleaseRule.courseId).toBeDefined();
    expect(courseModuleReleaseRule.moduleId).toBeDefined();
    expect(courseModuleReleaseRule.ruleType).toBeDefined();
    expect(courseModuleReleaseRule.config).toBeDefined();
  });
});
```

- [ ] **Step 1.2: Run the test and confirm it fails**

Run: `pnpm --filter @openlms/core test -- module-release-schema`
Expected: FAIL — module `module-release.ts` does not exist.

- [ ] **Step 1.3: Implement the Drizzle schema**

Create `packages/core/src/db/schema/module-release.ts`:

```ts
import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course, courseModule } from './course.ts';
import { tenant } from './tenant.ts';

export const courseModuleReleaseRule = pgTable(
  'course_module_release_rule',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    moduleId: text('module_id')
      .notNull()
      .references(() => courseModule.id, { onDelete: 'cascade' }),
    ruleType: text('rule_type').notNull(),
    config: jsonb('config').notNull(),
    position: integer('position').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_module_release_rule_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantModuleIdx: uniqueIndex('course_module_release_rule_tenant_module_id_uq').on(
      table.tenantId,
      table.moduleId,
      table.id,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_module_release_rule_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'course_module_release_rule_tenant_module_fk',
      columns: [table.tenantId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.id],
    }).onDelete('cascade'),
    ruleTypeCheck: check(
      'course_module_release_rule_rule_type_check',
      sql`${table.ruleType} IN ('prerequisite_modules', 'objective_mastery', 'date_after', 'manual_unlock')`,
    ),
    statusCheck: check(
      'course_module_release_rule_status_check',
      sql`${table.status} IN ('active', 'archived')`,
    ),
    positionNonnegativeCheck: check(
      'course_module_release_rule_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
  }),
);

export const courseModuleReleasePolicy = pgTable(
  'course_module_release_policy',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    moduleId: text('module_id')
      .notNull()
      .references(() => courseModule.id, { onDelete: 'cascade' }),
    combinator: text('combinator').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_module_release_policy_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantModuleUnique: uniqueIndex('course_module_release_policy_tenant_module_uq').on(
      table.tenantId,
      table.moduleId,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_module_release_policy_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'course_module_release_policy_tenant_module_fk',
      columns: [table.tenantId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.id],
    }).onDelete('cascade'),
    combinatorCheck: check(
      'course_module_release_policy_combinator_check',
      sql`${table.combinator} IN ('all', 'any')`,
    ),
  }),
);

export const courseModuleReleaseOverride = pgTable(
  'course_module_release_override',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    moduleId: text('module_id')
      .notNull()
      .references(() => courseModule.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    state: text('state').notNull(),
    reason: text('reason'),
    grantedByUserId: text('granted_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().default(sql`now()`),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_module_release_override_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantModuleStudentUnique: uniqueIndex(
      'course_module_release_override_tenant_module_student_uq',
    ).on(table.tenantId, table.moduleId, table.studentId),
    tenantCourseForeignKey: foreignKey({
      name: 'course_module_release_override_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'course_module_release_override_tenant_module_fk',
      columns: [table.tenantId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.id],
    }).onDelete('cascade'),
    stateCheck: check(
      'course_module_release_override_state_check',
      sql`${table.state} IN ('unlocked', 'locked')`,
    ),
  }),
);
```

- [ ] **Step 1.4: Re-export from schema index**

Edit `packages/core/src/db/schema/index.ts` and append at the end of the existing exports (alphabetical between `messaging.ts` and `notification.ts`):

```ts
export * from './module-release.ts';
```

- [ ] **Step 1.5: Write the SQL migration**

Create `packages/core/drizzle/0078_module_release.sql` (note: keep `--> statement-breakpoint` markers between statements; Drizzle's runner splits on them):

```sql
CREATE TABLE "course_module_release_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text NOT NULL,
	"rule_type" text NOT NULL,
	"config" jsonb NOT NULL,
	"position" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_module_release_policy" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text NOT NULL,
	"combinator" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_module_release_override" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text NOT NULL,
	"student_id" text NOT NULL,
	"state" text NOT NULL,
	"reason" text,
	"granted_by_user_id" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_module_id_course_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_module"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id") REFERENCES "public"."course_module"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_rule_type_check" CHECK ("course_module_release_rule"."rule_type" IN ('prerequisite_modules', 'objective_mastery', 'date_after', 'manual_unlock'));--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_status_check" CHECK ("course_module_release_rule"."status" IN ('active', 'archived'));--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_position_nonnegative_check" CHECK ("course_module_release_rule"."position" >= 0);--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_rule_tenant_id_uq" ON "course_module_release_rule" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_rule_tenant_module_id_uq" ON "course_module_release_rule" USING btree ("tenant_id","module_id","id");--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_module_id_course_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_module"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id") REFERENCES "public"."course_module"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_combinator_check" CHECK ("course_module_release_policy"."combinator" IN ('all', 'any'));--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_policy_tenant_id_uq" ON "course_module_release_policy" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_policy_tenant_module_uq" ON "course_module_release_policy" USING btree ("tenant_id","module_id");--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_module_id_course_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_module"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_granted_by_user_id_user_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id") REFERENCES "public"."course_module"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_state_check" CHECK ("course_module_release_override"."state" IN ('unlocked', 'locked'));--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_override_tenant_id_uq" ON "course_module_release_override" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_override_tenant_module_student_uq" ON "course_module_release_override" USING btree ("tenant_id","module_id","student_id");
```

- [ ] **Step 1.6: Update Drizzle migration journal**

Drizzle tracks migrations in `packages/core/drizzle/meta/_journal.json`. After writing the SQL file, regenerate the snapshot via the db:generate command (this also confirms our schema matches the migration):

Run: `cd /Users/mac/Desktop/Projects/Open-LMS && pnpm --filter @openlms/core db:generate`

If this generates a *different* migration file (numbered 0078) than what we wrote, prefer the generated one and replace our hand-rolled SQL with the generated content (re-numbering ours away). If the generator produces nothing because it considers state in-sync, regenerate the snapshot manually only if the journal has not been updated (it likely will be — inspect `meta/_journal.json` for a new `0078` entry).

If `db:generate` requires a running database connection it may fail; in that case skip and rely on the hand-written SQL plus a manual journal entry. To add the journal entry: read `meta/_journal.json`, find the current top entry index, and append a new entry `{ idx, version: <existing>, when: <timestamp ms>, tag: '0078_module_release', breakpoints: true }`.

- [ ] **Step 1.7: Run the schema test**

Run: `pnpm --filter @openlms/core test -- module-release-schema`
Expected: PASS.

- [ ] **Step 1.8: Run the existing migration-extensions test to make sure we did not break the manifest**

Run: `pnpm --filter @openlms/core test -- migration-extensions`
Expected: PASS.

- [ ] **Step 1.9: Commit**

```bash
git add packages/core/drizzle/0078_module_release.sql \
        packages/core/drizzle/meta/_journal.json \
        packages/core/drizzle/meta/0078_snapshot.json \
        packages/core/src/db/schema/module-release.ts \
        packages/core/src/db/schema/index.ts \
        packages/core/tests/module-release-schema.test.ts
git commit -m "feat(core): add module release rules / policy / override schema"
```

(Skip the snapshot file in `git add` if `db:generate` did not produce one.)

---

## Task 2: Branded IDs and contracts

**Files:**
- Modify: `packages/contracts/src/ids.ts`
- Create: `packages/contracts/src/module-release.ts`
- Modify: `packages/contracts/src/index.ts`

- [ ] **Step 2.1: Write failing contract tests**

Create `packages/contracts/tests/module-release.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ulid } from 'ulid';
import {
  CourseId,
  CourseModuleId,
  CourseModuleReleaseOverrideId,
  CourseModuleReleasePolicyId,
  CourseModuleReleaseRuleId,
  LearningObjectiveId,
  ModuleReleaseDateAfterConfig,
  ModuleReleaseDecision,
  ModuleReleaseManualUnlockConfig,
  ModuleReleaseObjectiveMasteryConfig,
  ModuleReleaseOverride,
  ModuleReleasePolicy,
  ModuleReleasePrerequisiteModulesConfig,
  ModuleReleaseRule,
  TenantId,
  UserId,
} from '../src/index.ts';

describe('module-release contracts', () => {
  const tenantId = TenantId.parse(ulid());
  const courseId = CourseId.parse(ulid());
  const moduleId = CourseModuleId.parse(ulid());
  const studentId = UserId.parse(ulid());

  it('parses a prerequisite_modules rule', () => {
    const rule = ModuleReleaseRule.parse({
      id: CourseModuleReleaseRuleId.parse(ulid()),
      tenantId,
      courseId,
      moduleId,
      ruleType: 'prerequisite_modules',
      config: {
        moduleIds: [CourseModuleId.parse(ulid())],
        requireAll: true,
      },
      position: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(rule.ruleType).toBe('prerequisite_modules');
  });

  it('parses an objective_mastery rule', () => {
    const config = ModuleReleaseObjectiveMasteryConfig.parse({
      objectiveId: LearningObjectiveId.parse(ulid()),
      minStatus: 'proficient',
      minScorePercent: 80,
    });
    expect(config.minScorePercent).toBe(80);
  });

  it('rejects an unknown ruleType', () => {
    expect(() =>
      ModuleReleaseRule.parse({
        id: CourseModuleReleaseRuleId.parse(ulid()),
        tenantId,
        courseId,
        moduleId,
        ruleType: 'eldritch_horror',
        config: {},
        position: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it('parses a date_after config', () => {
    const config = ModuleReleaseDateAfterConfig.parse({ releaseAt: new Date() });
    expect(config.releaseAt).toBeInstanceOf(Date);
  });

  it('parses a manual_unlock config', () => {
    const config = ModuleReleaseManualUnlockConfig.parse({ defaultLocked: true });
    expect(config.defaultLocked).toBe(true);
  });

  it('parses a policy with combinator', () => {
    const policy = ModuleReleasePolicy.parse({
      id: CourseModuleReleasePolicyId.parse(ulid()),
      tenantId,
      courseId,
      moduleId,
      combinator: 'any',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(policy.combinator).toBe('any');
  });

  it('parses an override with grantedBy', () => {
    const override = ModuleReleaseOverride.parse({
      id: CourseModuleReleaseOverrideId.parse(ulid()),
      tenantId,
      courseId,
      moduleId,
      studentId,
      state: 'unlocked',
      reason: 'extension granted for medical leave',
      grantedByUserId: UserId.parse(ulid()),
      grantedAt: new Date(),
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(override.state).toBe('unlocked');
  });

  it('parses a release decision', () => {
    const decision = ModuleReleaseDecision.parse({
      moduleId,
      state: 'released',
      evaluatedAt: new Date(),
      sourceCombinator: 'all',
      ruleResults: [
        {
          ruleId: CourseModuleReleaseRuleId.parse(ulid()),
          ruleType: 'date_after',
          passed: true,
          summary: 'Module open since 2026-01-01',
        },
      ],
      blockers: [],
      override: null,
    });
    expect(decision.state).toBe('released');
  });

  it('rejects negative position on a rule', () => {
    expect(() =>
      ModuleReleaseRule.parse({
        id: CourseModuleReleaseRuleId.parse(ulid()),
        tenantId,
        courseId,
        moduleId,
        ruleType: 'manual_unlock',
        config: { defaultLocked: true },
        position: -1,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2.2: Run the test to verify it fails**

Run: `pnpm --filter @openlms/contracts test -- module-release`
Expected: FAIL — module `module-release.ts` does not exist.

- [ ] **Step 2.3: Add new branded IDs**

Edit `packages/contracts/src/ids.ts` and append after the last existing branded ID block (after `UserPushTokenId`):

```ts
export const CourseModuleReleaseRuleId = ulidSchema(
  'CourseModuleReleaseRuleId',
).brand<'CourseModuleReleaseRuleId'>();
export type CourseModuleReleaseRuleId = z.infer<typeof CourseModuleReleaseRuleId>;

export const CourseModuleReleasePolicyId = ulidSchema(
  'CourseModuleReleasePolicyId',
).brand<'CourseModuleReleasePolicyId'>();
export type CourseModuleReleasePolicyId = z.infer<typeof CourseModuleReleasePolicyId>;

export const CourseModuleReleaseOverrideId = ulidSchema(
  'CourseModuleReleaseOverrideId',
).brand<'CourseModuleReleaseOverrideId'>();
export type CourseModuleReleaseOverrideId = z.infer<typeof CourseModuleReleaseOverrideId>;
```

- [ ] **Step 2.4: Create the contracts module**

Create `packages/contracts/src/module-release.ts`:

```ts
import { z } from 'zod';
import {
  CourseId,
  CourseModuleId,
  CourseModuleReleaseOverrideId,
  CourseModuleReleasePolicyId,
  CourseModuleReleaseRuleId,
  LearningObjectiveId,
  TenantId,
  UserId,
} from './ids.ts';

export const ModuleReleaseRuleType = z.enum([
  'prerequisite_modules',
  'objective_mastery',
  'date_after',
  'manual_unlock',
]);
export type ModuleReleaseRuleType = z.infer<typeof ModuleReleaseRuleType>;

export const ModuleReleaseRuleStatus = z.enum(['active', 'archived']);
export type ModuleReleaseRuleStatus = z.infer<typeof ModuleReleaseRuleStatus>;

export const ModuleReleaseCombinator = z.enum(['all', 'any']);
export type ModuleReleaseCombinator = z.infer<typeof ModuleReleaseCombinator>;

export const ModuleReleaseOverrideState = z.enum(['unlocked', 'locked']);
export type ModuleReleaseOverrideState = z.infer<typeof ModuleReleaseOverrideState>;

export const ModuleReleaseMasteryStatus = z.enum(['developing', 'proficient', 'mastered']);
export type ModuleReleaseMasteryStatus = z.infer<typeof ModuleReleaseMasteryStatus>;

export const ModuleReleasePrerequisiteModulesConfig = z
  .object({
    moduleIds: z.array(CourseModuleId).min(1).max(50),
    requireAll: z.boolean(),
  })
  .strict();
export type ModuleReleasePrerequisiteModulesConfig = z.infer<
  typeof ModuleReleasePrerequisiteModulesConfig
>;

export const ModuleReleaseObjectiveMasteryConfig = z
  .object({
    objectiveId: LearningObjectiveId,
    minStatus: ModuleReleaseMasteryStatus,
    minScorePercent: z.number().min(0).max(100).nullable().default(null),
  })
  .strict();
export type ModuleReleaseObjectiveMasteryConfig = z.infer<
  typeof ModuleReleaseObjectiveMasteryConfig
>;

export const ModuleReleaseDateAfterConfig = z
  .object({
    releaseAt: z.coerce.date(),
  })
  .strict();
export type ModuleReleaseDateAfterConfig = z.infer<typeof ModuleReleaseDateAfterConfig>;

export const ModuleReleaseManualUnlockConfig = z
  .object({
    defaultLocked: z.boolean(),
  })
  .strict();
export type ModuleReleaseManualUnlockConfig = z.infer<typeof ModuleReleaseManualUnlockConfig>;

const ModuleReleaseRuleConfigByType = z.discriminatedUnion('ruleType', [
  z.object({
    ruleType: z.literal('prerequisite_modules'),
    config: ModuleReleasePrerequisiteModulesConfig,
  }),
  z.object({
    ruleType: z.literal('objective_mastery'),
    config: ModuleReleaseObjectiveMasteryConfig,
  }),
  z.object({
    ruleType: z.literal('date_after'),
    config: ModuleReleaseDateAfterConfig,
  }),
  z.object({
    ruleType: z.literal('manual_unlock'),
    config: ModuleReleaseManualUnlockConfig,
  }),
]);

const ModuleReleaseRuleBase = z
  .object({
    id: CourseModuleReleaseRuleId,
    tenantId: TenantId,
    courseId: CourseId,
    moduleId: CourseModuleId,
    position: z.number().int().nonnegative(),
    status: ModuleReleaseRuleStatus,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const ModuleReleaseRule = ModuleReleaseRuleBase.and(ModuleReleaseRuleConfigByType);
export type ModuleReleaseRule = z.infer<typeof ModuleReleaseRule>;

export const ModuleReleasePolicy = z
  .object({
    id: CourseModuleReleasePolicyId,
    tenantId: TenantId,
    courseId: CourseId,
    moduleId: CourseModuleId,
    combinator: ModuleReleaseCombinator,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type ModuleReleasePolicy = z.infer<typeof ModuleReleasePolicy>;

export const ModuleReleaseOverride = z
  .object({
    id: CourseModuleReleaseOverrideId,
    tenantId: TenantId,
    courseId: CourseId,
    moduleId: CourseModuleId,
    studentId: UserId,
    state: ModuleReleaseOverrideState,
    reason: z.string().min(1).max(2_000).nullable(),
    grantedByUserId: UserId.nullable(),
    grantedAt: z.date(),
    expiresAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type ModuleReleaseOverride = z.infer<typeof ModuleReleaseOverride>;

export const ModuleReleaseState = z.enum(['released', 'locked']);
export type ModuleReleaseState = z.infer<typeof ModuleReleaseState>;

export const ModuleReleaseRuleResult = z
  .object({
    ruleId: CourseModuleReleaseRuleId,
    ruleType: ModuleReleaseRuleType,
    passed: z.boolean(),
    summary: z.string().min(1).max(500),
  })
  .strict();
export type ModuleReleaseRuleResult = z.infer<typeof ModuleReleaseRuleResult>;

export const ModuleReleaseBlocker = z
  .object({
    ruleType: ModuleReleaseRuleType,
    summary: z.string().min(1).max(500),
    requiredAction: z.string().min(1).max(500),
  })
  .strict();
export type ModuleReleaseBlocker = z.infer<typeof ModuleReleaseBlocker>;

export const ModuleReleaseDecisionOverrideRef = z
  .object({
    overrideId: CourseModuleReleaseOverrideId,
    state: ModuleReleaseOverrideState,
    reason: z.string().min(1).max(2_000).nullable(),
  })
  .strict();
export type ModuleReleaseDecisionOverrideRef = z.infer<typeof ModuleReleaseDecisionOverrideRef>;

export const ModuleReleaseDecision = z
  .object({
    moduleId: CourseModuleId,
    state: ModuleReleaseState,
    evaluatedAt: z.date(),
    sourceCombinator: ModuleReleaseCombinator,
    ruleResults: z.array(ModuleReleaseRuleResult),
    blockers: z.array(ModuleReleaseBlocker),
    override: ModuleReleaseDecisionOverrideRef.nullable(),
  })
  .strict();
export type ModuleReleaseDecision = z.infer<typeof ModuleReleaseDecision>;
```

- [ ] **Step 2.5: Re-export from contracts index**

Edit `packages/contracts/src/index.ts` and add (alphabetical order):

```ts
export * from './module-release.ts';
```

- [ ] **Step 2.6: Run the contract tests**

Run: `pnpm --filter @openlms/contracts test -- module-release`
Expected: PASS (all 8 cases).

- [ ] **Step 2.7: Run typecheck across the workspace**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 2.8: Commit**

```bash
git add packages/contracts/src/ids.ts \
        packages/contracts/src/module-release.ts \
        packages/contracts/src/index.ts \
        packages/contracts/tests/module-release.test.ts
git commit -m "feat(contracts): add module release rule / policy / override / decision contracts"
```

---

## Task 3: Pure release evaluator

**Files:**
- Create: `packages/core/src/module-release/evaluator.ts`
- Create: `packages/core/src/module-release/index.ts`
- Create: `packages/core/tests/module-release-evaluator.test.ts`

- [ ] **Step 3.1: Write failing evaluator tests**

Create `packages/core/tests/module-release-evaluator.test.ts`:

```ts
import {
  CourseId,
  CourseModuleId,
  CourseModuleReleaseOverrideId,
  CourseModuleReleaseRuleId,
  LearningObjectiveId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { ulid } from 'ulid';
import {
  type ModuleReleaseEvaluatorInput,
  evaluateModuleRelease,
} from '../src/module-release/evaluator.ts';

const tenantId = TenantId.parse(ulid());
const courseId = CourseId.parse(ulid());
const moduleId = CourseModuleId.parse(ulid());
const prereqModuleId = CourseModuleId.parse(ulid());
const objectiveAId = LearningObjectiveId.parse(ulid());
const studentId = UserId.parse(ulid());
const baseTime = new Date('2026-05-12T10:00:00Z');

const baseInput: ModuleReleaseEvaluatorInput = {
  tenantId,
  courseId,
  moduleId,
  studentId,
  rules: [],
  combinator: 'all',
  override: null,
  masteryByObjectiveId: new Map(),
  moduleObjectives: new Map(),
  now: baseTime,
};

describe('evaluateModuleRelease', () => {
  it('releases when there are no rules', () => {
    const result = evaluateModuleRelease(baseInput);
    expect(result.state).toBe('released');
    expect(result.ruleResults).toEqual([]);
    expect(result.blockers).toEqual([]);
  });

  it('honours an unlocked override regardless of rules', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'date_after',
          config: { releaseAt: new Date('2099-01-01T00:00:00Z') },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
      override: {
        id: CourseModuleReleaseOverrideId.parse(ulid()),
        tenantId,
        courseId,
        moduleId,
        studentId,
        state: 'unlocked',
        reason: 'accommodation',
        grantedByUserId: null,
        grantedAt: baseTime,
        expiresAt: null,
        createdAt: baseTime,
        updatedAt: baseTime,
      },
    });
    expect(result.state).toBe('released');
    expect(result.override?.state).toBe('unlocked');
  });

  it('locks when override state is locked even if rules pass', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      override: {
        id: CourseModuleReleaseOverrideId.parse(ulid()),
        tenantId,
        courseId,
        moduleId,
        studentId,
        state: 'locked',
        reason: 'integrity hold',
        grantedByUserId: null,
        grantedAt: baseTime,
        expiresAt: null,
        createdAt: baseTime,
        updatedAt: baseTime,
      },
    });
    expect(result.state).toBe('locked');
    expect(result.override?.state).toBe('locked');
  });

  it('ignores an expired override', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      override: {
        id: CourseModuleReleaseOverrideId.parse(ulid()),
        tenantId,
        courseId,
        moduleId,
        studentId,
        state: 'unlocked',
        reason: null,
        grantedByUserId: null,
        grantedAt: new Date('2026-01-01T00:00:00Z'),
        expiresAt: new Date('2026-04-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    });
    expect(result.state).toBe('released');
    expect(result.override).toBeNull();
  });

  it('passes a date_after rule when now is past releaseAt', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'date_after',
          config: { releaseAt: new Date('2026-05-01T00:00:00Z') },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
    });
    expect(result.state).toBe('released');
    expect(result.ruleResults[0]?.passed).toBe(true);
  });

  it('blocks a date_after rule when now is before releaseAt', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'date_after',
          config: { releaseAt: new Date('2099-01-01T00:00:00Z') },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
    });
    expect(result.state).toBe('locked');
    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0]?.ruleType).toBe('date_after');
  });

  it('passes objective_mastery when status meets the threshold', () => {
    const masteryByObjectiveId = new Map([
      [
        objectiveAId,
        {
          status: 'proficient' as const,
          score: 90,
          maxScore: 100,
        },
      ],
    ]);
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'objective_mastery',
          config: { objectiveId: objectiveAId, minStatus: 'proficient', minScorePercent: 80 },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
      masteryByObjectiveId,
    });
    expect(result.state).toBe('released');
  });

  it('blocks objective_mastery when status is below threshold', () => {
    const masteryByObjectiveId = new Map([
      [
        objectiveAId,
        {
          status: 'developing' as const,
          score: 60,
          maxScore: 100,
        },
      ],
    ]);
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'objective_mastery',
          config: { objectiveId: objectiveAId, minStatus: 'proficient', minScorePercent: null },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
      masteryByObjectiveId,
    });
    expect(result.state).toBe('locked');
  });

  it('blocks objective_mastery when score percentage is below the threshold even if status passes', () => {
    const masteryByObjectiveId = new Map([
      [
        objectiveAId,
        {
          status: 'proficient' as const,
          score: 70,
          maxScore: 100,
        },
      ],
    ]);
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'objective_mastery',
          config: { objectiveId: objectiveAId, minStatus: 'proficient', minScorePercent: 80 },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
      masteryByObjectiveId,
    });
    expect(result.state).toBe('locked');
  });

  it('passes prerequisite_modules when all prerequisite objectives are mastered', () => {
    const prereqObjectiveId = LearningObjectiveId.parse(ulid());
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'prerequisite_modules',
          config: { moduleIds: [prereqModuleId], requireAll: true },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
      moduleObjectives: new Map([[prereqModuleId, [prereqObjectiveId]]]),
      masteryByObjectiveId: new Map([
        [prereqObjectiveId, { status: 'proficient', score: 100, maxScore: 100 }],
      ]),
    });
    expect(result.state).toBe('released');
  });

  it('blocks prerequisite_modules when prerequisite has no objectives attached', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'prerequisite_modules',
          config: { moduleIds: [prereqModuleId], requireAll: true },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
      moduleObjectives: new Map([[prereqModuleId, []]]),
      masteryByObjectiveId: new Map(),
    });
    expect(result.state).toBe('locked');
  });

  it('passes prerequisite_modules requireAll=false when any prerequisite is mastered', () => {
    const objA = LearningObjectiveId.parse(ulid());
    const objB = LearningObjectiveId.parse(ulid());
    const moduleA = CourseModuleId.parse(ulid());
    const moduleB = CourseModuleId.parse(ulid());
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'prerequisite_modules',
          config: { moduleIds: [moduleA, moduleB], requireAll: false },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
      moduleObjectives: new Map([
        [moduleA, [objA]],
        [moduleB, [objB]],
      ]),
      masteryByObjectiveId: new Map([
        [objA, { status: 'developing', score: 50, maxScore: 100 }],
        [objB, { status: 'mastered', score: 100, maxScore: 100 }],
      ]),
    });
    expect(result.state).toBe('released');
  });

  it('manual_unlock with defaultLocked=true blocks when no override exists', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'manual_unlock',
          config: { defaultLocked: true },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
    });
    expect(result.state).toBe('locked');
  });

  it('combinator=any releases when at least one rule passes', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      combinator: 'any',
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'date_after',
          config: { releaseAt: new Date('2099-01-01T00:00:00Z') },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'date_after',
          config: { releaseAt: new Date('2026-01-01T00:00:00Z') },
          position: 1,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
    });
    expect(result.state).toBe('released');
  });

  it('skips archived rules', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'date_after',
          config: { releaseAt: new Date('2099-01-01T00:00:00Z') },
          position: 0,
          status: 'archived',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ],
    });
    expect(result.state).toBe('released');
  });

  it('evaluatedAt equals input now', () => {
    const result = evaluateModuleRelease(baseInput);
    expect(result.evaluatedAt.getTime()).toBe(baseTime.getTime());
  });
});
```

- [ ] **Step 3.2: Run the test to confirm failure**

Run: `pnpm --filter @openlms/core test -- module-release-evaluator`
Expected: FAIL — module not found.

- [ ] **Step 3.3: Implement the evaluator**

Create `packages/core/src/module-release/evaluator.ts`:

```ts
import type {
  CourseId,
  CourseModuleId,
  LearningObjectiveId,
  ModuleReleaseBlocker,
  ModuleReleaseCombinator,
  ModuleReleaseDecision,
  ModuleReleaseDecisionOverrideRef,
  ModuleReleaseOverride,
  ModuleReleaseRule,
  ModuleReleaseRuleResult,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { ModuleReleaseDecision as ModuleReleaseDecisionSchema } from '@openlms/contracts';

export type ObjectiveMasterySnapshot = {
  status: 'not_assessed' | 'developing' | 'proficient' | 'mastered';
  score: number | null;
  maxScore: number | null;
};

export type ModuleReleaseEvaluatorInput = {
  tenantId: TenantId;
  courseId: CourseId;
  moduleId: CourseModuleId;
  studentId: UserId;
  rules: ModuleReleaseRule[];
  combinator: ModuleReleaseCombinator;
  override: ModuleReleaseOverride | null;
  masteryByObjectiveId: Map<LearningObjectiveId, ObjectiveMasterySnapshot>;
  moduleObjectives: Map<CourseModuleId, LearningObjectiveId[]>;
  now: Date;
};

const masteryStatusRank: Record<ObjectiveMasterySnapshot['status'], number> = {
  not_assessed: 0,
  developing: 1,
  proficient: 2,
  mastered: 3,
};

const minStatusRank: Record<'developing' | 'proficient' | 'mastered', number> = {
  developing: 1,
  proficient: 2,
  mastered: 3,
};

const isOverrideActive = (override: ModuleReleaseOverride, now: Date): boolean => {
  if (override.expiresAt === null) return true;
  return override.expiresAt.getTime() > now.getTime();
};

const evaluateRule = (
  rule: ModuleReleaseRule,
  input: ModuleReleaseEvaluatorInput,
): { passed: boolean; summary: string; blocker?: ModuleReleaseBlocker } => {
  switch (rule.ruleType) {
    case 'date_after': {
      const releaseAt = rule.config.releaseAt;
      const passed = input.now.getTime() >= releaseAt.getTime();
      return passed
        ? { passed: true, summary: `Module open since ${releaseAt.toISOString()}` }
        : {
            passed: false,
            summary: `Module opens at ${releaseAt.toISOString()}`,
            blocker: {
              ruleType: 'date_after',
              summary: `Module is scheduled to open at ${releaseAt.toISOString()}`,
              requiredAction: 'Wait until the scheduled release time.',
            },
          };
    }
    case 'objective_mastery': {
      const mastery = input.masteryByObjectiveId.get(rule.config.objectiveId);
      const requiredRank = minStatusRank[rule.config.minStatus];
      const actualRank = mastery ? masteryStatusRank[mastery.status] : 0;
      if (actualRank < requiredRank) {
        return {
          passed: false,
          summary: `Mastery status is ${mastery?.status ?? 'not_assessed'}, requires ${rule.config.minStatus}`,
          blocker: {
            ruleType: 'objective_mastery',
            summary: `Reach ${rule.config.minStatus} mastery on the prerequisite objective`,
            requiredAction: 'Complete additional practice or assessments on this objective.',
          },
        };
      }
      if (rule.config.minScorePercent !== null && mastery) {
        if (mastery.score === null || mastery.maxScore === null || mastery.maxScore <= 0) {
          return {
            passed: false,
            summary: 'No score evidence yet — minimum score required',
            blocker: {
              ruleType: 'objective_mastery',
              summary: `Reach at least ${rule.config.minScorePercent}% on the prerequisite objective`,
              requiredAction: 'Complete a graded assessment on this objective.',
            },
          };
        }
        const percent = (mastery.score / mastery.maxScore) * 100;
        if (percent < rule.config.minScorePercent) {
          return {
            passed: false,
            summary: `Score ${percent.toFixed(1)}% below threshold ${rule.config.minScorePercent}%`,
            blocker: {
              ruleType: 'objective_mastery',
              summary: `Reach at least ${rule.config.minScorePercent}% on the prerequisite objective`,
              requiredAction: 'Improve your score on this objective.',
            },
          };
        }
      }
      return {
        passed: true,
        summary: `Mastery status ${mastery?.status ?? 'not_assessed'} satisfies threshold ${rule.config.minStatus}`,
      };
    }
    case 'prerequisite_modules': {
      const moduleStatuses = rule.config.moduleIds.map((prereqId) => {
        const objectiveIds = input.moduleObjectives.get(prereqId) ?? [];
        if (objectiveIds.length === 0) {
          return { moduleId: prereqId, completed: false };
        }
        const allMastered = objectiveIds.every((objectiveId) => {
          const mastery = input.masteryByObjectiveId.get(objectiveId);
          if (!mastery) return false;
          return masteryStatusRank[mastery.status] >= masteryStatusRank.proficient;
        });
        return { moduleId: prereqId, completed: allMastered };
      });
      const passed = rule.config.requireAll
        ? moduleStatuses.every((entry) => entry.completed)
        : moduleStatuses.some((entry) => entry.completed);
      if (!passed) {
        return {
          passed: false,
          summary: rule.config.requireAll
            ? 'Not all prerequisite modules have been mastered'
            : 'No prerequisite module has been mastered yet',
          blocker: {
            ruleType: 'prerequisite_modules',
            summary: rule.config.requireAll
              ? 'Master every objective in the prerequisite modules'
              : 'Master every objective in at least one prerequisite module',
            requiredAction:
              'Complete the prerequisite module activities until each objective reaches proficient mastery.',
          },
        };
      }
      return { passed: true, summary: 'Prerequisite mastery requirements satisfied' };
    }
    case 'manual_unlock': {
      const passed = !rule.config.defaultLocked;
      if (!passed) {
        return {
          passed: false,
          summary: 'Manual unlock required',
          blocker: {
            ruleType: 'manual_unlock',
            summary: 'Module requires an instructor unlock for this learner',
            requiredAction: 'Ask your instructor for access.',
          },
        };
      }
      return { passed: true, summary: 'Manual unlock policy currently open' };
    }
  }
};

export const evaluateModuleRelease = (
  input: ModuleReleaseEvaluatorInput,
): ModuleReleaseDecision => {
  const activeOverride =
    input.override && isOverrideActive(input.override, input.now) ? input.override : null;
  const overrideRef: ModuleReleaseDecisionOverrideRef | null = activeOverride
    ? {
        overrideId: activeOverride.id,
        state: activeOverride.state,
        reason: activeOverride.reason,
      }
    : null;

  if (activeOverride !== null) {
    return ModuleReleaseDecisionSchema.parse({
      moduleId: input.moduleId,
      state: activeOverride.state === 'unlocked' ? 'released' : 'locked',
      evaluatedAt: input.now,
      sourceCombinator: input.combinator,
      ruleResults: [],
      blockers:
        activeOverride.state === 'locked'
          ? [
              {
                ruleType: 'manual_unlock',
                summary: activeOverride.reason ?? 'Locked by instructor override',
                requiredAction: 'Contact your instructor for more information.',
              },
            ]
          : [],
      override: overrideRef,
    });
  }

  const activeRules = input.rules.filter((rule) => rule.status === 'active');
  if (activeRules.length === 0) {
    return ModuleReleaseDecisionSchema.parse({
      moduleId: input.moduleId,
      state: 'released',
      evaluatedAt: input.now,
      sourceCombinator: input.combinator,
      ruleResults: [],
      blockers: [],
      override: null,
    });
  }

  const evaluations = activeRules.map((rule) => {
    const outcome = evaluateRule(rule, input);
    const ruleResult: ModuleReleaseRuleResult = {
      ruleId: rule.id,
      ruleType: rule.ruleType,
      passed: outcome.passed,
      summary: outcome.summary,
    };
    return { ruleResult, blocker: outcome.blocker };
  });

  const passed =
    input.combinator === 'all'
      ? evaluations.every((entry) => entry.ruleResult.passed)
      : evaluations.some((entry) => entry.ruleResult.passed);

  const blockers = passed
    ? []
    : evaluations
        .filter((entry) => !entry.ruleResult.passed && entry.blocker !== undefined)
        .map((entry) => entry.blocker as ModuleReleaseBlocker);

  return ModuleReleaseDecisionSchema.parse({
    moduleId: input.moduleId,
    state: passed ? 'released' : 'locked',
    evaluatedAt: input.now,
    sourceCombinator: input.combinator,
    ruleResults: evaluations.map((entry) => entry.ruleResult),
    blockers,
    override: null,
  });
};
```

- [ ] **Step 3.4: Add a barrel index for the new module**

Create `packages/core/src/module-release/index.ts`:

```ts
export * from './evaluator.ts';
```

- [ ] **Step 3.5: Run the evaluator tests**

Run: `pnpm --filter @openlms/core test -- module-release-evaluator`
Expected: PASS (all 16 cases).

- [ ] **Step 3.6: Commit**

```bash
git add packages/core/src/module-release/evaluator.ts \
        packages/core/src/module-release/index.ts \
        packages/core/tests/module-release-evaluator.test.ts
git commit -m "feat(core): add pure module release evaluator"
```

---

## Task 4: Repository CRUD for rule, policy, override

**Files:**
- Create: `packages/core/src/module-release/repository.ts`
- Modify: `packages/core/src/module-release/index.ts`
- Create: `packages/core/tests/module-release-repository.test.ts`

The repository tests use the same mocked-Database pattern that lives in `packages/core/tests/lms-domain-repositories.test.ts`. We re-use those helpers so we don't drift.

- [ ] **Step 4.1: Skim the helpers we'll reuse**

Read `packages/core/tests/lms-domain-repositories.test.ts` until you find `createInsertOnlyDb`, `createSelectOnlyDb`, `createUpdateOnlyDb`, `createDeleteOnlyDb`. We'll mirror those patterns. (No code change in this step — just orient.)

- [ ] **Step 4.2: Write failing repository tests**

Create `packages/core/tests/module-release-repository.test.ts`:

```ts
import {
  CourseId,
  CourseModuleId,
  CourseModuleReleaseOverrideId,
  CourseModuleReleasePolicyId,
  CourseModuleReleaseRuleId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it, vi } from 'vitest';
import { ulid } from 'ulid';
import {
  createReleaseRule,
  deleteReleaseRule,
  getReleasePolicy,
  listReleaseOverridesForModule,
  listReleaseRulesForCourse,
  listReleaseRulesForModule,
  removeReleaseOverride,
  updateReleaseRule,
  upsertReleaseOverride,
  upsertReleasePolicy,
} from '../src/module-release/repository.ts';
import type { Database } from '../src/db/client.ts';

const tenantId = TenantId.parse(ulid());
const courseId = CourseId.parse(ulid());
const moduleId = CourseModuleId.parse(ulid());
const studentId = UserId.parse(ulid());
const grantedByUserId = UserId.parse(ulid());

const createInsertOnlyDb = <T extends object>(stored: T): Database => {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([stored]),
      }),
    }),
  } as unknown as Database;
};

const createUpsertReturningDb = <T extends object>(stored: T): Database => {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([stored]),
        }),
      }),
    }),
  } as unknown as Database;
};

const createSelectOnlyDb = <T>(rows: T[]): Database => {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(rows),
          limit: vi.fn().mockResolvedValue(rows),
        }),
      }),
    }),
  } as unknown as Database;
};

const createUpdateOnlyDb = <T extends object>(stored: T): Database => {
  return {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([stored]),
        }),
      }),
    }),
  } as unknown as Database;
};

const createDeleteOnlyDb = (): Database => {
  return {
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  } as unknown as Database;
};

const ruleRow = {
  id: CourseModuleReleaseRuleId.parse(ulid()),
  tenantId,
  courseId,
  moduleId,
  ruleType: 'date_after' as const,
  config: { releaseAt: new Date('2026-06-01T00:00:00Z') },
  position: 0,
  status: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const policyRow = {
  id: CourseModuleReleasePolicyId.parse(ulid()),
  tenantId,
  courseId,
  moduleId,
  combinator: 'all' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const overrideRow = {
  id: CourseModuleReleaseOverrideId.parse(ulid()),
  tenantId,
  courseId,
  moduleId,
  studentId,
  state: 'unlocked' as const,
  reason: 'extension',
  grantedByUserId,
  grantedAt: new Date(),
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('module release repository', () => {
  it('creates a release rule', async () => {
    const db = createInsertOnlyDb(ruleRow);
    const result = await createReleaseRule(db, {
      tenantId,
      courseId,
      moduleId,
      ruleType: 'date_after',
      config: { releaseAt: new Date('2026-06-01T00:00:00Z') },
      position: 0,
      status: 'active',
    });
    expect(result.ruleType).toBe('date_after');
  });

  it('lists release rules for a module ordered by position', async () => {
    const db = createSelectOnlyDb([ruleRow]);
    const result = await listReleaseRulesForModule(db, { tenantId, moduleId });
    expect(result).toHaveLength(1);
  });

  it('lists release rules across a course', async () => {
    const db = createSelectOnlyDb([ruleRow]);
    const result = await listReleaseRulesForCourse(db, { tenantId, courseId });
    expect(result).toHaveLength(1);
  });

  it('updates a release rule', async () => {
    const db = createUpdateOnlyDb({ ...ruleRow, position: 2 });
    const result = await updateReleaseRule(db, {
      tenantId,
      courseId,
      moduleId,
      ruleId: ruleRow.id,
      ruleType: 'date_after',
      config: { releaseAt: new Date('2026-06-02T00:00:00Z') },
      position: 2,
      status: 'active',
    });
    expect(result.position).toBe(2);
  });

  it('deletes a release rule', async () => {
    const db = createDeleteOnlyDb();
    await deleteReleaseRule(db, { tenantId, courseId, moduleId, ruleId: ruleRow.id });
    expect(db.delete).toHaveBeenCalled();
  });

  it('upserts a release policy', async () => {
    const db = createUpsertReturningDb(policyRow);
    const result = await upsertReleasePolicy(db, {
      tenantId,
      courseId,
      moduleId,
      combinator: 'all',
    });
    expect(result.combinator).toBe('all');
  });

  it('returns null when policy is missing', async () => {
    const db = createSelectOnlyDb([]);
    const result = await getReleasePolicy(db, { tenantId, moduleId });
    expect(result).toBeNull();
  });

  it('upserts a release override', async () => {
    const db = createUpsertReturningDb(overrideRow);
    const result = await upsertReleaseOverride(db, {
      tenantId,
      courseId,
      moduleId,
      studentId,
      state: 'unlocked',
      reason: 'extension',
      grantedByUserId,
      expiresAt: null,
    });
    expect(result.state).toBe('unlocked');
  });

  it('lists release overrides for a module', async () => {
    const db = createSelectOnlyDb([overrideRow]);
    const result = await listReleaseOverridesForModule(db, { tenantId, moduleId });
    expect(result).toHaveLength(1);
  });

  it('removes a release override', async () => {
    const db = createDeleteOnlyDb();
    await removeReleaseOverride(db, { tenantId, courseId, moduleId, studentId });
    expect(db.delete).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4.3: Run the failing tests**

Run: `pnpm --filter @openlms/core test -- module-release-repository`
Expected: FAIL — repository module not found.

- [ ] **Step 4.4: Implement the repository**

Create `packages/core/src/module-release/repository.ts`:

```ts
import {
  CourseId,
  type CourseId as CourseIdContract,
  CourseModuleId,
  type CourseModuleId as CourseModuleIdContract,
  CourseModuleReleaseOverrideId,
  CourseModuleReleasePolicyId,
  CourseModuleReleaseRuleId,
  type ModuleReleaseCombinator,
  ModuleReleaseOverride,
  type ModuleReleaseOverride as ModuleReleaseOverrideContract,
  type ModuleReleaseOverrideState,
  ModuleReleasePolicy,
  type ModuleReleasePolicy as ModuleReleasePolicyContract,
  ModuleReleaseRule,
  type ModuleReleaseRule as ModuleReleaseRuleContract,
  type ModuleReleaseRuleStatus,
  type ModuleReleaseRuleType,
  TenantId,
  type UserId,
} from '@openlms/contracts';
import { and, asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import {
  courseModuleReleaseOverride,
  courseModuleReleasePolicy,
  courseModuleReleaseRule,
} from '../db/schema/module-release.ts';

type ReleaseRuleConfig = ModuleReleaseRuleContract['config'];

export type CreateReleaseRuleInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  ruleType: ModuleReleaseRuleType;
  config: ReleaseRuleConfig;
  position: number;
  status: ModuleReleaseRuleStatus;
};

export const createReleaseRule = async (
  db: Database,
  input: CreateReleaseRuleInput,
  now = new Date(),
): Promise<ModuleReleaseRuleContract> => {
  const parsed = ModuleReleaseRule.parse({
    id: CourseModuleReleaseRuleId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: CourseModuleId.parse(input.moduleId),
    ruleType: input.ruleType,
    config: input.config,
    position: input.position,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.insert(courseModuleReleaseRule).values(parsed).returning();
  if (!row) {
    throw new Error('Module release rule could not be created because the database returned no row.');
  }
  return ModuleReleaseRule.parse(row);
};

export type ListReleaseRulesForModuleInput = {
  tenantId: string;
  moduleId: string;
};

export const listReleaseRulesForModule = async (
  db: Database,
  input: ListReleaseRulesForModuleInput,
): Promise<ModuleReleaseRuleContract[]> => {
  const rows = await db
    .select()
    .from(courseModuleReleaseRule)
    .where(
      and(
        eq(courseModuleReleaseRule.tenantId, input.tenantId),
        eq(courseModuleReleaseRule.moduleId, input.moduleId),
      ),
    )
    .orderBy(asc(courseModuleReleaseRule.position), asc(courseModuleReleaseRule.id));
  return rows.map((row) => ModuleReleaseRule.parse(row));
};

export type ListReleaseRulesForCourseInput = {
  tenantId: string;
  courseId: string;
};

export const listReleaseRulesForCourse = async (
  db: Database,
  input: ListReleaseRulesForCourseInput,
): Promise<ModuleReleaseRuleContract[]> => {
  const rows = await db
    .select()
    .from(courseModuleReleaseRule)
    .where(
      and(
        eq(courseModuleReleaseRule.tenantId, input.tenantId),
        eq(courseModuleReleaseRule.courseId, input.courseId),
      ),
    )
    .orderBy(asc(courseModuleReleaseRule.moduleId), asc(courseModuleReleaseRule.position));
  return rows.map((row) => ModuleReleaseRule.parse(row));
};

export type UpdateReleaseRuleInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  ruleId: string;
  ruleType: ModuleReleaseRuleType;
  config: ReleaseRuleConfig;
  position: number;
  status: ModuleReleaseRuleStatus;
};

export const updateReleaseRule = async (
  db: Database,
  input: UpdateReleaseRuleInput,
  now = new Date(),
): Promise<ModuleReleaseRuleContract> => {
  const [row] = await db
    .update(courseModuleReleaseRule)
    .set({
      ruleType: input.ruleType,
      config: input.config,
      position: input.position,
      status: input.status,
      updatedAt: now,
    })
    .where(
      and(
        eq(courseModuleReleaseRule.tenantId, input.tenantId),
        eq(courseModuleReleaseRule.courseId, input.courseId),
        eq(courseModuleReleaseRule.moduleId, input.moduleId),
        eq(courseModuleReleaseRule.id, input.ruleId),
      ),
    )
    .returning();
  if (!row) {
    throw new Error('Module release rule could not be updated because the database returned no row.');
  }
  return ModuleReleaseRule.parse(row);
};

export type DeleteReleaseRuleInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  ruleId: string;
};

export const deleteReleaseRule = async (
  db: Database,
  input: DeleteReleaseRuleInput,
): Promise<void> => {
  await db
    .delete(courseModuleReleaseRule)
    .where(
      and(
        eq(courseModuleReleaseRule.tenantId, input.tenantId),
        eq(courseModuleReleaseRule.courseId, input.courseId),
        eq(courseModuleReleaseRule.moduleId, input.moduleId),
        eq(courseModuleReleaseRule.id, input.ruleId),
      ),
    );
};

export type UpsertReleasePolicyInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  combinator: ModuleReleaseCombinator;
};

export const upsertReleasePolicy = async (
  db: Database,
  input: UpsertReleasePolicyInput,
  now = new Date(),
): Promise<ModuleReleasePolicyContract> => {
  const candidate = ModuleReleasePolicy.parse({
    id: CourseModuleReleasePolicyId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: CourseModuleId.parse(input.moduleId),
    combinator: input.combinator,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db
    .insert(courseModuleReleasePolicy)
    .values(candidate)
    .onConflictDoUpdate({
      target: [courseModuleReleasePolicy.tenantId, courseModuleReleasePolicy.moduleId],
      set: { combinator: input.combinator, updatedAt: now },
    })
    .returning();
  if (!row) {
    throw new Error('Module release policy could not be upserted because the database returned no row.');
  }
  return ModuleReleasePolicy.parse(row);
};

export type GetReleasePolicyInput = {
  tenantId: string;
  moduleId: string;
};

export const getReleasePolicy = async (
  db: Database,
  input: GetReleasePolicyInput,
): Promise<ModuleReleasePolicyContract | null> => {
  const [row] = await db
    .select()
    .from(courseModuleReleasePolicy)
    .where(
      and(
        eq(courseModuleReleasePolicy.tenantId, input.tenantId),
        eq(courseModuleReleasePolicy.moduleId, input.moduleId),
      ),
    )
    .limit(1);
  return row ? ModuleReleasePolicy.parse(row) : null;
};

export type UpsertReleaseOverrideInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  studentId: string;
  state: ModuleReleaseOverrideState;
  reason: string | null;
  grantedByUserId: string | null;
  expiresAt: Date | null;
};

export const upsertReleaseOverride = async (
  db: Database,
  input: UpsertReleaseOverrideInput,
  now = new Date(),
): Promise<ModuleReleaseOverrideContract> => {
  const candidate = ModuleReleaseOverride.parse({
    id: CourseModuleReleaseOverrideId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: CourseModuleId.parse(input.moduleId),
    studentId: input.studentId as UserId,
    state: input.state,
    reason: input.reason,
    grantedByUserId: input.grantedByUserId === null ? null : (input.grantedByUserId as UserId),
    grantedAt: now,
    expiresAt: input.expiresAt,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db
    .insert(courseModuleReleaseOverride)
    .values(candidate)
    .onConflictDoUpdate({
      target: [
        courseModuleReleaseOverride.tenantId,
        courseModuleReleaseOverride.moduleId,
        courseModuleReleaseOverride.studentId,
      ],
      set: {
        state: input.state,
        reason: input.reason,
        grantedByUserId: input.grantedByUserId,
        grantedAt: now,
        expiresAt: input.expiresAt,
        updatedAt: now,
      },
    })
    .returning();
  if (!row) {
    throw new Error('Module release override could not be upserted because the database returned no row.');
  }
  return ModuleReleaseOverride.parse(row);
};

export type ListReleaseOverridesForModuleInput = {
  tenantId: string;
  moduleId: string;
};

export const listReleaseOverridesForModule = async (
  db: Database,
  input: ListReleaseOverridesForModuleInput,
): Promise<ModuleReleaseOverrideContract[]> => {
  const rows = await db
    .select()
    .from(courseModuleReleaseOverride)
    .where(
      and(
        eq(courseModuleReleaseOverride.tenantId, input.tenantId),
        eq(courseModuleReleaseOverride.moduleId, input.moduleId),
      ),
    )
    .orderBy(asc(courseModuleReleaseOverride.studentId));
  return rows.map((row) => ModuleReleaseOverride.parse(row));
};

export type GetReleaseOverrideForStudentInput = {
  tenantId: string;
  moduleId: string;
  studentId: string;
};

export const getReleaseOverrideForStudent = async (
  db: Database,
  input: GetReleaseOverrideForStudentInput,
): Promise<ModuleReleaseOverrideContract | null> => {
  const [row] = await db
    .select()
    .from(courseModuleReleaseOverride)
    .where(
      and(
        eq(courseModuleReleaseOverride.tenantId, input.tenantId),
        eq(courseModuleReleaseOverride.moduleId, input.moduleId),
        eq(courseModuleReleaseOverride.studentId, input.studentId),
      ),
    )
    .limit(1);
  return row ? ModuleReleaseOverride.parse(row) : null;
};

export type RemoveReleaseOverrideInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  studentId: string;
};

export const removeReleaseOverride = async (
  db: Database,
  input: RemoveReleaseOverrideInput,
): Promise<void> => {
  await db
    .delete(courseModuleReleaseOverride)
    .where(
      and(
        eq(courseModuleReleaseOverride.tenantId, input.tenantId),
        eq(courseModuleReleaseOverride.courseId, input.courseId),
        eq(courseModuleReleaseOverride.moduleId, input.moduleId),
        eq(courseModuleReleaseOverride.studentId, input.studentId),
      ),
    );
};
```

- [ ] **Step 4.5: Update the index barrel**

Edit `packages/core/src/module-release/index.ts`:

```ts
export * from './evaluator.ts';
export * from './repository.ts';
```

- [ ] **Step 4.6: Run the repository tests**

Run: `pnpm --filter @openlms/core test -- module-release-repository`
Expected: PASS (10 cases).

- [ ] **Step 4.7: Commit**

```bash
git add packages/core/src/module-release/repository.ts \
        packages/core/src/module-release/index.ts \
        packages/core/tests/module-release-repository.test.ts
git commit -m "feat(core): add module release rule / policy / override repository"
```

---

## Task 5: Permissions

**Files:**
- Modify: `packages/core/src/permissions/evaluator.ts`
- Create: `packages/core/tests/module-release-permissions.test.ts`

- [ ] **Step 5.1: Write failing permission tests**

Create `packages/core/tests/module-release-permissions.test.ts`:

```ts
import {
  CourseMembership,
  CourseId,
  TenantId,
  UserId,
  TenantMembership,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { ulid } from 'ulid';
import { assertCorePermission } from '../src/permissions/evaluator.ts';

const tenantId = TenantId.parse(ulid());
const courseId = CourseId.parse(ulid());
const studentId = UserId.parse(ulid());
const instructorId = UserId.parse(ulid());

const studentMembership: TenantMembership = TenantMembership.parse({
  id: ulid(),
  tenantId,
  userId: studentId,
  role: 'student',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
});
const instructorMembership: TenantMembership = TenantMembership.parse({
  id: ulid(),
  tenantId,
  userId: instructorId,
  role: 'instructor',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('module release permissions', () => {
  it('instructor can manage module release rules', () => {
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: instructorId,
        memberships: [instructorMembership],
        permission: 'manage_module_release_rules',
      }),
    ).not.toThrow();
  });

  it('student cannot manage module release rules', () => {
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: studentId,
        memberships: [studentMembership],
        permission: 'manage_module_release_rules',
      }),
    ).toThrow();
  });

  it('student can view their own module release status', () => {
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: studentId,
        memberships: [studentMembership],
        permission: 'view_module_release_status',
      }),
    ).not.toThrow();
  });

  it('instructor can view module release status', () => {
    expect(() =>
      assertCorePermission({
        tenantId,
        courseId,
        actorId: instructorId,
        memberships: [instructorMembership],
        permission: 'view_module_release_status',
      }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 5.2: Run the test to confirm failure**

Run: `pnpm --filter @openlms/core test -- module-release-permissions`
Expected: FAIL — permissions are not yet declared.

- [ ] **Step 5.3: Add permissions to the matrix**

Edit `packages/core/src/permissions/evaluator.ts`:

1. Append the two new keys to the `CorePermission` union (between `manage_ai_policy` and the closing `;`):

```ts
export type CorePermission =
  | 'manage_courses'
  | 'manage_assignments'
  | 'submit_work'
  | 'request_submission_precheck'
  | 'request_feedback_draft'
  | 'view_ai_feedback_draft'
  | 'review_ai_feedback_draft'
  | 'publish_feedback'
  | 'view_published_feedback'
  | 'manage_grades'
  | 'build_ai_context'
  | 'view_audit_log'
  | 'manage_ai_policy'
  | 'manage_module_release_rules'
  | 'view_module_release_status';
```

2. In `permissionsByRole`, add the new permissions:
   - `student`: append `'view_module_release_status'`
   - `instructor`: append `'manage_module_release_rules', 'view_module_release_status'`
   - `teaching_assistant`: append `'manage_module_release_rules', 'view_module_release_status'`
   - `course_admin`: append `'manage_module_release_rules', 'view_module_release_status'`
   - `institution_admin`: append `'manage_module_release_rules', 'view_module_release_status'`

   (Service accounts unchanged.)

3. The `permissionsByCourseRole.student` needs `'view_module_release_status'` too (the others already pull from `permissionsByRole`).

- [ ] **Step 5.4: Run the permission tests**

Run: `pnpm --filter @openlms/core test -- module-release-permissions`
Expected: PASS (4 cases).

- [ ] **Step 5.5: Commit**

```bash
git add packages/core/src/permissions/evaluator.ts \
        packages/core/tests/module-release-permissions.test.ts
git commit -m "feat(core): add module release permissions to RBAC matrix"
```

---

## Task 6: Release-status service (compose evaluator with repositories)

**Files:**
- Create: `packages/core/src/module-release/release-status.ts`
- Modify: `packages/core/src/module-release/index.ts`
- Create: `packages/core/tests/module-release-status.test.ts`

The service stitches together:
1. The course's modules + their `learningObjectiveIds`
2. The student's `learning_objective_mastery` rows
3. Active rules + per-module policies + the student's overrides
4. Calls `evaluateModuleRelease` per module

- [ ] **Step 6.1: Write failing service tests**

Create `packages/core/tests/module-release-status.test.ts`:

```ts
import {
  CourseId,
  CourseModuleId,
  CourseModuleReleaseRuleId,
  LearningObjectiveId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it, vi } from 'vitest';
import { ulid } from 'ulid';
import {
  type ModuleReleaseStatusDependencies,
  evaluateCourseReleases,
} from '../src/module-release/release-status.ts';

const tenantId = TenantId.parse(ulid());
const courseId = CourseId.parse(ulid());
const studentId = UserId.parse(ulid());
const moduleId = CourseModuleId.parse(ulid());
const objectiveId = LearningObjectiveId.parse(ulid());
const now = new Date('2026-05-12T10:00:00Z');

const baseDependencies: ModuleReleaseStatusDependencies = {
  listCourseModules: vi.fn().mockResolvedValue([
    {
      id: moduleId,
      tenantId,
      courseId,
      title: 'Module',
      summary: null,
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 1,
      position: 0,
      learningObjectiveIds: [objectiveId],
      createdAt: now,
      updatedAt: now,
    },
  ]),
  listReleaseRulesForCourse: vi.fn().mockResolvedValue([]),
  getReleasePoliciesForCourse: vi.fn().mockResolvedValue(new Map()),
  listOverridesForStudent: vi.fn().mockResolvedValue(new Map()),
  listMasteryForStudent: vi.fn().mockResolvedValue([]),
};

describe('evaluateCourseReleases', () => {
  it('returns "released" decisions for every module when there are no rules', async () => {
    const decisions = await evaluateCourseReleases(baseDependencies, {
      tenantId,
      courseId,
      studentId,
      now,
    });
    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.state).toBe('released');
  });

  it('uses an active override even if rules exist', async () => {
    const dependencies: ModuleReleaseStatusDependencies = {
      ...baseDependencies,
      listReleaseRulesForCourse: vi.fn().mockResolvedValue([
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'date_after',
          config: { releaseAt: new Date('2099-01-01T00:00:00Z') },
          position: 0,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
      ]),
      listOverridesForStudent: vi.fn().mockResolvedValue(
        new Map([
          [
            moduleId,
            {
              id: ulid(),
              tenantId,
              courseId,
              moduleId,
              studentId,
              state: 'unlocked',
              reason: 'extension',
              grantedByUserId: null,
              grantedAt: now,
              expiresAt: null,
              createdAt: now,
              updatedAt: now,
            },
          ],
        ]),
      ),
    };
    const decisions = await evaluateCourseReleases(dependencies, {
      tenantId,
      courseId,
      studentId,
      now,
    });
    expect(decisions[0]?.state).toBe('released');
    expect(decisions[0]?.override?.state).toBe('unlocked');
  });

  it('uses module objectives to evaluate prerequisite_modules rule', async () => {
    const otherModuleId = CourseModuleId.parse(ulid());
    const otherObjectiveId = LearningObjectiveId.parse(ulid());
    const dependencies: ModuleReleaseStatusDependencies = {
      ...baseDependencies,
      listCourseModules: vi.fn().mockResolvedValue([
        {
          id: otherModuleId,
          tenantId,
          courseId,
          title: 'Prereq',
          summary: null,
          visibility: 'published',
          accessPolicy: 'course_member',
          version: 1,
          position: 0,
          learningObjectiveIds: [otherObjectiveId],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: moduleId,
          tenantId,
          courseId,
          title: 'Gated',
          summary: null,
          visibility: 'published',
          accessPolicy: 'course_member',
          version: 1,
          position: 1,
          learningObjectiveIds: [objectiveId],
          createdAt: now,
          updatedAt: now,
        },
      ]),
      listReleaseRulesForCourse: vi.fn().mockResolvedValue([
        {
          id: CourseModuleReleaseRuleId.parse(ulid()),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'prerequisite_modules',
          config: { moduleIds: [otherModuleId], requireAll: true },
          position: 0,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
      ]),
      listMasteryForStudent: vi.fn().mockResolvedValue([
        {
          id: ulid(),
          tenantId,
          courseId,
          learningObjectiveId: otherObjectiveId,
          studentId,
          status: 'proficient',
          score: 100,
          maxScore: 100,
          lastAssessedAt: now,
          evidenceCount: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]),
    };
    const decisions = await evaluateCourseReleases(dependencies, {
      tenantId,
      courseId,
      studentId,
      now,
    });
    const gated = decisions.find((decision) => decision.moduleId === moduleId);
    expect(gated?.state).toBe('released');
  });
});
```

- [ ] **Step 6.2: Run the test**

Run: `pnpm --filter @openlms/core test -- module-release-status`
Expected: FAIL — module not found.

- [ ] **Step 6.3: Implement the service**

Create `packages/core/src/module-release/release-status.ts`:

```ts
import type {
  CourseId,
  CourseModule,
  CourseModuleId,
  LearningObjectiveId,
  LearningObjectiveMastery,
  ModuleReleaseCombinator,
  ModuleReleaseDecision,
  ModuleReleaseOverride,
  ModuleReleasePolicy,
  ModuleReleaseRule,
  TenantId,
  UserId,
} from '@openlms/contracts';
import {
  type ObjectiveMasterySnapshot,
  evaluateModuleRelease,
} from './evaluator.ts';

export type ModuleReleaseStatusDependencies = {
  listCourseModules: (params: { tenantId: TenantId; courseId: CourseId }) => Promise<CourseModule[]>;
  listReleaseRulesForCourse: (params: {
    tenantId: TenantId;
    courseId: CourseId;
  }) => Promise<ModuleReleaseRule[]>;
  getReleasePoliciesForCourse: (params: {
    tenantId: TenantId;
    courseId: CourseId;
  }) => Promise<Map<CourseModuleId, ModuleReleasePolicy>>;
  listOverridesForStudent: (params: {
    tenantId: TenantId;
    courseId: CourseId;
    studentId: UserId;
  }) => Promise<Map<CourseModuleId, ModuleReleaseOverride>>;
  listMasteryForStudent: (params: {
    tenantId: TenantId;
    courseId: CourseId;
    studentId: UserId;
  }) => Promise<LearningObjectiveMastery[]>;
};

export type EvaluateCourseReleasesInput = {
  tenantId: TenantId;
  courseId: CourseId;
  studentId: UserId;
  now: Date;
};

export const evaluateCourseReleases = async (
  dependencies: ModuleReleaseStatusDependencies,
  input: EvaluateCourseReleasesInput,
): Promise<ModuleReleaseDecision[]> => {
  const [modules, rules, policiesByModule, overridesByModule, masteryRows] = await Promise.all([
    dependencies.listCourseModules({ tenantId: input.tenantId, courseId: input.courseId }),
    dependencies.listReleaseRulesForCourse({
      tenantId: input.tenantId,
      courseId: input.courseId,
    }),
    dependencies.getReleasePoliciesForCourse({
      tenantId: input.tenantId,
      courseId: input.courseId,
    }),
    dependencies.listOverridesForStudent({
      tenantId: input.tenantId,
      courseId: input.courseId,
      studentId: input.studentId,
    }),
    dependencies.listMasteryForStudent({
      tenantId: input.tenantId,
      courseId: input.courseId,
      studentId: input.studentId,
    }),
  ]);

  const masteryByObjectiveId = new Map<LearningObjectiveId, ObjectiveMasterySnapshot>();
  for (const row of masteryRows) {
    masteryByObjectiveId.set(row.learningObjectiveId, {
      status: row.status,
      score: row.score,
      maxScore: row.maxScore,
    });
  }

  const moduleObjectives = new Map<CourseModuleId, LearningObjectiveId[]>();
  for (const module of modules) {
    moduleObjectives.set(module.id, module.learningObjectiveIds);
  }

  const rulesByModule = new Map<CourseModuleId, ModuleReleaseRule[]>();
  for (const rule of rules) {
    const list = rulesByModule.get(rule.moduleId) ?? [];
    list.push(rule);
    rulesByModule.set(rule.moduleId, list);
  }

  return modules.map((module) => {
    const moduleRules = rulesByModule.get(module.id) ?? [];
    const policy = policiesByModule.get(module.id);
    const combinator: ModuleReleaseCombinator = policy?.combinator ?? 'all';
    const override = overridesByModule.get(module.id) ?? null;

    return evaluateModuleRelease({
      tenantId: input.tenantId,
      courseId: input.courseId,
      moduleId: module.id,
      studentId: input.studentId,
      rules: moduleRules,
      combinator,
      override,
      masteryByObjectiveId,
      moduleObjectives,
      now: input.now,
    });
  });
};
```

- [ ] **Step 6.4: Update the barrel**

Edit `packages/core/src/module-release/index.ts`:

```ts
export * from './evaluator.ts';
export * from './release-status.ts';
export * from './repository.ts';
```

- [ ] **Step 6.5: Run the service tests**

Run: `pnpm --filter @openlms/core test -- module-release-status`
Expected: PASS (3 cases).

- [ ] **Step 6.6: Commit**

```bash
git add packages/core/src/module-release/release-status.ts \
        packages/core/src/module-release/index.ts \
        packages/core/tests/module-release-status.test.ts
git commit -m "feat(core): add release-status service composing evaluator + repositories"
```

---

## Task 7: API routes (rules, policy, overrides, status)

**Files:**
- Create: `packages/api/src/routes/module-release.ts`
- Modify: `packages/api/src/dependencies.ts`
- Modify: `packages/api/src/app.ts`
- Create: `packages/api/tests/module-release-routes.test.ts`

The route file declares Zod request/response schemas, an OpenAPI route for each endpoint, and uses the `ApiDependencies` seam for handlers.

- [ ] **Step 7.1: Read the existing course-content route file for layout**

Read `packages/api/src/routes/course-content.ts` (skim only — about 800 lines). Note how it defines a path-params schema, a body schema, a response schema, and a `createRoute(...)` per endpoint. We'll follow the same pattern.

- [ ] **Step 7.2: Write the new route file**

Create `packages/api/src/routes/module-release.ts`:

```ts
import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseId,
  CourseModuleId,
  CourseModuleReleaseOverrideId,
  CourseModuleReleaseRuleId,
  ModuleReleaseCombinator,
  ModuleReleaseDateAfterConfig,
  ModuleReleaseDecision,
  ModuleReleaseManualUnlockConfig,
  ModuleReleaseObjectiveMasteryConfig,
  ModuleReleaseOverride,
  ModuleReleaseOverrideState,
  ModuleReleasePolicy,
  ModuleReleasePrerequisiteModulesConfig,
  ModuleReleaseRule,
  ModuleReleaseRuleStatus,
  ModuleReleaseRuleType,
  TenantId,
  UserId,
} from '@openlms/contracts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const ModuleReleaseRuleResponse = ModuleReleaseRule.openapi('ModuleReleaseRule');
export const ModuleReleasePolicyResponse = ModuleReleasePolicy.openapi('ModuleReleasePolicy');
export const ModuleReleaseOverrideResponse = ModuleReleaseOverride.openapi('ModuleReleaseOverride');
export const ModuleReleaseDecisionResponse = ModuleReleaseDecision.openapi('ModuleReleaseDecision');

export const CourseModulePathParams = z.object({
  tenantId: TenantId.openapi({
    param: { name: 'tenantId', in: 'path', description: 'Tenant identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0A',
  }),
  courseId: CourseId.openapi({
    param: { name: 'courseId', in: 'path', description: 'Course identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0B',
  }),
  moduleId: CourseModuleId.openapi({
    param: { name: 'moduleId', in: 'path', description: 'Course module identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0C',
  }),
});

export const ModuleReleaseRulePathParams = CourseModulePathParams.extend({
  ruleId: CourseModuleReleaseRuleId.openapi({
    param: { name: 'ruleId', in: 'path', description: 'Release rule identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0D',
  }),
});

export const ModuleReleaseOverrideStudentPathParams = CourseModulePathParams.extend({
  studentId: UserId.openapi({
    param: { name: 'studentId', in: 'path', description: 'Student identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0E',
  }),
});

export const CoursePathParams = z.object({
  tenantId: TenantId.openapi({ param: { name: 'tenantId', in: 'path' }, example: '01J9QW7B6N5W2YH3D3A1V0KE0A' }),
  courseId: CourseId.openapi({ param: { name: 'courseId', in: 'path' }, example: '01J9QW7B6N5W2YH3D3A1V0KE0B' }),
});

const ReleaseRuleConfigUnion = z.discriminatedUnion('ruleType', [
  z.object({
    ruleType: z.literal('prerequisite_modules'),
    config: ModuleReleasePrerequisiteModulesConfig,
  }),
  z.object({
    ruleType: z.literal('objective_mastery'),
    config: ModuleReleaseObjectiveMasteryConfig,
  }),
  z.object({ ruleType: z.literal('date_after'), config: ModuleReleaseDateAfterConfig }),
  z.object({ ruleType: z.literal('manual_unlock'), config: ModuleReleaseManualUnlockConfig }),
]);

export const CreateReleaseRuleBody = z
  .object({
    position: z.number().int().nonnegative(),
    status: ModuleReleaseRuleStatus,
  })
  .and(ReleaseRuleConfigUnion)
  .openapi({ description: 'Create a release rule for the module.' });

export const UpdateReleaseRuleBody = CreateReleaseRuleBody.openapi({
  description: 'Replace the release rule.',
});

export const UpsertReleasePolicyBody = z
  .object({ combinator: ModuleReleaseCombinator })
  .strict()
  .openapi({ description: 'Set the combinator for module release rules.' });

export const UpsertReleaseOverrideBody = z
  .object({
    state: ModuleReleaseOverrideState,
    reason: z.string().min(1).max(2_000).nullable(),
    expiresAt: z.coerce.date().nullable(),
  })
  .strict()
  .openapi({ description: 'Pin a per-student release state.' });

export const listReleaseRulesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-rules',
  tags: ['ModuleRelease'],
  operationId: 'listModuleReleaseRules',
  security: [{ bearerAuth: [] }],
  request: { params: CourseModulePathParams },
  responses: {
    200: {
      description: 'Release rules for the module.',
      content: { 'application/json': { schema: ModuleReleaseRuleResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const createReleaseRuleRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-rules',
  tags: ['ModuleRelease'],
  operationId: 'createModuleReleaseRule',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseModulePathParams,
    body: { required: true, content: { 'application/json': { schema: CreateReleaseRuleBody } } },
  },
  responses: {
    201: {
      description: 'Created release rule.',
      content: { 'application/json': { schema: ModuleReleaseRuleResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const updateReleaseRuleRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-rules/{ruleId}',
  tags: ['ModuleRelease'],
  operationId: 'updateModuleReleaseRule',
  security: [{ bearerAuth: [] }],
  request: {
    params: ModuleReleaseRulePathParams,
    body: { required: true, content: { 'application/json': { schema: UpdateReleaseRuleBody } } },
  },
  responses: {
    200: {
      description: 'Updated release rule.',
      content: { 'application/json': { schema: ModuleReleaseRuleResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteReleaseRuleRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-rules/{ruleId}',
  tags: ['ModuleRelease'],
  operationId: 'deleteModuleReleaseRule',
  security: [{ bearerAuth: [] }],
  request: { params: ModuleReleaseRulePathParams },
  responses: {
    204: { description: 'Release rule deleted.' },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const upsertReleasePolicyRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-policy',
  tags: ['ModuleRelease'],
  operationId: 'upsertModuleReleasePolicy',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseModulePathParams,
    body: { required: true, content: { 'application/json': { schema: UpsertReleasePolicyBody } } },
  },
  responses: {
    200: {
      description: 'Module release policy.',
      content: { 'application/json': { schema: ModuleReleasePolicyResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const getReleasePolicyRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-policy',
  tags: ['ModuleRelease'],
  operationId: 'getModuleReleasePolicy',
  security: [{ bearerAuth: [] }],
  request: { params: CourseModulePathParams },
  responses: {
    200: {
      description: 'Module release policy (default combinator if absent).',
      content: { 'application/json': { schema: ModuleReleasePolicyResponse } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listReleaseOverridesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-overrides',
  tags: ['ModuleRelease'],
  operationId: 'listModuleReleaseOverrides',
  security: [{ bearerAuth: [] }],
  request: { params: CourseModulePathParams },
  responses: {
    200: {
      description: 'Release overrides for the module.',
      content: { 'application/json': { schema: ModuleReleaseOverrideResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const upsertReleaseOverrideRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-overrides/{studentId}',
  tags: ['ModuleRelease'],
  operationId: 'upsertModuleReleaseOverride',
  security: [{ bearerAuth: [] }],
  request: {
    params: ModuleReleaseOverrideStudentPathParams,
    body: { required: true, content: { 'application/json': { schema: UpsertReleaseOverrideBody } } },
  },
  responses: {
    200: {
      description: 'Stored release override.',
      content: { 'application/json': { schema: ModuleReleaseOverrideResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const removeReleaseOverrideRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-overrides/{studentId}',
  tags: ['ModuleRelease'],
  operationId: 'removeModuleReleaseOverride',
  security: [{ bearerAuth: [] }],
  request: { params: ModuleReleaseOverrideStudentPathParams },
  responses: {
    204: { description: 'Override removed.' },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const getMyReleaseStatusRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/release-status',
  tags: ['ModuleRelease'],
  operationId: 'getMyModuleReleaseStatus',
  security: [{ bearerAuth: [] }],
  request: { params: CoursePathParams },
  responses: {
    200: {
      description: 'Module release decisions for the calling user.',
      content: { 'application/json': { schema: ModuleReleaseDecisionResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const getStudentReleaseStatusRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/release-status/{studentId}',
  tags: ['ModuleRelease'],
  operationId: 'getStudentModuleReleaseStatus',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams.extend({
      studentId: UserId.openapi({
        param: { name: 'studentId', in: 'path' },
        example: '01J9QW7B6N5W2YH3D3A1V0KE0E',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Module release decisions for a specific student.',
      content: { 'application/json': { schema: ModuleReleaseDecisionResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
```

- [ ] **Step 7.3: Wire dependency methods**

Edit `packages/api/src/dependencies.ts` to add the following members to the `ApiDependencies` interface (after the `getProviderConfig` member; preserve alphabetical-ish order with the other domain-specific methods):

```ts
  listModuleReleaseRules: (input: {
    tenantId: TenantId;
    courseId: CourseId;
    moduleId: CourseModuleId;
    actorUserId: UserId;
  }) => Promise<ModuleReleaseRule[]>;
  createModuleReleaseRule: (input: {
    tenantId: TenantId;
    courseId: CourseId;
    moduleId: CourseModuleId;
    actorUserId: UserId;
    body: CreateReleaseRuleBodyInput;
  }) => Promise<ModuleReleaseRule>;
  updateModuleReleaseRule: (input: {
    tenantId: TenantId;
    courseId: CourseId;
    moduleId: CourseModuleId;
    ruleId: CourseModuleReleaseRuleId;
    actorUserId: UserId;
    body: CreateReleaseRuleBodyInput;
  }) => Promise<ModuleReleaseRule>;
  deleteModuleReleaseRule: (input: {
    tenantId: TenantId;
    courseId: CourseId;
    moduleId: CourseModuleId;
    ruleId: CourseModuleReleaseRuleId;
    actorUserId: UserId;
  }) => Promise<void>;
  upsertModuleReleasePolicy: (input: {
    tenantId: TenantId;
    courseId: CourseId;
    moduleId: CourseModuleId;
    actorUserId: UserId;
    combinator: ModuleReleaseCombinator;
  }) => Promise<ModuleReleasePolicy>;
  getModuleReleasePolicy: (input: {
    tenantId: TenantId;
    courseId: CourseId;
    moduleId: CourseModuleId;
    actorUserId: UserId;
  }) => Promise<ModuleReleasePolicy>;
  listModuleReleaseOverrides: (input: {
    tenantId: TenantId;
    courseId: CourseId;
    moduleId: CourseModuleId;
    actorUserId: UserId;
  }) => Promise<ModuleReleaseOverride[]>;
  upsertModuleReleaseOverride: (input: {
    tenantId: TenantId;
    courseId: CourseId;
    moduleId: CourseModuleId;
    studentId: UserId;
    actorUserId: UserId;
    state: ModuleReleaseOverrideState;
    reason: string | null;
    expiresAt: Date | null;
  }) => Promise<ModuleReleaseOverride>;
  removeModuleReleaseOverride: (input: {
    tenantId: TenantId;
    courseId: CourseId;
    moduleId: CourseModuleId;
    studentId: UserId;
    actorUserId: UserId;
  }) => Promise<void>;
  getMyModuleReleaseStatus: (input: {
    tenantId: TenantId;
    courseId: CourseId;
    actorUserId: UserId;
  }) => Promise<ModuleReleaseDecision[]>;
  getStudentModuleReleaseStatus: (input: {
    tenantId: TenantId;
    courseId: CourseId;
    studentId: UserId;
    actorUserId: UserId;
  }) => Promise<ModuleReleaseDecision[]>;
```

Add the relevant imports at the top of the file:

```ts
import {
  // ...existing imports...
  type CourseModuleReleaseRuleId,
  type ModuleReleaseCombinator,
  type ModuleReleaseDecision,
  type ModuleReleaseOverride,
  type ModuleReleaseOverrideState,
  type ModuleReleasePolicy,
  type ModuleReleaseRule,
} from '@openlms/contracts';
import {
  createReleaseRule,
  deleteReleaseRule,
  evaluateCourseReleases,
  getReleaseOverrideForStudent,
  getReleasePolicy,
  listReleaseOverridesForModule,
  listReleaseRulesForCourse,
  listReleaseRulesForModule,
  removeReleaseOverride,
  updateReleaseRule,
  upsertReleaseOverride,
  upsertReleasePolicy,
} from '@openlms/core/module-release';
```

(If `@openlms/core` does not yet export `./module-release`, fall back to a relative path import for now and address the subpath export in the package.json change in step 7.5.)

Then implement each method inside `createApiDependencies(...)`. Pattern for staff-only mutation methods:

```ts
  listModuleReleaseRules: async ({ tenantId, courseId, moduleId, actorUserId }) => {
    const memberships = await listTenantMembershipsForActor(db, tenantId, actorUserId);
    const courseMemberships = await listCourseMembershipsForActor(db, tenantId, actorUserId, courseId);
    assertCorePermission({
      tenantId,
      courseId,
      actorId: actorUserId,
      memberships,
      courseMemberships,
      permission: 'view_module_release_status',
    });
    return listReleaseRulesForModule(db, { tenantId, moduleId });
  },
  createModuleReleaseRule: async ({ tenantId, courseId, moduleId, actorUserId, body }) => {
    const memberships = await listTenantMembershipsForActor(db, tenantId, actorUserId);
    const courseMemberships = await listCourseMembershipsForActor(db, tenantId, actorUserId, courseId);
    assertCorePermission({
      tenantId,
      courseId,
      actorId: actorUserId,
      memberships,
      courseMemberships,
      permission: 'manage_module_release_rules',
    });
    return createReleaseRule(db, {
      tenantId,
      courseId,
      moduleId,
      ruleType: body.ruleType,
      config: body.config,
      position: body.position,
      status: body.status,
    });
  },
  // ...similar for update/delete/policy/override...
  getMyModuleReleaseStatus: async ({ tenantId, courseId, actorUserId }) => {
    const memberships = await listTenantMembershipsForActor(db, tenantId, actorUserId);
    const courseMemberships = await listCourseMembershipsForActor(db, tenantId, actorUserId, courseId);
    assertCorePermission({
      tenantId,
      courseId,
      actorId: actorUserId,
      memberships,
      courseMemberships,
      permission: 'view_module_release_status',
    });
    const dependencies = buildReleaseStatusDependencies(db);
    return evaluateCourseReleases(dependencies, {
      tenantId,
      courseId,
      studentId: actorUserId,
      now: new Date(),
    });
  },
  getStudentModuleReleaseStatus: async ({ tenantId, courseId, studentId, actorUserId }) => {
    const memberships = await listTenantMembershipsForActor(db, tenantId, actorUserId);
    const courseMemberships = await listCourseMembershipsForActor(db, tenantId, actorUserId, courseId);
    assertCorePermission({
      tenantId,
      courseId,
      actorId: actorUserId,
      memberships,
      courseMemberships,
      permission: actorUserId === studentId ? 'view_module_release_status' : 'manage_module_release_rules',
    });
    const dependencies = buildReleaseStatusDependencies(db);
    return evaluateCourseReleases(dependencies, {
      tenantId,
      courseId,
      studentId,
      now: new Date(),
    });
  },
```

The helper `buildReleaseStatusDependencies(db)` returns a `ModuleReleaseStatusDependencies` value. Implement near the top of the function (or as a private function in the same file):

```ts
const buildReleaseStatusDependencies = (db: Database): ModuleReleaseStatusDependencies => ({
  listCourseModules: ({ tenantId, courseId }) =>
    listCourseModulesRepo(db, { tenantId, courseId }),
  listReleaseRulesForCourse: ({ tenantId, courseId }) =>
    listReleaseRulesForCourse(db, { tenantId, courseId }),
  getReleasePoliciesForCourse: async ({ tenantId, courseId }) => {
    const policies = await listReleasePoliciesForCourse(db, { tenantId, courseId });
    return new Map(policies.map((policy) => [policy.moduleId, policy]));
  },
  listOverridesForStudent: async ({ tenantId, courseId, studentId }) => {
    const overrides = await listReleaseOverridesForStudent(db, { tenantId, courseId, studentId });
    return new Map(overrides.map((override) => [override.moduleId, override]));
  },
  listMasteryForStudent: ({ tenantId, courseId, studentId }) =>
    listLearningObjectiveMasteryForStudent(db, { tenantId, courseId, studentId }),
});
```

For the missing helpers (`listReleasePoliciesForCourse`, `listReleaseOverridesForStudent`), add them to `repository.ts` (Task 4 already covered the others — add these now in this step):

Add to `packages/core/src/module-release/repository.ts`:

```ts
export type ListReleasePoliciesForCourseInput = {
  tenantId: string;
  courseId: string;
};

export const listReleasePoliciesForCourse = async (
  db: Database,
  input: ListReleasePoliciesForCourseInput,
): Promise<ModuleReleasePolicyContract[]> => {
  const rows = await db
    .select()
    .from(courseModuleReleasePolicy)
    .where(
      and(
        eq(courseModuleReleasePolicy.tenantId, input.tenantId),
        eq(courseModuleReleasePolicy.courseId, input.courseId),
      ),
    );
  return rows.map((row) => ModuleReleasePolicy.parse(row));
};

export type ListReleaseOverridesForStudentInput = {
  tenantId: string;
  courseId: string;
  studentId: string;
};

export const listReleaseOverridesForStudent = async (
  db: Database,
  input: ListReleaseOverridesForStudentInput,
): Promise<ModuleReleaseOverrideContract[]> => {
  const rows = await db
    .select()
    .from(courseModuleReleaseOverride)
    .where(
      and(
        eq(courseModuleReleaseOverride.tenantId, input.tenantId),
        eq(courseModuleReleaseOverride.courseId, input.courseId),
        eq(courseModuleReleaseOverride.studentId, input.studentId),
      ),
    )
    .orderBy(asc(courseModuleReleaseOverride.moduleId));
  return rows.map((row) => ModuleReleaseOverride.parse(row));
};
```

For `listLearningObjectiveMasteryForStudent`: this likely already exists. Search:

```bash
grep -R "learningObjectiveMastery" packages/core/src/courses/ packages/core/src/learning* 2>&1
```

If a function exists (e.g. `listLearningObjectiveMasteryForStudent` or `listLearningObjectiveMasteryByCourse`), import and use it. If it does not, add to `packages/core/src/courses/learning-objective-mastery.ts`:

```ts
export type ListLearningObjectiveMasteryForStudentInput = {
  tenantId: string;
  courseId: string;
  studentId: string;
};

export const listLearningObjectiveMasteryForStudent = async (
  db: Database,
  input: ListLearningObjectiveMasteryForStudentInput,
): Promise<LearningObjectiveMastery[]> => {
  const rows = await db
    .select()
    .from(learningObjectiveMastery)
    .where(
      and(
        eq(learningObjectiveMastery.tenantId, input.tenantId),
        eq(learningObjectiveMastery.courseId, input.courseId),
        eq(learningObjectiveMastery.studentId, input.studentId),
      ),
    );
  return rows.map((row) => LearningObjectiveMastery.parse(row));
};
```

(Use the actual function and import names — verify by grep before adding.)

For `listCourseModulesRepo` — there must be an existing helper since `listCourseModulesRoute` already exists. Find it:

```bash
grep -n "listCourseModules" packages/core/src/courses/repository.ts
```

Import it under the same name (alias if there is a collision with the dependency method name).

- [ ] **Step 7.4: Register the routes in `app.ts`**

Edit `packages/api/src/app.ts`:

1. Add imports near the other routes-imports block:

```ts
import {
  createReleaseRuleRoute,
  deleteReleaseRuleRoute,
  getMyReleaseStatusRoute,
  getReleasePolicyRoute,
  getStudentReleaseStatusRoute,
  listReleaseOverridesRoute,
  listReleaseRulesRoute,
  removeReleaseOverrideRoute,
  updateReleaseRuleRoute,
  upsertReleaseOverrideRoute,
  upsertReleasePolicyRoute,
} from './routes/module-release.ts';
```

2. After existing route registrations, add handlers — pattern per route:

```ts
app.openapi(listReleaseRulesRoute, async (c) => {
  const session = await requireSession(c);
  const params = c.req.valid('param');
  const rules = await dependencies.listModuleReleaseRules({
    tenantId: params.tenantId,
    courseId: params.courseId,
    moduleId: params.moduleId,
    actorUserId: session.userId,
  });
  return c.json(rules, 200);
});

app.openapi(createReleaseRuleRoute, async (c) => {
  const session = await requireSession(c);
  const params = c.req.valid('param');
  const body = c.req.valid('json');
  const rule = await dependencies.createModuleReleaseRule({
    tenantId: params.tenantId,
    courseId: params.courseId,
    moduleId: params.moduleId,
    actorUserId: session.userId,
    body,
  });
  return c.json(rule, 201);
});

// ... continue for all 11 routes ...
```

(The exact `requireSession` helper name and shape exist in `app.ts`; reuse it. Do not duplicate or invent helpers.)

- [ ] **Step 7.5: Add `./module-release` subpath export to `@openlms/core`**

Edit `packages/core/package.json` `exports` map: add a sibling entry alongside the existing `./auth/session` etc. entries:

```json
"./module-release": {
  "types": "./src/module-release/index.ts",
  "import": "./src/module-release/index.ts",
  "default": "./src/module-release/index.ts"
}
```

(Adjust to match the exact format used by the existing entries.)

- [ ] **Step 7.6: Write a focused dependencies test**

Create `packages/api/tests/module-release-routes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

describe('module release dependency wiring', () => {
  it('exposes the new module-release methods', () => {
    const deps = createApiDependencies({
      DATABASE_CONNECTION_STRING: 'postgres://test:test@localhost:5432/test',
    });
    expect(typeof deps.listModuleReleaseRules).toBe('function');
    expect(typeof deps.createModuleReleaseRule).toBe('function');
    expect(typeof deps.updateModuleReleaseRule).toBe('function');
    expect(typeof deps.deleteModuleReleaseRule).toBe('function');
    expect(typeof deps.upsertModuleReleasePolicy).toBe('function');
    expect(typeof deps.getModuleReleasePolicy).toBe('function');
    expect(typeof deps.listModuleReleaseOverrides).toBe('function');
    expect(typeof deps.upsertModuleReleaseOverride).toBe('function');
    expect(typeof deps.removeModuleReleaseOverride).toBe('function');
    expect(typeof deps.getMyModuleReleaseStatus).toBe('function');
    expect(typeof deps.getStudentModuleReleaseStatus).toBe('function');
  });
});
```

- [ ] **Step 7.7: Run the targeted tests**

Run: `pnpm --filter @openlms/api test -- module-release`
Expected: PASS.

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 7.8: Regenerate the OpenAPI document**

Run: `pnpm --filter @openlms/api generate:openapi`
Expected: writes to `openapi/openapi.json` with the new endpoints.

- [ ] **Step 7.9: Commit**

```bash
git add packages/api/src/routes/module-release.ts \
        packages/api/src/app.ts \
        packages/api/src/dependencies.ts \
        packages/api/tests/module-release-routes.test.ts \
        packages/core/src/module-release/repository.ts \
        packages/core/src/module-release/index.ts \
        packages/core/src/courses/learning-objective-mastery.ts \
        packages/core/package.json \
        openapi/openapi.json
git commit -m "feat(api): expose module release rule / policy / override routes and release-status endpoints"
```

(Skip files in `git add` that you didn't actually modify in this task.)

---

## Task 8: Full check

- [ ] **Step 8.1: Lint, typecheck, test**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: ALL PASS.

If any check fails, fix the smallest failing case and re-run. Do not skip or `--no-verify`.

- [ ] **Step 8.2: Confirm the migration is referenced in `_journal.json`**

Run:
```bash
grep -n "0078" packages/core/drizzle/meta/_journal.json
```
Expected: line containing `"tag": "0078_module_release"` (or similar).

If missing, hand-edit per Step 1.6 guidance.

- [ ] **Step 8.3: Sanity-check the OpenAPI document contains the new operations**

Run:
```bash
grep -c "ModuleRelease" openapi/openapi.json
```
Expected: at least 6 (multiple operationIds + schema names).

---

## Notes

- **No frontend.** This branch is backend+AI foundation only. Do not stub client-side code.
- **No new AI action this iteration.** A `next_best_resource` AI action will land in a follow-up iteration. The release evaluator is purely deterministic in this iteration.
- **Tenant isolation** is enforced by the unique `(tenant_id, id)` indexes plus the composite `(tenant_id, course_id) → course(tenant_id, id)` foreign keys. Repository inputs always carry `tenantId`.
- **Audit log:** Out of scope this iteration. The existing audit outbox is wired only for grades/feedback transitions today; we do not add module-release writes to the outbox now (would require a parallel reviewer pass).
- **Migration testability:** there is no SQL-level legacy backfill in 0078 — it's pure additive schema, so the existing migration-shape test suite will not need a new case.
