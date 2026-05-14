import { z } from 'zod';
import {
  CourseId,
  CourseModuleId,
  CoursePageId,
  CourseResourceId,
  CourseSectionId,
  CourseSyllabusId,
  CourseUnitId,
  LearningObjectiveId,
  LearningObjectiveMasteryId,
  TenantId,
  UserId,
  WikiPageId,
} from './ids.ts';

export const CourseStatus = z.enum(['draft', 'active', 'archived', 'deleted']);
export type CourseStatus = z.infer<typeof CourseStatus>;

export const CatalogVisibility = z.enum(['private', 'listed']);
export type CatalogVisibility = z.infer<typeof CatalogVisibility>;

export const Course = z.object({
  id: CourseId,
  tenantId: TenantId,
  code: z.string().min(1).max(32),
  title: z.string().min(1).max(160),
  status: CourseStatus,
  startsAt: z.date().nullable(),
  endsAt: z.date().nullable(),
  catalogCategory: z.string().min(1).max(120).nullable().default(null),
  academicTerm: z.string().min(1).max(64).nullable().default(null),
  maxEnrollments: z.number().int().positive().nullable().default(null),
  waitlistEnabled: z.boolean().default(false),
  enrollmentApprovalRequired: z.boolean().default(false),
  isBlueprint: z.boolean().default(false),
  deletedAt: z.date().nullable().default(null),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Course = z.infer<typeof Course>;

export const CatalogCourse = z.object({
  id: CourseId,
  tenantId: TenantId,
  code: z.string().min(1).max(32),
  title: z.string().min(1).max(160),
  catalogCategory: z.string().min(1).max(120).nullable().default(null),
  academicTerm: z.string().min(1).max(64).nullable().default(null),
  startsAt: z.date().nullable(),
  endsAt: z.date().nullable(),
});
export type CatalogCourse = z.infer<typeof CatalogCourse>;

export const CourseCatalogSettings = z.object({
  courseId: CourseId,
  tenantId: TenantId,
  catalogVisibility: CatalogVisibility,
  enrollmentCode: z.string().min(4).max(64).nullable(),
  catalogCategory: z.string().min(1).max(120).nullable().default(null),
  academicTerm: z.string().min(1).max(64).nullable().default(null),
  maxEnrollments: z.number().int().positive().nullable().default(null),
  waitlistEnabled: z.boolean().default(false),
  enrollmentApprovalRequired: z.boolean().default(false),
  updatedAt: z.date(),
});
export type CourseCatalogSettings = z.infer<typeof CourseCatalogSettings>;

export const CourseSectionStatus = z.enum(['active', 'archived']);
export type CourseSectionStatus = z.infer<typeof CourseSectionStatus>;

export const CourseSectionMeetingDay = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);
export type CourseSectionMeetingDay = z.infer<typeof CourseSectionMeetingDay>;

const CourseSectionMeetingTime = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/);

const meetingTimeToMinutes = (time: string): number => {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);
};

export const CourseSection = z
  .object({
    id: CourseSectionId,
    tenantId: TenantId,
    courseId: CourseId,
    name: z.string().min(1).max(120),
    status: CourseSectionStatus,
    position: z.number().int().nonnegative(),
    meetingDays: z.array(CourseSectionMeetingDay).default([]),
    meetingStartTime: CourseSectionMeetingTime.nullable().default(null),
    meetingEndTime: CourseSectionMeetingTime.nullable().default(null),
    location: z.string().min(1).max(255).nullable().default(null),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((section, context) => {
    const hasMeetingDays = section.meetingDays.length > 0;
    const hasStart = section.meetingStartTime !== null;
    const hasEnd = section.meetingEndTime !== null;

    if (!(hasMeetingDays === hasStart && hasStart === hasEnd)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Section meeting days and time range must be supplied together.',
        path: ['meetingDays'],
      });
    }

    if (
      section.meetingStartTime !== null &&
      section.meetingEndTime !== null &&
      meetingTimeToMinutes(section.meetingEndTime) <= meetingTimeToMinutes(section.meetingStartTime)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Section meeting end time must be after the start time.',
        path: ['meetingEndTime'],
      });
    }
  });
export type CourseSection = z.infer<typeof CourseSection>;

export const CourseSyllabusVisibility = z.enum(['draft', 'published', 'archived']);
export type CourseSyllabusVisibility = z.infer<typeof CourseSyllabusVisibility>;

export const CourseSyllabus = z.object({
  id: CourseSyllabusId,
  tenantId: TenantId,
  courseId: CourseId,
  body: z.string().min(1),
  visibility: CourseSyllabusVisibility,
  version: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CourseSyllabus = z.infer<typeof CourseSyllabus>;

export const CourseContentVisibility = z.enum(['draft', 'published', 'scheduled', 'archived']);
export type CourseContentVisibility = z.infer<typeof CourseContentVisibility>;

export const CourseContentAccessPolicy = z.enum(['public', 'course_member', 'course_staff']);
export type CourseContentAccessPolicy = z.infer<typeof CourseContentAccessPolicy>;

export const CourseModule = z.object({
  id: CourseModuleId,
  tenantId: TenantId,
  courseId: CourseId,
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(2_000).nullable(),
  visibility: CourseContentVisibility,
  accessPolicy: CourseContentAccessPolicy,
  version: z.number().int().positive(),
  position: z.number().int().nonnegative(),
  learningObjectiveIds: z.array(LearningObjectiveId),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CourseModule = z.infer<typeof CourseModule>;

export const CourseUnit = z.object({
  id: CourseUnitId,
  tenantId: TenantId,
  courseId: CourseId,
  moduleId: CourseModuleId,
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(2_000).nullable(),
  visibility: CourseContentVisibility,
  accessPolicy: CourseContentAccessPolicy,
  version: z.number().int().positive(),
  position: z.number().int().nonnegative(),
  learningObjectiveIds: z.array(LearningObjectiveId),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CourseUnit = z.infer<typeof CourseUnit>;

export const LearningObjectiveStatus = z.enum(['draft', 'active', 'archived']);
export type LearningObjectiveStatus = z.infer<typeof LearningObjectiveStatus>;

export const LearningObjective = z.object({
  id: LearningObjectiveId,
  tenantId: TenantId,
  courseId: CourseId,
  code: z.string().min(1).max(48),
  title: z.string().min(1).max(180),
  description: z.string().min(1).max(2_000).nullable(),
  status: LearningObjectiveStatus,
  position: z.number().int().nonnegative(),
  masteryThresholdPercent: z.number().min(0).max(100).nullable().default(null),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type LearningObjective = z.infer<typeof LearningObjective>;

export const LearningObjectiveCoverage = z
  .object({
    learningObjectiveId: LearningObjectiveId,
    moduleIds: z.array(CourseModuleId),
    unitIds: z.array(CourseUnitId),
    pageIds: z.array(CoursePageId),
    wikiPageIds: z.array(WikiPageId).default([]),
  })
  .strict();
export type LearningObjectiveCoverage = z.infer<typeof LearningObjectiveCoverage>;

export const LearningObjectiveMasteryStatus = z.enum([
  'not_assessed',
  'developing',
  'proficient',
  'mastered',
]);
export type LearningObjectiveMasteryStatus = z.infer<typeof LearningObjectiveMasteryStatus>;

export const LearningObjectiveMastery = z
  .object({
    id: LearningObjectiveMasteryId,
    tenantId: TenantId,
    courseId: CourseId,
    learningObjectiveId: LearningObjectiveId,
    studentId: UserId,
    status: LearningObjectiveMasteryStatus,
    score: z.number().finite().nonnegative().nullable(),
    maxScore: z.number().finite().positive().nullable(),
    lastAssessedAt: z.date().nullable(),
    evidenceCount: z.number().int().nonnegative(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((mastery, context) => {
    const hasScore = mastery.score !== null;
    const hasMaxScore = mastery.maxScore !== null;

    if (hasScore !== hasMaxScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Learning objective mastery score and max score must both be set or both be null.',
        path: hasScore ? ['maxScore'] : ['score'],
      });
      return;
    }

    if (mastery.score !== null && mastery.maxScore !== null && mastery.score > mastery.maxScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Learning objective mastery score cannot exceed max score.',
        path: ['score'],
      });
    }
  });
export type LearningObjectiveMastery = z.infer<typeof LearningObjectiveMastery>;

export const CoursePageVisibility = z.enum(['draft', 'published', 'archived']);
export type CoursePageVisibility = z.infer<typeof CoursePageVisibility>;

export const CourseResourceType = z.enum([
  'syllabus',
  'reading_material',
  'video_transcript',
  'teacher_example',
  'faq',
  'announcement',
  'external_link',
  'file',
]);
export type CourseResourceType = z.infer<typeof CourseResourceType>;

export const CourseResource = z
  .object({
    id: CourseResourceId,
    tenantId: TenantId,
    courseId: CourseId,
    moduleId: CourseModuleId.nullable(),
    unitId: CourseUnitId.nullable(),
    resourceType: CourseResourceType,
    title: z.string().min(1).max(180),
    body: z.string().min(1),
    sourceUri: z.string().min(1).nullable(),
    visibility: CourseContentVisibility,
    accessPolicy: CourseContentAccessPolicy,
    version: z.number().int().positive(),
    position: z.number().int().nonnegative(),
    learningObjectiveIds: z.array(LearningObjectiveId),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((resource, context) => {
    if (resource.unitId !== null && resource.moduleId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unit resources must include their parent module.',
        path: ['moduleId'],
      });
    }
  });
export type CourseResource = z.infer<typeof CourseResource>;

export const CoursePage = z.object({
  id: CoursePageId,
  tenantId: TenantId,
  courseId: CourseId,
  title: z.string().min(1).max(180),
  body: z.string().min(1),
  visibility: CoursePageVisibility,
  version: z.number().int().positive(),
  learningObjectiveIds: z.array(LearningObjectiveId),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CoursePage = z.infer<typeof CoursePage>;

export const CourseBackupFormatVersion = z.literal('1');
export type CourseBackupFormatVersion = z.infer<typeof CourseBackupFormatVersion>;

export const CourseBackup = z
  .object({
    formatVersion: CourseBackupFormatVersion,
    exportedAt: z.date(),
    course: Course,
    learningObjectives: z.array(LearningObjective),
    modules: z.array(CourseModule),
    units: z.array(CourseUnit),
    pages: z.array(CoursePage),
    resources: z.array(CourseResource),
  })
  .strict();
export type CourseBackup = z.infer<typeof CourseBackup>;

export const CourseAnalyticsSummary = z
  .object({
    enrolledStudents: z.number().int().nonnegative(),
    publishedAssignments: z.number().int().nonnegative(),
    publishedQuizzes: z.number().int().nonnegative(),
    publishedCalendarEvents: z.number().int().nonnegative(),
    publishedDiscussionTopics: z.number().int().nonnegative(),
    totalSubmissions: z.number().int().nonnegative(),
  })
  .strict();
export type CourseAnalyticsSummary = z.infer<typeof CourseAnalyticsSummary>;
