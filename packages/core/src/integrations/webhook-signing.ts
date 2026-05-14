import { createHmac } from 'node:crypto';

export type CreateWebhookSignatureHeadersInput = {
  payload: string;
  signingSecret: string;
  timestamp?: number;
};

export const createWebhookSignatureHeaders = (
  input: CreateWebhookSignatureHeadersInput,
): Record<string, string> => {
  const timestamp = input.timestamp ?? Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${input.payload}`;
  const digest = createHmac('sha256', input.signingSecret).update(signedPayload).digest('hex');

  return {
    'x-openlms-webhook-timestamp': String(timestamp),
    'x-openlms-webhook-signature': `v1=${digest}`,
  };
};
