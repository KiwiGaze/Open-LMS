import { describe, expect, it } from 'vitest';
import { createWebhookSignatureHeaders } from '../src/integrations/webhook-signing.ts';

describe('webhook signing', () => {
  it('signs timestamped payloads with HMAC SHA-256', () => {
    const headers = createWebhookSignatureHeaders({
      payload: '{"event":"grade.published"}',
      signingSecret: 'super-secret-webhook-key',
      timestamp: 1_715_688_000,
    });

    expect(headers).toEqual({
      'x-openlms-webhook-timestamp': '1715688000',
      'x-openlms-webhook-signature':
        'v1=07e7d18fb96c9c863da8c9206df4e0e529797a43a30e174b242075652df1614c',
    });
  });
});
