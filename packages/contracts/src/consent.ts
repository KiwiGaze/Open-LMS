import { z } from 'zod';
import { ConsentId, TenantId, UserId } from './ids.ts';

export const ConsentActionType = z.enum([
  'ai_analysis',
  'automated_profiling',
  'third_party_provider',
  'cohort_signal_contribution',
  'live_draft_analysis',
]);
export type ConsentActionType = z.infer<typeof ConsentActionType>;

export const ConsentScope = z.enum(['tenant', 'course', 'assignment', 'action']);
export type ConsentScope = z.infer<typeof ConsentScope>;

export const ConsentState = z.enum(['granted', 'revoked', 'pending', 'expired']);
export type ConsentState = z.infer<typeof ConsentState>;

export const ConsentGrantedBy = z.enum(['subject', 'parent', 'institution_default_acceptance']);
export type ConsentGrantedBy = z.infer<typeof ConsentGrantedBy>;

export const Consent = z
  .object({
    id: ConsentId,
    tenantId: TenantId,
    subjectId: UserId,
    actionType: ConsentActionType,
    scope: ConsentScope,
    scopeId: z.string().min(1),
    state: ConsentState,
    grantedBy: ConsentGrantedBy.nullable(),
    grantedAt: z.date().nullable(),
    revokedAt: z.date().nullable(),
    expiresAt: z.date().nullable(),
    evidence: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((value, context) => {
    if (value.state === 'granted') {
      if (!value.grantedBy || !value.grantedAt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Granted consent requires grantedBy and grantedAt.',
          path: ['grantedAt'],
        });
      }

      if (value.revokedAt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Granted consent cannot have revokedAt.',
          path: ['revokedAt'],
        });
      }
    }

    if (value.state === 'revoked' && !value.revokedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Revoked consent requires revokedAt.',
        path: ['revokedAt'],
      });
    }

    if (value.state === 'pending') {
      if (value.grantedBy || value.grantedAt || value.revokedAt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Pending consent cannot include grant or revocation timestamps.',
          path: ['state'],
        });
      }
    }

    if (value.state === 'expired') {
      if (!value.expiresAt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expired consent requires expiresAt.',
          path: ['expiresAt'],
        });
      }

      if (value.revokedAt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expired consent cannot have revokedAt.',
          path: ['revokedAt'],
        });
      }
    }
  });
export type Consent = z.infer<typeof Consent>;

export const InstitutionConsentPolicy = z.object({
  tenantId: TenantId,
  defaultPosture: z.enum(['opt_in', 'opt_out', 'explicit_only']),
  jurisdictionProfile: z.enum(['gdpr_strict', 'ferpa_k12', 'us_college', 'eu_college', 'custom']),
  ageGateEnabled: z.boolean(),
  reconsentTriggers: z.array(z.enum(['provider_change', 'new_action_type', 'policy_change'])),
  minNForDisclosure: z.number().int().min(2),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type InstitutionConsentPolicy = z.infer<typeof InstitutionConsentPolicy>;
