import {
  CourseExternalTool,
  ExportJobRecord,
  IntegrationConnection,
  Lti1p3PlatformKey,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  getExportJobById,
  listExportJobsForTenant,
  saveExportJob,
} from '../src/exports/repository.ts';
import {
  getActiveLti1p3PlatformSigningKey,
  getIntegrationConnectionById,
  listActiveLti1p3PlatformKeys,
  listCourseExternalToolsForCourse,
  listIntegrationConnections,
  saveIntegrationConnection,
  saveLti1p3PlatformKey,
} from '../src/integrations/repository.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2S';
const requestedById = '01J9QW7B6N5W2YH3D3A1V0KE2V';

const exportJob = ExportJobRecord.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  tenantId,
  requestedById,
  exportType: 'feedback_and_grades',
  format: 'csv',
  status: 'succeeded',
  filters: {
    courseId: null,
    assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
    studentId: null,
    submittedFrom: null,
    submittedTo: null,
  },
  storageFileId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  errorMessage: null,
  createdAt: now,
  updatedAt: now,
});

const connection = IntegrationConnection.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
  tenantId,
  providerType: 'sis_csv',
  displayName: 'Registrar CSV export',
  status: 'enabled',
  config: {
    delimiter: ',',
    includeFeedbackComments: true,
  },
  createdAt: now,
  updatedAt: now,
});

const externalTool = CourseExternalTool.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE30',
  tenantId,
  courseId,
  integrationConnectionId: connection.id,
  name: 'Lab simulator',
  description: 'Launch the virtual science lab.',
  launchUrl: 'https://tools.example.edu/lti/launch/lab-simulator',
  placement: 'module_item',
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const ltiPlatformKey = Lti1p3PlatformKey.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE33',
  tenantId,
  keyId: 'platform-key-1',
  status: 'active',
  publicJwk: {
    kty: 'RSA',
    kid: 'platform-key-1',
    use: 'sig',
    alg: 'RS256',
    n: 'sXch3n91Z0-SKpR6aSpsNQ',
    e: 'AQAB',
  },
  encryptedPrivateJwk:
    '{"ciphertextBase64":"encrypted","ivBase64":"AAAAAAAAAAAAAAAA","authTagBase64":"AAAAAAAAAAAAAAAAAAAAAA=="}',
  createdAt: now,
  updatedAt: now,
});

const createInsertOnlyDb = <T>(rows: T[]): Database =>
  ({
    insert: () => ({
      values: (value: T) => ({
        onConflictDoUpdate: () => ({
          returning: async () => {
            rows.push(value);
            return [value];
          },
        }),
        returning: async () => {
          rows.push(value);
          return [value];
        },
      }),
    }),
  }) as unknown as Database;

const createSelectOnlyDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createCourseExternalToolListDb = (
  rows: CourseExternalTool[],
  statuses: CourseExternalTool['status'][] = ['active'],
  connections: IntegrationConnection[] = [connection],
): Database =>
  ({
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            orderBy: async () =>
              rows
                .filter((row) => row.tenantId === tenantId)
                .filter((row) => row.courseId === courseId)
                .filter((row) => statuses.includes(row.status))
                .filter((row) =>
                  connections.some(
                    (record) =>
                      record.tenantId === row.tenantId &&
                      record.id === row.integrationConnectionId &&
                      record.status === 'enabled',
                  ),
                )
                .sort(
                  (left, right) =>
                    left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
                ),
          }),
        }),
      }),
    }),
  }) as unknown as Database;

const createLtiPlatformKeyListDb = (rows: Lti1p3PlatformKey[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.status === 'active')
              .sort(
                (left, right) =>
                  left.createdAt.getTime() - right.createdAt.getTime() ||
                  left.keyId.localeCompare(right.keyId),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const createLtiPlatformSigningKeyDb = (rows: Lti1p3PlatformKey[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async () =>
              rows
                .filter((row) => row.tenantId === tenantId)
                .filter((row) => row.status === 'active')
                .sort(
                  (left, right) =>
                    right.createdAt.getTime() - left.createdAt.getTime() ||
                    right.keyId.localeCompare(left.keyId),
                )
                .slice(0, 1),
          }),
        }),
      }),
    }),
  }) as unknown as Database;

const createWhereOrderCaptureDb = (capture: { condition: unknown }): Database =>
  ({
    select: () => ({
      from: () => ({
        innerJoin: (_joinedTable: unknown, joinCondition: unknown) => {
          capture.condition = [capture.condition, joinCondition];
          return {
            where: (condition: unknown) => {
              capture.condition = [capture.condition, condition];
              return {
                orderBy: async () => [],
              };
            },
          };
        },
      }),
    }),
  }) as unknown as Database;

const getObjectProperty = (value: unknown, propertyName: string): unknown => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return (value as Record<PropertyKey, unknown>)[propertyName];
};

const collectSqlChunkColumnNames = (value: unknown, seen = new WeakSet<object>()): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSqlChunkColumnNames(item, seen));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  const queryChunks = getObjectProperty(value, 'queryChunks');
  if (Array.isArray(queryChunks)) {
    return queryChunks.flatMap((chunk) => collectSqlChunkColumnNames(chunk, seen));
  }

  const ownName = getObjectProperty(value, 'name');
  return typeof ownName === 'string' ? [ownName] : [];
};

const collectSqlChunkParamValues = (value: unknown, seen = new WeakSet<object>()): unknown[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSqlChunkParamValues(item, seen));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  const queryChunks = getObjectProperty(value, 'queryChunks');
  if (Array.isArray(queryChunks)) {
    return queryChunks.flatMap((chunk) => collectSqlChunkParamValues(chunk, seen));
  }

  if (!Object.prototype.hasOwnProperty.call(value, 'value')) {
    return [];
  }

  const ownValue = getObjectProperty(value, 'value');
  return Array.isArray(ownValue) ? ownValue : [ownValue];
};

describe('export and integration repositories', () => {
  it('stores export jobs and finds them by tenant-scoped id', async () => {
    const rows: ExportJobRecord[] = [];
    const saved = await saveExportJob(createInsertOnlyDb(rows), exportJob);
    const found = await getExportJobById(createSelectOnlyDb([exportJob]), tenantId, exportJob.id);

    expect(saved).toEqual(exportJob);
    expect(found).toEqual(exportJob);
  });

  it('lists export jobs for a tenant', async () => {
    const jobs = await listExportJobsForTenant(createSelectOnlyDb([exportJob]), tenantId);

    expect(jobs).toEqual([exportJob]);
  });

  it('stores integration connections and lists tenant connections', async () => {
    const rows: IntegrationConnection[] = [];
    const saved = await saveIntegrationConnection(createInsertOnlyDb(rows), connection);
    const found = await getIntegrationConnectionById(
      createSelectOnlyDb([connection]),
      tenantId,
      connection.id,
    );
    const connections = await listIntegrationConnections(
      createSelectOnlyDb([connection]),
      tenantId,
    );

    expect(saved).toEqual(connection);
    expect(found).toEqual(connection);
    expect(connections).toEqual([connection]);
  });

  it('stores LTI platform keys and lists active tenant keys only', async () => {
    const rows: Lti1p3PlatformKey[] = [];
    const retired = Lti1p3PlatformKey.parse({
      ...ltiPlatformKey,
      id: '01J9QW7B6N5W2YH3D3A1V0KE34',
      keyId: 'platform-key-2',
      status: 'retired',
      publicJwk: { ...ltiPlatformKey.publicJwk, kid: 'platform-key-2' },
    });
    const otherTenant = Lti1p3PlatformKey.parse({
      ...ltiPlatformKey,
      id: '01J9QW7B6N5W2YH3D3A1V0KE35',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE36',
      keyId: 'platform-key-3',
      publicJwk: { ...ltiPlatformKey.publicJwk, kid: 'platform-key-3' },
    });
    const saved = await saveLti1p3PlatformKey(createInsertOnlyDb(rows), ltiPlatformKey);

    const keys = await listActiveLti1p3PlatformKeys(
      createLtiPlatformKeyListDb([saved, retired, otherTenant]),
      tenantId,
    );

    expect(keys).toEqual([ltiPlatformKey]);
  });

  it('returns the newest active LTI platform signing key for a tenant', async () => {
    const newerKey = Lti1p3PlatformKey.parse({
      ...ltiPlatformKey,
      id: '01J9QW7B6N5W2YH3D3A1V0KE37',
      keyId: 'platform-key-4',
      publicJwk: { ...ltiPlatformKey.publicJwk, kid: 'platform-key-4' },
      createdAt: new Date('2026-05-11T00:00:00.000Z'),
      updatedAt: new Date('2026-05-11T00:00:00.000Z'),
    });
    const retired = Lti1p3PlatformKey.parse({
      ...newerKey,
      id: '01J9QW7B6N5W2YH3D3A1V0KE38',
      keyId: 'platform-key-5',
      status: 'retired',
      publicJwk: { ...newerKey.publicJwk, kid: 'platform-key-5' },
      createdAt: new Date('2026-05-12T00:00:00.000Z'),
      updatedAt: new Date('2026-05-12T00:00:00.000Z'),
    });

    await expect(
      getActiveLti1p3PlatformSigningKey(
        createLtiPlatformSigningKeyDb([ltiPlatformKey, newerKey, retired]),
        tenantId,
      ),
    ).resolves.toEqual(newerKey);
  });

  it('lists active course external tool placements by name', async () => {
    const archivedTool = CourseExternalTool.parse({
      ...externalTool,
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      name: 'Archived analytics',
      status: 'archived',
    });
    const earlierTool = CourseExternalTool.parse({
      ...externalTool,
      id: '01J9QW7B6N5W2YH3D3A1V0KE32',
      name: 'Aardvark practice',
      launchUrl: 'https://tools.example.edu/lti/launch/practice',
    });

    await expect(
      listCourseExternalToolsForCourse(
        createCourseExternalToolListDb([externalTool, archivedTool, earlierTool]),
        { tenantId, courseId, statuses: ['active'] },
      ),
    ).resolves.toEqual([earlierTool, externalTool]);
  });

  it('can include archived course external tools for staff views', async () => {
    const archivedTool = CourseExternalTool.parse({
      ...externalTool,
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      name: 'Archived analytics',
      status: 'archived',
    });

    await expect(
      listCourseExternalToolsForCourse(
        createCourseExternalToolListDb([externalTool, archivedTool], ['active', 'archived']),
        { tenantId, courseId, statuses: ['active', 'archived'] },
      ),
    ).resolves.toEqual([archivedTool, externalTool]);
  });

  it('does not list active course external tools backed by disabled connections', async () => {
    const disabledConnection = IntegrationConnection.parse({
      ...connection,
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      status: 'disabled',
    });
    const disabledTool = CourseExternalTool.parse({
      ...externalTool,
      id: '01J9QW7B6N5W2YH3D3A1V0KE34',
      integrationConnectionId: disabledConnection.id,
      name: 'Disabled lab simulator',
    });

    await expect(
      listCourseExternalToolsForCourse(
        createCourseExternalToolListDb(
          [externalTool, disabledTool],
          ['active'],
          [connection, disabledConnection],
        ),
        { tenantId, courseId, statuses: ['active'] },
      ),
    ).resolves.toEqual([externalTool]);
  });

  it('builds tenant, course, and status scoped course external tool queries from input', async () => {
    const capture = { condition: null as unknown };

    await listCourseExternalToolsForCourse(createWhereOrderCaptureDb(capture), {
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE34',
      statuses: ['active', 'archived'],
    });

    const names = collectSqlChunkColumnNames(capture.condition);
    const values = collectSqlChunkParamValues(capture.condition);
    expect(names).toContain('tenant_id');
    expect(names).toContain('course_id');
    expect(names).toContain('integration_connection_id');
    expect(names).toContain('status');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE33');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE34');
    expect(values).toContain('active');
    expect(values).toContain('enabled');
  });
});
