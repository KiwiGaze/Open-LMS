import { FileResource } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  LocalFileStorageProvider,
  deleteFileResourceForOwner,
  getFileResourceById,
  getFileResourceForOwner,
  getFileStorageUsage,
  listFileResourcesForCourse,
  listFileResourcesForOwner,
  saveFileResource,
} from '../src/files/repository.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const ownerId = '01J9QW7B6N5W2YH3D3A1V0KE2V';

const file = FileResource.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  tenantId,
  ownerId,
  courseId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  storageProvider: 's3_compatible',
  storageKey: 'tenant/course/submission/file.pdf',
  filename: 'evidence.pdf',
  mediaType: 'application/pdf',
  byteSize: 42000,
  checksumSha256: 'a'.repeat(64),
  visibility: 'course_member',
  altText: 'Evidence PDF',
  transcriptText: null,
  license: null,
  copyrightHolder: null,
  createdAt: now,
});

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

const createSelectOnlyDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          // biome-ignore lint/suspicious/noThenProperty: mocks Drizzle's thenable query builder for `await db.select()...` calls in repository tests.
          then: (resolve: (value: T[]) => unknown) => Promise.resolve(rows).then(resolve),
          limit: async () => rows,
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createSelectConditionCaptureDb = <T>(rows: T[], capture: { condition: unknown }): Database =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => {
          capture.condition = condition;
          return {
            limit: async () => rows,
          };
        },
      }),
    }),
  }) as unknown as Database;

const createDeleteOnlyDb = <T>(rows: T[]): Database =>
  ({
    delete: () => ({
      where: () => ({
        returning: async () => rows,
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

describe('file metadata repository', () => {
  it('stores file metadata without storing file bytes', async () => {
    const rows: FileResource[] = [];
    const saved = await saveFileResource(createInsertOnlyDb(rows), file);

    expect(saved).toEqual(file);
    expect(rows[0]).not.toHaveProperty('bytes');
  });

  it('reads file metadata by tenant-scoped file id', async () => {
    const found = await getFileResourceById(createSelectOnlyDb([file]), tenantId, file.id);

    expect(found).toEqual(file);
  });

  it('lists file metadata for a tenant-scoped owner', async () => {
    const files = await listFileResourcesForOwner(createSelectOnlyDb([file]), tenantId, ownerId);

    expect(files).toEqual([file]);
  });

  it('lists file metadata for a tenant-scoped course library', async () => {
    const files = await listFileResourcesForCourse(
      createSelectOnlyDb([file]),
      tenantId,
      file.courseId ?? '',
    );

    expect(files).toEqual([file]);
  });

  it('sums tenant and owner file storage usage', async () => {
    const usage = await getFileStorageUsage(createSelectOnlyDb([{ totalBytes: 4096 }]), {
      tenantId,
      ownerId,
    });

    expect(usage).toEqual({ totalBytes: 4096 });
  });

  it('reads file metadata only for the authenticated owner', async () => {
    const capture = { condition: null as unknown };

    const found = await getFileResourceForOwner(createSelectConditionCaptureDb([file], capture), {
      tenantId,
      ownerId,
      fileResourceId: file.id,
    });

    expect(found).toEqual(file);
    expect(collectSqlChunkColumnNames(capture.condition)).toEqual(
      expect.arrayContaining(['tenant_id', 'owner_id', 'id']),
    );
  });

  it('deletes file metadata only for the authenticated owner', async () => {
    await expect(
      deleteFileResourceForOwner(createDeleteOnlyDb([{ id: file.id }]), {
        tenantId,
        ownerId,
        fileResourceId: file.id,
      }),
    ).resolves.toBe(true);
    await expect(
      deleteFileResourceForOwner(createDeleteOnlyDb([]), {
        tenantId,
        ownerId,
        fileResourceId: file.id,
      }),
    ).resolves.toBe(false);
  });

  it('stores, reads, and deletes file bytes through the local storage provider contract', async () => {
    const provider = new LocalFileStorageProvider('/tmp/openlms-file-storage-test');
    const stored = await provider.upload({
      tenantId,
      fileResourceId: file.id,
      bytes: new Uint8Array([1, 2, 3]),
    });

    await expect(provider.download(stored.storageKey)).resolves.toEqual(new Uint8Array([1, 2, 3]));
    await provider.delete(stored.storageKey);
    await expect(provider.download(stored.storageKey)).rejects.toThrow(
      'File content was not found. Upload the file again or contact support.',
    );
  });
});
