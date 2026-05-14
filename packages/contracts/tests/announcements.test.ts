import { describe, expect, it } from 'vitest';
import { CourseAnnouncement } from '../src/index.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const announcementId = '01J9QW7B6N5W2YH3D3A1V0KE5J';
const authorId = '01J9QW7B6N5W2YH3D3A1V0KE2W';

describe('course announcement contracts', () => {
  it('validates course announcements', () => {
    expect(
      CourseAnnouncement.parse({
        id: announcementId,
        tenantId,
        courseId,
        authorId,
        title: 'Bring annotated drafts',
        body: 'Please bring annotated drafts to the next seminar.',
        status: 'published',
        pinned: true,
        postedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({ id: announcementId, status: 'published', pinned: true });
  });
});
