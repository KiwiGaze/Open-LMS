import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.ts';

export type Database = ReturnType<typeof createDb>;
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DatabaseExecutor = Database | DatabaseTransaction;

export type DatabaseHandle = {
  db: Database;
  close: () => Promise<void>;
};

export const createDb = (databaseUrl: string) => {
  const client = postgres(databaseUrl, { max: 10 });
  return drizzle(client, { schema, casing: 'snake_case' });
};

export const createDbHandle = (databaseUrl: string): DatabaseHandle => {
  const client = postgres(databaseUrl, { max: 10 });
  const db = drizzle(client, { schema, casing: 'snake_case' });

  return {
    db,
    close: () => client.end(),
  };
};
