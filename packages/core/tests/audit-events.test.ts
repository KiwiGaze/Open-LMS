import { Grade } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  buildAiFeedbackDraftStatusChangedEvent,
  buildAuditLog,
  buildCourseAnnouncementPublishedEvent,
  buildDiscussionReplyCreatedEvent,
  buildExportCompletedEvent,
  buildFeedbackPublicationAuditLog,
  buildFeedbackPublishedEvent,
  buildGradeChangeAuditLog,
  buildGradeChangedEvent,
  buildGradePublishedEvent,
  buildHumanReviewAssignedEvent,
  buildHumanReviewAuditLog,
  buildHumanReviewCompletedEvent,
  buildTenantFileStorageQuotaChangedAuditLog,
  buildLearningFeedbackOpenedEvent,
  buildLearningPageViewedEvent,
  buildLearningPrecheckRequestedEvent,
  buildOutboxEvent,
  buildProviderConfigValidationAuditLog,
  buildProviderConfigValidationEvent,
  buildSisFinalGradesSubmittedEvent,
  buildTenantMembershipRoleChangedAuditLog,
  buildXapiStatementEmittedEvent,
} from '../src/events/audit-outbox.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const actorId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const submissionId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const aiFeedbackDraftId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const humanReviewId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';
const publishedFeedbackId = '01J9QW7B6N5W2YH3D3A1V0KE2Z';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE33';
const announcementId = '01J9QW7B6N5W2YH3D3A1V0KE32';
const coursePageId = '01J9QW7B6N5W2YH3D3A1V0KE34';
const discussionTopicId = '01J9QW7B6N5W2YH3D3A1V0KE35';
const discussionPostId = '01J9QW7B6N5W2YH3D3A1V0KE36';
const providerConfigId = '01J9QW7B6N5W2YH3D3A1V0KE37';
const membershipId = '01J9QW7B6N5W2YH3D3A1V0KE38';
const targetUserId = '01J9QW7B6N5W2YH3D3A1V0KE39';
const grade = Grade.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE30',
  tenantId,
  submissionId,
  score: 8,
  maxScore: 10,
  status: 'draft',
  source: 'manual',
  createdAt: now,
  updatedAt: now,
});
const changedGrade = Grade.parse({
  ...grade,
  score: 9,
  status: 'published',
  updatedAt: new Date('2026-05-10T01:00:00.000Z'),
});

describe('audit and outbox builders', () => {
  it('builds append-only audit records with tenant and resource scope', () => {
    const auditLog = buildAuditLog(
      {
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        actorId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        category: 'ai_request',
        action: 'request_feedback_draft',
        resourceType: 'submission',
        resourceId: 'submission-1',
        metadata: { actionIdentifier: 'feedback_draft' },
      },
      now,
    );

    expect(auditLog.category).toBe('ai_request');
    expect(auditLog.metadata.actionIdentifier).toBe('feedback_draft');
  });

  it('builds serializable outbox events with the realtime envelope shape', () => {
    const event = buildOutboxEvent(
      {
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        topic: 'assignment.feedback',
        eventType: 'feedback.published',
        payload: { submissionId: 'submission-1' },
      },
      now,
    );

    expect(JSON.parse(JSON.stringify(event)).eventType).toBe('feedback.published');
    expect(event.schemaVersion).toBe('1');
    expect(event.processedAt).toBeNull();
  });

  it('builds reference-only learning activity events', () => {
    const pageViewed = buildLearningPageViewedEvent(
      { tenantId, actorId, courseId, coursePageId },
      now,
    );
    const precheckRequested = buildLearningPrecheckRequestedEvent(
      { tenantId, actorId, assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE35', submissionId },
      now,
    );
    const feedbackOpened = buildLearningFeedbackOpenedEvent(
      { tenantId, actorId, submissionId, publishedFeedbackId },
      now,
    );

    expect(pageViewed.topic).toBe('learning.activity');
    expect(pageViewed.eventType).toBe('learning.page_viewed');
    expect(pageViewed.payload).toEqual({
      actorId,
      courseId,
      coursePageId,
    });
    expect(precheckRequested.eventType).toBe('learning.precheck_requested');
    expect(precheckRequested.payload).toEqual({
      actorId,
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      submissionId,
    });
    expect(feedbackOpened.eventType).toBe('learning.feedback_opened');
    expect(feedbackOpened.payload).toEqual({
      actorId,
      submissionId,
      publishedFeedbackId,
    });
  });

  it('builds AI feedback draft status change events without copying feedback content', () => {
    const event = buildAiFeedbackDraftStatusChangedEvent(
      {
        tenantId,
        aiFeedbackDraftId,
        submissionId,
        previousStatus: 'generated',
        status: 'rejected',
        reviewDecision: 'reject',
      },
      now,
    );

    expect(event.topic).toBe('assignment.feedback');
    expect(event.eventType).toBe('ai.feedback_draft.status_changed');
    expect(event.payload).toEqual({
      aiFeedbackDraftId,
      submissionId,
      previousStatus: 'generated',
      status: 'rejected',
      reviewDecision: 'reject',
    });
  });

  it('builds human review audit records without copying feedback content', () => {
    const auditLog = buildHumanReviewAuditLog(
      {
        tenantId,
        reviewerId: actorId,
        humanReviewId,
        aiFeedbackDraftId,
        submissionId,
        decision: 'edit',
      },
      now,
    );

    expect(auditLog.category).toBe('human_review');
    expect(auditLog.action).toBe('review_ai_feedback_draft');
    expect(auditLog.resourceType).toBe('human_review');
    expect(auditLog.resourceId).toBe(humanReviewId);
    expect(auditLog.metadata).toEqual({
      aiFeedbackDraftId,
      submissionId,
      decision: 'edit',
    });
  });

  it('builds human review assigned events with stable references only', () => {
    const event = buildHumanReviewAssignedEvent(
      {
        tenantId,
        reviewerId: actorId,
        aiFeedbackDraftId,
        submissionId,
      },
      now,
    );

    expect(event.topic).toBe('human_review.lifecycle');
    expect(event.eventType).toBe('human_review.assigned');
    expect(event.payload).toEqual({
      aiFeedbackDraftId,
      submissionId,
      reviewerId: actorId,
    });
  });

  it('builds human review completed events with stable references only', () => {
    const event = buildHumanReviewCompletedEvent(
      {
        tenantId,
        reviewerId: actorId,
        humanReviewId,
        aiFeedbackDraftId,
        submissionId,
        decision: 'reject',
      },
      now,
    );

    expect(event.topic).toBe('human_review.lifecycle');
    expect(event.eventType).toBe('human_review.completed');
    expect(event.payload).toEqual({
      humanReviewId,
      aiFeedbackDraftId,
      submissionId,
      reviewerId: actorId,
      decision: 'reject',
    });
  });

  it('builds feedback publication events with stable references only', () => {
    const event = buildFeedbackPublishedEvent(
      {
        tenantId,
        submissionId,
        publishedFeedbackId,
        source: 'ai_assisted',
        version: 2,
        linkedGradeId: null,
      },
      now,
    );

    expect(event.topic).toBe('assignment.feedback');
    expect(event.eventType).toBe('feedback.published');
    expect(event.schemaVersion).toBe('1');
    expect(event.payload).toEqual({
      submissionId,
      publishedFeedbackId,
      source: 'ai_assisted',
      version: 2,
      linkedGradeId: null,
    });
  });

  it('builds course announcement published events with stable references only', () => {
    const event = buildCourseAnnouncementPublishedEvent(
      {
        tenantId,
        courseId,
        announcementId,
        authorId: actorId,
        title: 'Essay workshop reminder',
      },
      now,
    );

    expect(event.topic).toBe('announcement.lifecycle');
    expect(event.eventType).toBe('announcement.published');
    expect(event.payload).toEqual({
      courseId,
      announcementId,
      authorId: actorId,
      title: 'Essay workshop reminder',
    });
  });

  it('builds discussion reply created events with stable references only', () => {
    const event = buildDiscussionReplyCreatedEvent(
      {
        tenantId,
        courseId,
        topicId: discussionTopicId,
        postId: discussionPostId,
        parentPostId: '01J9QW7B6N5W2YH3D3A1V0KE38',
        authorId: actorId,
      },
      now,
    );

    expect(event.topic).toBe('discussion.lifecycle');
    expect(event.eventType).toBe('discussion.reply_created');
    expect(event.payload).toEqual({
      courseId,
      topicId: discussionTopicId,
      postId: discussionPostId,
      parentPostId: '01J9QW7B6N5W2YH3D3A1V0KE38',
      authorId: actorId,
    });
  });

  it('builds publication audit records with actor and final feedback reference', () => {
    const auditLog = buildFeedbackPublicationAuditLog(
      {
        tenantId,
        actorId,
        submissionId,
        publishedFeedbackId,
        source: 'manual',
        version: 1,
        linkedGradeId: null,
      },
      now,
    );

    expect(auditLog.category).toBe('publication');
    expect(auditLog.action).toBe('publish_feedback');
    expect(auditLog.resourceType).toBe('published_feedback');
    expect(auditLog.resourceId).toBe(publishedFeedbackId);
    expect(auditLog.metadata).toEqual({
      submissionId,
      source: 'manual',
      version: 1,
      linkedGradeId: null,
    });
  });

  it('builds export completed events for grade and feedback exports', () => {
    const event = buildExportCompletedEvent(
      {
        tenantId,
        exportJobId: '01J9QW7B6N5W2YH3D3A1V0KE31',
        requestedById: actorId,
        exportType: 'feedback_and_grades',
        format: 'csv',
        storageFileId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      },
      now,
    );

    expect(event.topic).toBe('integration.export');
    expect(event.eventType).toBe('export.completed');
    expect(event.payload).toEqual({
      exportJobId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      requestedById: actorId,
      exportType: 'feedback_and_grades',
      format: 'csv',
      storageFileId: '01J9QW7B6N5W2YH3D3A1V0KE32',
    });
  });

  it('builds provider config validation audit and events without secret material', () => {
    const auditLog = buildProviderConfigValidationAuditLog(
      {
        tenantId,
        actorId,
        providerConfigId,
        providerType: 'openai_compatible',
        validationStatus: 'invalid',
        validationError: '401 Unauthorized',
      },
      now,
    );
    const event = buildProviderConfigValidationEvent(
      {
        tenantId,
        providerConfigId,
        providerType: 'openai_compatible',
        validationStatus: 'invalid',
        validationError: '401 Unauthorized',
      },
      now,
    );

    expect(auditLog.category).toBe('policy');
    expect(auditLog.action).toBe('validate_provider_config');
    expect(auditLog.resourceType).toBe('provider_config');
    expect(auditLog.resourceId).toBe(providerConfigId);
    expect(auditLog.metadata).toEqual({
      providerType: 'openai_compatible',
      validationStatus: 'invalid',
      validationError: '401 Unauthorized',
    });
    expect(JSON.stringify(auditLog)).not.toContain('ciphertext');
    expect(event.topic).toBe('ai.provider_config');
    expect(event.eventType).toBe('ai.provider_config.validation_recorded');
    expect(event.payload).toEqual({
      providerConfigId,
      providerType: 'openai_compatible',
      validationStatus: 'invalid',
      validationError: '401 Unauthorized',
    });
  });

  it('builds xAPI statement emitted events with stable references only', () => {
    const event = buildXapiStatementEmittedEvent(
      {
        tenantId,
        integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE36',
        statementId: 'xapi-statement-1',
        actorId,
        verb: 'experienced',
        objectId: coursePageId,
      },
      now,
    );

    expect(event.topic).toBe('integration.xapi');
    expect(event.eventType).toBe('xapi.statement_emitted');
    expect(event.payload).toEqual({
      integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE36',
      statementId: 'xapi-statement-1',
      actorId,
      verb: 'experienced',
      objectId: coursePageId,
    });
  });

  it('builds SIS final grade submission events with storage references only', () => {
    const event = buildSisFinalGradesSubmittedEvent(
      {
        tenantId,
        courseId,
        integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE36',
        storageFileId: '01J9QW7B6N5W2YH3D3A1V0KE38',
        rowCount: 2,
      },
      now,
    );

    expect(event.topic).toBe('integration.sis');
    expect(event.eventType).toBe('sis.final_grades_submitted');
    expect(event.payload).toEqual({
      courseId,
      integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE36',
      storageFileId: '01J9QW7B6N5W2YH3D3A1V0KE38',
      rowCount: 2,
    });
    expect(JSON.stringify(event.payload)).not.toContain('studentId');
    expect(JSON.stringify(event.payload)).not.toContain('letterGrade');
  });

  it('builds grade changed events with before and after grade state', () => {
    const event = buildGradeChangedEvent({ previousGrade: grade, grade: changedGrade }, now);

    expect(event.topic).toBe('grade.lifecycle');
    expect(event.eventType).toBe('grade.changed');
    expect(event.payload).toEqual({
      gradeId: grade.id,
      submissionId,
      previousScore: 8,
      score: 9,
      maxScore: 10,
      previousStatus: 'draft',
      status: 'published',
      source: 'manual',
      updatedAt: changedGrade.updatedAt.toISOString(),
    });
  });

  it('builds grade published events without before-state grade data', () => {
    const event = buildGradePublishedEvent({ grade: changedGrade }, now);

    expect(event.topic).toBe('grade.lifecycle');
    expect(event.eventType).toBe('grade.published');
    expect(event.payload).toEqual({
      gradeId: grade.id,
      submissionId,
      score: 9,
      maxScore: 10,
      status: 'published',
      source: 'manual',
      updatedAt: changedGrade.updatedAt.toISOString(),
    });
    expect(event.payload).not.toHaveProperty('previousScore');
    expect(event.payload).not.toHaveProperty('previousStatus');
  });

  it('builds grade change audit logs with actor and changed fields', () => {
    const auditLog = buildGradeChangeAuditLog(
      {
        actorId,
        previousGrade: grade,
        grade: changedGrade,
      },
      now,
    );

    expect(auditLog.category).toBe('grade');
    expect(auditLog.action).toBe('change_grade');
    expect(auditLog.resourceType).toBe('grade');
    expect(auditLog.resourceId).toBe(grade.id);
    expect(auditLog.metadata).toEqual({
      submissionId,
      previousScore: 8,
      score: 9,
      maxScore: 10,
      previousStatus: 'draft',
      status: 'published',
      source: 'manual',
      updatedAt: changedGrade.updatedAt.toISOString(),
    });
  });

  it('builds tenant membership role-change audit logs', () => {
    const auditLog = buildTenantMembershipRoleChangedAuditLog(
      {
        tenantId,
        actorId,
        membershipId,
        targetUserId,
        previousRole: 'student',
        role: 'instructor',
        updatedAt: now,
      },
      now,
    );

    expect(auditLog.category).toBe('tenant');
    expect(auditLog.action).toBe('change_tenant_membership_role');
    expect(auditLog.resourceType).toBe('tenant_membership');
    expect(auditLog.resourceId).toBe(membershipId);
    expect(auditLog.metadata).toEqual({
      targetUserId,
      previousRole: 'student',
      role: 'instructor',
      updatedAt: now.toISOString(),
    });
  });

  it('builds tenant file storage quota change audit logs', () => {
    const auditLog = buildTenantFileStorageQuotaChangedAuditLog(
      {
        tenantId,
        actorId,
        previousStorageByteLimit: null,
        storageByteLimit: 1024,
        previousDefaultUserStorageByteLimit: 256,
        defaultUserStorageByteLimit: null,
        updatedAt: now,
      },
      now,
    );

    expect(auditLog.category).toBe('tenant');
    expect(auditLog.action).toBe('change_tenant_file_storage_quotas');
    expect(auditLog.resourceType).toBe('tenant');
    expect(auditLog.resourceId).toBe(tenantId);
    expect(auditLog.metadata).toEqual({
      previousStorageByteLimit: null,
      storageByteLimit: 1024,
      previousDefaultUserStorageByteLimit: 256,
      defaultUserStorageByteLimit: null,
      updatedAt: now.toISOString(),
    });
  });
});
