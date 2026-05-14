import { describe, expect, it } from 'vitest';
import { AttendanceRecord, AttendanceSession } from '../src/attendance.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const sessionId = '01J9QW7B6N5W2YH3D3A1V0KE4C';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';

describe('attendance contracts', () => {
  it('accepts course attendance sessions', () => {
    expect(
      AttendanceSession.parse({
        id: sessionId,
        tenantId,
        courseId,
        title: 'Week 1 seminar',
        startsAt: now,
        endsAt: new Date('2026-05-10T01:00:00.000Z'),
        status: 'scheduled',
        createdAt: now,
        updatedAt: now,
      }),
    ).toEqual({
      id: sessionId,
      tenantId,
      courseId,
      title: 'Week 1 seminar',
      startsAt: now,
      endsAt: new Date('2026-05-10T01:00:00.000Z'),
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('accepts per-student attendance records', () => {
    expect(
      AttendanceRecord.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE4D',
        tenantId,
        sessionId,
        studentId,
        status: 'present',
        note: null,
        recordedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      sessionId,
      studentId,
      status: 'present',
      note: null,
    });
  });
});
