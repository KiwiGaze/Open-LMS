import { z } from 'zod';
import {
  CourseId,
  CourseModuleId,
  CourseUnitId,
  DiscussionPostGradeId,
  DiscussionPostId,
  DiscussionTopicId,
  DiscussionTopicSubscriptionId,
  RubricId,
  TenantId,
  UserId,
} from './ids.ts';

export const DiscussionTopicVisibility = z.enum(['draft', 'published', 'archived']);
export type DiscussionTopicVisibility = z.infer<typeof DiscussionTopicVisibility>;

export const DiscussionPostStatus = z.enum(['draft', 'published', 'hidden', 'deleted']);
export type DiscussionPostStatus = z.infer<typeof DiscussionPostStatus>;

export const DiscussionPostGradeStatus = z.enum(['draft', 'published', 'revised']);
export type DiscussionPostGradeStatus = z.infer<typeof DiscussionPostGradeStatus>;

export const DiscussionTopic = z
  .object({
    id: DiscussionTopicId,
    tenantId: TenantId,
    courseId: CourseId,
    moduleId: CourseModuleId.nullable().default(null),
    unitId: CourseUnitId.nullable().default(null),
    title: z.string().min(1).max(180),
    prompt: z.string().min(1).max(4_000).nullable(),
    visibility: DiscussionTopicVisibility,
    position: z.number().int().nonnegative(),
    gradingEnabled: z.boolean().default(false),
    pointsPossible: z.number().finite().nonnegative().nullable().default(null),
    rubricId: RubricId.nullable().default(null),
    requirePostBeforeSeeingOthers: z.boolean().default(false),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((topic, context) => {
    if (topic.unitId !== null && topic.moduleId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unit discussion topics must include their parent module.',
        path: ['moduleId'],
      });
    }
    if (topic.gradingEnabled && topic.pointsPossible === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Graded discussion topics must declare pointsPossible.',
        path: ['pointsPossible'],
      });
    }
  });
export type DiscussionTopic = z.infer<typeof DiscussionTopic>;

export const DiscussionPost = z.object({
  id: DiscussionPostId,
  tenantId: TenantId,
  topicId: DiscussionTopicId,
  authorId: UserId,
  parentPostId: DiscussionPostId.nullable(),
  body: z.string().min(1),
  status: DiscussionPostStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type DiscussionPost = z.infer<typeof DiscussionPost>;

export const DiscussionTopicSubscription = z
  .object({
    id: DiscussionTopicSubscriptionId,
    tenantId: TenantId,
    topicId: DiscussionTopicId,
    userId: UserId,
    createdAt: z.date(),
  })
  .strict();
export type DiscussionTopicSubscription = z.infer<typeof DiscussionTopicSubscription>;

export const DiscussionPostGrade = z
  .object({
    id: DiscussionPostGradeId,
    tenantId: TenantId,
    topicId: DiscussionTopicId,
    postId: DiscussionPostId,
    studentId: UserId,
    score: z.number().finite().nonnegative(),
    maxScore: z.number().finite().positive(),
    status: DiscussionPostGradeStatus,
    comment: z.string().min(1).max(4_000).nullable(),
    gradedByUserId: UserId.nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((grade, context) => {
    if (grade.score > grade.maxScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discussion post grade score cannot exceed max score.',
        path: ['score'],
      });
    }
  });
export type DiscussionPostGrade = z.infer<typeof DiscussionPostGrade>;
