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
import { useExternalToolsQuery, useStartLtiLaunch } from '@/lib/api/queries/lti.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import type { CourseExternalTool } from '@openlms/contracts';
import { ExternalLink, Plug } from 'lucide-react';
import { use } from 'react';

type Params = { courseId: string };

export default function ExternalToolsPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const tools = useExternalToolsQuery(tenantId, courseId);
  const launch = useStartLtiLaunch(tenantId, courseId);
  const { publish } = useToast();

  const handleLaunch = (tool: CourseExternalTool) => {
    launch.mutate(tool.id, {
      onSuccess: (initiation) => {
        if (initiation.method === 'redirect') {
          window.location.assign(initiation.url);
          return;
        }
        publish({
          tone: 'warning',
          title: 'Unexpected launch response',
          description: 'The tool did not return a redirect. Contact your instructor.',
        });
      },
      onError: (error) => {
        const message =
          error instanceof ApiHttpError ? error.message : 'The launch could not start.';
        publish({ tone: 'danger', title: 'Launch failed', description: message });
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="External tools"
        description="LTI 1.3 tools wired into this course. Launching opens the tool in this tab via the OIDC handshake."
      />

      {tools.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`tool-${i}`} className="h-28 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : tools.error ? (
        <ErrorState error={tools.error} onRetry={() => tools.refetch()} />
      ) : (tools.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Plug}
          title="No external tools yet"
          description="An admin can register an LTI 1.3 tool from tenant admin, then place it in this course."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {(tools.data ?? [])
            .filter((t) => t.status === 'active')
            .map((tool) => (
              <li key={tool.id}>
                <Card>
                  <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
                    <div>
                      <CardTitle className="text-base">{tool.name}</CardTitle>
                      {tool.description ? (
                        <CardDescription>{tool.description}</CardDescription>
                      ) : (
                        <CardDescription>
                          Placement: {tool.placement.replace(/_/g, ' ')}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="outline">{tool.placement.replace(/_/g, ' ')}</Badge>
                      <Button
                        onClick={() => handleLaunch(tool)}
                        loading={launch.isPending && launch.variables === tool.id}
                      >
                        <ExternalLink className="size-4" aria-hidden /> Launch
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-(--color-text-muted)">
                    {tool.launchUrl}
                  </CardContent>
                </Card>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
