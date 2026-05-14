import {
  type AiPolicyDecision,
  ContextPackage,
  type ContextPackage as ContextPackageContract,
  ContextPackageId,
  type ContextResource,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { ulid } from 'ulid';

export type BuildContextPackageInput = {
  tenantId: string;
  actorId: string;
  actionIdentifier: string;
  policyDecision: AiPolicyDecision;
  resources: ContextResource[];
};

export const buildContextPackage = (
  input: BuildContextPackageInput,
  now = new Date(),
): ContextPackageContract => {
  if (!input.policyDecision.allowed) {
    throw new Error(`Context package blocked by policy: ${input.policyDecision.reason}`);
  }

  return ContextPackage.parse({
    id: ContextPackageId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    actionIdentifier: input.actionIdentifier,
    actorId: UserId.parse(input.actorId),
    resources: input.resources,
    policyStamp: {
      allowed: input.policyDecision.allowed,
      requiresHumanReview: input.policyDecision.requiresHumanReview,
      reason: input.policyDecision.reason,
      policyVersion: input.policyDecision.policyVersion,
      signalQualityClass: input.policyDecision.signalQualityClass,
    },
    createdAt: now,
  });
};
