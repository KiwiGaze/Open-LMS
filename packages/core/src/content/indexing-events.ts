import type {
  CoursePage,
  CourseResource,
  CourseResourceType,
  RagAccessPolicy,
  RagSourceType,
  RagVisibility,
  ScormExtractedContent,
  ScormPackage,
} from '@openlms/contracts';
import { buildOutboxEvent } from '../events/audit-outbox.ts';

const topic = 'course.content';
const eventType = 'course.content.indexing_requested';

const pageVisibilityToRagVisibility = (visibility: CoursePage['visibility']): RagVisibility =>
  visibility === 'published' ? 'student_visible' : 'teacher_only';

const resourceVisibilityToRagVisibility = (resource: CourseResource): RagVisibility => {
  if (resource.accessPolicy === 'course_staff') {
    return 'teacher_only';
  }

  return resource.visibility === 'published' ? 'student_visible' : 'teacher_only';
};

const resourceTypeToRagSourceType = (resourceType: CourseResourceType): RagSourceType => {
  if (resourceType === 'external_link' || resourceType === 'file') {
    return 'reading_material';
  }

  return resourceType;
};

export const buildCoursePageIndexingEvent = (page: CoursePage, now = new Date()) =>
  buildOutboxEvent(
    {
      tenantId: page.tenantId,
      topic,
      eventType,
      payload: {
        action: page.visibility === 'archived' ? 'delete' : 'upsert',
        courseId: page.courseId,
        sourceType: 'course_page' satisfies RagSourceType,
        sourceId: page.id,
        sourceVersion: String(page.version),
        title: page.title,
        visibility: pageVisibilityToRagVisibility(page.visibility),
        accessPolicy: 'course_member' satisfies RagAccessPolicy,
        learningObjectiveIds: page.learningObjectiveIds,
        updatedAt: page.updatedAt.toISOString(),
      },
    },
    now,
  );

export const buildCourseResourceIndexingEvent = (resource: CourseResource, now = new Date()) =>
  buildOutboxEvent(
    {
      tenantId: resource.tenantId,
      topic,
      eventType,
      payload: {
        action: resource.visibility === 'archived' ? 'delete' : 'upsert',
        courseId: resource.courseId,
        moduleId: resource.moduleId,
        unitId: resource.unitId,
        sourceType: resourceTypeToRagSourceType(resource.resourceType),
        sourceId: resource.id,
        sourceVersion: String(resource.version),
        title: resource.title,
        visibility: resourceVisibilityToRagVisibility(resource),
        accessPolicy: resource.accessPolicy,
        learningObjectiveIds: resource.learningObjectiveIds,
        updatedAt: resource.updatedAt.toISOString(),
      },
    },
    now,
  );

export const buildScormExtractedContentIndexingEvent = (
  content: ScormExtractedContent,
  packageStatus: ScormPackage['status'],
  now = new Date(),
) =>
  buildOutboxEvent(
    {
      tenantId: content.tenantId,
      topic,
      eventType,
      payload: {
        action: packageStatus === 'archived' ? 'delete' : 'upsert',
        courseId: content.courseId,
        sourceType: 'scorm_package' satisfies RagSourceType,
        sourceId: content.id,
        sourceVersion: content.sourceVersion,
        title: content.title,
        visibility:
          packageStatus === 'published'
            ? ('student_visible' satisfies RagVisibility)
            : ('teacher_only' satisfies RagVisibility),
        accessPolicy: 'course_member' satisfies RagAccessPolicy,
        learningObjectiveIds: content.learningObjectiveIds,
        scormPackageId: content.scormPackageId,
        sourceKey: content.sourceKey,
        updatedAt: content.updatedAt.toISOString(),
      },
    },
    now,
  );
