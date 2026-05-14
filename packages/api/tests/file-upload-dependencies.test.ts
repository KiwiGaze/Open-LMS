import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  createFileResource: vi.fn(),
  createFileResourceId: vi.fn(),
  getFileStorageUsage: vi.fn(),
  getTenantById: vi.fn(),
  localFileStorage: { upload: vi.fn(), delete: vi.fn() },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createFileResource: coreMocks.createFileResource,
    createFileResourceId: coreMocks.createFileResourceId,
    getFileStorageUsage: coreMocks.getFileStorageUsage,
    getTenantById: coreMocks.getTenantById,
    LocalFileStorageProvider: vi.fn(() => coreMocks.localFileStorage),
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE80';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE81';
const storageFileId = '01J9QW7B6N5W2YH3D3A1V0KE82';
const now = new Date('2026-05-14T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

describe('file upload API dependency quotas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createFileResourceId.mockReturnValue(storageFileId);
    coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role: 'student' }]);
    coreMocks.listUserCourseMemberships.mockResolvedValue([]);
    coreMocks.getTenantById.mockResolvedValue({
      id: tenantId,
      slug: 'writing-school',
      displayName: 'Writing School',
      storageByteLimit: null,
      defaultUserStorageByteLimit: null,
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.getFileStorageUsage.mockResolvedValue({ totalBytes: 0 });
    coreMocks.localFileStorage.upload.mockResolvedValue({
      storageProvider: 'local_fs',
      storageKey: `${tenantId}/${storageFileId}`,
    });
    coreMocks.createFileResource.mockImplementation(async (_db, input) => ({
      ...input,
      createdAt: now,
    }));
  });

  it('rejects uploads that would exceed the tenant storage quota before storing bytes', async () => {
    coreMocks.getTenantById.mockResolvedValue({
      id: tenantId,
      slug: 'writing-school',
      displayName: 'Writing School',
      storageByteLimit: 4,
      defaultUserStorageByteLimit: null,
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.getFileStorageUsage.mockResolvedValue({ totalBytes: 3 });
    const dependencies = createDependencies();

    await expect(
      dependencies.uploadFile(actorUserId, tenantId, {
        courseId: null,
        filename: 'notes.txt',
        mediaType: 'text/plain',
        contentBase64: Buffer.from('hello').toString('base64'),
        visibility: 'private',
        altText: null,
        transcriptText: null,
        license: null,
        copyrightHolder: null,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Tenant file storage quota would be exceeded. Delete files or ask an administrator to increase the quota.',
    });

    expect(coreMocks.localFileStorage.upload).not.toHaveBeenCalled();
    expect(coreMocks.createFileResource).not.toHaveBeenCalled();
  });

  it('rejects uploads that would exceed the default per-user storage quota before storing bytes', async () => {
    coreMocks.getTenantById.mockResolvedValue({
      id: tenantId,
      slug: 'writing-school',
      displayName: 'Writing School',
      storageByteLimit: null,
      defaultUserStorageByteLimit: 4,
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.getFileStorageUsage.mockResolvedValueOnce({ totalBytes: 3 });
    const dependencies = createDependencies();

    await expect(
      dependencies.uploadFile(actorUserId, tenantId, {
        courseId: null,
        filename: 'notes.txt',
        mediaType: 'text/plain',
        contentBase64: Buffer.from('hello').toString('base64'),
        visibility: 'private',
        altText: null,
        transcriptText: null,
        license: null,
        copyrightHolder: null,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'User file storage quota would be exceeded. Delete files or ask an administrator to increase the quota.',
    });

    expect(coreMocks.getFileStorageUsage).toHaveBeenCalledTimes(1);
    expect(coreMocks.getFileStorageUsage).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      ownerId: actorUserId,
    });
    expect(coreMocks.localFileStorage.upload).not.toHaveBeenCalled();
    expect(coreMocks.createFileResource).not.toHaveBeenCalled();
  });
});
