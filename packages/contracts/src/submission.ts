import { z } from 'zod';
import {
  AssignmentId,
  AssignmentPeerReviewId,
  AssignmentPeerReviewResponseId,
  CourseGroupId,
  CourseId,
  DraftId,
  FileResourceId,
  IntegrationConnectionId,
  SubmissionAttachmentId,
  SubmissionCommentId,
  SubmissionId,
  SubmissionPlagiarismReportId,
  TenantId,
  UserId,
} from './ids.ts';

export const DraftBlock = z
  .object({
    blockId: z.string().min(1),
    text: z.string(),
  })
  .strict();
export type DraftBlock = z.infer<typeof DraftBlock>;

export const Draft = z.object({
  id: DraftId,
  tenantId: TenantId,
  assignmentId: AssignmentId,
  studentId: UserId,
  blocks: z.array(DraftBlock),
  updatedAt: z.date(),
  createdAt: z.date(),
});
export type Draft = z.infer<typeof Draft>;

export const SubmissionStatus = z.enum(['submitted', 'late', 'returned', 'revised', 'archived']);
export type SubmissionStatus = z.infer<typeof SubmissionStatus>;

export const Submission = z.object({
  id: SubmissionId,
  tenantId: TenantId,
  assignmentId: AssignmentId,
  studentId: UserId,
  groupId: CourseGroupId.nullable().default(null),
  sourceDraftId: DraftId,
  version: z.number().int().positive(),
  status: SubmissionStatus,
  contentSnapshot: z.array(DraftBlock),
  submittedAt: z.date(),
  createdAt: z.date(),
  anonymousLabel: z.string().min(1).max(60).nullable().default(null),
});
export type Submission = z.infer<typeof Submission>;

export const AssignmentSubmissionListItem = Submission.extend({
  studentId: Submission.shape.studentId.nullable(),
});
export type AssignmentSubmissionListItem = z.infer<typeof AssignmentSubmissionListItem>;

export const SubmissionAttachment = z.object({
  id: SubmissionAttachmentId,
  tenantId: TenantId,
  submissionId: SubmissionId,
  fileResourceId: FileResourceId,
  displayName: z.string().min(1).max(255),
  position: z.number().int().nonnegative(),
  createdAt: z.date(),
});
export type SubmissionAttachment = z.infer<typeof SubmissionAttachment>;

export const SubmissionCommentVisibility = z.enum([
  'student_visible',
  'staff_only',
  'peer_reviewer_visible',
]);
export type SubmissionCommentVisibility = z.infer<typeof SubmissionCommentVisibility>;

export const SubmissionComment = z.object({
  id: SubmissionCommentId,
  tenantId: TenantId,
  submissionId: SubmissionId,
  authorId: UserId,
  body: z.string().min(1).max(4000),
  visibility: SubmissionCommentVisibility,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SubmissionComment = z.infer<typeof SubmissionComment>;

export const SubmissionPlagiarismReportStatus = z.enum(['pending', 'complete', 'failed']);
export type SubmissionPlagiarismReportStatus = z.infer<typeof SubmissionPlagiarismReportStatus>;

const HttpsReportUrl = z
  .string()
  .regex(/^https:\/\//, {
    message: 'Plagiarism report URL must use HTTPS.',
  })
  .url()
  .max(2048);

export const SubmissionPlagiarismReport = z
  .object({
    id: SubmissionPlagiarismReportId,
    tenantId: TenantId,
    courseId: CourseId,
    submissionId: SubmissionId,
    integrationConnectionId: IntegrationConnectionId,
    similarityPercent: z.number().min(0).max(100).finite(),
    reportUrl: HttpsReportUrl.nullable(),
    status: SubmissionPlagiarismReportStatus,
    checkedAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type SubmissionPlagiarismReport = z.infer<typeof SubmissionPlagiarismReport>;

export const AssignmentPeerReviewResponseStatus = z.enum(['draft', 'submitted']);
export type AssignmentPeerReviewResponseStatus = z.infer<typeof AssignmentPeerReviewResponseStatus>;

export const AssignmentPeerReviewResponse = z
  .object({
    id: AssignmentPeerReviewResponseId,
    tenantId: TenantId,
    peerReviewId: AssignmentPeerReviewId,
    criterionId: z.string().min(1).max(64),
    score: z.number().finite().nonnegative().nullable(),
    comment: z.string().min(1).max(4_000).nullable(),
    status: AssignmentPeerReviewResponseStatus,
    submittedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((response, context) => {
    if (response.status === 'submitted' && response.submittedAt === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'submittedAt must be set when status is submitted.',
        path: ['submittedAt'],
      });
    }
  });
export type AssignmentPeerReviewResponse = z.infer<typeof AssignmentPeerReviewResponse>;
