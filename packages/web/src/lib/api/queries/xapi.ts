'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import type { XapiStatement, XapiStatementIngest } from '@openlms/contracts';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

type XapiObject = { id: string; definition?: Record<string, unknown> };

type EmitOptions = {
  verb: { id: string; display?: Record<string, string> };
  object: XapiObject;
  result?: Record<string, unknown>;
  context?: Record<string, unknown>;
};

function actorHomePage(): string {
  if (typeof globalThis !== 'undefined' && 'location' in globalThis) {
    return (globalThis as { location: { origin: string } }).location.origin;
  }
  // Non-browser fallback (tests, server-rendered pre-hydration). The backend
  // ignores this field for identity purposes and only uses it to namespace the
  // account.
  return 'urn:openlms:account';
}

function buildStatement(
  user: { id: string; email: string; name: string | null },
  options: EmitOptions,
): XapiStatementIngest {
  return {
    actor: {
      objectType: 'Agent',
      account: { homePage: actorHomePage(), name: user.id },
      name: user.name ?? user.email,
    },
    verb: options.verb,
    object: options.object,
    ...(options.result ? { result: options.result } : {}),
    ...(options.context ? { context: options.context } : {}),
    timestamp: new Date().toISOString(),
  };
}

export function useXapiEmitter() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const user = useSessionStore((s) => s.user);

  const mutation = useMutation({
    mutationFn: (statement: XapiStatementIngest) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot emit xAPI statement.'));
      }
      return apiFetch<XapiStatement>(`/tenants/${tenantId}/xapi/statements`, {
        method: 'POST',
        body: statement,
        // Let the statement complete if the user navigates away mid-emit
        // (especially common for resource opens that target _blank).
        keepalive: true,
      });
    },
  });

  const emit = useCallback(
    (options: EmitOptions) => {
      if (!tenantId || !user) return;
      mutation.mutate(buildStatement(user, options));
    },
    [tenantId, user, mutation],
  );

  return emit;
}
