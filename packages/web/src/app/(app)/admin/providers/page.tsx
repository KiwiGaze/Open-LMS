'use client';

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
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  type UpsertProviderConfigInput,
  useDeleteProviderConfigMutation,
  useProviderConfigQuery,
  useUpsertProviderConfigMutation,
} from '@/lib/api/queries/provider-configs.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime, formatNumber } from '@/lib/format.ts';
import type { AiProviderType, ProviderConfigSummary } from '@openlms/contracts';
import { Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';

const PROVIDER_TYPES: AiProviderType[] = [
  'openai',
  'anthropic',
  'google',
  'azure_openai',
  'openai_compatible',
  'local',
];

const MODEL_FIELDS = [
  { key: 'precheckModel', label: 'Precheck' },
  { key: 'feedbackDraftModel', label: 'Feedback draft' },
  { key: 'trendCardModel', label: 'Trend card' },
  { key: 'rubricClarityModel', label: 'Rubric clarity' },
  { key: 'pageExplanationModel', label: 'Page explanation' },
  { key: 'embeddingModel', label: 'Embedding' },
  { key: 'rerankModel', label: 'Rerank' },
] as const;

type ModelFieldKey = (typeof MODEL_FIELDS)[number]['key'];

type FormState = {
  providerType: AiProviderType;
  baseUrl: string;
  apiKey: string;
  models: Record<ModelFieldKey, string>;
  maxContextTokens: string;
  supportsStructuredOutput: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsPromptCaching: boolean;
  supportsDeterministic: boolean;
  softWarn: string;
  hardCap: string;
  period: 'day' | 'week' | 'month';
};

const emptyForm = (): FormState => ({
  providerType: 'openai',
  baseUrl: '',
  apiKey: '',
  models: {
    precheckModel: '',
    feedbackDraftModel: '',
    trendCardModel: '',
    rubricClarityModel: '',
    pageExplanationModel: '',
    embeddingModel: '',
    rerankModel: '',
  },
  maxContextTokens: '128000',
  supportsStructuredOutput: true,
  supportsTools: true,
  supportsVision: false,
  supportsPromptCaching: false,
  supportsDeterministic: true,
  softWarn: '100000',
  hardCap: '500000',
  period: 'month',
});

const formFromSummary = (summary: ProviderConfigSummary): FormState => ({
  providerType: summary.providerType,
  baseUrl: summary.baseUrl ?? '',
  apiKey: '',
  models: {
    precheckModel: summary.modelPreferences.precheckModel ?? '',
    feedbackDraftModel: summary.modelPreferences.feedbackDraftModel ?? '',
    trendCardModel: summary.modelPreferences.trendCardModel ?? '',
    rubricClarityModel: summary.modelPreferences.rubricClarityModel ?? '',
    pageExplanationModel: summary.modelPreferences.pageExplanationModel ?? '',
    embeddingModel: summary.modelPreferences.embeddingModel ?? '',
    rerankModel: summary.modelPreferences.rerankModel ?? '',
  },
  maxContextTokens: String(summary.capabilities.maxContextTokens),
  supportsStructuredOutput: summary.capabilities.supportsStructuredOutput,
  supportsTools: summary.capabilities.supportsTools,
  supportsVision: summary.capabilities.supportsVision,
  supportsPromptCaching: summary.capabilities.supportsPromptCaching,
  supportsDeterministic: summary.capabilities.supportsDeterministic,
  softWarn: String(summary.quota.softWarnTokensPerPeriod),
  hardCap: String(summary.quota.hardCapTokensPerPeriod),
  period: summary.quota.period,
});

type ValidationErrors = Partial<Record<string, string>>;

const validate = (form: FormState, isCreating: boolean): ValidationErrors => {
  const errors: ValidationErrors = {};
  const maxContext = Number(form.maxContextTokens);
  const softWarn = Number(form.softWarn);
  const hardCap = Number(form.hardCap);

  if (isCreating && form.apiKey.trim() === '') {
    errors.apiKey = 'API key is required when creating a provider.';
  }
  if (!Number.isInteger(maxContext) || maxContext <= 0) {
    errors.maxContextTokens = 'Must be a positive integer.';
  }
  if (!Number.isInteger(softWarn) || softWarn < 0) {
    errors.softWarn = 'Must be a non-negative integer.';
  }
  if (!Number.isInteger(hardCap) || hardCap <= 0) {
    errors.hardCap = 'Must be a positive integer.';
  }
  if (
    Number.isInteger(softWarn) &&
    Number.isInteger(hardCap) &&
    softWarn > hardCap &&
    softWarn >= 0 &&
    hardCap > 0
  ) {
    errors.softWarn = 'Soft warning threshold cannot exceed the hard cap.';
  }
  const anyModel = MODEL_FIELDS.some(({ key }) => form.models[key].trim() !== '');
  if (!anyModel) {
    errors.models = 'Set at least one model.';
  }
  return errors;
};

const formToInput = (form: FormState): UpsertProviderConfigInput => {
  const modelPreferences: Record<string, string> = {};
  for (const { key } of MODEL_FIELDS) {
    const value = form.models[key].trim();
    if (value !== '') modelPreferences[key] = value;
  }
  return {
    providerType: form.providerType,
    baseUrl: form.baseUrl.trim() === '' ? null : form.baseUrl.trim(),
    ...(form.apiKey.trim() !== '' ? { apiKey: form.apiKey.trim() } : {}),
    modelPreferences: modelPreferences as UpsertProviderConfigInput['modelPreferences'],
    capabilities: {
      supportsStructuredOutput: form.supportsStructuredOutput,
      supportsTools: form.supportsTools,
      supportsVision: form.supportsVision,
      supportsPromptCaching: form.supportsPromptCaching,
      maxContextTokens: Number(form.maxContextTokens),
      supportsDeterministic: form.supportsDeterministic,
    },
    quota: {
      softWarnTokensPerPeriod: Number(form.softWarn),
      hardCapTokensPerPeriod: Number(form.hardCap),
      period: form.period,
    },
  };
};

export default function AdminProvidersPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const provider = useProviderConfigQuery(tenantId);
  const upsert = useUpsertProviderConfigMutation(tenantId);
  const remove = useDeleteProviderConfigMutation(tenantId);
  const { publish } = useToast();

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const summary = provider.data ?? null;
  const editing = form !== null;
  const isCreating = editing && summary === null;

  const startEdit = () => {
    setErrors({});
    setForm(summary ? formFromSummary(summary) : emptyForm());
  };

  const cancelEdit = () => {
    setErrors({});
    setForm(null);
  };

  const submit = async () => {
    if (!form) return;
    const next = validate(form, isCreating);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      await upsert.mutateAsync(formToInput(form));
      publish({ tone: 'success', title: 'Provider config saved' });
      setForm(null);
    } catch (error) {
      publish({
        tone: 'danger',
        title: 'Save failed',
        description: error instanceof ApiHttpError ? error.message : 'Could not save the provider.',
      });
    }
  };

  const handleDelete = async () => {
    if (!summary) return;
    try {
      await remove.mutateAsync();
      publish({ tone: 'success', title: 'Provider config deleted' });
    } catch (error) {
      publish({
        tone: 'danger',
        title: 'Delete failed',
        description:
          error instanceof ApiHttpError ? error.message : 'Could not delete the provider.',
      });
    }
  };

  if (provider.isLoading) {
    return <Skeleton className="h-72 w-full rounded-[var(--radius-lg)]" />;
  }
  if (provider.error) {
    return <ErrorState error={provider.error} onRetry={() => provider.refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="AI providers"
        description="Configure your tenant's AI provider, models, and quota."
        actions={
          editing ? null : summary ? (
            <div className="flex items-center gap-2">
              <Button intent="secondary" size="sm" onClick={startEdit}>
                Edit
              </Button>
              <Button intent="danger" size="sm" onClick={handleDelete} disabled={remove.isPending}>
                <Trash2 className="size-3.5" aria-hidden /> Delete
              </Button>
            </div>
          ) : (
            <Button intent="primary" size="sm" onClick={startEdit}>
              <Sparkles className="size-3.5" aria-hidden /> Add provider
            </Button>
          )
        }
      />

      {editing && form ? (
        <Card>
          <CardHeader>
            <CardTitle>{isCreating ? 'Add provider' : 'Edit provider'}</CardTitle>
            <CardDescription>
              {isCreating
                ? 'Configure the AI provider for this tenant. The API key is encrypted at rest.'
                : 'Update settings. Leave the API key blank to keep the existing one; provide a new key to rotate.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="providerType">Provider type</Label>
                <select
                  id="providerType"
                  className="mt-1 h-9 w-full rounded-[var(--radius-sm)] border border-(--color-border-subtle) bg-(--color-surface-base) px-2 text-sm"
                  value={form.providerType}
                  onChange={(e) =>
                    setForm({ ...form, providerType: e.target.value as AiProviderType })
                  }
                >
                  {PROVIDER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="baseUrl">Base URL (optional)</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  placeholder="https://api.example.com"
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="apiKey">
                API key{' '}
                {isCreating ? (
                  ''
                ) : (
                  <span className="text-(--color-text-muted)">(leave blank to keep current)</span>
                )}
              </Label>
              <Input
                id="apiKey"
                type="password"
                autoComplete="off"
                value={form.apiKey}
                onChange={(e) => {
                  setForm({ ...form, apiKey: e.target.value });
                  setErrors((prev) => ({ ...prev, apiKey: undefined }));
                }}
              />
              {errors.apiKey ? (
                <p className="mt-1 text-xs text-(--color-danger-700)">{errors.apiKey}</p>
              ) : null}
            </div>

            <div>
              <Label>Models</Label>
              {errors.models ? (
                <p className="mt-1 text-xs text-(--color-danger-700)">{errors.models}</p>
              ) : null}
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {MODEL_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <Label htmlFor={key} className="text-xs">
                      {label}
                    </Label>
                    <Input
                      id={key}
                      value={form.models[key]}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          models: { ...form.models, [key]: e.target.value },
                        });
                        setErrors((prev) => ({ ...prev, models: undefined }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="maxContextTokens">Max context tokens</Label>
                <Input
                  id="maxContextTokens"
                  type="number"
                  min={1}
                  value={form.maxContextTokens}
                  onChange={(e) => {
                    setForm({ ...form, maxContextTokens: e.target.value });
                    setErrors((prev) => ({ ...prev, maxContextTokens: undefined }));
                  }}
                />
                {errors.maxContextTokens ? (
                  <p className="mt-1 text-xs text-(--color-danger-700)">
                    {errors.maxContextTokens}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="softWarn">Soft warn (tokens / period)</Label>
                <Input
                  id="softWarn"
                  type="number"
                  min={0}
                  value={form.softWarn}
                  onChange={(e) => {
                    setForm({ ...form, softWarn: e.target.value });
                    setErrors((prev) => ({ ...prev, softWarn: undefined }));
                  }}
                />
                {errors.softWarn ? (
                  <p className="mt-1 text-xs text-(--color-danger-700)">{errors.softWarn}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="hardCap">Hard cap (tokens / period)</Label>
                <Input
                  id="hardCap"
                  type="number"
                  min={1}
                  value={form.hardCap}
                  onChange={(e) => {
                    setForm({ ...form, hardCap: e.target.value });
                    setErrors((prev) => ({ ...prev, hardCap: undefined }));
                  }}
                />
                {errors.hardCap ? (
                  <p className="mt-1 text-xs text-(--color-danger-700)">{errors.hardCap}</p>
                ) : null}
              </div>
            </div>

            <div>
              <Label htmlFor="period">Period</Label>
              <select
                id="period"
                className="mt-1 h-9 w-full rounded-[var(--radius-sm)] border border-(--color-border-subtle) bg-(--color-surface-base) px-2 text-sm sm:w-48"
                value={form.period}
                onChange={(e) =>
                  setForm({ ...form, period: e.target.value as FormState['period'] })
                }
              >
                <option value="day">day</option>
                <option value="week">week</option>
                <option value="month">month</option>
              </select>
            </div>

            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Capabilities
              </legend>
              {(
                [
                  ['supportsStructuredOutput', 'Structured output'],
                  ['supportsTools', 'Tools'],
                  ['supportsVision', 'Vision'],
                  ['supportsPromptCaching', 'Prompt caching'],
                  ['supportsDeterministic', 'Deterministic'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </fieldset>

            <div className="flex items-center justify-end gap-2">
              <Button intent="secondary" size="sm" onClick={cancelEdit} disabled={upsert.isPending}>
                Cancel
              </Button>
              <Button intent="primary" size="sm" onClick={submit} disabled={upsert.isPending}>
                {upsert.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !summary ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Sparkles className="size-8 text-(--color-text-muted)" aria-hidden />
            <div>
              <p className="text-base font-medium text-(--color-text-default)">
                No provider configured
              </p>
              <p className="mt-1 text-sm text-(--color-text-muted)">
                Add an AI provider configuration to enable feedback, prechecks, and summaries.
              </p>
            </div>
            <Button intent="primary" size="sm" onClick={startEdit}>
              <Sparkles className="size-3.5" aria-hidden /> Add provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="capitalize">
                  {summary.providerType.replace(/_/g, ' ')}
                </CardTitle>
                <CardDescription>
                  Last validated:{' '}
                  {summary.validatedAt ? formatDateTime(summary.validatedAt) : 'never'}
                </CardDescription>
              </div>
              <Badge
                tone={
                  summary.validationStatus === 'valid'
                    ? 'success'
                    : summary.validationStatus === 'invalid'
                      ? 'danger'
                      : 'warning'
                }
              >
                {summary.validationStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {MODEL_FIELDS.filter(({ key }) => Boolean(summary.modelPreferences[key])).map(
              ({ key, label }) => (
                <div key={key}>
                  <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-(--color-text-default)">
                    {summary.modelPreferences[key]}
                  </p>
                </div>
              ),
            )}
            <div>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Soft quota
              </p>
              <p className="mt-1 text-sm font-medium text-(--color-text-default)">
                {summary.quota.softWarnTokensPerPeriod
                  ? `${formatNumber(summary.quota.softWarnTokensPerPeriod)} tokens / ${summary.quota.period}`
                  : 'No soft cap'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Hard quota
              </p>
              <p className="mt-1 text-sm font-medium text-(--color-text-default)">
                {summary.quota.hardCapTokensPerPeriod
                  ? `${formatNumber(summary.quota.hardCapTokensPerPeriod)} tokens / ${summary.quota.period}`
                  : 'No hard cap'}
              </p>
            </div>
            {summary.validationError ? (
              <div className="sm:col-span-2 rounded-[var(--radius-md)] border border-(--color-danger-200) bg-(--color-danger-50) p-3 text-sm text-(--color-danger-700)">
                {summary.validationError}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
