'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useMyPushTokensQuery,
  useRevokeMyPushTokenMutation,
} from '@/lib/api/queries/push-tokens.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { Smartphone } from 'lucide-react';

export default function MyDevicesPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const tokens = useMyPushTokensQuery(tenantId);
  const revoke = useRevokeMyPushTokenMutation(tenantId);
  const { publish } = useToast();

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-(--color-text-muted)">
          Select a tenant from the navigation to manage your devices.
        </CardContent>
      </Card>
    );
  }
  if (tokens.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (tokens.error) {
    return <ErrorState error={tokens.error} onRetry={() => tokens.refetch()} />;
  }

  const items = tokens.data ?? [];

  const handleRevoke = async (tokenId: string) => {
    try {
      await revoke.mutateAsync(tokenId);
      publish({ tone: 'success', title: 'Device removed' });
    } catch (error) {
      publish({
        tone: 'danger',
        title: 'Revoke failed',
        description: error instanceof ApiHttpError ? error.message : 'Could not remove device.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Account"
        title="Devices"
        description="Mobile and web devices registered for push notifications. Revoking a device stops further notifications until it registers again."
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Smartphone}
          title="No registered devices"
          description="Sign in on a mobile or web app to receive push notifications."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((token) => (
            <li key={token.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Smartphone className="size-4 text-(--color-text-muted)" aria-hidden />
                        <span className="capitalize">{token.platform}</span>
                        {token.appVersion ? (
                          <Badge tone="outline">v{token.appVersion}</Badge>
                        ) : null}
                      </CardTitle>
                      <CardDescription>
                        Last active {formatDateTime(token.lastUsedAt)}
                        {token.locale ? <> · Locale {token.locale}</> : null}
                      </CardDescription>
                      <p className="mt-1 text-xs text-(--color-text-muted)">
                        Registered {formatDateTime(token.createdAt)}
                      </p>
                    </div>
                    <Button
                      intent="danger"
                      size="sm"
                      onClick={() => handleRevoke(token.id)}
                      disabled={revoke.isPending}
                    >
                      Revoke
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
