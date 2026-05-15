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
      const items: { xml: string }[] = [];
      for (const file of Array.from(files)) {
        const text = await file.text();
        if (file.name.toLowerCase().endsWith('.json')) {
          // Re-importing an exported bundle: pull each item's xml field out.
          const bundle = JSON.parse(text) as { items?: { xml?: unknown }[] };
          if (!bundle || !Array.isArray(bundle.items)) {
            throw new Error(`${file.name} is not a QTI export bundle.`);
          }
          for (const entry of bundle.items) {
            if (typeof entry.xml !== 'string' || entry.xml.length === 0) {
              throw new Error(`${file.name} contains an item without xml content.`);
            }
            items.push({ xml: entry.xml });
          }
        } else {
          items.push({ xml: text });
        }
      }
      if (items.length === 0) {
        publish({ tone: 'danger', title: 'Nothing to import' });
        return;
      }
      const result = await importMutation.mutateAsync({ format: 'qti_2_1', items });
      publish({
        tone: 'success',
        title: `Imported ${result.importedCount} question${result.importedCount === 1 ? '' : 's'}`,
      });
    } catch (error) {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not import. Try again.';
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
        accept=".xml,.json,application/xml,text/xml,application/json"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
