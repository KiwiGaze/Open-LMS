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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  type CreateWebhookSubscriptionInput,
  useCreateWebhookSubscriptionMutation,
  useDeleteWebhookSubscriptionMutation,
  useUpdateWebhookSubscriptionMutation,
  useWebhookSubscriptionsQuery,
} from '@/lib/api/queries/webhook-subscriptions.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { WebhookSubscription } from '@openlms/contracts';
import { Plus, Trash2, Webhook } from 'lucide-react';
import { useState } from 'react';

const TOPIC_REGEX = /^[a-z][a-z0-9_.:-]*$/;

type FormErrors = Partial<Record<'name' | 'endpointUrl' | 'topics' | 'signingSecret', string>>;

type EditableState = {
  name: string;
  endpointUrl: string;
  topics: string;
  signingSecret: string;
  enabled: boolean;
};

const validate = (
  state: EditableState,
  isCreating: boolean,
): { errors: FormErrors; topicList: string[] } => {
  const errors: FormErrors = {};
  if (state.name.trim() === '') errors.name = 'Required.';
  try {
    const parsed = new URL(state.endpointUrl.trim());
    if (parsed.protocol !== 'https:') {
      errors.endpointUrl = 'Must use HTTPS.';
    }
  } catch {
    errors.endpointUrl = 'Must be a valid HTTPS URL.';
  }
  const topicList = state.topics
    .split(',')
    .map((topic) => topic.trim())
    .filter((topic) => topic.length > 0);
  if (topicList.length === 0) errors.topics = 'At least one topic is required.';
  for (const topic of topicList) {
    if (!TOPIC_REGEX.test(topic)) {
      errors.topics = `"${topic}" is not a valid topic (lowercase letters/numbers/punctuation).`;
      break;
    }
  }
  if (isCreating && state.signingSecret.trim() === '')
    errors.signingSecret = 'Signing secret is required when creating.';
  return { errors, topicList };
};

const emptyForm = (): EditableState => ({
  name: '',
  endpointUrl: '',
  topics: '',
  signingSecret: '',
  enabled: true,
});

export default function AdminWebhooksPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const subscriptions = useWebhookSubscriptionsQuery(tenantId);
  const create = useCreateWebhookSubscriptionMutation(tenantId);
  const update = useUpdateWebhookSubscriptionMutation(tenantId);
  const remove = useDeleteWebhookSubscriptionMutation(tenantId);
  const { publish } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<WebhookSubscription | null>(null);

  if (subscriptions.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (subscriptions.error) {
    return <ErrorState error={subscriptions.error} onRetry={() => subscriptions.refetch()} />;
  }

  const items = subscriptions.data ?? [];

  const handleToggle = async (sub: WebhookSubscription, next: boolean) => {
    try {
      await update.mutateAsync({
        id: sub.id,
        name: sub.name,
        endpointUrl: sub.endpointUrl,
        topics: sub.topics,
        status: next ? 'enabled' : 'disabled',
      });
      publish({ tone: 'success', title: next ? 'Webhook enabled' : 'Webhook disabled' });
    } catch (error) {
      publish({
        tone: 'danger',
        title: 'Toggle failed',
        description:
          error instanceof ApiHttpError ? error.message : 'Could not update webhook status.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      publish({ tone: 'success', title: 'Webhook removed' });
    } catch (error) {
      publish({
        tone: 'danger',
        title: 'Delete failed',
        description: error instanceof ApiHttpError ? error.message : 'Could not delete webhook.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="Webhook subscriptions"
        description="HTTPS endpoints that receive outbound event deliveries (grades, assignment feedback, etc). Each subscription is signed with the shared secret you provide."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button intent="primary" size="sm">
                <Plus className="size-3.5" aria-hidden /> Add webhook
              </Button>
            </DialogTrigger>
            <WebhookFormDialog
              title="New webhook subscription"
              description="Configure the endpoint, topics, and shared secret. Endpoints must use HTTPS."
              initialState={emptyForm()}
              isCreating
              busy={create.isPending}
              onSubmit={async (state, topicList) => {
                const payload: CreateWebhookSubscriptionInput = {
                  name: state.name.trim(),
                  endpointUrl: state.endpointUrl.trim(),
                  topics: topicList,
                  status: state.enabled ? 'enabled' : 'disabled',
                  signingSecret: state.signingSecret.trim(),
                };
                try {
                  await create.mutateAsync(payload);
                  publish({ tone: 'success', title: 'Webhook created' });
                  setCreateOpen(false);
                  return true;
                } catch (error) {
                  publish({
                    tone: 'danger',
                    title: 'Create failed',
                    description:
                      error instanceof ApiHttpError ? error.message : 'Could not create webhook.',
                  });
                  return false;
                }
              }}
              onCancel={() => setCreateOpen(false)}
            />
          </Dialog>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title="No webhook subscriptions"
          description="Add a subscription to forward outbox events to an external system."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((sub) => (
            <li key={sub.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Webhook className="size-4 text-(--color-text-muted)" aria-hidden />
                        {sub.name}
                        <Badge tone={sub.status === 'enabled' ? 'success' : 'neutral'}>
                          {sub.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        <code className="text-xs">{sub.endpointUrl}</code>
                      </CardDescription>
                      <p className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                        <span className="text-(--color-text-muted)">Topics:</span>
                        {sub.topics.map((topic) => (
                          <Badge key={topic} tone="outline" className="text-2xs">
                            {topic}
                          </Badge>
                        ))}
                      </p>
                      <p className="mt-1 text-xs text-(--color-text-muted)">
                        Last changed {formatDateTime(sub.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={sub.status === 'enabled'}
                        onCheckedChange={(next) => handleToggle(sub, next)}
                        disabled={update.isPending}
                        aria-label={
                          sub.status === 'enabled' ? `Disable ${sub.name}` : `Enable ${sub.name}`
                        }
                      />
                      <Button intent="secondary" size="sm" onClick={() => setEditing(sub)}>
                        Edit
                      </Button>
                      <Button
                        intent="danger"
                        size="sm"
                        onClick={() => handleDelete(sub.id)}
                        disabled={remove.isPending}
                        aria-label={`Delete ${sub.name}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <WebhookFormDialog
            title="Edit webhook subscription"
            description="Update the endpoint, topics, or status. Leave the signing secret blank to keep the current one; provide a new value to rotate."
            initialState={{
              name: editing.name,
              endpointUrl: editing.endpointUrl,
              topics: editing.topics.join(', '),
              signingSecret: '',
              enabled: editing.status === 'enabled',
            }}
            isCreating={false}
            busy={update.isPending}
            onSubmit={async (state, topicList) => {
              try {
                await update.mutateAsync({
                  id: editing.id,
                  name: state.name.trim(),
                  endpointUrl: state.endpointUrl.trim(),
                  topics: topicList,
                  status: state.enabled ? 'enabled' : 'disabled',
                  ...(state.signingSecret.trim() !== ''
                    ? { signingSecret: state.signingSecret.trim() }
                    : {}),
                });
                publish({ tone: 'success', title: 'Webhook updated' });
                setEditing(null);
                return true;
              } catch (error) {
                publish({
                  tone: 'danger',
                  title: 'Update failed',
                  description:
                    error instanceof ApiHttpError ? error.message : 'Could not update webhook.',
                });
                return false;
              }
            }}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

function WebhookFormDialog({
  title,
  description,
  initialState,
  isCreating,
  busy,
  onSubmit,
  onCancel,
}: {
  title: string;
  description: string;
  initialState: EditableState;
  isCreating: boolean;
  busy: boolean;
  onSubmit: (state: EditableState, topicList: string[]) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [state, setState] = useState<EditableState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});

  const submit = async () => {
    const { errors: next, topicList } = validate(state, isCreating);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const ok = await onSubmit(state, topicList);
    if (ok) {
      setState(initialState);
      setErrors({});
    }
  };

  const setField = <K extends keyof EditableState>(key: K, value: EditableState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        <div>
          <Label htmlFor="webhook-name">Name</Label>
          <Input
            id="webhook-name"
            value={state.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'webhook-name-error' : undefined}
            onChange={(e) => setField('name', e.target.value)}
          />
          {errors.name ? (
            <p id="webhook-name-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="webhook-endpoint">Endpoint URL</Label>
          <Input
            id="webhook-endpoint"
            type="url"
            placeholder="https://hooks.example.edu/open-lms"
            value={state.endpointUrl}
            aria-invalid={Boolean(errors.endpointUrl)}
            aria-describedby={errors.endpointUrl ? 'webhook-endpoint-error' : undefined}
            onChange={(e) => setField('endpointUrl', e.target.value)}
          />
          {errors.endpointUrl ? (
            <p id="webhook-endpoint-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.endpointUrl}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="webhook-topics">Topics</Label>
          <Input
            id="webhook-topics"
            placeholder="grade.lifecycle, assignment.feedback"
            value={state.topics}
            aria-invalid={Boolean(errors.topics)}
            aria-describedby={errors.topics ? 'webhook-topics-error' : 'webhook-topics-hint'}
            onChange={(e) => setField('topics', e.target.value)}
          />
          {errors.topics ? (
            <p id="webhook-topics-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.topics}
            </p>
          ) : (
            <p id="webhook-topics-hint" className="mt-1 text-xs text-(--color-text-muted)">
              Comma-separated lowercase topics (e.g. <code>grade.lifecycle</code>).
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="webhook-secret">
            Signing secret{' '}
            {isCreating ? null : (
              <span className="text-(--color-text-muted)">(leave blank to keep current)</span>
            )}
          </Label>
          <Input
            id="webhook-secret"
            type="password"
            autoComplete="off"
            value={state.signingSecret}
            aria-invalid={Boolean(errors.signingSecret)}
            aria-describedby={errors.signingSecret ? 'webhook-secret-error' : undefined}
            onChange={(e) => setField('signingSecret', e.target.value)}
          />
          {errors.signingSecret ? (
            <p id="webhook-secret-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.signingSecret}
            </p>
          ) : null}
        </div>
        <label
          htmlFor="webhook-enabled"
          className="flex items-center gap-2 text-sm text-(--color-text-default)"
        >
          <Switch
            id="webhook-enabled"
            checked={state.enabled}
            onCheckedChange={(next) => setField('enabled', next)}
          />
          Enabled
        </label>
        <div className="flex items-center justify-end gap-2">
          <Button
            intent="secondary"
            size="sm"
            onClick={() => {
              setState(initialState);
              setErrors({});
              onCancel();
            }}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button intent="primary" size="sm" onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
