'use client';

import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import type { QuizAttemptResponseAnswer, QuizQuestion } from '@openlms/contracts';

export type QuestionAnswer = QuizAttemptResponseAnswer | undefined;

export type QuestionViewProps = {
  question: QuizQuestion;
  answer: QuestionAnswer;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
};

export function QuestionView({ question, answer, onChange, disabled }: QuestionViewProps) {
  switch (question.questionType) {
    case 'true_false':
      return <TrueFalseQuestion {...{ question, answer, onChange, disabled }} />;
    case 'multiple_choice':
      return <MultipleChoiceQuestion {...{ question, answer, onChange, disabled }} />;
    case 'numeric':
      return <NumericQuestion {...{ question, answer, onChange, disabled }} />;
    case 'short_answer':
      return (
        <TextQuestion
          question={question}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
          variant="short"
        />
      );
    case 'essay':
      return (
        <TextQuestion
          question={question}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
          variant="essay"
        />
      );
    case 'matching':
      return <MatchingPlaceholder />;
  }
}

function TrueFalseQuestion({ question, answer, onChange, disabled }: QuestionViewProps) {
  const selectedId = answer?.kind === 'choice' ? (answer.selectedChoiceIds[0] ?? '') : '';
  return (
    <RadioGroup
      value={selectedId}
      onValueChange={(value) =>
        onChange(value ? { kind: 'choice', selectedChoiceIds: [value] } : undefined)
      }
      disabled={disabled}
      className="flex flex-col gap-2"
    >
      {question.choices.map((choice) => (
        <Label
          key={choice.id}
          htmlFor={`${question.id}-${choice.id}`}
          className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-(--color-border-subtle) px-4 py-3 hover:bg-(--color-surface-elevated)"
        >
          <RadioGroupItem id={`${question.id}-${choice.id}`} value={choice.id} />
          <span className="text-sm text-(--color-text-default)">{choice.text}</span>
        </Label>
      ))}
    </RadioGroup>
  );
}

function MultipleChoiceQuestion({ question, answer, onChange, disabled }: QuestionViewProps) {
  const selected = new Set(answer?.kind === 'choice' ? answer.selectedChoiceIds : []);

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    if (next.size === 0) {
      onChange(undefined);
      return;
    }
    onChange({ kind: 'choice', selectedChoiceIds: Array.from(next) });
  };

  return (
    <div className="flex flex-col gap-2">
      {question.choices.map((choice) => {
        const id = `${question.id}-${choice.id}`;
        const checked = selected.has(choice.id);
        return (
          <Label
            key={choice.id}
            htmlFor={id}
            className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-(--color-border-subtle) px-4 py-3 hover:bg-(--color-surface-elevated)"
          >
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={(value) => toggle(choice.id, value === true)}
              disabled={disabled}
              className="mt-0.5"
            />
            <span className="text-sm text-(--color-text-default)">{choice.text}</span>
          </Label>
        );
      })}
      <p className="text-xs text-(--color-text-muted)">Pick one or more answers as appropriate.</p>
    </div>
  );
}

function NumericQuestion({ question, answer, onChange, disabled }: QuestionViewProps) {
  const value = answer?.kind === 'numeric' ? String(answer.value) : '';
  return (
    <Input
      id={`${question.id}-numeric`}
      type="number"
      inputMode="decimal"
      step="any"
      className="w-full sm:w-64"
      value={value}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw === '') {
          onChange(undefined);
          return;
        }
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) return;
        onChange({ kind: 'numeric', value: parsed });
      }}
      disabled={disabled}
      placeholder="Enter a number"
    />
  );
}

function TextQuestion({
  question,
  answer,
  onChange,
  disabled,
  variant,
}: QuestionViewProps & { variant: 'short' | 'essay' }) {
  const text = answer?.kind === 'text' ? answer.text : '';
  const handle = (raw: string) => {
    if (raw.length === 0) {
      onChange(undefined);
      return;
    }
    onChange({ kind: 'text', text: raw });
  };
  if (variant === 'short') {
    return (
      <Input
        id={`${question.id}-text`}
        type="text"
        value={text}
        onChange={(e) => handle(e.target.value)}
        disabled={disabled}
        maxLength={1000}
        placeholder="Your answer"
      />
    );
  }
  return (
    <Textarea
      id={`${question.id}-text`}
      rows={10}
      value={text}
      onChange={(e) => handle(e.target.value)}
      disabled={disabled}
      maxLength={20000}
      placeholder="Type your essay here…"
    />
  );
}

function MatchingPlaceholder() {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-(--color-border-subtle) bg-(--color-surface-elevated) p-4 text-sm text-(--color-text-muted)">
      Matching questions aren't supported in this attempt UI yet. Skip and submit, or contact your
      instructor.
    </div>
  );
}
