import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listCalendarItemsForUser: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listCalendarItemsForUser: coreMocks.listCalendarItemsForUser,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KED0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KED1';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KED2';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KED3';
const from = new Date('2026-05-10T00:00:00.000Z');
const to = new Date('2026-05-31T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setTenantRole = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role ? [{ tenantId, role }] : []);
};

describe('calendar ICS export API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listCalendarItemsForUser.mockResolvedValue([
      {
        id: `calendar:assignment:${assignmentId}`,
        tenantId,
        courseId,
        courseCode: 'WRIT-101',
        courseTitle: 'Writing 101',
        itemType: 'assignment_due',
        title: 'Essay 1',
        startsAt: new Date('2026-05-15T23:59:00.000Z'),
        endsAt: null,
        sourceType: 'assignment',
        sourceId: assignmentId,
      },
    ]);
    setTenantRole('student');
  });

  it('returns ICS body for tenant members', async () => {
    const dependencies = createDependencies();

    const ics = await dependencies.exportCalendarIcs(actorUserId, tenantId, from, to);

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('SUMMARY:WRIT-101 — Essay 1\r\n');
    expect(ics).toContain('DTSTART:20260515T235900Z\r\n');

    expect(coreMocks.listCalendarItemsForUser).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      userId: actorUserId,
      from,
      to,
    });
  });

  it('rejects non-tenant members', async () => {
    setTenantRole(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.exportCalendarIcs(actorUserId, tenantId, from, to),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.listCalendarItemsForUser).not.toHaveBeenCalled();
  });

  it('returns a header-only ICS feed when there are no items', async () => {
    coreMocks.listCalendarItemsForUser.mockResolvedValue([]);
    const dependencies = createDependencies();

    const ics = await dependencies.exportCalendarIcs(actorUserId, tenantId, from, to);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });
});
