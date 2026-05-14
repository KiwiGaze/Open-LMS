import {
  FileResource,
  FileResourceId,
  type FileResource as FileResourceContract,
} from '@openlms/contracts';
import { and, eq, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { fileResource } from '../db/schema/file.ts';

export { LocalFileStorageProvider } from './storage.ts';

export type GetFileResourceForOwnerInput = {
  tenantId: string;
  ownerId: string;
  fileResourceId: string;
};

export type GetFileStorageUsageInput = {
  tenantId: string;
  ownerId?: string;
};

export type FileStorageUsage = {
  totalBytes: number;
};

export type CreateFileResourceInput = {
  id?: string;
  tenantId: string;
  courseId: string | null;
  ownerId: string;
  storageProvider: FileResourceContract['storageProvider'];
  storageKey: string;
  filename: string;
  mediaType: string;
  byteSize: number;
  checksumSha256: string;
  visibility: FileResourceContract['visibility'];
  altText: string | null;
  transcriptText: string | null;
  license: string | null;
  copyrightHolder: string | null;
};

export const createFileResourceId = (): string => FileResourceId.parse(ulid());

export const createFileResource = async (
  db: Database,
  input: CreateFileResourceInput,
  now = new Date(),
): Promise<FileResourceContract> =>
  saveFileResource(
    db,
    FileResource.parse({
      ...(input.id ? { id: input.id } : { id: createFileResourceId() }),
      ...input,
      createdAt: now,
    }),
  );

export const saveFileResource = async (
  db: Database,
  value: FileResourceContract,
): Promise<FileResourceContract> => {
  const parsed = FileResource.parse(value);
  const [row] = await db.insert(fileResource).values(parsed).returning();

  if (!row) {
    throw new Error('File metadata could not be saved because the database returned no row.');
  }

  return FileResource.parse(row);
};

export const getFileResourceById = async (
  db: Database,
  tenantId: string,
  fileResourceId: string,
): Promise<FileResourceContract | null> => {
  const [row] = await db
    .select()
    .from(fileResource)
    .where(and(eq(fileResource.tenantId, tenantId), eq(fileResource.id, fileResourceId)))
    .limit(1);

  return row ? FileResource.parse(row) : null;
};

export const getFileResourceForOwner = async (
  db: Database,
  input: GetFileResourceForOwnerInput,
): Promise<FileResourceContract | null> => {
  const [row] = await db
    .select()
    .from(fileResource)
    .where(
      and(
        eq(fileResource.tenantId, input.tenantId),
        eq(fileResource.ownerId, input.ownerId),
        eq(fileResource.id, input.fileResourceId),
      ),
    )
    .limit(1);

  return row ? FileResource.parse(row) : null;
};

export const listFileResourcesForOwner = async (
  db: Database,
  tenantId: string,
  ownerId: string,
): Promise<FileResourceContract[]> => {
  const rows = await db
    .select()
    .from(fileResource)
    .where(and(eq(fileResource.tenantId, tenantId), eq(fileResource.ownerId, ownerId)))
    .orderBy(fileResource.createdAt);

  return rows.map((row) => FileResource.parse(row));
};

export const listFileResourcesForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
): Promise<FileResourceContract[]> => {
  const rows = await db
    .select()
    .from(fileResource)
    .where(and(eq(fileResource.tenantId, tenantId), eq(fileResource.courseId, courseId)))
    .orderBy(fileResource.createdAt);

  return rows.map((row) => FileResource.parse(row));
};

export const getFileStorageUsage = async (
  db: Database,
  input: GetFileStorageUsageInput,
): Promise<FileStorageUsage> => {
  const conditions = [eq(fileResource.tenantId, input.tenantId)];
  if (input.ownerId !== undefined) {
    conditions.push(eq(fileResource.ownerId, input.ownerId));
  }

  const [row] = await db
    .select({ totalBytes: sql<number>`coalesce(sum(${fileResource.byteSize}), 0)::bigint` })
    .from(fileResource)
    .where(and(...conditions));

  return { totalBytes: Number(row?.totalBytes ?? 0) };
};

export const deleteFileResourceForOwner = async (
  db: Database,
  input: GetFileResourceForOwnerInput,
): Promise<boolean> => {
  const rows = await db
    .delete(fileResource)
    .where(
      and(
        eq(fileResource.tenantId, input.tenantId),
        eq(fileResource.ownerId, input.ownerId),
        eq(fileResource.id, input.fileResourceId),
      ),
    )
    .returning({ id: fileResource.id });

  return rows.length > 0;
};
