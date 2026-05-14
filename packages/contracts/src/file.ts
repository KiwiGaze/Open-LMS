import { z } from 'zod';
import { CourseId, FileResourceId, TenantId, UserId } from './ids.ts';

export const FileStorageProvider = z.enum(['local_fs', 's3_compatible']);
export type FileStorageProvider = z.infer<typeof FileStorageProvider>;

export const FileVisibility = z.enum([
  'private',
  'owner_and_instructors',
  'course_staff',
  'course_member',
]);
export type FileVisibility = z.infer<typeof FileVisibility>;

export const FileResource = z
  .object({
    id: FileResourceId,
    tenantId: TenantId,
    courseId: CourseId.nullable().default(null),
    ownerId: UserId,
    storageProvider: FileStorageProvider,
    storageKey: z.string().min(1),
    filename: z.string().min(1).max(255),
    mediaType: z.string().min(1).max(127),
    byteSize: z.number().int().nonnegative(),
    checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
    visibility: FileVisibility,
    altText: z.string().min(1).max(500).nullable().default(null),
    transcriptText: z.string().min(1).max(20_000).nullable().default(null),
    license: z.string().min(1).max(120).nullable().default(null),
    copyrightHolder: z.string().min(1).max(160).nullable().default(null),
    createdAt: z.date(),
  })
  .strict();
export type FileResource = z.infer<typeof FileResource>;

export const FileMetadata = z
  .object({
    id: FileResourceId,
    tenantId: TenantId,
    courseId: CourseId.nullable().default(null),
    ownerId: UserId,
    filename: z.string().min(1).max(255),
    mediaType: z.string().min(1).max(127),
    byteSize: z.number().int().nonnegative(),
    checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
    visibility: FileVisibility,
    altText: z.string().min(1).max(500).nullable().default(null),
    transcriptText: z.string().min(1).max(20_000).nullable().default(null),
    license: z.string().min(1).max(120).nullable().default(null),
    copyrightHolder: z.string().min(1).max(160).nullable().default(null),
    createdAt: z.date(),
  })
  .strict();
export type FileMetadata = z.infer<typeof FileMetadata>;

export const CreateFileUpload = z
  .object({
    courseId: CourseId.nullable().default(null),
    filename: z.string().min(1).max(255),
    mediaType: z.string().min(1).max(127),
    contentBase64: z.string().min(1),
    visibility: FileVisibility.default('private'),
    altText: z.string().min(1).max(500).nullable().default(null),
    transcriptText: z.string().min(1).max(20_000).nullable().default(null),
    license: z.string().min(1).max(120).nullable().default(null),
    copyrightHolder: z.string().min(1).max(160).nullable().default(null),
  })
  .strict();
export type CreateFileUpload = z.infer<typeof CreateFileUpload>;
