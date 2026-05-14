import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  listResourceViewsForResource,
  listResourceViewsForViewer,
  recordResourceView,
} from '../src/resource-views/repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE80';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE81';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE82';
const viewerId = '01J9QW7B6N5W2YH3D3A1V0KE83';
const eventId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const now = new Date('2026-05-12T10:00:00Z');

const eventRow = {
  id: eventId,
  tenantId,
  courseId,
  resourceId,
  viewerId,
  viewedAt: now,
  createdAt: now,
};

const createInsertReturningDb = <T>(stored: T): Database =>
  ({
    insert: () => ({
      values: () => ({
        returning: async () => [stored],
      }),
    }),
  }) as unknown as Database;

const createSelectOrderByDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

describe('resource view event repository', () => {
  it('records a resource view event', async () => {
    const db = createInsertReturningDb(eventRow);
    const result = await recordResourceView(db, {
      tenantId,
      courseId,
      resourceId,
      viewerId,
      viewedAt: now,
    });
    expect(result.viewedAt.getTime()).toBe(now.getTime());
  });

  it('lists views for a resource', async () => {
    const db = createSelectOrderByDb([eventRow]);
    const result = await listResourceViewsForResource(db, { tenantId, resourceId });
    expect(result).toHaveLength(1);
  });

  it('lists views for a viewer scoped to a course', async () => {
    const db = createSelectOrderByDb([eventRow]);
    const result = await listResourceViewsForViewer(db, { tenantId, courseId, viewerId });
    expect(result).toHaveLength(1);
    expect(result[0]?.viewerId).toBe(viewerId);
  });
});
