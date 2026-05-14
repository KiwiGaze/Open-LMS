import { describe, expect, it } from 'vitest';
import { WebhookSubscription } from '../src/integration.ts';

const now = new Date('2026-05-14T00:00:00.000Z');

describe('webhook subscription contract', () => {
  it('models a public webhook subscription without exposing the signing secret', () => {
    const subscription = WebhookSubscription.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KWH1',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KWH2',
      name: 'Student systems webhook',
      endpointUrl: 'https://hooks.example.edu/open-lms',
      topics: ['grade.lifecycle', 'assignment.feedback'],
      status: 'enabled',
      createdAt: now,
      updatedAt: now,
    });

    expect(subscription).not.toHaveProperty('signingSecret');
    expect(subscription.topics).toEqual(['grade.lifecycle', 'assignment.feedback']);
  });

  it('rejects non-HTTPS endpoints', () => {
    expect(() =>
      WebhookSubscription.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KWH1',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KWH2',
        name: 'Local webhook',
        endpointUrl: 'http://hooks.example.edu/open-lms',
        topics: ['grade.lifecycle'],
        status: 'enabled',
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });
});
