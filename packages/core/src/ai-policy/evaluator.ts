import type {
  AiAction,
  AiPolicyDecision,
  AiPolicyRule,
  Consent,
  ConsentActionType,
  InstitutionConsentPolicy,
} from '@openlms/contracts';

export type EvaluateAiPolicyInput = {
  action: AiAction;
  rule: AiPolicyRule;
  consentPolicy: InstitutionConsentPolicy;
  consents: Consent[];
  cohortSizeTotal: number | null;
  cohortSizeConsenting: number | null;
};

export const consentActionTypeFor = (action: AiAction): ConsentActionType => {
  if (action.scope === 'real_time_loop') {
    return 'live_draft_analysis';
  }

  if (action.scope === 'cohort' || action.identifier === 'assignment_trend_card') {
    return 'cohort_signal_contribution';
  }

  return 'ai_analysis';
};

const matchesConsentScope = (consent: Consent, action: AiAction, rule: AiPolicyRule): boolean => {
  if (consent.scope === 'tenant') {
    return consent.scopeId === rule.tenantId;
  }

  if (consent.scope === 'action') {
    return consent.scopeId === action.identifier;
  }

  return consent.scope === rule.targetType && consent.scopeId === rule.targetId;
};

const isMatchingConsent = (consent: Consent, action: AiAction, rule: AiPolicyRule): boolean => {
  if (consent.tenantId !== rule.tenantId) {
    return false;
  }

  if (consent.actionType !== consentActionTypeFor(action)) {
    return false;
  }

  return matchesConsentScope(consent, action, rule);
};

const consentEffectiveTime = (consent: Consent): number => {
  const effectiveDate =
    consent.revokedAt ?? consent.grantedAt ?? consent.expiresAt ?? consent.updatedAt;
  return effectiveDate.getTime();
};

const isNewerConsent = (candidate: Consent, current: Consent): boolean =>
  consentEffectiveTime(candidate) > consentEffectiveTime(current);

const currentMatchingConsentsForAiAction = (
  consents: Consent[],
  action: AiAction,
  rule: AiPolicyRule,
): Consent[] => {
  const currentBySubject = new Map<string, Consent>();

  for (const consent of consents) {
    if (!isMatchingConsent(consent, action, rule)) {
      continue;
    }

    const current = currentBySubject.get(consent.subjectId);
    if (!current || isNewerConsent(consent, current)) {
      currentBySubject.set(consent.subjectId, consent);
    }
  }

  return [...currentBySubject.values()];
};

const isActiveGrant = (consent: Consent, now: Date): boolean => {
  if (consent.state !== 'granted') {
    return false;
  }

  if (!consent.grantedBy || !consent.grantedAt || consent.revokedAt) {
    return false;
  }

  return !consent.expiresAt || consent.expiresAt.getTime() > now.getTime();
};

export const hasGrantedConsentForAiAction = (
  consents: Consent[],
  action: AiAction,
  rule: AiPolicyRule,
  now: Date,
): boolean =>
  currentMatchingConsentsForAiAction(consents, action, rule).some((consent) =>
    isActiveGrant(consent, now),
  );

export const canUseSubjectContextForAiAction = (
  input: Pick<EvaluateAiPolicyInput, 'action' | 'rule' | 'consentPolicy'> & {
    consents: Consent[];
    now: Date;
  },
): boolean => {
  const currentMatchingConsents = currentMatchingConsentsForAiAction(
    input.consents,
    input.action,
    input.rule,
  );

  if (currentMatchingConsents.some((consent) => isActiveGrant(consent, input.now))) {
    return true;
  }

  const explicitConsentRequired =
    input.rule.requiresExplicitConsent || input.consentPolicy.defaultPosture === 'explicit_only';

  if (explicitConsentRequired) {
    return false;
  }

  return !currentMatchingConsents.some((consent) => consent.state === 'revoked');
};

const classifySignalQuality = (
  total: number,
  consenting: number,
  minNForDisclosure: number,
): AiPolicyDecision['signalQualityClass'] => {
  if (consenting < minNForDisclosure) {
    return 'insufficient_n';
  }

  return consenting === total ? 'representative' : 'partial';
};

export const hasInvalidCohortCounts = (total: number, consenting: number): boolean =>
  total < 0 || consenting < 0 || consenting > total;

const usesCohortDisclosureControls = (input: EvaluateAiPolicyInput): boolean => {
  if (input.action.scope === 'cohort' || input.action.scope === 'real_time_loop') {
    return true;
  }

  return (
    input.action.scope === 'batch' &&
    input.cohortSizeTotal !== null &&
    input.cohortSizeConsenting !== null
  );
};

export const evaluateAiPolicy = (
  input: EvaluateAiPolicyInput,
  now = new Date(),
): AiPolicyDecision => {
  if (!input.rule.enabled) {
    return {
      allowed: false,
      requiresHumanReview: input.rule.requiresHumanReview,
      reason: 'AI action is disabled by institution policy.',
      policyVersion: input.rule.version,
      signalQualityClass: null,
    };
  }

  if (input.rule.actionIdentifier !== input.action.identifier) {
    return {
      allowed: false,
      requiresHumanReview: true,
      reason: 'AI policy rule does not match the requested action.',
      policyVersion: input.rule.version,
      signalQualityClass: null,
    };
  }

  const consentRequired =
    input.rule.requiresExplicitConsent || input.consentPolicy.defaultPosture === 'explicit_only';

  if (
    consentRequired &&
    !hasGrantedConsentForAiAction(input.consents, input.action, input.rule, now)
  ) {
    return {
      allowed: false,
      requiresHumanReview: input.rule.requiresHumanReview || input.action.humanReviewRequired,
      reason: 'Required consent is missing or no longer valid.',
      policyVersion: input.rule.version,
      signalQualityClass: null,
    };
  }

  if (usesCohortDisclosureControls(input)) {
    const total = input.cohortSizeTotal ?? 0;
    const consenting = input.cohortSizeConsenting ?? 0;

    if (hasInvalidCohortCounts(total, consenting)) {
      return {
        allowed: false,
        requiresHumanReview: true,
        reason: 'Cohort counts are invalid. Verify total and consenting learner counts.',
        policyVersion: input.rule.version,
        signalQualityClass: null,
      };
    }

    const signalQualityClass = classifySignalQuality(
      total,
      consenting,
      input.rule.minCohortSizeForDisclosure,
    );

    if (signalQualityClass === 'insufficient_n') {
      return {
        allowed: false,
        requiresHumanReview: true,
        reason: 'Cohort signal suppressed below disclosure threshold.',
        policyVersion: input.rule.version,
        signalQualityClass,
      };
    }

    return {
      allowed: true,
      requiresHumanReview: input.rule.requiresHumanReview || input.action.humanReviewRequired,
      reason: 'AI action allowed by policy with cohort disclosure controls.',
      policyVersion: input.rule.version,
      signalQualityClass,
    };
  }

  return {
    allowed: true,
    requiresHumanReview: input.rule.requiresHumanReview || input.action.humanReviewRequired,
    reason: 'AI action allowed by policy.',
    policyVersion: input.rule.version,
    signalQualityClass: null,
  };
};

export const buildAiPolicyAuditMetadata = (
  decision: AiPolicyDecision,
): Record<string, unknown> => ({
  policyAllowed: decision.allowed,
  policyRequiresHumanReview: decision.requiresHumanReview,
  policyReason: decision.reason,
  policyVersion: decision.policyVersion,
  policySignalQualityClass: decision.signalQualityClass,
});
