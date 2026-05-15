'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
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
import { Input } from '@/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import {
  useTenantMembersQuery,
  useUpdateTenantFileStorageQuotasMutation,
  useUpdateTenantMembershipMutation,
} from '@/lib/api/queries/tenant-members.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDate } from '@/lib/format.ts';
import type { Tenant, TenantRole } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { Building2, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';

const TENANT_ROLES: TenantRole[] = [
  'student',
  'instructor',
  'teaching_assistant',
  'course_admin',
  'institution_admin',
];

export default function TenantAdminPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();

  const tenants = useQuery({
    queryKey: queryKeys.tenants(),
    queryFn: () => apiFetch<Tenant[]>('/tenants'),
  });

  const active = tenants.data?.find((t) => t.id === tenantId);
  const members = useTenantMembersQuery(tenantId);
  const updateMembership = useUpdateTenantMembershipMutation(tenantId);

  const onRoleChange = (membershipId: string, role: TenantRole) => {
    updateMembership.mutate(
      { membershipId, role },
      {
        onSuccess: () => publish({ tone: 'success', title: 'Role updated' }),
        onError: (error) =>
          publish({
            tone: 'danger',
            title: 'Update failed',
            description: error instanceof Error ? error.message : undefined,
          }),
      },
    );
  };

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
        <div className="flex flex-col gap-4">
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

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Tenant memberships. Changing a role takes effect immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : members.error ? (
                <ErrorState error={members.error} onRetry={() => members.refetch()} />
              ) : (members.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No members yet"
                  description="Invite users to this tenant from the onboarding flow."
                />
              ) : (
                <ul className="flex flex-col divide-y divide-(--color-border-subtle)">
                  {members.data?.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <code className="font-mono text-xs text-(--color-text-default)">
                          {m.userId}
                        </code>
                        <p className="mt-0.5 text-xs text-(--color-text-muted)">
                          Joined {formatDate(m.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="brand">{m.role}</Badge>
                        <Select
                          value={m.role}
                          onValueChange={(value) => onRoleChange(m.id, value as TenantRole)}
                          disabled={updateMembership.isPending}
                        >
                          <SelectTrigger aria-label="Change role" className="w-44 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TENANT_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <FileStorageQuotasCard tenantId={tenantId} tenant={active} />
        </div>
      )}
    </div>
  );
}

function FileStorageQuotasCard({
  tenantId,
  tenant,
}: {
  tenantId: string | null;
  tenant: Tenant;
}) {
  const { publish } = useToast();
  const update = useUpdateTenantFileStorageQuotasMutation(tenantId);
  const [tenantLimit, setTenantLimit] = useState(bytesToMb(tenant.storageByteLimit));
  const [userLimit, setUserLimit] = useState(bytesToMb(tenant.defaultUserStorageByteLimit));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTenantLimit(bytesToMb(tenant.storageByteLimit));
    setUserLimit(bytesToMb(tenant.defaultUserStorageByteLimit));
  }, [tenant.storageByteLimit, tenant.defaultUserStorageByteLimit]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const tenantBytes = mbToBytes(tenantLimit);
    const userBytes = mbToBytes(userLimit);
    if (tenantBytes === 'invalid' || userBytes === 'invalid') {
      setError('Enter a non-negative number of megabytes, or leave blank for unlimited.');
      return;
    }
    update.mutate(
      { storageByteLimit: tenantBytes, defaultUserStorageByteLimit: userBytes },
      {
        onSuccess: () => publish({ tone: 'success', title: 'Quotas updated' }),
        onError: (e) =>
          publish({
            tone: 'danger',
            title: 'Update failed',
            description: e instanceof Error ? e.message : undefined,
          }),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>File storage quotas</CardTitle>
        <CardDescription>
          Caps the total bytes the tenant and each user can store. Leave blank for unlimited.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField label="Tenant total (MB)" id="quota-tenant" error={error}>
            <Input
              id="quota-tenant"
              type="number"
              min={0}
              step={1}
              value={tenantLimit}
              onChange={(e) => setTenantLimit(e.target.value)}
              placeholder="Unlimited"
            />
          </FormField>
          <FormField label="Default per-user (MB)" id="quota-user">
            <Input
              id="quota-user"
              type="number"
              min={0}
              step={1}
              value={userLimit}
              onChange={(e) => setUserLimit(e.target.value)}
              placeholder="Unlimited"
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending} loading={update.isPending}>
              Save quotas
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function bytesToMb(bytes: number | null): string {
  if (bytes == null) return '';
  const mb = bytes / 1024 / 1024;
  return Number.isInteger(mb) ? String(mb) : mb.toFixed(2);
}

function mbToBytes(value: string): number | null | 'invalid' {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const mb = Number(trimmed);
  if (!Number.isFinite(mb) || mb < 0) return 'invalid';
  return Math.round(mb * 1024 * 1024);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">{label}</dt>
      <dd className="text-(--color-text-default)">{value}</dd>
    </div>
  );
}
