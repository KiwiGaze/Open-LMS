import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course, courseModule, courseUnit } from './course.ts';
import { rubric } from './rubric.ts';
import { tenant } from './tenant.ts';

export const discussionTopic = pgTable(
  'discussion_topic',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    moduleId: text('module_id').references(() => courseModule.id, { onDelete: 'set null' }),
    unitId: text('unit_id').references(() => courseUnit.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    prompt: text('prompt'),
    visibility: text('visibility').notNull(),
    position: integer('position').notNull(),
    gradingEnabled: boolean('grading_enabled').notNull().default(false),
    pointsPossible: real('points_possible'),
    rubricId: text('rubric_id').references(() => rubric.id, { onDelete: 'set null' }),
    requirePostBeforeSeeingOthers: boolean('require_post_before_seeing_others')
      .notNull()
      .default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('discussion_topic_tenant_id_uq').on(table.tenantId, table.id),
    pointsPossibleCheck: check(
      'discussion_topic_points_possible_check',
      sql`${table.pointsPossible} IS NULL OR ${table.pointsPossible} >= 0`,
    ),
    gradingConsistencyCheck: check(
      'discussion_topic_grading_consistency_check',
      sql`${table.gradingEnabled} = false OR ${table.pointsPossible} IS NOT NULL`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'discussion_topic_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'discussion_topic_tenant_module_fk',
      columns: [table.tenantId, table.courseId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.courseId, courseModule.id],
    }).onDelete('set null'),
    tenantUnitForeignKey: foreignKey({
      name: 'discussion_topic_tenant_unit_fk',
      columns: [table.tenantId, table.courseId, table.unitId],
      foreignColumns: [courseUnit.tenantId, courseUnit.courseId, courseUnit.id],
    }).onDelete('set null'),
    tenantModuleUnitForeignKey: foreignKey({
      name: 'discussion_topic_tenant_module_unit_fk',
      columns: [table.tenantId, table.courseId, table.moduleId, table.unitId],
      foreignColumns: [
        courseUnit.tenantId,
        courseUnit.courseId,
        courseUnit.moduleId,
        courseUnit.id,
      ],
    }),
    unitRequiresModuleCheck: check(
      'discussion_topic_unit_requires_module_check',
      sql`${table.unitId} IS NULL OR ${table.moduleId} IS NOT NULL`,
    ),
    positionNonnegativeCheck: check(
      'discussion_topic_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
  }),
);

export const discussionPost = pgTable(
  'discussion_post',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    topicId: text('topic_id')
      .notNull()
      .references(() => discussionTopic.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    parentPostId: text('parent_post_id'),
    body: text('body').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('discussion_post_tenant_id_uq').on(table.tenantId, table.id),
    tenantTopicIdUnique: uniqueIndex('discussion_post_tenant_topic_id_uq').on(
      table.tenantId,
      table.topicId,
      table.id,
    ),
    tenantTopicForeignKey: foreignKey({
      name: 'discussion_post_tenant_topic_fk',
      columns: [table.tenantId, table.topicId],
      foreignColumns: [discussionTopic.tenantId, discussionTopic.id],
    }).onDelete('cascade'),
    tenantParentPostForeignKey: foreignKey({
      name: 'discussion_post_tenant_parent_post_fk',
      columns: [table.tenantId, table.topicId, table.parentPostId],
      foreignColumns: [table.tenantId, table.topicId, table.id],
    }).onDelete('set null'),
    statusCheck: check(
      'discussion_post_status_check',
      sql`${table.status} IN ('draft', 'published', 'hidden', 'deleted')`,
    ),
  }),
);

export const discussionTopicSubscription = pgTable(
  'discussion_topic_subscription',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    topicId: text('topic_id')
      .notNull()
      .references(() => discussionTopic.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantTopicUserUnique: uniqueIndex('discussion_topic_subscription_tenant_topic_user_uq').on(
      table.tenantId,
      table.topicId,
      table.userId,
    ),
    tenantTopicForeignKey: foreignKey({
      name: 'discussion_topic_subscription_tenant_topic_fk',
      columns: [table.tenantId, table.topicId],
      foreignColumns: [discussionTopic.tenantId, discussionTopic.id],
    }).onDelete('cascade'),
  }),
);

export const discussionPostGrade = pgTable(
  'discussion_post_grade',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    topicId: text('topic_id')
      .notNull()
      .references(() => discussionTopic.id, { onDelete: 'cascade' }),
    postId: text('post_id')
      .notNull()
      .references(() => discussionPost.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    score: real('score').notNull(),
    maxScore: real('max_score').notNull(),
    status: text('status').notNull(),
    comment: text('comment'),
    gradedByUserId: text('graded_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('discussion_post_grade_tenant_id_uq').on(table.tenantId, table.id),
    tenantPostUnique: uniqueIndex('discussion_post_grade_tenant_post_uq').on(
      table.tenantId,
      table.postId,
    ),
    tenantTopicForeignKey: foreignKey({
      name: 'discussion_post_grade_tenant_topic_fk',
      columns: [table.tenantId, table.topicId],
      foreignColumns: [discussionTopic.tenantId, discussionTopic.id],
    }).onDelete('cascade'),
    tenantPostForeignKey: foreignKey({
      name: 'discussion_post_grade_tenant_post_fk',
      columns: [table.tenantId, table.postId],
      foreignColumns: [discussionPost.tenantId, discussionPost.id],
    }).onDelete('cascade'),
    statusCheck: check(
      'discussion_post_grade_status_check',
      sql`${table.status} IN ('draft', 'published', 'revised')`,
    ),
    scoreBoundsCheck: check(
      'discussion_post_grade_score_bounds_check',
      sql`${table.score} >= 0 AND ${table.maxScore} > 0 AND ${table.score} <= ${table.maxScore}`,
    ),
  }),
);
