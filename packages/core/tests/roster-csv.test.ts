import { CourseMembership } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { parseRosterCsv, serializeCourseRosterCsv } from '../src/memberships/roster-csv.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

describe('course roster CSV', () => {
  it('parses roster import rows with role and lifecycle status', () => {
    expect(
      parseRosterCsv('user_id,role,status\n01J9QW7B6N5W2YH3D3A1V0KE2T,student,active\n'),
    ).toEqual([
      {
        rowNumber: 2,
        userId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        role: 'student',
        status: 'active',
      },
    ]);
  });

  it('serializes course memberships with stable headers', () => {
    expect(
      serializeCourseRosterCsv([
        CourseMembership.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE2V',
          tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
          courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
          userId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
          role: 'student',
          status: 'waitlisted',
          invitedAt: null,
          acceptedAt: null,
          droppedAt: null,
          withdrawnAt: null,
          createdAt: now,
          updatedAt: now,
        }),
      ]),
    ).toBe(
      [
        'membership_id,user_id,role,status,invited_at,accepted_at,dropped_at,withdrawn_at,created_at,updated_at',
        '01J9QW7B6N5W2YH3D3A1V0KE2V,01J9QW7B6N5W2YH3D3A1V0KE2Y,student,waitlisted,,,,,2026-05-10T00:00:00.000Z,2026-05-10T00:00:00.000Z',
      ].join('\n'),
    );
  });
});
