import pino from 'pino';

export const createLogger = (name: string) =>
  pino({
    name,
    level: process.env.LOG_LEVEL ?? 'info',
    redact: {
      paths: ['apiKey', 'authorization', '*.apiKey', '*.authorization'],
      remove: true,
    },
  });
