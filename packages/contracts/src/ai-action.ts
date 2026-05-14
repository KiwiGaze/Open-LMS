import { z } from 'zod';

export const AiActionScope = z.enum(['single', 'batch', 'cohort', 'real_time_loop']);
export type AiActionScope = z.infer<typeof AiActionScope>;

export const AiRiskLevel = z.enum(['low', 'medium', 'high']);
export type AiRiskLevel = z.infer<typeof AiRiskLevel>;

export const AiAction = z.object({
  identifier: z.string().min(1),
  productSurface: z.string().min(1),
  requiredContext: z.array(z.string().min(1)),
  optionalContext: z.array(z.string().min(1)),
  outputContract: z.string().min(1),
  riskLevel: AiRiskLevel,
  humanReviewRequired: z.boolean(),
  allowedAudience: z.array(z.enum(['student', 'instructor', 'admin', 'system'])),
  scope: AiActionScope,
});
export type AiAction = z.infer<typeof AiAction>;
