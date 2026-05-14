import { AuditLog, type AuditLog as AuditLogContract } from '@openlms/contracts';

const csvHeaders = [
  'id',
  'tenant_id',
  'actor_id',
  'category',
  'action',
  'resource_type',
  'resource_id',
  'metadata',
  'created_at',
];

const toCsvValue = (value: string | null): string => {
  if (value === null) {
    return '';
  }

  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
};

const toExportValues = (log: AuditLogContract): (string | null)[] => [
  log.id,
  log.tenantId,
  log.actorId,
  log.category,
  log.action,
  log.resourceType,
  log.resourceId,
  JSON.stringify(log.metadata),
  log.createdAt.toISOString(),
];

export const serializeAuditLogsAsCsv = (logs: AuditLogContract[]): string => {
  const body = logs
    .map((log) => AuditLog.parse(log))
    .map((log) => toExportValues(log).map(toCsvValue).join(','));

  return [csvHeaders.join(','), ...body].join('\n');
};
