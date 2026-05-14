import { describe, expect, it } from 'vitest';
import {
  QtiQuizItemExport,
  QtiQuizItemImportRequest,
  QtiQuizItemImportResult,
} from '../src/index.ts';

const now = new Date('2026-05-12T00:00:00.000Z');

describe('QTI contracts', () => {
  it('models a QTI 2.1 quiz item export bundle', () => {
    const bundle = QtiQuizItemExport.parse({
      format: 'qti_2_1',
      exportedAt: now,
      itemCount: 1,
      items: [
        {
          identifier: '01J9QW7B6N5W2YH3D3A1V0KE88',
          title: 'Evidence question',
          xml: '<assessmentItem identifier="item-1"></assessmentItem>',
        },
      ],
    });

    expect(bundle.items[0]?.xml).toContain('assessmentItem');
  });

  it('models a QTI 2.1 quiz item import request and result', () => {
    const request = QtiQuizItemImportRequest.parse({
      format: 'qti_2_1',
      startingPosition: 3,
      items: [{ xml: '<assessmentItem identifier="item-1"></assessmentItem>' }],
    });
    const result = QtiQuizItemImportResult.parse({
      format: 'qti_2_1',
      importedCount: 1,
      questions: [
        {
          id: '01J9QW7B6N5W2YH3D3A1V0KE88',
          tenantId: '01J9QW7B6N5W2YH3D3A1V0KE85',
          quizId: '01J9QW7B6N5W2YH3D3A1V0KE87',
          position: 3,
          questionType: 'multiple_choice',
          prompt: 'Which element connects evidence to a claim?',
          points: 2,
          choices: [{ id: 'choice-a', text: 'Reasoning' }],
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    expect(request.startingPosition).toBe(3);
    expect(result.importedCount).toBe(1);
  });
});
