'use client';

import { Button } from '@/components/ui/button.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useExportQuizQtiMutation, useImportQuizQtiMutation } from '@/lib/api/queries/quizzes.ts';
import { Download, Upload } from 'lucide-react';
import { useRef } from 'react';

type Props = {
  tenantId: string | null;
  courseId: string;
  quizId: string;
};

export function QtiTools({ tenantId, courseId, quizId }: Props) {
  const { publish } = useToast();
  const exportMutation = useExportQuizQtiMutation(tenantId, courseId, quizId);
  const importMutation = useImportQuizQtiMutation(tenantId, courseId, quizId);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    exportMutation.mutate(undefined, {
      onSuccess: (bundle) =>
        publish({
          tone: 'success',
          title: `Exported ${bundle.items.length} item${bundle.items.length === 1 ? '' : 's'}`,
        }),
      onError: (error) => {
        const message =
          error instanceof ApiHttpError ? error.message : 'Could not export. Try again.';
        publish({ tone: 'danger', title: 'Export failed', description: message });
      },
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const items = await Promise.all(
        Array.from(files).map(async (file) => ({ xml: await file.text() })),
      );
      const result = await importMutation.mutateAsync({ format: 'qti_2_1', items });
      publish({
        tone: 'success',
        title: `Imported ${result.importedCount} question${result.importedCount === 1 ? '' : 's'}`,
      });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not import. Try again.';
      publish({ tone: 'danger', title: 'Import failed', description: message });
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        intent="secondary"
        size="sm"
        onClick={handleExport}
        disabled={exportMutation.isPending}
        loading={exportMutation.isPending}
      >
        <Download className="size-3.5" aria-hidden /> Export QTI
      </Button>
      <Button
        intent="secondary"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={importMutation.isPending}
        loading={importMutation.isPending}
      >
        <Upload className="size-3.5" aria-hidden /> Import QTI
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".xml,application/xml,text/xml"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
