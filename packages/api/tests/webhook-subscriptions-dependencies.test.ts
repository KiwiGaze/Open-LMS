import { type TenantRole, WebhookSubscription } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  createWebhookSubscription: vi.fn(),
  deleteWebhookSubscription: vi.fn(),
  encryptSecret: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  listWebhookSubscriptions: vi.fn(),
  serializeEncryptedSecret: vi.fn(),
  updateWebhookSubscription: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createWebhookSubscription: coreMocks.createWebhookSubscription,
    deleteWebhookSubscription: coreMocks.deleteWebhookSubscription,
    encryptSecret: coreMocks.encryptSecret,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    listWebhookSubscriptions: coreMocks.listWebhookSubscriptions,
    serializeEncryptedSecret: coreMocks.serializeEncryptedSecret,
    updateWebhookSubscription: coreMocks.updateWebhookSubscription,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KWA0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KWA1';
const webhookSubscriptionId = '01J9QW7B6N5W2YH3D3A1V0KWA2';
const now = new Date('2026-05-14T00:00:00.000Z');
const encryptionKey = Buffer.from('a'.repeat(32), 'utf8').toString('base64');

const subscription = WebhookSubscription.parse({
  id: webhookSubscriptionId,
  tenantId,
  name: 'Student systems webhook',
  endpointUrl: 'https://hooks.example.edu/open-lms',
  topics: ['grade.lifecycle'],
  status: 'enabled',
  createdAt: now,
  updatedAt: now,
});

const createDependencies = (overrides?: { encryptionKey?: string }) =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
    WEBHOOK_SIGNING_SECRET_ENCRYPTION_KEY: overrides?.encryptionKey ?? encryptionKey,
  });

const setActorRole = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(
    role ? [{ tenantId, userId: actorUserId, role }] : [],
  );
};

describe('webhook subscription API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.encryptSecret.mockReturnValue({
      ciphertextBase64: 'ciphertext',
      ivBase64: 'iv',
      authTagBase64: 'tag',
    });
    coreMocks.serializeEncryptedSecret.mockReturnValue('encrypted-secret');
    coreMocks.listWebhookSubscriptions.mockResolvedValue([subscription]);
    coreMocks.createWebhookSubscription.mockResolvedValue(subscription);
    coreMocks.updateWebhookSubscription.mockResolvedValue(subscription);
    coreMocks.deleteWebhookSubscription.mockResolvedValue(true);
  });

  it('creates webhook subscriptions for institution admins with encrypted signing secrets', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.createWebhookSubscription(actorUserId, tenantId, {
        name: 'Student systems webhook',
        endpointUrl: 'https://hooks.example.edu/open-lms',
        topics: ['grade.lifecycle'],
        status: 'enabled',
        signingSecret: 'plain-webhook-secret',
      }),
    ).resolves.toEqual(subscription);

    expect(coreMocks.encryptSecret).toHaveBeenCalledWith('plain-webhook-secret', encryptionKey);
    expect(coreMocks.createWebhookSubscription).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      name: 'Student systems webhook',
      endpointUrl: 'https://hooks.example.edu/open-lms',
      topics: ['grade.lifecycle'],
      status: 'enabled',
      encryptedSigningSecret: 'encrypted-secret',
    });
  });

  it('lists webhook subscriptions for institution admins', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(dependencies.listWebhookSubscriptions(actorUserId, tenantId)).resolves.toEqual([
      subscription,
    ]);
  });

  it('rejects non-admin tenant members', async () => {
    setActorRole('instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.listWebhookSubscriptions(actorUserId, tenantId),
    ).rejects.toMatchObject({
      code: 'forbidden',
    });
    expect(coreMocks.listWebhookSubscriptions).not.toHaveBeenCalled();
  });

  it('requires webhook signing secret encryption configuration when creating subscriptions', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies({ encryptionKey: '' });

    await expect(
      dependencies.createWebhookSubscription(actorUserId, tenantId, {
        name: 'Student systems webhook',
        endpointUrl: 'https://hooks.example.edu/open-lms',
        topics: ['grade.lifecycle'],
        status: 'enabled',
        signingSecret: 'plain-webhook-secret',
      }),
    ).rejects.toMatchObject({
      message:
        'Webhook signing secret encryption is not configured. Set WEBHOOK_SIGNING_SECRET_ENCRYPTION_KEY and retry.',
    });
  });

  it('updates webhook subscriptions without rotating the signing secret when none is provided', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateWebhookSubscription(actorUserId, tenantId, webhookSubscriptionId, {
        name: 'Renamed webhook',
        endpointUrl: 'https://hooks.example.edu/open-lms',
        topics: ['grade.lifecycle', 'assignment.feedback'],
        status: 'disabled',
      }),
    ).resolves.toEqual(subscription);

    expect(coreMocks.encryptSecret).not.toHaveBeenCalled();
    expect(coreMocks.updateWebhookSubscription).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      webhookSubscriptionId,
      name: 'Renamed webhook',
      endpointUrl: 'https://hooks.example.edu/open-lms',
      topics: ['grade.lifecycle', 'assignment.feedback'],
      status: 'disabled',
    });
  });

  it('returns not_found when deleting a missing subscription', async () => {
    setActorRole('institution_admin');
    coreMocks.deleteWebhookSubscription.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteWebhookSubscription(actorUserId, tenantId, webhookSubscriptionId),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});
