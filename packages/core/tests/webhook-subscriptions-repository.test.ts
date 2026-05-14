import { WebhookSubscription } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  createWebhookSubscription,
  deleteWebhookSubscription,
  listWebhookSubscriptions,
  updateWebhookSubscription,
} from '../src/integrations/webhook-subscriptions-repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KWH2';
const subscriptionId = '01J9QW7B6N5W2YH3D3A1V0KWH1';
const now = new Date('2026-05-14T00:00:00.000Z');

const subscription = WebhookSubscription.parse({
  id: subscriptionId,
  tenantId,
  name: 'Student systems webhook',
  endpointUrl: 'https://hooks.example.edu/open-lms',
  topics: ['grade.lifecycle'],
  status: 'enabled',
  createdAt: now,
  updatedAt: now,
});

const createInsertDb = (captured: { value: unknown }): Database =>
  ({
    insert: () => ({
      values: (value: unknown) => {
        captured.value = value;
        return {
          returning: async () => [value],
        };
      },
    }),
  }) as unknown as Database;

const createSelectDb = (rows: unknown[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createUpdateDb = (row: unknown, captured: { value: unknown }): Database =>
  ({
    update: () => ({
      set: (value: unknown) => {
        captured.value = value;
        return {
          where: () => ({
            returning: async () => (row ? [row] : []),
          }),
        };
      },
    }),
  }) as unknown as Database;

const createDeleteDb = (rows: unknown[]): Database =>
  ({
    delete: () => ({
      where: () => ({
        returning: async () => rows,
      }),
    }),
  }) as unknown as Database;

describe('webhook subscription repository', () => {
  it('creates tenant-scoped webhook subscriptions with encrypted signing secret metadata', async () => {
    const captured = { value: null as unknown };

    const created = await createWebhookSubscription(
      createInsertDb(captured),
      {
        tenantId,
        name: 'Student systems webhook',
        endpointUrl: 'https://hooks.example.edu/open-lms',
        topics: ['grade.lifecycle'],
        status: 'enabled',
        encryptedSigningSecret: 'encrypted-secret',
      },
      now,
    );

    expect(created).toMatchObject({
      tenantId,
      name: 'Student systems webhook',
      endpointUrl: 'https://hooks.example.edu/open-lms',
    });
    expect(captured.value).toMatchObject({
      tenantId,
      encryptedSigningSecret: 'encrypted-secret',
    });
  });

  it('lists public subscription records without encrypted signing secrets', async () => {
    const rows = [{ ...subscription, encryptedSigningSecret: 'encrypted-secret' }];

    await expect(listWebhookSubscriptions(createSelectDb(rows), tenantId)).resolves.toEqual([
      subscription,
    ]);
  });

  it('updates subscription metadata and can rotate the encrypted signing secret', async () => {
    const captured = { value: null as unknown };

    await expect(
      updateWebhookSubscription(
        createUpdateDb(
          {
            ...subscription,
            name: 'Updated webhook',
            encryptedSigningSecret: 'rotated-secret',
          },
          captured,
        ),
        {
          tenantId,
          webhookSubscriptionId: subscriptionId,
          name: 'Updated webhook',
          endpointUrl: subscription.endpointUrl,
          topics: subscription.topics,
          status: 'disabled',
          encryptedSigningSecret: 'rotated-secret',
        },
        now,
      ),
    ).resolves.toMatchObject({ name: 'Updated webhook' });

    expect(captured.value).toEqual({
      name: 'Updated webhook',
      endpointUrl: subscription.endpointUrl,
      topics: subscription.topics,
      status: 'disabled',
      encryptedSigningSecret: 'rotated-secret',
      updatedAt: now,
    });
  });

  it('deletes subscriptions by tenant-scoped id', async () => {
    await expect(
      deleteWebhookSubscription(createDeleteDb([{ id: subscriptionId }]), {
        tenantId,
        webhookSubscriptionId: subscriptionId,
      }),
    ).resolves.toBe(true);
  });
});
