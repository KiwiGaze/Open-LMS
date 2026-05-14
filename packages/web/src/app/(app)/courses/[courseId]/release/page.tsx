'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  type ReleaseRuleInput,
  useCreateReleaseRuleMutation,
  useDeleteReleaseRuleMutation,
  useModuleReleasePolicyQuery,
  useModuleReleaseRulesQuery,
  useUpsertReleasePolicyMutation,
} from '@/lib/api/queries/module-release.ts';
import { useCourseModulesQuery } from '@/lib/api/queries/modules.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { CourseModule, ModuleReleaseRule } from '@openlms/contracts';
import { Lock, Plus, Trash2, Unlock } from 'lucide-react';
import { use, useState } from 'react';

type Params = { courseId: string };
type RuleType = 'prerequisite_modules' | 'objective_mastery' | 'date_after' | 'manual_unlock';

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

const RULE_TYPE_LABEL: Record<RuleType, string> = {
  prerequisite_modules: 'Prerequisite modules',
  objective_mastery: 'Objective mastery',
  date_after: 'Date after',
  manual_unlock: 'Manual unlock',
};

export default function ModuleReleasePage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const modules = useCourseModulesQuery(tenantId, courseId);
  const [activeModule, setActiveModule] = useState<CourseModule | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Module release"
        title="Adaptive release"
        description="Gate modules behind prerequisites, dates, or manual unlocks. Rules combine via the policy combinator."
      />

      {modules.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : modules.error ? (
        <ErrorState error={modules.error} onRetry={() => modules.refetch()} />
      ) : (modules.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Lock}
          title="No modules"
          description="Create modules first, then attach release rules."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-2">
            {modules.data?.map((module) => (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveModule(module)}
                className={`rounded-[var(--radius-md)] border border-(--color-border-subtle) px-3 py-2 text-left text-sm hover:bg-(--color-surface-muted) ${
                  activeModule?.id === module.id
                    ? 'border-(--color-brand) bg-(--color-brand-subtle)'
                    : ''
                }`}
              >
                <span className="font-medium text-(--color-text-default)">{module.title}</span>
              </button>
            ))}
          </div>

          {activeModule ? (
            <RulesPanel
              tenantId={tenantId}
              courseId={courseId}
              module={activeModule}
              allModules={modules.data ?? []}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-(--color-text-muted)">
                Pick a module on the left to manage its release rules.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function RulesPanel({
  tenantId,
  courseId,
  module,
  allModules,
}: {
  tenantId: string | null;
  courseId: string;
  module: CourseModule;
  allModules: CourseModule[];
}) {
  const { publish } = useToast();
  const rules = useModuleReleaseRulesQuery(tenantId, courseId, module.id);
  const policy = useModuleReleasePolicyQuery(tenantId, courseId, module.id);
  const deleteRule = useDeleteReleaseRuleMutation(tenantId, courseId, module.id);
  const upsertPolicy = useUpsertReleasePolicyMutation(tenantId, courseId, module.id);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = async (rule: ModuleReleaseRule) => {
    if (!window.confirm(`Delete ${RULE_TYPE_LABEL[rule.ruleType]} rule?`)) return;
    try {
      await deleteRule.mutateAsync(rule.id);
      publish({ tone: 'success', title: 'Rule deleted' });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not delete. Try again.';
      publish({ tone: 'danger', title: 'Delete failed', description: message });
    }
  };

  const handleCombinator = async (combinator: 'all' | 'any') => {
    try {
      await upsertPolicy.mutateAsync(combinator);
      publish({ tone: 'success', title: 'Policy saved' });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save. Try again.';
      publish({ tone: 'danger', title: 'Save failed', description: message });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{module.title}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-(--color-text-muted)">Combinator:</span>
              <Select
                value={policy.data?.combinator ?? 'all'}
                onValueChange={(v) => handleCombinator(v as 'all' | 'any')}
                disabled={upsertPolicy.isPending}
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rules must pass</SelectItem>
                  <SelectItem value="any">Any rule passes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {rules.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : rules.error ? (
            <ErrorState error={rules.error} onRetry={() => rules.refetch()} />
          ) : (rules.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Unlock}
              title="No rules"
              description="Without rules, this module is unlocked by default."
              action={
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="size-4" aria-hidden /> New rule
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col divide-y divide-(--color-border-subtle) overflow-hidden rounded-[var(--radius-md)] border border-(--color-border-subtle)">
              {rules.data?.map((rule) => (
                <li key={rule.id} className="flex items-center gap-3 p-3">
                  <Badge tone="info">{RULE_TYPE_LABEL[rule.ruleType]}</Badge>
                  <RuleSummary rule={rule} allModules={allModules} />
                  <Badge tone={rule.status === 'active' ? 'success' : 'neutral'}>
                    {rule.status}
                  </Badge>
                  <Button
                    intent="ghost"
                    size="icon-sm"
                    aria-label="Delete rule"
                    onClick={() => handleDelete(rule)}
                    disabled={deleteRule.isPending}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {(rules.data?.length ?? 0) > 0 ? (
            <div className="flex items-center justify-end">
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" aria-hidden /> Add rule
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AddRuleDialog
        tenantId={tenantId}
        courseId={courseId}
        moduleId={module.id}
        currentModuleId={module.id}
        allModules={allModules}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        nextPosition={rules.data?.length ?? 0}
      />
    </div>
  );
}

function RuleSummary({
  rule,
  allModules,
}: {
  rule: ModuleReleaseRule;
  allModules: CourseModule[];
}) {
  switch (rule.ruleType) {
    case 'prerequisite_modules': {
      const names = rule.config.moduleIds
        .map((id) => allModules.find((m) => m.id === id)?.title ?? id.slice(-8))
        .join(', ');
      return (
        <span className="flex-1 text-sm text-(--color-text-default)">
          {rule.config.requireAll ? 'Complete all of' : 'Complete any of'}: {names}
        </span>
      );
    }
    case 'objective_mastery':
      return (
        <span className="flex-1 text-sm text-(--color-text-default)">
          Objective {rule.config.objectiveId.slice(-8)} · ≥ {rule.config.minStatus}
          {rule.config.minScorePercent !== null ? ` · ${rule.config.minScorePercent}%` : ''}
        </span>
      );
    case 'date_after':
      return (
        <span className="flex-1 text-sm text-(--color-text-default)">
          After {formatDateTime(rule.config.releaseAt)}
        </span>
      );
    case 'manual_unlock':
      return (
        <span className="flex-1 text-sm text-(--color-text-default)">
          Manual unlock · default {rule.config.defaultLocked ? 'locked' : 'unlocked'}
        </span>
      );
  }
}

function AddRuleDialog({
  tenantId,
  courseId,
  moduleId,
  currentModuleId,
  allModules,
  open,
  onOpenChange,
  nextPosition,
}: {
  tenantId: string | null;
  courseId: string;
  moduleId: string;
  currentModuleId: string;
  allModules: CourseModule[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextPosition: number;
}) {
  const { publish } = useToast();
  const create = useCreateReleaseRuleMutation(tenantId, courseId, moduleId);
  const [ruleType, setRuleType] = useState<RuleType>('date_after');

  // Type-specific state
  const [prereqIds, setPrereqIds] = useState<string[]>([]);
  const [prereqRequireAll, setPrereqRequireAll] = useState(true);
  const [objectiveId, setObjectiveId] = useState('');
  const [minStatus, setMinStatus] = useState<'developing' | 'proficient' | 'mastered'>(
    'proficient',
  );
  const [minScorePercent, setMinScorePercent] = useState('');
  const [releaseAt, setReleaseAt] = useState('');
  const [defaultLocked, setDefaultLocked] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setRuleType('date_after');
    setPrereqIds([]);
    setPrereqRequireAll(true);
    setObjectiveId('');
    setMinStatus('proficient');
    setMinScorePercent('');
    setReleaseAt('');
    setDefaultLocked(true);
    setErrors({});
  };

  const togglePrereq = (id: string) => {
    setPrereqIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    let input: ReleaseRuleInput;
    if (ruleType === 'prerequisite_modules') {
      if (prereqIds.length === 0) {
        setErrors({ prereqs: 'Pick at least one module.' });
        return;
      }
      input = {
        targetType: 'module',
        targetId: null,
        position: nextPosition,
        status: 'active',
        ruleType: 'prerequisite_modules',
        config: { moduleIds: prereqIds, requireAll: prereqRequireAll },
      };
    } else if (ruleType === 'objective_mastery') {
      if (!ULID_RE.test(objectiveId.trim())) {
        setErrors({ objectiveId: 'Enter a valid Learning Objective ULID.' });
        return;
      }
      const minScore = minScorePercent.trim() === '' ? null : Number(minScorePercent);
      if (minScore !== null && (minScore < 0 || minScore > 100)) {
        setErrors({ minScorePercent: '0–100 or blank.' });
        return;
      }
      input = {
        targetType: 'module',
        targetId: null,
        position: nextPosition,
        status: 'active',
        ruleType: 'objective_mastery',
        config: { objectiveId: objectiveId.trim(), minStatus, minScorePercent: minScore },
      };
    } else if (ruleType === 'date_after') {
      if (!releaseAt) {
        setErrors({ releaseAt: 'Pick a date.' });
        return;
      }
      const iso = new Date(releaseAt).toISOString();
      input = {
        targetType: 'module',
        targetId: null,
        position: nextPosition,
        status: 'active',
        ruleType: 'date_after',
        config: { releaseAt: iso },
      };
    } else {
      input = {
        targetType: 'module',
        targetId: null,
        position: nextPosition,
        status: 'active',
        ruleType: 'manual_unlock',
        config: { defaultLocked },
      };
    }

    try {
      await create.mutateAsync(input);
      publish({ tone: 'success', title: 'Rule created' });
      reset();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save. Try again.';
      publish({ tone: 'danger', title: 'Create failed', description: message });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>New release rule</DialogTitle>
          <DialogDescription>
            Choose a rule type and configure how this module is unlocked.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Rule type" id="rule-type">
            <Select value={ruleType} onValueChange={(v) => setRuleType(v as RuleType)}>
              <SelectTrigger id="rule-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prerequisite_modules">Prerequisite modules</SelectItem>
                <SelectItem value="objective_mastery">Objective mastery</SelectItem>
                <SelectItem value="date_after">Date after</SelectItem>
                <SelectItem value="manual_unlock">Manual unlock</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {ruleType === 'prerequisite_modules' ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-(--color-text-default)">
                Pick modules that must be completed first
              </legend>
              {errors.prereqs ? (
                <p className="text-xs text-(--color-text-danger)">{errors.prereqs}</p>
              ) : null}
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-[var(--radius-md)] border border-(--color-border-subtle) p-2">
                {allModules
                  .filter((m) => m.id !== currentModuleId)
                  .map((m) => {
                    const id = `prereq-${m.id}`;
                    return (
                      <label
                        key={m.id}
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-(--color-surface-muted)"
                      >
                        <Checkbox
                          id={id}
                          checked={prereqIds.includes(m.id)}
                          onCheckedChange={() => togglePrereq(m.id)}
                        />
                        <span className="flex-1 text-sm text-(--color-text-default)">
                          {m.title}
                        </span>
                      </label>
                    );
                  })}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="require-all"
                  checked={prereqRequireAll}
                  onCheckedChange={setPrereqRequireAll}
                />
                <label htmlFor="require-all" className="text-sm text-(--color-text-default)">
                  Require all (off = any one)
                </label>
              </div>
            </fieldset>
          ) : null}

          {ruleType === 'objective_mastery' ? (
            <div className="flex flex-col gap-4">
              <FormField
                label="Learning objective ID"
                id="obj-id"
                required
                error={errors.objectiveId}
                description="26-character ULID from the objectives page."
              >
                <Input
                  id="obj-id"
                  value={objectiveId}
                  onChange={(e) => setObjectiveId(e.target.value)}
                  placeholder="01J9QW7B6N5W2YH3D3A1V0KE91"
                />
              </FormField>
              <FormField label="Minimum status" id="min-status">
                <Select
                  value={minStatus}
                  onValueChange={(v) => setMinStatus(v as 'developing' | 'proficient' | 'mastered')}
                >
                  <SelectTrigger id="min-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developing">Developing</SelectItem>
                    <SelectItem value="proficient">Proficient</SelectItem>
                    <SelectItem value="mastered">Mastered</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                label="Minimum score %"
                id="min-score"
                description="Optional. 0–100 or blank."
                error={errors.minScorePercent}
              >
                <Input
                  id="min-score"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={minScorePercent}
                  onChange={(e) => setMinScorePercent(e.target.value)}
                />
              </FormField>
            </div>
          ) : null}

          {ruleType === 'date_after' ? (
            <FormField label="Release at" id="release-at" required error={errors.releaseAt}>
              <Input
                id="release-at"
                type="datetime-local"
                value={releaseAt}
                onChange={(e) => setReleaseAt(e.target.value)}
              />
            </FormField>
          ) : null}

          {ruleType === 'manual_unlock' ? (
            <div className="flex items-center gap-2">
              <Switch
                id="default-locked"
                checked={defaultLocked}
                onCheckedChange={setDefaultLocked}
              />
              <label htmlFor="default-locked" className="text-sm text-(--color-text-default)">
                Locked by default (instructors unlock per student)
              </label>
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={create.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={create.isPending} loading={create.isPending}>
              Create rule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
