'use client';

import { FormField } from '@/components/patterns/form-field.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useCreateRubricMutation } from '@/lib/api/queries/rubrics.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { ulid } from '@/lib/ids.ts';
import type { Rubric, RubricCriterion, RubricLevel } from '@openlms/contracts';
import { ClipboardCopy, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

const newLevel = (): RubricLevel => ({
  id: ulid(),
  label: '',
  description: '',
  points: 0,
});

const newCriterion = (): RubricCriterion => ({
  id: ulid(),
  label: '',
  description: '',
  evidenceRequired: false,
  learningObjectiveIds: [],
  levels: [
    { id: ulid(), label: 'Exceeds', description: 'Goes beyond expectations.', points: 4 },
    { id: ulid(), label: 'Meets', description: 'Meets expectations.', points: 3 },
    { id: ulid(), label: 'Approaching', description: 'Approaches expectations.', points: 2 },
    { id: ulid(), label: 'Below', description: 'Below expectations.', points: 1 },
  ],
});

export default function NewRubricPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();
  const create = useCreateRubricMutation(tenantId);

  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState<RubricCriterion[]>([newCriterion()]);
  const [created, setCreated] = useState<Rubric | null>(null);

  const updateCriterion = (id: string, patch: Partial<RubricCriterion>) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addCriterion = () => setCriteria((prev) => [...prev, newCriterion()]);
  const removeCriterion = (id: string) => {
    if (criteria.length === 1) return;
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const updateLevel = (criterionId: string, levelId: string, patch: Partial<RubricLevel>) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId
          ? { ...c, levels: c.levels.map((l) => (l.id === levelId ? { ...l, ...patch } : l)) }
          : c,
      ),
    );
  };

  const addLevel = (criterionId: string) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === criterionId ? { ...c, levels: [...c.levels, newLevel()] } : c)),
    );
  };

  const removeLevel = (criterionId: string, levelId: string) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId && c.levels.length > 1
          ? { ...c, levels: c.levels.filter((l) => l.id !== levelId) }
          : c,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const cleanedCriteria = criteria.map((c) => ({
      ...c,
      label: c.label.trim(),
      description: c.description.trim(),
      levels: c.levels.map((l) => ({
        ...l,
        label: l.label.trim(),
        description: l.description.trim(),
      })),
    }));

    const invalidCriterion = cleanedCriteria.find(
      (c) => !c.label || !c.description || c.levels.some((l) => !l.label || !l.description),
    );
    if (invalidCriterion) {
      publish({
        tone: 'danger',
        title: 'Missing fields',
        description: 'Every criterion and level needs a label and description.',
      });
      return;
    }

    try {
      const rubric = await create.mutateAsync({
        title: trimmedTitle,
        sourceTemplateId: null,
        criteria: cleanedCriteria,
      });
      publish({ tone: 'success', title: 'Rubric created' });
      setCreated(rubric);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save. Try again.';
      publish({ tone: 'danger', title: 'Save failed', description: message });
    }
  };

  const copyId = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.id);
      publish({ tone: 'success', title: 'Rubric ID copied' });
    } catch {
      publish({
        tone: 'danger',
        title: 'Could not copy',
        description: 'Select and copy manually.',
      });
    }
  };

  if (created) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Rubrics"
          title="Rubric created"
          description="Paste this ID into an assignment or discussion to attach the rubric."
        />
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">Title</p>
              <p className="mt-1 text-base font-medium text-(--color-text-default)">
                {created.title}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Rubric ID
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="block flex-1 rounded-[var(--radius-sm)] bg-(--color-surface-muted) px-2 py-1 font-mono text-sm text-(--color-text-default)">
                  {created.id}
                </code>
                <Button onClick={copyId} intent="secondary" size="sm">
                  <ClipboardCopy className="size-4" aria-hidden /> Copy
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setCreated(null);
                  setTitle('');
                  setCriteria([newCriterion()]);
                }}
                intent="secondary"
              >
                Create another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Rubrics"
        title="New rubric"
        description="Define criteria and level descriptors. The rubric ID can be attached to assignments and discussions."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField label="Title" id="rubric-title" required>
              <Input
                id="rubric-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                placeholder="Argument writing rubric"
              />
            </FormField>
          </CardContent>
        </Card>

        {criteria.map((criterion, criterionIndex) => (
          <Card key={criterion.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Criterion {criterionIndex + 1}</CardTitle>
                <Button
                  type="button"
                  intent="ghost"
                  size="icon-sm"
                  aria-label="Remove criterion"
                  onClick={() => removeCriterion(criterion.id)}
                  disabled={criteria.length === 1}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <CardDescription>How will you assess this dimension?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField label="Label" id={`crit-${criterion.id}-label`} required>
                <Input
                  id={`crit-${criterion.id}-label`}
                  value={criterion.label}
                  onChange={(e) => updateCriterion(criterion.id, { label: e.target.value })}
                  maxLength={120}
                />
              </FormField>
              <FormField label="Description" id={`crit-${criterion.id}-desc`} required>
                <Textarea
                  id={`crit-${criterion.id}-desc`}
                  value={criterion.description}
                  onChange={(e) => updateCriterion(criterion.id, { description: e.target.value })}
                  rows={2}
                />
              </FormField>
              <div className="flex items-center gap-2">
                <Switch
                  id={`crit-${criterion.id}-evidence`}
                  checked={criterion.evidenceRequired}
                  onCheckedChange={(checked) =>
                    updateCriterion(criterion.id, { evidenceRequired: checked })
                  }
                />
                <label
                  htmlFor={`crit-${criterion.id}-evidence`}
                  className="text-sm text-(--color-text-default)"
                >
                  Reviewers must provide evidence for this criterion
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-(--color-text-default)">Levels</p>
                {criterion.levels.map((level, levelIndex) => (
                  <div
                    key={level.id}
                    className="grid grid-cols-1 gap-2 rounded-[var(--radius-sm)] border border-(--color-border-subtle) p-3 sm:grid-cols-[1fr_2fr_80px_auto]"
                  >
                    <Input
                      aria-label={`Level ${levelIndex + 1} label`}
                      value={level.label}
                      onChange={(e) =>
                        updateLevel(criterion.id, level.id, { label: e.target.value })
                      }
                      placeholder="Meets"
                      maxLength={80}
                    />
                    <Input
                      aria-label={`Level ${levelIndex + 1} description`}
                      value={level.description}
                      onChange={(e) =>
                        updateLevel(criterion.id, level.id, { description: e.target.value })
                      }
                      placeholder="Meets expectations."
                    />
                    <Input
                      aria-label={`Level ${levelIndex + 1} points`}
                      type="number"
                      min={0}
                      step="0.5"
                      value={level.points}
                      onChange={(e) =>
                        updateLevel(criterion.id, level.id, {
                          points: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <Button
                      type="button"
                      intent="ghost"
                      size="icon-sm"
                      aria-label="Remove level"
                      onClick={() => removeLevel(criterion.id, level.id)}
                      disabled={criterion.levels.length === 1}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  intent="secondary"
                  size="sm"
                  onClick={() => addLevel(criterion.id)}
                >
                  <Plus className="size-4" aria-hidden /> Add level
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex items-center justify-between gap-2">
          <Button type="button" intent="secondary" onClick={addCriterion}>
            <Plus className="size-4" aria-hidden /> Add criterion
          </Button>
          <Button
            type="submit"
            disabled={!title.trim() || create.isPending}
            loading={create.isPending}
          >
            <Save className="size-4" aria-hidden /> Create rubric
          </Button>
        </div>
      </form>
    </div>
  );
}
