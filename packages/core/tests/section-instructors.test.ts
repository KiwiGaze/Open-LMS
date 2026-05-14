import { CourseSectionInstructor } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  assignInstructorToSection,
  listSectionInstructorsForSection,
  removeInstructorFromSection,
} from '../src/section-members/repository.ts';

const now = new Date('2026-05-14T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const sectionId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const instructorId = '01J9QW7B6N5W2YH3D3A1V0KE2X';

const createInsertOnlyDb = <T>(rows: T[]): Database =>
  ({
    insert: () => ({
      values: (value: T) => ({
        returning: async () => {
          rows.push(value);
          return [value];
        },
      }),
    }),
  }) as unknown as Database;

const createListOnlyDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createDeleteCaptureDb = (capture: { deleted: boolean }): Database =>
  ({
    delete: () => ({
      where: async () => {
        capture.deleted = true;
      },
    }),
  }) as unknown as Database;

describe('section instructor repository', () => {
  it('assigns instructors to course sections', async () => {
    const rows: unknown[] = [];

    const assignment = await assignInstructorToSection(
      createInsertOnlyDb(rows),
      {
        tenantId,
        courseId,
        sectionId,
        instructorId,
      },
      now,
    );

    expect(assignment).toMatchObject({
      tenantId,
      courseId,
      sectionId,
      instructorId,
    });
    expect(rows).toHaveLength(1);
  });

  it('lists instructors for a section', async () => {
    const assignment = CourseSectionInstructor.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      tenantId,
      courseId,
      sectionId,
      instructorId,
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      listSectionInstructorsForSection(createListOnlyDb([assignment]), {
        tenantId,
        courseId,
        sectionId,
      }),
    ).resolves.toEqual([assignment]);
  });

  it('removes instructors from sections', async () => {
    const capture = { deleted: false };

    await removeInstructorFromSection(createDeleteCaptureDb(capture), {
      tenantId,
      courseId,
      sectionId,
      instructorId,
    });

    expect(capture.deleted).toBe(true);
  });
});
