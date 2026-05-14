import {
  ExportJobRecord,
  type ExportJobRecord as ExportJobRecordContract,
} from '@openlms/contracts';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { exportJob } from '../db/schema/data-export.ts';

export const saveExportJob = async (
  db: Database,
  value: ExportJobRecordContract,
): Promise<ExportJobRecordContract> => {
  const parsed = ExportJobRecord.parse(value);
  const [row] = await db.insert(exportJob).values(parsed).returning();

  if (!row) {
    throw new Error('Export job could not be saved because the database returned no row.');
  }

  return ExportJobRecord.parse(row);
};

export const getExportJobById = async (
  db: Database,
  tenantId: string,
  exportJobId: string,
): Promise<ExportJobRecordContract | null> => {
  const [row] = await db
    .select()
    .from(exportJob)
    .where(and(eq(exportJob.tenantId, tenantId), eq(exportJob.id, exportJobId)))
    .limit(1);

  return row ? ExportJobRecord.parse(row) : null;
};

export const listExportJobsForTenant = async (
  db: Database,
  tenantId: string,
): Promise<ExportJobRecordContract[]> => {
  const rows = await db
    .select()
    .from(exportJob)
    .where(eq(exportJob.tenantId, tenantId))
    .orderBy(exportJob.createdAt);

  return rows.map((row) => ExportJobRecord.parse(row));
};
