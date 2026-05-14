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
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useImportCourseRosterCsvMutation } from '@/lib/api/queries/memberships.ts';
import { Upload } from 'lucide-react';
import { useState } from 'react';

export function BulkCsvDialog({
  tenantId,
  courseId,
  open,
  onOpenChange,
}: {
  tenantId: string | null;
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { publish } = useToast();
  const importCsv = useImportCourseRosterCsvMutation(tenantId, courseId);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    try {
      const csv = await file.text();
      const result = await importCsv.mutateAsync(csv);
      publish({
        tone: result.failedCount === 0 ? 'success' : 'warning',
        title: 'Roster imported',
        description: `${result.importedCount} added, ${result.failedCount} failed.`,
      });
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not import. Try again.';
      publish({ tone: 'danger', title: 'Import failed', description: message });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFile(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk enroll via CSV</DialogTitle>
          <DialogDescription>
            CSV columns must include user identifier and role. The server processes each row
            independently — failures are surfaced per row.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="CSV file" id="csv-file" required>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </FormField>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={importCsv.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!file || importCsv.isPending}
              loading={importCsv.isPending}
            >
              <Upload className="size-4" aria-hidden /> Import
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
