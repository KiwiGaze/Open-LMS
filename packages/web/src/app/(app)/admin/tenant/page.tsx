'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDate } from '@/lib/format.ts';
import type { Tenant } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { Building2, Settings } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function TenantAdminPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const tenants = useQuery({
    queryKey: queryKeys.tenants(),
    queryFn: () => apiFetch<Tenant[]>('/tenants'),
  });

  const active = tenants.data?.find((t) => t.id === tenantId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="Tenant settings"
        description="Identity, lifecycle, and member-level controls for your institution."
      />

      {tenants.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : tenants.error ? (
        <ErrorState error={tenants.error} onRetry={() => tenants.refetch()} />
      ) : !active ? (
        <EmptyState
          icon={Building2}
          title="No tenant selected"
          description="Switch to a tenant to manage its settings."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Institution</CardTitle>
              <CardDescription>Basic identity for the tenant.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <Field label="Display name" value={active.displayName} />
              <Field label="Slug" value={active.slug} />
              <Field
                label="Tenant ID"
                value={<code className="font-mono text-xs">{active.id}</code>}
              />
              <Field label="Created" value={formatDate(active.createdAt)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
              <CardDescription>Common administrative actions.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild intent="ghost" className="justify-start">
                <Link href="/admin/providers">
                  <Settings className="size-4" aria-hidden /> AI providers
                </Link>
              </Button>
              <Button asChild intent="ghost" className="justify-start">
                <Link href="/admin/ai-usage">
                  <Settings className="size-4" aria-hidden /> AI usage
                </Link>
              </Button>
              <Button asChild intent="ghost" className="justify-start">
                <Link href="/admin/audit-logs">
                  <Settings className="size-4" aria-hidden /> Audit logs
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">{label}</dt>
      <dd className="text-(--color-text-default)">{value}</dd>
    </div>
  );
}
