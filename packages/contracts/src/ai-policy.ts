import { z } from 'zod';
import { AiActionScope, AiRiskLevel } from './ai-action.ts';
import { TenantId } from './ids.ts';

export const AiPolicyDecision = z.object({
  allowed: z.boolean(),
  requiresHumanReview: z.boolean(),
  reason: z.string().min(1),
  policyVersion: z.number().int().positive(),
  signalQualityClass: z.enum(['representative', 'partial', 'insufficient_n']).nullable(),
});
export type AiPolicyDecision = z.infer<typeof AiPolicyDecision>;

export const AiPolicyTargetType = z.enum(['tenant', 'course', 'assignment']);
export type AiPolicyTargetType = z.infer<typeof AiPolicyTargetType>;

export const AiPolicyRule = z
  .object({
    tenantId: TenantId,
    actionIdentifier: z.string().min(1),
    version: z.number().int().positive(),
    targetType: AiPolicyTargetType.default('tenant'),
    targetId: z.string().min(1).nullable().default(null),
    enabled: z.boolean(),
    riskLevel: AiRiskLevel,
    scope: AiActionScope,
    requiresHumanReview: z.boolean(),
    requiresExplicitConsent: z.boolean(),
    minCohortSizeForDisclosure: z.number().int().min(2),
  })
  .superRefine((rule, context) => {
    if (rule.targetType !== 'tenant' && !rule.targetId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Course and assignment AI policy rules require a target id.',
        path: ['targetId'],
      });
    }
  });
export type AiPolicyRule = z.infer<typeof AiPolicyRule>;
