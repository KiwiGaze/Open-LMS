'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { AuditLog } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { Download, Search, Shield } from 'lucide-react';
import { useState } from 'react';

export default function AuditLogsPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const [search, setSearch] = useState('');

  const logs = useQuery({
    queryKey: tenantId ? queryKeys.auditLogs(tenantId) : ['audit', 'inactive'],
    queryFn: () => apiFetch<AuditLog[]>(`/tenants/${tenantId}/audit-logs`),
    enabled: Boolean(tenantId),
  });

  const filtered = (logs.data ?? []).filter((log) => {
    if (!search.trim()) return true;
    const hay =
      `${log.action} ${log.actorId ?? ''} ${log.resourceType ?? ''} ${log.resourceId ?? ''}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="Audit logs"
        description="Every meaningful state change for accountability and compliance."
        actions={
          <Button intent="secondary" asChild>
            <a href={`/api/v1/tenants/${tenantId}/audit-logs/export.csv`} download>
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
          </Button>
        }
      />

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-muted)"
          aria-hidden
        />
        <Input
          placeholder="Search by action, actor, or resource..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          type="search"
        />
      </div>

      {logs.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[var(--radius-md)]" />
      ) : logs.error ? (
        <ErrorState error={logs.error} onRetry={() => logs.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Shield}
          title={logs.data?.length === 0 ? 'No audit entries' : 'No matches'}
          description={
            logs.data?.length === 0
              ? 'Audit activity will appear here as it happens.'
              : 'Try a different query.'
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 160 }}>When</TableHead>
              <TableHead style={{ width: 110 }}>Category</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Actor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-(--color-text-muted) text-xs">
                  {formatDateTime(log.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge tone="brand">{log.category}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-(--color-text-default)">
                  {log.action}
                </TableCell>
                <TableCell className="font-mono text-xs text-(--color-text-muted)">
                  {log.resourceType ?? '—'}
                  {log.resourceId ? ` · ${log.resourceId.slice(-8)}` : ''}
                </TableCell>
                <TableCell className="font-mono text-xs text-(--color-text-muted)">
                  {log.actorId ? log.actorId.slice(-12) : 'system'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
