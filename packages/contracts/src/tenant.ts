import { z } from 'zod';
import { TenantId } from './ids.ts';

export const TenantSlug = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
    message: 'Slug must be lowercase alphanumeric with optional hyphens',
  });
export type TenantSlug = z.infer<typeof TenantSlug>;

export const Tenant = z.object({
  id: TenantId,
  slug: TenantSlug,
  displayName: z.string().min(1).max(120),
  storageByteLimit: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable().default(null),
  defaultUserStorageByteLimit: z
    .number()
    .int()
    .positive()
    .max(Number.MAX_SAFE_INTEGER)
    .nullable()
    .default(null),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Tenant = z.infer<typeof Tenant>;
