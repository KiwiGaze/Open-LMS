import { CoursePage, CourseResource, ScormExtractedContent } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  buildCoursePageIndexingEvent,
  buildCourseResourceIndexingEvent,
  buildScormExtractedContentIndexingEvent,
} from '../src/content/indexing-events.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2W';

describe('content indexing events', () => {
  it('builds reference-only course page indexing events for AI consumers', () => {
    const page = CoursePage.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      tenantId,
      courseId,
      title: 'Evidence overview',
      body: 'Full content should not be copied into the event payload.',
      visibility: 'published',
      version: 3,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    });

    const event = buildCoursePageIndexingEvent(page, now);

    expect(event.topic).toBe('course.content');
    expect(event.eventType).toBe('course.content.indexing_requested');
    expect(event.schemaVersion).toBe('1');
    expect(event.payload).toEqual({
      action: 'upsert',
      courseId,
      sourceType: 'course_page',
      sourceId: page.id,
      sourceVersion: '3',
      title: page.title,
      visibility: 'student_visible',
      accessPolicy: 'course_member',
      learningObjectiveIds: [learningObjectiveId],
      updatedAt: now.toISOString(),
    });
    expect(JSON.stringify(event.payload)).not.toContain(page.body);
  });

  it('builds resource indexing events with source type and access metadata', () => {
    const resource = CourseResource.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      tenantId,
      courseId,
      moduleId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      unitId: null,
      resourceType: 'teacher_example',
      title: 'Annotated example',
      body: 'Teacher-only content should not be copied into the event payload.',
      sourceUri: null,
      visibility: 'published',
      accessPolicy: 'course_staff',
      version: 2,
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    });

    const event = buildCourseResourceIndexingEvent(resource, now);

    expect(event.payload).toEqual(
      expect.objectContaining({
        sourceType: 'teacher_example',
        sourceId: resource.id,
        sourceVersion: '2',
        visibility: 'teacher_only',
        accessPolicy: 'course_staff',
        moduleId: resource.moduleId,
        unitId: null,
      }),
    );
    expect(JSON.stringify(event.payload)).not.toContain(resource.body);
  });

  it('builds SCORM extracted-content indexing events without copying extracted text', () => {
    const content = ScormExtractedContent.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE80',
      tenantId,
      courseId,
      scormPackageId: '01J9QW7B6N5W2YH3D3A1V0KE81',
      sourceKey: 'sco:introduction',
      title: 'Introduction SCO',
      body: 'Extracted SCORM text should be fetched by the indexer.',
      language: 'en-US',
      learningObjectiveIds: [learningObjectiveId],
      sourceVersion: 'manifest-sha256:abc123',
      createdAt: now,
      updatedAt: now,
    });

    const event = buildScormExtractedContentIndexingEvent(content, 'published', now);

    expect(event.payload).toEqual({
      action: 'upsert',
      courseId,
      sourceType: 'scorm_package',
      sourceId: content.id,
      sourceVersion: content.sourceVersion,
      title: content.title,
      visibility: 'student_visible',
      accessPolicy: 'course_member',
      learningObjectiveIds: [learningObjectiveId],
      scormPackageId: content.scormPackageId,
      sourceKey: content.sourceKey,
      updatedAt: now.toISOString(),
    });
    expect(JSON.stringify(event.payload)).not.toContain(content.body);
  });
});
