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
  useUpdateTenantMembershipMutation,
} from '@/lib/api/queries/tenant-members.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDate } from '@/lib/format.ts';
import type { Tenant, TenantRole } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { Building2, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

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
