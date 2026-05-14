export type AiGenerationMetadata = {
  aiGenerationLogId: string;
  promptIdentifier: string;
  promptVersion: string;
  providerType: string;
  model: string;
};

export type AiGenerationResult<TOutput> = {
  output: TOutput;
  metadata: AiGenerationMetadata;
};

export const buildAiGenerationAuditMetadata = (
  metadata: AiGenerationMetadata,
): Record<string, unknown> => ({
  aiGenerationLogId: metadata.aiGenerationLogId,
  promptIdentifier: metadata.promptIdentifier,
  promptVersion: metadata.promptVersion,
  providerType: metadata.providerType,
  model: metadata.model,
});
