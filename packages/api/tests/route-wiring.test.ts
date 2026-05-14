import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROUTES_DIR = join(__dirname, '..', 'src', 'routes');
const APP_TS = join(__dirname, '..', 'src', 'app.ts');

const ROUTE_EXPORT_PATTERN = /^export const (\w+Route)\s*=\s*createRoute\(/gm;
const OPENAPI_REGISTRATION_PATTERN = /app\.openapi\((\w+Route)/g;

const collectDeclaredRoutes = (): Set<string> => {
  const declared = new Set<string>();
  for (const entry of readdirSync(ROUTES_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
    const contents = readFileSync(join(ROUTES_DIR, entry.name), 'utf8');
    for (const match of contents.matchAll(ROUTE_EXPORT_PATTERN)) {
      const name = match[1];
      if (name) declared.add(name);
    }
  }
  return declared;
};

const collectWiredRoutes = (): Set<string> => {
  const wired = new Set<string>();
  const contents = readFileSync(APP_TS, 'utf8');
  for (const match of contents.matchAll(OPENAPI_REGISTRATION_PATTERN)) {
    const name = match[1];
    if (name) wired.add(name);
  }
  return wired;
};

describe('route wiring audit', () => {
  // Every `createRoute(...)` exported from `src/routes/*.ts` must be
  // registered in `src/app.ts` via `app.openapi(...)`. The issue that
  // motivated this guard found 64 routes declared-but-not-served, which
  // either leaked dead types into `openapi/openapi.json` or shipped 404s to
  // the frontend. Treat any new unwired route as a build failure.
  it('every exported route is registered in app.ts', () => {
    const declared = collectDeclaredRoutes();
    const wired = collectWiredRoutes();

    const unwired = [...declared].filter((name) => !wired.has(name)).sort();
    expect(unwired).toEqual([]);
  });

  it('every wired route name exists as an export', () => {
    const declared = collectDeclaredRoutes();
    const wired = collectWiredRoutes();

    const ghost = [...wired].filter((name) => !declared.has(name)).sort();
    expect(ghost).toEqual([]);
  });
});
