import { z } from 'zod';
import { TenantFeatureFlagId, TenantId } from './ids.ts';

export const FeatureFlagKey = z.string().regex(/^[a-z][a-z0-9_.:-]{1,79}$/, {
  message:
    'Feature flag keys must be 2-80 lowercase letters, numbers, underscores, dots, colons, or hyphens.',
});
export type FeatureFlagKey = z.infer<typeof FeatureFlagKey>;

export const TenantFeatureFlag = z
  .object({
    id: TenantFeatureFlagId,
    tenantId: TenantId,
    key: FeatureFlagKey,
    enabled: z.boolean(),
    description: z.string().min(1).max(500).nullable().default(null),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type TenantFeatureFlag = z.infer<typeof TenantFeatureFlag>;
