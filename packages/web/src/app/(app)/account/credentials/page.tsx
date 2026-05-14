'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useMyCredentialAwardsQuery } from '@/lib/api/queries/credentials.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { Award } from 'lucide-react';

export default function MyCredentialsPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const credentials = useMyCredentialAwardsQuery(tenantId);

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-(--color-text-muted)">
          Select a tenant from the navigation to see your credentials.
        </CardContent>
      </Card>
    );
  }
  if (credentials.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }
  if (credentials.error) {
    return <ErrorState error={credentials.error} onRetry={() => credentials.refetch()} />;
  }

  const items = credentials.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Account"
        title="My credentials"
        description="Badges and certificates you've earned across this tenant."
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No credentials yet"
          description="Credentials you earn from your courses will appear here."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map(({ award, credential }) => (
            <li key={award.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Award className="size-4 text-(--color-text-muted)" aria-hidden />
                        {credential.title}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {credential.credentialType}
                      </CardDescription>
                    </div>
                    <Badge tone={award.status === 'revoked' ? 'danger' : 'success'}>
                      {award.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm text-(--color-text-default)">
                  {credential.description ? (
                    <p className="text-(--color-text-muted)">{credential.description}</p>
                  ) : null}
                  <p className="text-xs text-(--color-text-muted)">
                    <span className="font-medium text-(--color-text-default)">Criteria:</span>{' '}
                    {credential.criteriaSummary}
                  </p>
                  <dl className="grid grid-cols-2 gap-1 text-xs">
                    <dt className="text-(--color-text-muted)">Issued</dt>
                    <dd className="text-right text-(--color-text-default)">
                      {formatDateTime(award.issuedAt)}
                    </dd>
                    {award.revokedAt ? (
                      <>
                        <dt className="text-(--color-text-muted)">Revoked</dt>
                        <dd className="text-right text-(--color-text-default)">
                          {formatDateTime(award.revokedAt)}
                        </dd>
                      </>
                    ) : null}
                    {award.expiresAt ? (
                      <>
                        <dt className="text-(--color-text-muted)">Expires</dt>
                        <dd className="text-right text-(--color-text-default)">
                          {formatDateTime(award.expiresAt)}
                        </dd>
                      </>
                    ) : null}
                  </dl>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
