import { AiGenerationLog } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { createDbGatewayUsageRecorder, saveAiGenerationLog } from '../src/ai-logs/repository.ts';
import type { Database } from '../src/db/client.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

const log = AiGenerationLog.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  actorId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  actionIdentifier: 'feedback_draft',
  contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  promptIdentifier: 'feedback_draft.default',
  promptVersion: '2026-05-10.1',
  providerType: 'openai_compatible',
  model: 'feedback-model',
  inputTokens: 42,
  outputTokens: 88,
  durationMs: 1200,
  retryCount: 0,
  fallbackUsed: false,
  estimatedCostCents: 0.018,
  createdAt: now,
});

const createInsertOnlyDb = (rows: unknown[]): Database =>
  ({
    insert: () => ({
      values: (value: unknown) => ({
        returning: async () => {
          rows.push(value);
          return [value];
        },
      }),
    }),
  }) as unknown as Database;

describe('AI generation log repository', () => {
  it('persists prompt metadata with generation usage', async () => {
    const saved = await saveAiGenerationLog(createInsertOnlyDb([]), log);

    expect(saved.promptIdentifier).toBe('feedback_draft.default');
    expect(saved.promptVersion).toBe('2026-05-10.1');
  });

  it('records gateway usage with prompt metadata', async () => {
    const rows: unknown[] = [];
    const recorder = createDbGatewayUsageRecorder(
      createInsertOnlyDb(rows),
      () => log.id,
      () => now,
    );

    await recorder.recordGeneration({
      tenantId: log.tenantId,
      actorId: log.actorId,
      actionIdentifier: log.actionIdentifier,
      contextPackageId: log.contextPackageId,
      promptIdentifier: log.promptIdentifier,
      promptVersion: log.promptVersion,
      providerType: log.providerType,
      model: log.model,
      inputTokens: log.inputTokens,
      outputTokens: log.outputTokens,
      durationMs: log.durationMs,
      retryCount: log.retryCount,
      fallbackUsed: log.fallbackUsed,
      estimatedCostCents: log.estimatedCostCents,
    });

    expect(rows).toEqual([
      expect.objectContaining({
        promptIdentifier: 'feedback_draft.default',
        promptVersion: '2026-05-10.1',
        estimatedCostCents: 0.018,
      }),
    ]);
  });
});
