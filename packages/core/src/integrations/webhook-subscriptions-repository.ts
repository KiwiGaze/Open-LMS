import {
  WebhookSubscription,
  type WebhookSubscription as WebhookSubscriptionContract,
  WebhookSubscriptionId,
} from '@openlms/contracts';
import { and, asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { webhookSubscription } from '../db/schema/integration.ts';

type WebhookSubscriptionRow = typeof webhookSubscription.$inferSelect;

const toWebhookSubscription = (
  row: Omit<WebhookSubscriptionRow, 'encryptedSigningSecret'>,
): WebhookSubscriptionContract =>
  WebhookSubscription.parse({
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    endpointUrl: row.endpointUrl,
    topics: row.topics,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

export type CreateWebhookSubscriptionInput = {
  tenantId: string;
  name: string;
  endpointUrl: string;
  topics: string[];
  status: WebhookSubscriptionContract['status'];
  encryptedSigningSecret: string;
};

export const createWebhookSubscription = async (
  db: Database,
  input: CreateWebhookSubscriptionInput,
  now = new Date(),
): Promise<WebhookSubscriptionContract> => {
  const [row] = await db
    .insert(webhookSubscription)
    .values({
      id: WebhookSubscriptionId.parse(ulid()),
      tenantId: input.tenantId,
      name: input.name,
      endpointUrl: input.endpointUrl,
      topics: input.topics,
      status: input.status,
      encryptedSigningSecret: input.encryptedSigningSecret,
      createdAt: now,
      updatedAt: now,
    })
    .returning({
      id: webhookSubscription.id,
      tenantId: webhookSubscription.tenantId,
      name: webhookSubscription.name,
      endpointUrl: webhookSubscription.endpointUrl,
      topics: webhookSubscription.topics,
      status: webhookSubscription.status,
      createdAt: webhookSubscription.createdAt,
      updatedAt: webhookSubscription.updatedAt,
    });

  if (!row) {
    throw new Error(
      'Webhook subscription could not be created because the database returned no row.',
    );
  }

  return toWebhookSubscription(row);
};

export const listWebhookSubscriptions = async (
  db: Database,
  tenantId: string,
): Promise<WebhookSubscriptionContract[]> => {
  const rows = await db
    .select({
      id: webhookSubscription.id,
      tenantId: webhookSubscription.tenantId,
      name: webhookSubscription.name,
      endpointUrl: webhookSubscription.endpointUrl,
      topics: webhookSubscription.topics,
      status: webhookSubscription.status,
      createdAt: webhookSubscription.createdAt,
      updatedAt: webhookSubscription.updatedAt,
    })
    .from(webhookSubscription)
    .where(eq(webhookSubscription.tenantId, tenantId))
    .orderBy(asc(webhookSubscription.createdAt), asc(webhookSubscription.id));

  return rows.map(toWebhookSubscription);
};

export type UpdateWebhookSubscriptionInput = {
  tenantId: string;
  webhookSubscriptionId: string;
  name: string;
  endpointUrl: string;
  topics: string[];
  status: WebhookSubscriptionContract['status'];
  encryptedSigningSecret?: string;
};

export const updateWebhookSubscription = async (
  db: Database,
  input: UpdateWebhookSubscriptionInput,
  now = new Date(),
): Promise<WebhookSubscriptionContract | null> => {
  const values = {
    name: input.name,
    endpointUrl: input.endpointUrl,
    topics: input.topics,
    status: input.status,
    ...(input.encryptedSigningSecret === undefined
      ? {}
      : { encryptedSigningSecret: input.encryptedSigningSecret }),
    updatedAt: now,
  };

  const [row] = await db
    .update(webhookSubscription)
    .set(values)
    .where(
      and(
        eq(webhookSubscription.tenantId, input.tenantId),
        eq(webhookSubscription.id, input.webhookSubscriptionId),
      ),
    )
    .returning({
      id: webhookSubscription.id,
      tenantId: webhookSubscription.tenantId,
      name: webhookSubscription.name,
      endpointUrl: webhookSubscription.endpointUrl,
      topics: webhookSubscription.topics,
      status: webhookSubscription.status,
      createdAt: webhookSubscription.createdAt,
      updatedAt: webhookSubscription.updatedAt,
    });

  return row ? toWebhookSubscription(row) : null;
};

export type DeleteWebhookSubscriptionInput = {
  tenantId: string;
  webhookSubscriptionId: string;
};

export const deleteWebhookSubscription = async (
  db: Database,
  input: DeleteWebhookSubscriptionInput,
): Promise<boolean> => {
  const rows = await db
    .delete(webhookSubscription)
    .where(
      and(
        eq(webhookSubscription.tenantId, input.tenantId),
        eq(webhookSubscription.id, input.webhookSubscriptionId),
      ),
    )
    .returning({ id: webhookSubscription.id });

  return rows.length > 0;
};
