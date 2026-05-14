import { z } from 'zod';
import { CourseId, LearningObjectiveId, TenantId, UserId } from './ids.ts';

export const LearningSupportMode = z.enum(['learning_support', 'traditional_thread_fallback']);
export type LearningSupportMode = z.infer<typeof LearningSupportMode>;

export const LearningSupportStatus = z.enum(['open', 'resolved']);
export type LearningSupportStatus = z.infer<typeof LearningSupportStatus>;

export const LearningSupportEscalationState = z.enum([
  'none',
  'needs_instructor',
  'escalated',
  'resolved',
]);
export type LearningSupportEscalationState = z.infer<typeof LearningSupportEscalationState>;

export const LearningSupportTutorState = z.enum([
  'active',
  'handoff_recommended',
  'escalated',
  'resolved',
]);
export type LearningSupportTutorState = z.infer<typeof LearningSupportTutorState>;

export const LearningSupportSourceCitation = z
  .object({
    resourceType: z.enum([
      'course_page',
      'course_resource',
      'assignment',
      'quiz',
      'discussion_topic',
      'feedback',
    ]),
    resourceId: z.string().min(1),
    title: z.string().min(1).max(180),
  })
  .strict();
export type LearningSupportSourceCitation = z.infer<typeof LearningSupportSourceCitation>;

export const LearningSupportReusableOutcome = z
  .object({
    summary: z.string().min(1).max(1_000),
    interventionType: z.enum(['explanation', 'practice', 'instructor_follow_up']),
    worked: z.boolean(),
  })
  .strict();
export type LearningSupportReusableOutcome = z.infer<typeof LearningSupportReusableOutcome>;

export const LearningSupportConversation = z
  .object({
    tenantId: TenantId,
    courseId: CourseId,
    studentId: UserId,
    mode: LearningSupportMode,
    status: LearningSupportStatus,
    escalationState: LearningSupportEscalationState,
    objectiveIds: z.array(LearningObjectiveId),
    evidenceIds: z.array(z.string().min(1)),
    unresolvedMisconceptionIds: z.array(z.string().min(1)),
    citedSources: z.array(LearningSupportSourceCitation),
    reusableOutcome: LearningSupportReusableOutcome.nullable(),
    fallbackThreadId: z.string().min(1).nullable(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((conversation, context) => {
    if (
      conversation.mode === 'traditional_thread_fallback' &&
      conversation.fallbackThreadId === null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Traditional support fallback requires fallbackThreadId.',
        path: ['fallbackThreadId'],
      });
    }
  });
export type LearningSupportConversation = z.infer<typeof LearningSupportConversation>;

export const LearningSupportTutorSession = z
  .object({
    sessionId: z.string().min(1),
    tenantId: TenantId,
    courseId: CourseId,
    studentId: UserId,
    objectiveIds: z.array(LearningObjectiveId),
    evidenceIds: z.array(z.string().min(1)),
    unresolvedMisconceptionIds: z.array(z.string().min(1)),
    citedSources: z.array(LearningSupportSourceCitation),
    tutorState: LearningSupportTutorState,
    fallbackThreadId: z.string().min(1).nullable(),
    reusableOutcome: LearningSupportReusableOutcome.nullable(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((session, context) => {
    if (session.tutorState === 'escalated' && session.fallbackThreadId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Escalated tutor sessions require fallbackThreadId.',
        path: ['fallbackThreadId'],
      });
    }
  });
export type LearningSupportTutorSession = z.infer<typeof LearningSupportTutorSession>;
