import { serve } from '@hono/node-server';
import { createApiApp } from './app.ts';
import { createApiDependencies } from './dependencies.ts';

export type ServerEnvironment = {
  PORT?: string;
  DATABASE_CONNECTION_STRING?: string;
};

export const readServerPort = (environment: ServerEnvironment): number => {
  if (!environment.PORT) {
    return 3000;
  }

  if (!/^[1-9]\d*$/.test(environment.PORT)) {
    throw new Error('PORT must be a positive integer.');
  }

  const port = Number(environment.PORT);
  if (port > 65535) {
    throw new Error('PORT must be between 1 and 65535.');
  }

  return port;
};

export const startServer = (environment: ServerEnvironment): void => {
  const port = readServerPort(environment);
  const dependencies = createApiDependencies(environment);
  const app = createApiApp({ dependencies });

  serve({ fetch: app.fetch, port });
  console.log(`Open-LMS API listening on http://localhost:${port}`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer(process.env);
}
