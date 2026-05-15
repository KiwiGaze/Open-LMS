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
import { useScormPackagesQuery } from '@/lib/api/queries/scorm.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { Box, Play, Plus } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { RegisterScormPackageDialog } from './register-dialog.tsx';

type Params = { courseId: string };

export default function ScormPackagesPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const packages = useScormPackagesQuery(tenantId, courseId);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="SCORM packages"
        description="Self-contained learning modules. Launch one to track completion and score."
        actions={
          <Button onClick={() => setRegisterOpen(true)}>
            <Plus className="size-4" aria-hidden /> Register package
          </Button>
        }
      />

      {packages.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`scorm-${i}`} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : packages.error ? (
        <ErrorState error={packages.error} onRetry={() => packages.refetch()} />
      ) : (packages.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Box}
          title="No SCORM packages yet"
          description="An instructor can upload a SCORM package to add interactive modules to this course."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {(packages.data ?? [])
            .filter((p) => p.status === 'published' || p.status === 'draft')
            .map((p) => (
              <li key={p.id}>
                <Card>
                  <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
                    <div>
                      <CardTitle className="text-base">{p.title}</CardTitle>
                      <CardDescription>SCORM {p.scormVersion}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={p.status === 'published' ? 'success' : 'neutral'}>
                        {p.status}
                      </Badge>
                      <Button asChild>
                        <Link href={`/courses/${courseId}/scorm-packages/${p.id}`}>
                          <Play className="size-4" aria-hidden /> Launch
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-(--color-text-muted)" />
                </Card>
              </li>
            ))}
        </ul>
      )}

      <RegisterScormPackageDialog
        tenantId={tenantId}
        courseId={courseId}
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />
    </div>
  );
}
