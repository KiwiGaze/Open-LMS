import type { GatewayMessage } from './gateway.ts';

const injectionPatterns = [
  /ignore (all )?(previous|above) instructions/i,
  /ignore (the )?rubric/i,
  /reveal (the )?(system|developer) prompt/i,
  /you are now/i,
];

export type GuardrailResult = {
  allowed: boolean;
  reason: string;
};

export const checkPromptInjection = (messages: GatewayMessage[]): GuardrailResult => {
  const matched = messages.some((message) =>
    injectionPatterns.some((pattern) => pattern.test(message.content)),
  );

  if (matched) {
    return {
      allowed: false,
      reason: 'Input contains prompt-injection language. Remove it and retry.',
    };
  }

  return {
    allowed: true,
    reason: 'Input passed prompt-injection guardrails.',
  };
};

const sensitivePatterns = [
  {
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '[redacted-email]',
  },
  {
    pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    replacement: '[redacted-phone]',
  },
];

export const redactSensitiveGatewayMessages = (messages: GatewayMessage[]): GatewayMessage[] =>
  messages.map((message) => ({
    ...message,
    content: sensitivePatterns.reduce(
      (content, redaction) => content.replace(redaction.pattern, redaction.replacement),
      message.content,
    ),
  }));

const gradeClaimPatterns = [
  /official grade/i,
  /final grade/i,
  /final score/i,
  /\bwill receive (?:an? )?[A-F][+-]?\b/i,
  /\bscore is \d+(?:\.\d+)?\s*(?:%|percent|points?)?\b/i,
];

const collectTextValues = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectTextValues);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectTextValues);
  }

  return [];
};

const hasMissingEvidence = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(hasMissingEvidence);
  }

  if (value && typeof value === 'object') {
    if ('evidence' in value && Array.isArray(value.evidence) && value.evidence.length === 0) {
      return true;
    }

    return Object.values(value).some(hasMissingEvidence);
  }

  return false;
};

export const checkStructuredOutputGuardrails = (
  actionIdentifier: string,
  output: unknown,
): GuardrailResult => {
  if (actionIdentifier !== 'submission_precheck' && actionIdentifier !== 'feedback_draft') {
    return {
      allowed: true,
      reason: 'Output does not require formative grade-claim guardrails.',
    };
  }

  const makesGradeClaim = collectTextValues(output).some((text) =>
    gradeClaimPatterns.some((pattern) => pattern.test(text)),
  );

  if (makesGradeClaim) {
    return {
      allowed: false,
      reason:
        'Output contains unsupported official grade claims. Regenerate without final score or grade language.',
    };
  }

  if (hasMissingEvidence(output)) {
    return {
      allowed: false,
      reason: 'Output is missing required evidence. Regenerate with cited evidence.',
    };
  }

  return {
    allowed: true,
    reason: 'Output passed formative grade-claim guardrails.',
  };
};
