import { z } from 'zod';

const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;

const ulidSchema = (label: string) =>
  z.string().regex(ulidRegex, { message: `${label} must be a ULID` });

export const TenantId = ulidSchema('TenantId').brand<'TenantId'>();
export type TenantId = z.infer<typeof TenantId>;

export const TenantFeatureFlagId = ulidSchema('TenantFeatureFlagId').brand<'TenantFeatureFlagId'>();
export type TenantFeatureFlagId = z.infer<typeof TenantFeatureFlagId>;

export const UserId = ulidSchema('UserId').brand<'UserId'>();
export type UserId = z.infer<typeof UserId>;

export const UserLegalHoldId = ulidSchema('UserLegalHoldId').brand<'UserLegalHoldId'>();
export type UserLegalHoldId = z.infer<typeof UserLegalHoldId>;

export const RetentionPolicyId = ulidSchema('RetentionPolicyId').brand<'RetentionPolicyId'>();
export type RetentionPolicyId = z.infer<typeof RetentionPolicyId>;

export const MembershipId = ulidSchema('MembershipId').brand<'MembershipId'>();
export type MembershipId = z.infer<typeof MembershipId>;

export const CourseMembershipId = ulidSchema('CourseMembershipId').brand<'CourseMembershipId'>();
export type CourseMembershipId = z.infer<typeof CourseMembershipId>;

export const ProviderConfigId = ulidSchema('ProviderConfigId').brand<'ProviderConfigId'>();
export type ProviderConfigId = z.infer<typeof ProviderConfigId>;

export const ConsentId = ulidSchema('ConsentId').brand<'ConsentId'>();
export type ConsentId = z.infer<typeof ConsentId>;

export const ContextPackageId = ulidSchema('ContextPackageId').brand<'ContextPackageId'>();
export type ContextPackageId = z.infer<typeof ContextPackageId>;

export const AuditLogId = ulidSchema('AuditLogId').brand<'AuditLogId'>();
export type AuditLogId = z.infer<typeof AuditLogId>;

export const OutboxEventId = ulidSchema('OutboxEventId').brand<'OutboxEventId'>();
export type OutboxEventId = z.infer<typeof OutboxEventId>;

export const AiGenerationLogId = ulidSchema('AiGenerationLogId').brand<'AiGenerationLogId'>();
export type AiGenerationLogId = z.infer<typeof AiGenerationLogId>;

export const CourseId = ulidSchema('CourseId').brand<'CourseId'>();
export type CourseId = z.infer<typeof CourseId>;

export const CourseFavoriteId = ulidSchema('CourseFavoriteId').brand<'CourseFavoriteId'>();
export type CourseFavoriteId = z.infer<typeof CourseFavoriteId>;

export const CourseSectionId = ulidSchema('CourseSectionId').brand<'CourseSectionId'>();
export type CourseSectionId = z.infer<typeof CourseSectionId>;

export const CourseSectionMemberId =
  ulidSchema('CourseSectionMemberId').brand<'CourseSectionMemberId'>();
export type CourseSectionMemberId = z.infer<typeof CourseSectionMemberId>;

export const CourseSectionInstructorId = ulidSchema(
  'CourseSectionInstructorId',
).brand<'CourseSectionInstructorId'>();
export type CourseSectionInstructorId = z.infer<typeof CourseSectionInstructorId>;

export const CourseSyllabusId = ulidSchema('CourseSyllabusId').brand<'CourseSyllabusId'>();
export type CourseSyllabusId = z.infer<typeof CourseSyllabusId>;

export const CourseCalendarEventId =
  ulidSchema('CourseCalendarEventId').brand<'CourseCalendarEventId'>();
export type CourseCalendarEventId = z.infer<typeof CourseCalendarEventId>;

export const CourseCalendarEventReminderId = ulidSchema(
  'CourseCalendarEventReminderId',
).brand<'CourseCalendarEventReminderId'>();
export type CourseCalendarEventReminderId = z.infer<typeof CourseCalendarEventReminderId>;

export const CourseAnnouncementId =
  ulidSchema('CourseAnnouncementId').brand<'CourseAnnouncementId'>();
export type CourseAnnouncementId = z.infer<typeof CourseAnnouncementId>;

export const CourseModuleId = ulidSchema('CourseModuleId').brand<'CourseModuleId'>();
export type CourseModuleId = z.infer<typeof CourseModuleId>;

export const CourseUnitId = ulidSchema('CourseUnitId').brand<'CourseUnitId'>();
export type CourseUnitId = z.infer<typeof CourseUnitId>;

export const LearningObjectiveId = ulidSchema('LearningObjectiveId').brand<'LearningObjectiveId'>();
export type LearningObjectiveId = z.infer<typeof LearningObjectiveId>;

export const LearningObjectiveMasteryId = ulidSchema(
  'LearningObjectiveMasteryId',
).brand<'LearningObjectiveMasteryId'>();
export type LearningObjectiveMasteryId = z.infer<typeof LearningObjectiveMasteryId>;

export const LearningEvidenceId = ulidSchema('LearningEvidenceId').brand<'LearningEvidenceId'>();
export type LearningEvidenceId = z.infer<typeof LearningEvidenceId>;

export const CourseResourceId = ulidSchema('CourseResourceId').brand<'CourseResourceId'>();
export type CourseResourceId = z.infer<typeof CourseResourceId>;

export const AssignmentId = ulidSchema('AssignmentId').brand<'AssignmentId'>();
export type AssignmentId = z.infer<typeof AssignmentId>;

export const QuizId = ulidSchema('QuizId').brand<'QuizId'>();
export type QuizId = z.infer<typeof QuizId>;

export const QuizOverrideId = ulidSchema('QuizOverrideId').brand<'QuizOverrideId'>();
export type QuizOverrideId = z.infer<typeof QuizOverrideId>;

export const QuizQuestionId = ulidSchema('QuizQuestionId').brand<'QuizQuestionId'>();
export type QuizQuestionId = z.infer<typeof QuizQuestionId>;

export const QuizAttemptId = ulidSchema('QuizAttemptId').brand<'QuizAttemptId'>();
export type QuizAttemptId = z.infer<typeof QuizAttemptId>;

export const QuizAttemptProbeId = ulidSchema('QuizAttemptProbeId').brand<'QuizAttemptProbeId'>();
export type QuizAttemptProbeId = z.infer<typeof QuizAttemptProbeId>;

export const QuizAttemptProbeResponseId = ulidSchema(
  'QuizAttemptProbeResponseId',
).brand<'QuizAttemptProbeResponseId'>();
export type QuizAttemptProbeResponseId = z.infer<typeof QuizAttemptProbeResponseId>;

export const QuizAttemptResponseId =
  ulidSchema('QuizAttemptResponseId').brand<'QuizAttemptResponseId'>();
export type QuizAttemptResponseId = z.infer<typeof QuizAttemptResponseId>;

export const QuizAttemptQuestionGradeId = ulidSchema(
  'QuizAttemptQuestionGradeId',
).brand<'QuizAttemptQuestionGradeId'>();
export type QuizAttemptQuestionGradeId = z.infer<typeof QuizAttemptQuestionGradeId>;

export const SurveyId = ulidSchema('SurveyId').brand<'SurveyId'>();
export type SurveyId = z.infer<typeof SurveyId>;

export const SurveyQuestionId = ulidSchema('SurveyQuestionId').brand<'SurveyQuestionId'>();
export type SurveyQuestionId = z.infer<typeof SurveyQuestionId>;

export const SurveyResponseId = ulidSchema('SurveyResponseId').brand<'SurveyResponseId'>();
export type SurveyResponseId = z.infer<typeof SurveyResponseId>;

export const GlossaryEntryId = ulidSchema('GlossaryEntryId').brand<'GlossaryEntryId'>();
export type GlossaryEntryId = z.infer<typeof GlossaryEntryId>;

export const WikiPageId = ulidSchema('WikiPageId').brand<'WikiPageId'>();
export type WikiPageId = z.infer<typeof WikiPageId>;

export const CourseMeetingId = ulidSchema('CourseMeetingId').brand<'CourseMeetingId'>();
export type CourseMeetingId = z.infer<typeof CourseMeetingId>;

export const WikiPageRevisionId = ulidSchema('WikiPageRevisionId').brand<'WikiPageRevisionId'>();
export type WikiPageRevisionId = z.infer<typeof WikiPageRevisionId>;

export const AttendanceSessionId = ulidSchema('AttendanceSessionId').brand<'AttendanceSessionId'>();
export type AttendanceSessionId = z.infer<typeof AttendanceSessionId>;

export const AttendanceRecordId = ulidSchema('AttendanceRecordId').brand<'AttendanceRecordId'>();
export type AttendanceRecordId = z.infer<typeof AttendanceRecordId>;

export const CompletionRequirementId =
  ulidSchema('CompletionRequirementId').brand<'CompletionRequirementId'>();
export type CompletionRequirementId = z.infer<typeof CompletionRequirementId>;

export const CompletionProgressId =
  ulidSchema('CompletionProgressId').brand<'CompletionProgressId'>();
export type CompletionProgressId = z.infer<typeof CompletionProgressId>;

export const CourseCredentialId = ulidSchema('CourseCredentialId').brand<'CourseCredentialId'>();
export type CourseCredentialId = z.infer<typeof CourseCredentialId>;

export const CredentialAwardId = ulidSchema('CredentialAwardId').brand<'CredentialAwardId'>();
export type CredentialAwardId = z.infer<typeof CredentialAwardId>;

export const ConversationThreadId =
  ulidSchema('ConversationThreadId').brand<'ConversationThreadId'>();
export type ConversationThreadId = z.infer<typeof ConversationThreadId>;

export const ConversationMessageId =
  ulidSchema('ConversationMessageId').brand<'ConversationMessageId'>();
export type ConversationMessageId = z.infer<typeof ConversationMessageId>;

export const NotificationPreferenceId = ulidSchema(
  'NotificationPreferenceId',
).brand<'NotificationPreferenceId'>();
export type NotificationPreferenceId = z.infer<typeof NotificationPreferenceId>;

export const CourseGroupSetId = ulidSchema('CourseGroupSetId').brand<'CourseGroupSetId'>();
export type CourseGroupSetId = z.infer<typeof CourseGroupSetId>;

export const CourseGroupId = ulidSchema('CourseGroupId').brand<'CourseGroupId'>();
export type CourseGroupId = z.infer<typeof CourseGroupId>;

export const CourseGroupMemberId = ulidSchema('CourseGroupMemberId').brand<'CourseGroupMemberId'>();
export type CourseGroupMemberId = z.infer<typeof CourseGroupMemberId>;

export const QuestionBankId = ulidSchema('QuestionBankId').brand<'QuestionBankId'>();
export type QuestionBankId = z.infer<typeof QuestionBankId>;

export const QuestionBankQuestionId =
  ulidSchema('QuestionBankQuestionId').brand<'QuestionBankQuestionId'>();
export type QuestionBankQuestionId = z.infer<typeof QuestionBankQuestionId>;

export const RubricId = ulidSchema('RubricId').brand<'RubricId'>();
export type RubricId = z.infer<typeof RubricId>;

export const RubricTemplateId = ulidSchema('RubricTemplateId').brand<'RubricTemplateId'>();
export type RubricTemplateId = z.infer<typeof RubricTemplateId>;

export const DraftId = ulidSchema('DraftId').brand<'DraftId'>();
export type DraftId = z.infer<typeof DraftId>;

export const SubmissionId = ulidSchema('SubmissionId').brand<'SubmissionId'>();
export type SubmissionId = z.infer<typeof SubmissionId>;

export const SubmissionAttachmentId =
  ulidSchema('SubmissionAttachmentId').brand<'SubmissionAttachmentId'>();
export type SubmissionAttachmentId = z.infer<typeof SubmissionAttachmentId>;

export const SubmissionCommentId = ulidSchema('SubmissionCommentId').brand<'SubmissionCommentId'>();
export type SubmissionCommentId = z.infer<typeof SubmissionCommentId>;

export const AiFeedbackDraftId = ulidSchema('AiFeedbackDraftId').brand<'AiFeedbackDraftId'>();
export type AiFeedbackDraftId = z.infer<typeof AiFeedbackDraftId>;

export const SubmissionPrecheckId =
  ulidSchema('SubmissionPrecheckId').brand<'SubmissionPrecheckId'>();
export type SubmissionPrecheckId = z.infer<typeof SubmissionPrecheckId>;

export const GradebookCategoryId = ulidSchema('GradebookCategoryId').brand<'GradebookCategoryId'>();
export type GradebookCategoryId = z.infer<typeof GradebookCategoryId>;

export const GradebookManualItemId =
  ulidSchema('GradebookManualItemId').brand<'GradebookManualItemId'>();
export type GradebookManualItemId = z.infer<typeof GradebookManualItemId>;

export const GradebookManualGradeId =
  ulidSchema('GradebookManualGradeId').brand<'GradebookManualGradeId'>();
export type GradebookManualGradeId = z.infer<typeof GradebookManualGradeId>;

export const CourseGradingSchemeId =
  ulidSchema('CourseGradingSchemeId').brand<'CourseGradingSchemeId'>();
export type CourseGradingSchemeId = z.infer<typeof CourseGradingSchemeId>;

export const GradeHistoryId = ulidSchema('GradeHistoryId').brand<'GradeHistoryId'>();
export type GradeHistoryId = z.infer<typeof GradeHistoryId>;

export const GradeAppealId = ulidSchema('GradeAppealId').brand<'GradeAppealId'>();
export type GradeAppealId = z.infer<typeof GradeAppealId>;

export const AssignmentTrendCardId =
  ulidSchema('AssignmentTrendCardId').brand<'AssignmentTrendCardId'>();
export type AssignmentTrendCardId = z.infer<typeof AssignmentTrendCardId>;

export const AssignmentOverrideId =
  ulidSchema('AssignmentOverrideId').brand<'AssignmentOverrideId'>();
export type AssignmentOverrideId = z.infer<typeof AssignmentOverrideId>;

export const AssignmentPeerReviewId =
  ulidSchema('AssignmentPeerReviewId').brand<'AssignmentPeerReviewId'>();
export type AssignmentPeerReviewId = z.infer<typeof AssignmentPeerReviewId>;

export const RubricClarityReviewId =
  ulidSchema('RubricClarityReviewId').brand<'RubricClarityReviewId'>();
export type RubricClarityReviewId = z.infer<typeof RubricClarityReviewId>;

export const CoursePageId = ulidSchema('CoursePageId').brand<'CoursePageId'>();
export type CoursePageId = z.infer<typeof CoursePageId>;

export const DiscussionTopicId = ulidSchema('DiscussionTopicId').brand<'DiscussionTopicId'>();
export type DiscussionTopicId = z.infer<typeof DiscussionTopicId>;

export const DiscussionPostId = ulidSchema('DiscussionPostId').brand<'DiscussionPostId'>();
export type DiscussionPostId = z.infer<typeof DiscussionPostId>;

export const DiscussionTopicSubscriptionId = ulidSchema(
  'DiscussionTopicSubscriptionId',
).brand<'DiscussionTopicSubscriptionId'>();
export type DiscussionTopicSubscriptionId = z.infer<typeof DiscussionTopicSubscriptionId>;

export const PageExplanationId = ulidSchema('PageExplanationId').brand<'PageExplanationId'>();
export type PageExplanationId = z.infer<typeof PageExplanationId>;

export const HumanReviewId = ulidSchema('HumanReviewId').brand<'HumanReviewId'>();
export type HumanReviewId = z.infer<typeof HumanReviewId>;

export const PublishedFeedbackId = ulidSchema('PublishedFeedbackId').brand<'PublishedFeedbackId'>();
export type PublishedFeedbackId = z.infer<typeof PublishedFeedbackId>;

export const FeedbackDialogueId = ulidSchema('FeedbackDialogueId').brand<'FeedbackDialogueId'>();
export type FeedbackDialogueId = z.infer<typeof FeedbackDialogueId>;

export const FeedbackDialogueMessageId = ulidSchema(
  'FeedbackDialogueMessageId',
).brand<'FeedbackDialogueMessageId'>();
export type FeedbackDialogueMessageId = z.infer<typeof FeedbackDialogueMessageId>;

export const GradeId = ulidSchema('GradeId').brand<'GradeId'>();
export type GradeId = z.infer<typeof GradeId>;

export const ExportJobId = ulidSchema('ExportJobId').brand<'ExportJobId'>();
export type ExportJobId = z.infer<typeof ExportJobId>;

export const FileResourceId = ulidSchema('FileResourceId').brand<'FileResourceId'>();
export type FileResourceId = z.infer<typeof FileResourceId>;

export const IntegrationConnectionId =
  ulidSchema('IntegrationConnectionId').brand<'IntegrationConnectionId'>();
export type IntegrationConnectionId = z.infer<typeof IntegrationConnectionId>;

export const WebhookSubscriptionId =
  ulidSchema('WebhookSubscriptionId').brand<'WebhookSubscriptionId'>();
export type WebhookSubscriptionId = z.infer<typeof WebhookSubscriptionId>;

export const XapiStatementId = ulidSchema('XapiStatementId').brand<'XapiStatementId'>();
export type XapiStatementId = z.infer<typeof XapiStatementId>;

export const Lti1p3PlatformKeyId = ulidSchema('Lti1p3PlatformKeyId').brand<'Lti1p3PlatformKeyId'>();
export type Lti1p3PlatformKeyId = z.infer<typeof Lti1p3PlatformKeyId>;

export const Lti1p3DeepLinkingSessionId = ulidSchema(
  'Lti1p3DeepLinkingSessionId',
).brand<'Lti1p3DeepLinkingSessionId'>();
export type Lti1p3DeepLinkingSessionId = z.infer<typeof Lti1p3DeepLinkingSessionId>;

export const CourseExternalToolId =
  ulidSchema('CourseExternalToolId').brand<'CourseExternalToolId'>();
export type CourseExternalToolId = z.infer<typeof CourseExternalToolId>;

export const CourseExternalToolOutcomeId = ulidSchema(
  'CourseExternalToolOutcomeId',
).brand<'CourseExternalToolOutcomeId'>();
export type CourseExternalToolOutcomeId = z.infer<typeof CourseExternalToolOutcomeId>;

export const SubmissionPlagiarismReportId = ulidSchema(
  'SubmissionPlagiarismReportId',
).brand<'SubmissionPlagiarismReportId'>();
export type SubmissionPlagiarismReportId = z.infer<typeof SubmissionPlagiarismReportId>;

export const UserPushTokenId = ulidSchema('UserPushTokenId').brand<'UserPushTokenId'>();
export type UserPushTokenId = z.infer<typeof UserPushTokenId>;

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

export const DiscussionPostGradeId =
  ulidSchema('DiscussionPostGradeId').brand<'DiscussionPostGradeId'>();
export type DiscussionPostGradeId = z.infer<typeof DiscussionPostGradeId>;

export const AssignmentPeerReviewResponseId = ulidSchema(
  'AssignmentPeerReviewResponseId',
).brand<'AssignmentPeerReviewResponseId'>();
export type AssignmentPeerReviewResponseId = z.infer<typeof AssignmentPeerReviewResponseId>;

export const ScormPackageId = ulidSchema('ScormPackageId').brand<'ScormPackageId'>();
export type ScormPackageId = z.infer<typeof ScormPackageId>;

export const ScormExtractedContentId =
  ulidSchema('ScormExtractedContentId').brand<'ScormExtractedContentId'>();
export type ScormExtractedContentId = z.infer<typeof ScormExtractedContentId>;

export const ScormAttemptId = ulidSchema('ScormAttemptId').brand<'ScormAttemptId'>();
export type ScormAttemptId = z.infer<typeof ScormAttemptId>;

export const CourseResourceViewEventId = ulidSchema(
  'CourseResourceViewEventId',
).brand<'CourseResourceViewEventId'>();
export type CourseResourceViewEventId = z.infer<typeof CourseResourceViewEventId>;

export const isTenantId = (value: unknown): value is TenantId =>
  typeof value === 'string' && ulidRegex.test(value);

export const isUserId = (value: unknown): value is UserId =>
  typeof value === 'string' && ulidRegex.test(value);
