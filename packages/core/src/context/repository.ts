import { ContextPackage, type ContextPackage as ContextPackageContract } from '@openlms/contracts';
import type { Database } from '../db/client.ts';
import { contextPackage } from '../db/schema/context-package.ts';

export const saveContextPackage = async (
  db: Database,
  value: ContextPackageContract,
): Promise<ContextPackageContract> => {
  const parsed = ContextPackage.parse(value);
  const [row] = await db.insert(contextPackage).values(parsed).returning();

  if (!row) {
    throw new Error('Context package could not be saved because the database returned no row.');
  }

  return ContextPackage.parse(row);
};
