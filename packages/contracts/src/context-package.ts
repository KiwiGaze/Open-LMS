import { z } from 'zod';
import { ContextPackageId, TenantId, UserId } from './ids.ts';

export const ContextResource = z.object({
  resourceType: z.enum([
    'assignment',
    'rubric',
    'submission',
    'course_page',
    'course_content',
    'aggregate',
  ]),
  resourceId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  metadata: z.record(z.unknown()),
});
export type ContextResource = z.infer<typeof ContextResource>;

export const ContextPackage = z.object({
  id: ContextPackageId,
  tenantId: TenantId,
  actionIdentifier: z.string().min(1),
  actorId: UserId,
  resources: z.array(ContextResource).min(1),
  policyStamp: z.object({
    allowed: z.boolean(),
    requiresHumanReview: z.boolean(),
    reason: z.string().min(1),
    policyVersion: z.number().int().positive(),
    signalQualityClass: z.enum(['representative', 'partial', 'insufficient_n']).nullable(),
  }),
  createdAt: z.date(),
});
export type ContextPackage = z.infer<typeof ContextPackage>;
