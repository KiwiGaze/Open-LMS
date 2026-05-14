import {
  AiProviderType,
  type AiProviderType as AiProviderTypeContract,
  EncryptedApiKey,
  type ModelPreferences,
  ProviderBaseUrl,
  ProviderCapabilities,
  type ProviderCapabilities as ProviderCapabilitiesContract,
  ProviderConfig,
  type ProviderConfig as ProviderConfigContract,
  ProviderConfigId,
  ProviderConfigValidationStatus,
  ProviderQuota,
  type ProviderQuota as ProviderQuotaContract,
  TenantId,
} from '@openlms/contracts';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { type ProviderConfigRow, providerConfig } from '../db/schema/provider-config.ts';

export type UpsertProviderConfigInput = {
  tenantId: string;
  providerType: AiProviderTypeContract;
  baseUrl: string | null;
  /**
   * The serialized encrypted API key to set, or `null` to keep the existing
   * key when updating. Creating a new row with `null` is rejected because the
   * column is NOT NULL.
   */
  encryptedApiKey: string | null;
  modelPreferences: ModelPreferences;
  capabilities: ProviderCapabilitiesContract;
  quota: ProviderQuotaContract;
};

const toProviderConfig = (row: ProviderConfigRow): ProviderConfigContract =>
  ProviderConfig.parse({
    id: row.id,
    tenantId: row.tenantId,
    providerType: row.providerType,
    baseUrl: row.baseUrl,
    encryptedApiKey: row.encryptedApiKey,
    modelPreferences: row.modelPreferences,
    capabilities: row.capabilities,
    quota: row.quota,
    validationStatus: row.validationStatus,
    validationError: row.validationError,
    validatedAt: row.validatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

export const upsertProviderConfig = async (
  db: Database,
  input: UpsertProviderConfigInput,
): Promise<ProviderConfigContract> => {
  const tenantId = TenantId.parse(input.tenantId);
  const baseUrl = input.baseUrl === null ? null : ProviderBaseUrl.parse(input.baseUrl);
  const parsedEncryptedApiKey =
    input.encryptedApiKey === null ? null : EncryptedApiKey.parse(input.encryptedApiKey);
  const providerType = AiProviderType.parse(input.providerType);
  const capabilities = ProviderCapabilities.parse(input.capabilities);
  const quota = ProviderQuota.parse(input.quota);
  const now = new Date();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ encryptedApiKey: providerConfig.encryptedApiKey })
      .from(providerConfig)
      .where(eq(providerConfig.tenantId, tenantId))
      .for('update')
      .limit(1);

    let encryptedApiKey: string;
    if (parsedEncryptedApiKey !== null) {
      encryptedApiKey = parsedEncryptedApiKey;
    } else if (existing) {
      encryptedApiKey = existing.encryptedApiKey;
    } else {
      throw new Error(
        'Provider config cannot be created without an encrypted API key — none was supplied.',
      );
    }

    const [row] = await tx
      .insert(providerConfig)
      .values({
        id: ProviderConfigId.parse(ulid()),
        tenantId,
        providerType,
        baseUrl,
        encryptedApiKey,
        modelPreferences: input.modelPreferences,
        capabilities,
        quota,
        validationStatus: 'pending',
        validationError: null,
        validatedAt: null,
      })
      .onConflictDoUpdate({
        target: providerConfig.tenantId,
        set: {
          providerType,
          baseUrl,
          encryptedApiKey,
          modelPreferences: input.modelPreferences,
          capabilities,
          quota,
          validationStatus: 'pending',
          validationError: null,
          validatedAt: null,
          updatedAt: now,
        },
      })
      .returning();

    if (!row) {
      throw new Error('Provider config could not be saved because the database returned no row.');
    }

    return toProviderConfig(row);
  });
};

export const getProviderConfigByTenantId = async (
  db: Database,
  tenantId: string,
): Promise<ProviderConfigContract | null> => {
  const [row] = await db
    .select()
    .from(providerConfig)
    .where(eq(providerConfig.tenantId, TenantId.parse(tenantId)))
    .limit(1);

  return row ? toProviderConfig(row) : null;
};

export type RecordProviderConfigValidationResultInput = {
  tenantId: string;
  validationStatus: 'valid' | 'invalid';
  validationError: string | null;
};

export const deleteProviderConfigByTenantId = async (
  db: Database,
  tenantId: string,
): Promise<boolean> => {
  const rows = await db
    .delete(providerConfig)
    .where(eq(providerConfig.tenantId, TenantId.parse(tenantId)))
    .returning({ id: providerConfig.id });

  return rows.length > 0;
};

export const recordProviderConfigValidationResult = async (
  db: Database,
  input: RecordProviderConfigValidationResultInput,
  validatedAt: Date,
): Promise<ProviderConfigContract> => {
  const validationStatus = ProviderConfigValidationStatus.parse(input.validationStatus);

  if (validationStatus === 'valid' && input.validationError) {
    throw new Error('Valid provider config results cannot include a validation error.');
  }

  if (validationStatus === 'invalid' && !input.validationError) {
    throw new Error('Invalid provider config results require a validation error.');
  }

  const [row] = await db
    .update(providerConfig)
    .set({
      validationStatus,
      validationError: input.validationError,
      validatedAt,
      updatedAt: validatedAt,
    })
    .where(eq(providerConfig.tenantId, TenantId.parse(input.tenantId)))
    .returning();

  if (!row) {
    throw new Error(
      'Provider config validation result could not be saved because it was not found.',
    );
  }

  return toProviderConfig(row);
};
