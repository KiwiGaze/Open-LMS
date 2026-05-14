'use client';

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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useCopyCourseMutation,
  useCoursesQuery,
  useImportCommonCartridgeMutation,
  useRestoreCourseBackupMutation,
} from '@/lib/api/queries/courses.ts';
import { ArchiveRestore, Copy, Download, Package, Upload } from 'lucide-react';
import { useState } from 'react';

export function CourseToolsCard({
  tenantId,
  courseId,
}: {
  tenantId: string | null;
  courseId: string;
}) {
  const [copyOpen, setCopyOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const backupHref = tenantId ? `/api/v1/tenants/${tenantId}/courses/${courseId}/backup` : '#';
  const cartridgeHref = tenantId
    ? `/api/v1/tenants/${tenantId}/courses/${courseId}/common-cartridge`
    : '#';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course tools</CardTitle>
        <CardDescription>
          Copy content from another course, import a Common Cartridge package, or back up and
          restore this course.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button intent="secondary" onClick={() => setCopyOpen(true)} disabled={!tenantId}>
          <Copy className="size-4" aria-hidden /> Copy from another course
        </Button>
        <Button asChild intent="secondary" disabled={!tenantId}>
          <a href={backupHref} download>
            <Download className="size-4" aria-hidden /> Export backup (JSON)
          </a>
        </Button>
        <Button intent="secondary" onClick={() => setRestoreOpen(true)} disabled={!tenantId}>
          <ArchiveRestore className="size-4" aria-hidden /> Restore from backup
        </Button>
        <Button asChild intent="secondary" disabled={!tenantId}>
          <a href={cartridgeHref} download>
            <Package className="size-4" aria-hidden /> Export Common Cartridge
          </a>
        </Button>
        <Button intent="secondary" onClick={() => setImportOpen(true)} disabled={!tenantId}>
          <Upload className="size-4" aria-hidden /> Import Common Cartridge
        </Button>
      </CardContent>

      <CopyCourseDialog
        tenantId={tenantId}
        targetCourseId={courseId}
        open={copyOpen}
        onOpenChange={setCopyOpen}
      />
      <RestoreCourseDialog
        tenantId={tenantId}
        courseId={courseId}
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
      />
      <ImportCartridgeDialog
        tenantId={tenantId}
        courseId={courseId}
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </Card>
  );
}

function CopyCourseDialog({
  tenantId,
  targetCourseId,
  open,
  onOpenChange,
}: {
  tenantId: string | null;
  targetCourseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { publish } = useToast();
  const courses = useCoursesQuery(tenantId, open);
  const copy = useCopyCourseMutation(tenantId);
  const [sourceCourseId, setSourceCourseId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const candidates = (courses.data ?? []).filter((c) => c.id !== targetCourseId);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sourceCourseId) {
      setError('Pick a source course.');
      return;
    }
    setError(null);
    try {
      const result = await copy.mutateAsync({ sourceCourseId, targetCourseId });
      publish({
        tone: 'success',
        title: 'Content copied',
        description: `${result.modulesCopied} modules · ${result.unitsCopied} units · ${result.pagesCopied} pages · ${result.resourcesCopied} resources.`,
      });
      onOpenChange(false);
      setSourceCourseId('');
    } catch (e) {
      const message = e instanceof ApiHttpError ? e.message : 'Could not copy. Try again.';
      publish({ tone: 'danger', title: 'Copy failed', description: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy content from another course</DialogTitle>
          <DialogDescription>
            Pulls modules, units, pages, resources, and learning objectives from the source into
            this course. Existing content is not deleted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="copy-source">Source course</Label>
            <Select
              value={sourceCourseId}
              onValueChange={(v) => {
                setSourceCourseId(v);
                if (error) setError(null);
              }}
              disabled={courses.isLoading || courses.isError || candidates.length === 0}
            >
              <SelectTrigger id="copy-source">
                <SelectValue
                  placeholder={
                    courses.isLoading
                      ? 'Loading…'
                      : courses.isError
                        ? 'Could not load courses — try again'
                        : candidates.length === 0
                          ? 'No other courses available'
                          : 'Pick a course'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} · {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error ? <p className="text-xs text-(--color-text-danger)">{error}</p> : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={copy.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={copy.isPending} loading={copy.isPending}>
              <Copy className="size-4" aria-hidden /> Copy content
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RestoreCourseDialog({
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
  const restore = useRestoreCourseBackupMutation(tenantId, courseId);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await restore.mutateAsync(parsed);
      publish({
        tone: 'success',
        title: 'Backup restored',
        description: `${result.modulesRestored} modules · ${result.unitsRestored} units · ${result.pagesRestored} pages · ${result.resourcesRestored} resources.`,
      });
      onOpenChange(false);
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError('That file is not valid JSON.');
        return;
      }
      const message = e instanceof ApiHttpError ? e.message : 'Could not restore. Try again.';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore from backup</DialogTitle>
          <DialogDescription>
            Upload a backup JSON exported from another Open-LMS course. Existing content is not
            removed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="restore-file">Backup file</Label>
            <Input
              id="restore-file"
              type="file"
              accept="application/json,.json"
              disabled={restore.isPending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
            {error ? <p className="text-xs text-(--color-text-danger)">{error}</p> : null}
            {restore.isPending ? <Badge tone="neutral">Restoring…</Badge> : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={restore.isPending}>
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportCartridgeDialog({
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
  const importMutation = useImportCommonCartridgeMutation(tenantId, courseId);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await importMutation.mutateAsync(parsed);
      publish({
        tone: 'success',
        title: 'Cartridge imported',
        description: `${result.modulesRestored} modules · ${result.unitsRestored} units · ${result.pagesRestored} pages · ${result.resourcesRestored} resources.`,
      });
      onOpenChange(false);
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError('That file is not valid JSON.');
        return;
      }
      const message = e instanceof ApiHttpError ? e.message : 'Could not import. Try again.';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Common Cartridge</DialogTitle>
          <DialogDescription>
            Upload an IMS Common Cartridge package envelope (JSON). Existing content is not removed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cartridge-file">Cartridge file</Label>
            <Input
              id="cartridge-file"
              type="file"
              accept="application/json,.json"
              disabled={importMutation.isPending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
            {error ? <p className="text-xs text-(--color-text-danger)">{error}</p> : null}
            {importMutation.isPending ? <Badge tone="neutral">Importing…</Badge> : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={importMutation.isPending}>
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
