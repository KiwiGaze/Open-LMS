import {
  type AiFeedbackDraftStatus,
  type AiProviderType,
  type Assignment,
  AuditCategory,
  type AuditCategory as AuditCategoryContract,
  AuditLog,
  type AuditLog as AuditLogContract,
  AuditLogId,
  type ExportFormat,
  type ExportType,
  type Grade,
  type HumanReviewDecision,
  OutboxEvent,
  type OutboxEvent as OutboxEventContract,
  OutboxEventId,
  type ProviderConfigValidationStatus,
  type PublishedFeedbackSource,
  type Rubric,
  type Submission,
  TenantId,
  type TenantRole,
  UserId,
} from '@openlms/contracts';
import { ulid } from 'ulid';

export type BuildAuditLogInput = {
  tenantId: string;
  actorId: string | null;
  category: AuditCategoryContract;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
};

export const buildAuditLog = (input: BuildAuditLogInput, now = new Date()): AuditLogContract =>
  AuditLog.parse({
    id: AuditLogId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    actorId: input.actorId ? UserId.parse(input.actorId) : null,
    category: AuditCategory.parse(input.category),
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    metadata: input.metadata,
    createdAt: now,
  });

export type BuildOutboxEventInput = {
  tenantId: string;
  topic: string;
  eventType: string;
  schemaVersion?: string;
  payload: Record<string, unknown>;
};

export const buildOutboxEvent = (
  input: BuildOutboxEventInput,
  now = new Date(),
): OutboxEventContract =>
  OutboxEvent.parse({
    id: OutboxEventId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    topic: input.topic,
    eventType: input.eventType,
    schemaVersion: input.schemaVersion ?? '1',
    payload: input.payload,
    occurredAt: now,
    processedAt: null,
  });

export type BuildLearningPageViewedEventInput = {
  tenantId: string;
  actorId: string;
  courseId: string;
  coursePageId: string;
};

export const buildLearningPageViewedEvent = (
  input: BuildLearningPageViewedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'learning.activity',
      eventType: 'learning.page_viewed',
      payload: {
        actorId: input.actorId,
        courseId: input.courseId,
        coursePageId: input.coursePageId,
      },
    },
    now,
  );

export type BuildLearningPrecheckRequestedEventInput = {
  tenantId: string;
  actorId: string;
  assignmentId: string;
  submissionId: string;
};

export const buildLearningPrecheckRequestedEvent = (
  input: BuildLearningPrecheckRequestedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'learning.activity',
      eventType: 'learning.precheck_requested',
      payload: {
        actorId: input.actorId,
        assignmentId: input.assignmentId,
        submissionId: input.submissionId,
      },
    },
    now,
  );

export type BuildLearningFeedbackOpenedEventInput = {
  tenantId: string;
  actorId: string;
  submissionId: string;
  publishedFeedbackId: string;
};

export const buildLearningFeedbackOpenedEvent = (
  input: BuildLearningFeedbackOpenedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'learning.activity',
      eventType: 'learning.feedback_opened',
      payload: {
        actorId: input.actorId,
        submissionId: input.submissionId,
        publishedFeedbackId: input.publishedFeedbackId,
      },
    },
    now,
  );

export type BuildAiFeedbackDraftStatusChangedEventInput = {
  tenantId: string;
  aiFeedbackDraftId: string;
  submissionId: string;
  previousStatus: AiFeedbackDraftStatus;
  status: AiFeedbackDraftStatus;
  reviewDecision: HumanReviewDecision | null;
};

export const buildAiFeedbackDraftStatusChangedEvent = (
  input: BuildAiFeedbackDraftStatusChangedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'assignment.feedback',
      eventType: 'ai.feedback_draft.status_changed',
      payload: {
        aiFeedbackDraftId: input.aiFeedbackDraftId,
        submissionId: input.submissionId,
        previousStatus: input.previousStatus,
        status: input.status,
        reviewDecision: input.reviewDecision,
      },
    },
    now,
  );

export type AssignmentLifecycleEventName = 'created' | 'published' | 'changed' | 'closed';

export type BuildAssignmentLifecycleEventInput = {
  assignment: Assignment;
  lifecycleEvent: AssignmentLifecycleEventName;
};

export const buildAssignmentLifecycleEvent = (
  input: BuildAssignmentLifecycleEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.assignment.tenantId,
      topic: 'assignment.lifecycle',
      eventType: `assignment.${input.lifecycleEvent}`,
      payload: {
        assignmentId: input.assignment.id,
        courseId: input.assignment.courseId,
        status: input.assignment.status,
        activeRubricId: input.assignment.activeRubricId,
        updatedAt: input.assignment.updatedAt.toISOString(),
      },
    },
    now,
  );

export const buildSubmissionCreatedEvent = (
  submission: Submission,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: submission.tenantId,
      topic: 'submission.lifecycle',
      eventType: 'submission.created',
      payload: {
        submissionId: submission.id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        sourceDraftId: submission.sourceDraftId,
        version: submission.version,
        status: submission.status,
        submittedAt: submission.submittedAt.toISOString(),
      },
    },
    now,
  );

export type BuildCourseAnnouncementPublishedEventInput = {
  tenantId: string;
  courseId: string;
  announcementId: string;
  authorId: string;
  title: string;
};

export const buildCourseAnnouncementPublishedEvent = (
  input: BuildCourseAnnouncementPublishedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'announcement.lifecycle',
      eventType: 'announcement.published',
      payload: {
        courseId: input.courseId,
        announcementId: input.announcementId,
        authorId: input.authorId,
        title: input.title,
      },
    },
    now,
  );

export type BuildDiscussionReplyCreatedEventInput = {
  tenantId: string;
  courseId: string;
  topicId: string;
  postId: string;
  parentPostId: string;
  authorId: string;
};

export const buildDiscussionReplyCreatedEvent = (
  input: BuildDiscussionReplyCreatedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'discussion.lifecycle',
      eventType: 'discussion.reply_created',
      payload: {
        courseId: input.courseId,
        topicId: input.topicId,
        postId: input.postId,
        parentPostId: input.parentPostId,
        authorId: input.authorId,
      },
    },
    now,
  );

export const buildRubricVersionChangedEvent = (
  rubric: Rubric,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: rubric.tenantId,
      topic: 'rubric.lifecycle',
      eventType: 'rubric.version_changed',
      payload: {
        rubricId: rubric.id,
        version: rubric.version,
        sourceTemplateId: rubric.sourceTemplateId,
        updatedAt: rubric.updatedAt.toISOString(),
      },
    },
    now,
  );

export type BuildGradeChangedEventInput = {
  previousGrade: Grade;
  grade: Grade;
};

export type BuildGradePublishedEventInput = {
  grade: Grade;
};

const buildPublishedGradeFields = (grade: Grade): Record<string, unknown> => ({
  submissionId: grade.submissionId,
  score: grade.score,
  maxScore: grade.maxScore,
  status: grade.status,
  source: grade.source,
  updatedAt: grade.updatedAt.toISOString(),
});

const buildGradeChangeFields = (input: BuildGradeChangedEventInput): Record<string, unknown> => ({
  ...buildPublishedGradeFields(input.grade),
  previousScore: input.previousGrade.score,
  previousStatus: input.previousGrade.status,
});

export const buildGradePublishedEvent = (
  input: BuildGradePublishedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.grade.tenantId,
      topic: 'grade.lifecycle',
      eventType: 'grade.published',
      payload: {
        gradeId: input.grade.id,
        ...buildPublishedGradeFields(input.grade),
      },
    },
    now,
  );

export const buildGradeChangedEvent = (
  input: BuildGradeChangedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.grade.tenantId,
      topic: 'grade.lifecycle',
      eventType: 'grade.changed',
      payload: {
        gradeId: input.grade.id,
        ...buildGradeChangeFields(input),
      },
    },
    now,
  );

export type BuildGradeChangeAuditLogInput = BuildGradeChangedEventInput & {
  actorId: string;
};

export const buildGradeChangeAuditLog = (
  input: BuildGradeChangeAuditLogInput,
  now = new Date(),
): AuditLogContract =>
  buildAuditLog(
    {
      tenantId: input.grade.tenantId,
      actorId: input.actorId,
      category: 'grade',
      action: 'change_grade',
      resourceType: 'grade',
      resourceId: input.grade.id,
      metadata: buildGradeChangeFields(input),
    },
    now,
  );

export type BuildTenantMembershipRoleChangedAuditLogInput = {
  tenantId: string;
  actorId: string;
  membershipId: string;
  targetUserId: string;
  previousRole: TenantRole;
  role: TenantRole;
  updatedAt: Date;
};

export const buildTenantMembershipRoleChangedAuditLog = (
  input: BuildTenantMembershipRoleChangedAuditLogInput,
  now = new Date(),
): AuditLogContract =>
  buildAuditLog(
    {
      tenantId: input.tenantId,
      actorId: input.actorId,
      category: 'tenant',
      action: 'change_tenant_membership_role',
      resourceType: 'tenant_membership',
      resourceId: input.membershipId,
      metadata: {
        targetUserId: input.targetUserId,
        previousRole: input.previousRole,
        role: input.role,
        updatedAt: input.updatedAt.toISOString(),
      },
    },
    now,
  );

export type BuildTenantFileStorageQuotaChangedAuditLogInput = {
  tenantId: string;
  actorId: string;
  previousStorageByteLimit: number | null;
  storageByteLimit: number | null;
  previousDefaultUserStorageByteLimit: number | null;
  defaultUserStorageByteLimit: number | null;
  updatedAt: Date;
};

export const buildTenantFileStorageQuotaChangedAuditLog = (
  input: BuildTenantFileStorageQuotaChangedAuditLogInput,
  now = new Date(),
): AuditLogContract =>
  buildAuditLog(
    {
      tenantId: input.tenantId,
      actorId: input.actorId,
      category: 'tenant',
      action: 'change_tenant_file_storage_quotas',
      resourceType: 'tenant',
      resourceId: input.tenantId,
      metadata: {
        previousStorageByteLimit: input.previousStorageByteLimit,
        storageByteLimit: input.storageByteLimit,
        previousDefaultUserStorageByteLimit: input.previousDefaultUserStorageByteLimit,
        defaultUserStorageByteLimit: input.defaultUserStorageByteLimit,
        updatedAt: input.updatedAt.toISOString(),
      },
    },
    now,
  );

export type BuildHumanReviewAuditLogInput = {
  tenantId: string;
  reviewerId: string;
  humanReviewId: string;
  aiFeedbackDraftId: string;
  submissionId: string;
  decision: HumanReviewDecision;
};

export type BuildHumanReviewAssignedEventInput = {
  tenantId: string;
  reviewerId: string;
  aiFeedbackDraftId: string;
  submissionId: string;
};

export const buildHumanReviewAuditLog = (
  input: BuildHumanReviewAuditLogInput,
  now = new Date(),
): AuditLogContract =>
  buildAuditLog(
    {
      tenantId: input.tenantId,
      actorId: input.reviewerId,
      category: 'human_review',
      action: 'review_ai_feedback_draft',
      resourceType: 'human_review',
      resourceId: input.humanReviewId,
      metadata: {
        aiFeedbackDraftId: input.aiFeedbackDraftId,
        submissionId: input.submissionId,
        decision: input.decision,
      },
    },
    now,
  );

export const buildHumanReviewAssignedEvent = (
  input: BuildHumanReviewAssignedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'human_review.lifecycle',
      eventType: 'human_review.assigned',
      payload: {
        aiFeedbackDraftId: input.aiFeedbackDraftId,
        submissionId: input.submissionId,
        reviewerId: input.reviewerId,
      },
    },
    now,
  );

export const buildHumanReviewCompletedEvent = (
  input: BuildHumanReviewAuditLogInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'human_review.lifecycle',
      eventType: 'human_review.completed',
      payload: {
        humanReviewId: input.humanReviewId,
        aiFeedbackDraftId: input.aiFeedbackDraftId,
        submissionId: input.submissionId,
        reviewerId: input.reviewerId,
        decision: input.decision,
      },
    },
    now,
  );

export type BuildExportCompletedEventInput = {
  tenantId: string;
  exportJobId: string;
  requestedById: string;
  exportType: ExportType;
  format: ExportFormat;
  storageFileId: string | null;
};

export const buildExportCompletedEvent = (
  input: BuildExportCompletedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'integration.export',
      eventType: 'export.completed',
      payload: {
        exportJobId: input.exportJobId,
        requestedById: input.requestedById,
        exportType: input.exportType,
        format: input.format,
        storageFileId: input.storageFileId,
      },
    },
    now,
  );

export type BuildXapiStatementEmittedEventInput = {
  tenantId: string;
  integrationConnectionId: string;
  statementId: string;
  actorId: string;
  verb: string;
  objectId: string;
};

export const buildXapiStatementEmittedEvent = (
  input: BuildXapiStatementEmittedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'integration.xapi',
      eventType: 'xapi.statement_emitted',
      payload: {
        integrationConnectionId: input.integrationConnectionId,
        statementId: input.statementId,
        actorId: input.actorId,
        verb: input.verb,
        objectId: input.objectId,
      },
    },
    now,
  );

export type BuildSisFinalGradesSubmittedEventInput = {
  tenantId: string;
  courseId: string;
  integrationConnectionId: string;
  storageFileId: string;
  rowCount: number;
};

export const buildSisFinalGradesSubmittedEvent = (
  input: BuildSisFinalGradesSubmittedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'integration.sis',
      eventType: 'sis.final_grades_submitted',
      payload: {
        courseId: input.courseId,
        integrationConnectionId: input.integrationConnectionId,
        storageFileId: input.storageFileId,
        rowCount: input.rowCount,
      },
    },
    now,
  );

export type BuildProviderConfigValidationInput = {
  tenantId: string;
  providerConfigId: string;
  providerType: AiProviderType;
  validationStatus: ProviderConfigValidationStatus;
  validationError: string | null;
};

const buildProviderConfigValidationFields = (
  input: BuildProviderConfigValidationInput,
): Record<string, unknown> => ({
  providerType: input.providerType,
  validationStatus: input.validationStatus,
  validationError: input.validationError,
});

export const buildProviderConfigValidationEvent = (
  input: BuildProviderConfigValidationInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'ai.provider_config',
      eventType: 'ai.provider_config.validation_recorded',
      payload: {
        providerConfigId: input.providerConfigId,
        ...buildProviderConfigValidationFields(input),
      },
    },
    now,
  );

export type BuildProviderConfigValidationAuditLogInput = BuildProviderConfigValidationInput & {
  actorId: string;
};

export const buildProviderConfigValidationAuditLog = (
  input: BuildProviderConfigValidationAuditLogInput,
  now = new Date(),
): AuditLogContract =>
  buildAuditLog(
    {
      tenantId: input.tenantId,
      actorId: input.actorId,
      category: 'policy',
      action: 'validate_provider_config',
      resourceType: 'provider_config',
      resourceId: input.providerConfigId,
      metadata: buildProviderConfigValidationFields(input),
    },
    now,
  );

export type BuildFeedbackPublishedEventInput = {
  tenantId: string;
  submissionId: string;
  publishedFeedbackId: string;
  source: PublishedFeedbackSource;
  version: number;
  linkedGradeId: string | null;
};

export const buildFeedbackPublishedEvent = (
  input: BuildFeedbackPublishedEventInput,
  now = new Date(),
): OutboxEventContract =>
  buildOutboxEvent(
    {
      tenantId: input.tenantId,
      topic: 'assignment.feedback',
      eventType: 'feedback.published',
      payload: {
        submissionId: input.submissionId,
        publishedFeedbackId: input.publishedFeedbackId,
        source: input.source,
        version: input.version,
        linkedGradeId: input.linkedGradeId,
      },
    },
    now,
  );

export type BuildFeedbackPublicationAuditLogInput = BuildFeedbackPublishedEventInput & {
  actorId: string;
};

export const buildFeedbackPublicationAuditLog = (
  input: BuildFeedbackPublicationAuditLogInput,
  now = new Date(),
): AuditLogContract =>
  buildAuditLog(
    {
      tenantId: input.tenantId,
      actorId: input.actorId,
      category: 'publication',
      action: 'publish_feedback',
      resourceType: 'published_feedback',
      resourceId: input.publishedFeedbackId,
      metadata: {
        submissionId: input.submissionId,
        source: input.source,
        version: input.version,
        linkedGradeId: input.linkedGradeId,
      },
    },
    now,
  );
