'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import {
  useNotificationPreferencesQuery,
  useUpsertNotificationPreferenceMutation,
} from '@/lib/api/queries/notifications.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
} from '@openlms/contracts';

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  feedback_published: 'Feedback published',
  ai_generation_ready: 'AI generation ready',
  review_requested: 'Review requested',
  grade_published: 'Grade published',
  announcement_published: 'Announcement published',
  discussion_reply: 'Discussion reply',
  calendar_reminder: 'Calendar reminder',
  system: 'System',
};

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  in_app: 'In app',
  email: 'Email',
  push: 'Push',
};

const FREQUENCY_LABEL: Record<NotificationFrequency, string> = {
  immediate: 'Immediate',
  daily_digest: 'Daily digest',
  weekly_digest: 'Weekly digest',
  off: 'Off',
};

export default function NotificationPreferencesPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const prefs = useNotificationPreferencesQuery(tenantId);
  const upsert = useUpsertNotificationPreferenceMutation(tenantId);

  const findFrequency = (
    category: NotificationCategory,
    channel: NotificationChannel,
  ): NotificationFrequency | null =>
    prefs.data?.find((p) => p.category === category && p.channel === channel)?.frequency ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Choose how you'd like to be told about activity in your courses."
      />

      {prefs.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`pref-skel-${i}`} className="h-44 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : prefs.error ? (
        <ErrorState error={prefs.error} onRetry={() => prefs.refetch()} />
      ) : (
        <div className="grid gap-3">
          {NotificationCategory.options.map((category) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{CATEGORY_LABEL[category]}</CardTitle>
                <CardDescription>
                  Set delivery frequency per channel. Selecting a value overrides the tenant default
                  for that channel.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {NotificationChannel.options.map((channel) => {
                  const current = findFrequency(category, channel);
                  const fieldId = `pref-${category}-${channel}`;
                  return (
                    <div key={channel} className="flex flex-col gap-1.5">
                      <Label htmlFor={fieldId}>{CHANNEL_LABEL[channel]}</Label>
                      <Select
                        value={current ?? undefined}
                        onValueChange={(value) =>
                          upsert.mutate({
                            category,
                            channel,
                            frequency: value as NotificationFrequency,
                          })
                        }
                        disabled={upsert.isPending || !tenantId}
                      >
                        <SelectTrigger
                          id={fieldId}
                          aria-label={`${CATEGORY_LABEL[category]} via ${CHANNEL_LABEL[channel]}`}
                        >
                          <SelectValue placeholder="Default" />
                        </SelectTrigger>
                        <SelectContent>
                          {NotificationFrequency.options.map((freq) => (
                            <SelectItem key={freq} value={freq}>
                              {FREQUENCY_LABEL[freq]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
