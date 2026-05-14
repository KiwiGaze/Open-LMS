import { describe, expect, it } from 'vitest';
import { FileMetadata, FileResource } from '../src/index.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

describe('file contracts', () => {
  it('models course file library metadata without exposing storage internals', () => {
    const resource = FileResource.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
      ownerId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      storageProvider: 'local_fs',
      storageKey: 'tenant/course/file.pdf',
      filename: 'syllabus.pdf',
      mediaType: 'application/pdf',
      byteSize: 42000,
      checksumSha256: 'a'.repeat(64),
      visibility: 'course_member',
      altText: 'Course syllabus cover page',
      transcriptText: null,
      license: 'CC BY 4.0',
      copyrightHolder: 'Open LMS',
      createdAt: now,
    });

    const metadata = FileMetadata.parse({
      id: resource.id,
      tenantId: resource.tenantId,
      courseId: resource.courseId,
      ownerId: resource.ownerId,
      filename: resource.filename,
      mediaType: resource.mediaType,
      byteSize: resource.byteSize,
      checksumSha256: resource.checksumSha256,
      visibility: resource.visibility,
      altText: resource.altText,
      transcriptText: resource.transcriptText,
      license: resource.license,
      copyrightHolder: resource.copyrightHolder,
      createdAt: resource.createdAt,
    });

    expect(metadata.courseId).toBe(resource.courseId);
    expect(metadata.visibility).toBe('course_member');
    expect(metadata.altText).toBe('Course syllabus cover page');
    expect(metadata).not.toHaveProperty('storageProvider');
    expect(metadata).not.toHaveProperty('storageKey');
  });
});
