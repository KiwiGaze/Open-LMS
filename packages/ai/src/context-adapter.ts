import type { ContextPackage } from '@openlms/contracts';
import type { GatewayMessage } from './gateway.ts';
import { getActivePromptForAction } from './prompt-registry.ts';
import type { RagRetrievalResult } from './rag.ts';

export type AdaptedContext = {
  promptIdentifier: string;
  promptVersion: string;
  messages: GatewayMessage[];
  requiresHumanReview: boolean;
  retrievalTrace: RetrievalTraceEntry[];
};

export type AdaptContextPackageOptions = {
  retrievedChunks?: RagRetrievalResult[];
  retrievalPolicy?: {
    courseId: string;
    allowedVisibilities: string[];
    allowedAccessPolicies: string[];
  };
};

export type RetrievalTraceEntry = {
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  sourceVersion: string;
  relevanceScore: number;
  visibility: string;
  accessPolicy: string;
  learningObjectiveIds: string[];
};

const renderResource = (resource: ContextPackage['resources'][number]): string =>
  [`# ${resource.title}`, `Type: ${resource.resourceType}`, resource.body].join('\n');

const renderRetrievedChunk = (result: RagRetrievalResult): string =>
  [
    `# ${result.chunk.sourceTitle}`,
    `Type: ${result.chunk.sourceType}`,
    `Source: ${result.chunk.sourceId}@${result.chunk.sourceVersion}`,
    `Relevance: ${result.relevanceScore.toFixed(2)}`,
    result.chunk.content,
  ].join('\n');

const buildRetrievalTraceEntry = (result: RagRetrievalResult): RetrievalTraceEntry => ({
  sourceId: result.chunk.sourceId,
  sourceTitle: result.chunk.sourceTitle,
  sourceType: result.chunk.sourceType,
  sourceVersion: result.chunk.sourceVersion,
  relevanceScore: result.relevanceScore,
  visibility: result.chunk.visibility,
  accessPolicy: result.chunk.accessPolicy,
  learningObjectiveIds: result.chunk.learningObjectiveIds,
});

const assertRetrievedChunksAllowed = (
  contextPackage: ContextPackage,
  options: AdaptContextPackageOptions,
): RagRetrievalResult[] => {
  const retrievedChunks = options.retrievedChunks ?? [];

  if (retrievedChunks.length === 0) {
    return retrievedChunks;
  }

  if (!options.retrievalPolicy) {
    throw new Error(
      'Retrieved context requires an explicit tenant, course, visibility, and access policy before prompt adaptation.',
    );
  }

  const unauthorizedChunk = retrievedChunks.find(
    (result) =>
      result.chunk.tenantId !== contextPackage.tenantId ||
      result.chunk.courseId !== options.retrievalPolicy?.courseId ||
      !options.retrievalPolicy.allowedVisibilities.includes(result.chunk.visibility) ||
      !options.retrievalPolicy.allowedAccessPolicies.includes(result.chunk.accessPolicy),
  );

  if (unauthorizedChunk) {
    throw new Error(
      'Retrieved context includes a chunk outside the allowed tenant, course, visibility, or access policy.',
    );
  }

  return retrievedChunks;
};

export const adaptContextPackage = (
  contextPackage: ContextPackage,
  options: AdaptContextPackageOptions = {},
): AdaptedContext => {
  const prompt = getActivePromptForAction(contextPackage.actionIdentifier);
  const retrievedChunks = assertRetrievedChunksAllowed(contextPackage, options);

  return {
    promptIdentifier: prompt.identifier,
    promptVersion: prompt.version,
    requiresHumanReview: contextPackage.policyStamp.requiresHumanReview,
    retrievalTrace: retrievedChunks.map(buildRetrievalTraceEntry),
    messages: [
      {
        role: 'system',
        content: [
          'You are Open-LMS-AI. Use only the provided context. Produce evidence-grounded educational suggestions, not official decisions.',
          `Prompt: ${prompt.identifier}@${prompt.version}`,
          prompt.instructions,
        ].join('\n\n'),
      },
      {
        role: 'user',
        content: [
          `Action: ${contextPackage.actionIdentifier}`,
          `Policy: ${contextPackage.policyStamp.reason}`,
          `Policy version: ${contextPackage.policyStamp.policyVersion}`,
          `Signal quality: ${contextPackage.policyStamp.signalQualityClass ?? 'none'}`,
          ...contextPackage.resources.map(renderResource),
          retrievedChunks.length > 0
            ? ['Retrieved context', ...retrievedChunks.map(renderRetrievedChunk)].join('\n\n')
            : null,
        ].join('\n\n'),
      },
    ],
  };
};
