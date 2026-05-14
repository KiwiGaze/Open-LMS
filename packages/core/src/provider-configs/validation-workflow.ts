import type {
  AuditLog,
  OutboxEvent,
  ProviderConfig,
  ProviderConfigValidationStatus,
} from '@openlms/contracts';
import {
  buildProviderConfigValidationAuditLog,
  buildProviderConfigValidationEvent,
} from '../events/audit-outbox.ts';

export type RecordProviderConfigValidationRequest = {
  tenantId: string;
  actorId: string;
  validationStatus: Extract<ProviderConfigValidationStatus, 'valid' | 'invalid'>;
  validationError: string | null;
  now: Date;
};

export type RecordProviderConfigValidationPorts = {
  recordValidationResult: (input: {
    tenantId: string;
    validationStatus: Extract<ProviderConfigValidationStatus, 'valid' | 'invalid'>;
    validationError: string | null;
    validatedAt: Date;
  }) => Promise<ProviderConfig>;
  saveAuditLog: (auditLog: AuditLog) => Promise<void>;
  saveOutboxEvent: (event: OutboxEvent) => Promise<void>;
};

export type RecordProviderConfigValidationResult = {
  providerConfig: ProviderConfig;
};

export const recordProviderConfigValidation = async (
  request: RecordProviderConfigValidationRequest,
  ports: RecordProviderConfigValidationPorts,
): Promise<RecordProviderConfigValidationResult> => {
  const providerConfig = await ports.recordValidationResult({
    tenantId: request.tenantId,
    validationStatus: request.validationStatus,
    validationError: request.validationError,
    validatedAt: request.now,
  });

  if (providerConfig.tenantId !== request.tenantId) {
    throw new Error('Provider config validation returned a record for a different tenant.');
  }

  const eventInput = {
    tenantId: request.tenantId,
    providerConfigId: providerConfig.id,
    providerType: providerConfig.providerType,
    validationStatus: providerConfig.validationStatus,
    validationError: providerConfig.validationError,
  };

  await ports.saveAuditLog(
    buildProviderConfigValidationAuditLog(
      {
        ...eventInput,
        actorId: request.actorId,
      },
      request.now,
    ),
  );
  await ports.saveOutboxEvent(buildProviderConfigValidationEvent(eventInput, request.now));

  return { providerConfig };
};
