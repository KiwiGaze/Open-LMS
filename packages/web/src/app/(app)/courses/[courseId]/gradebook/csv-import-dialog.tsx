'use client';

import { FormField } from '@/components/patterns/form-field.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useImportAssignmentGradesCsv } from '@/lib/api/queries/gradebook.ts';
import type { Assignment } from '@openlms/contracts';
import { Upload } from 'lucide-react';
import { useState } from 'react';

export type CsvImportDialogProps = {
  tenantId: string | null;
  courseId: string;
  assignments: Assignment[];
};

export function CsvImportDialog({ tenantId, courseId, assignments }: CsvImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const { publish } = useToast();
  const importMutation = useImportAssignmentGradesCsv(tenantId, courseId);

  const handleSubmit = async () => {
    if (!assignmentId || !file) {
      publish({
        tone: 'warning',
        title: 'Pick an assignment and a CSV file',
      });
      return;
    }
    try {
      const csv = await file.text();
      const result = await importMutation.mutateAsync({ assignmentId, csv });
      publish({
        tone: 'success',
        title: 'CSV imported',
        description: `${result.savedCount} graded, ${result.failedCount} failed.`,
      });
      setOpen(false);
      setFile(null);
      setAssignmentId('');
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not import the CSV.';
      publish({ tone: 'danger', title: 'Import failed', description: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button intent="secondary" size="sm">
          <Upload className="size-4" aria-hidden /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent width="md">
        <DialogHeader>
          <DialogTitle>Import grades from CSV</DialogTitle>
          <DialogDescription>
            CSV import is scoped per assignment. Pick the assignment and upload a CSV with the
            expected column shape.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField
            id="csv-assignment"
            label="Assignment"
            required
            description="Grades in the CSV will be applied to this assignment's submissions."
          >
            <Select value={assignmentId} onValueChange={setAssignmentId}>
              <SelectTrigger id="csv-assignment">
                <SelectValue placeholder="Pick an assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            id="csv-file"
            label="CSV file"
            required
            description="UTF-8 text/csv. The backend validates the column shape and reports per-row errors."
          >
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-(--color-text-default) file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-(--color-brand-subtle) file:px-3 file:py-1.5 file:text-(--color-brand-700)"
            />
          </FormField>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button intent="ghost">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            loading={importMutation.isPending}
            disabled={!assignmentId || !file}
          >
            Import grades
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
