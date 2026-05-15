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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useCreateScormPackageMutation } from '@/lib/api/queries/scorm.ts';
import type { ScormPackageStatus, ScormVersion } from '@openlms/contracts';
import { useState } from 'react';

type Props = {
  tenantId: string | null;
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RegisterScormPackageDialog({ tenantId, courseId, open, onOpenChange }: Props) {
  const { publish } = useToast();
  const create = useCreateScormPackageMutation(tenantId, courseId);

  const [title, setTitle] = useState('');
  const [version, setVersion] = useState<ScormVersion>('1.2');
  const [launchUrl, setLaunchUrl] = useState('');
  const [manifestText, setManifestText] = useState('{}');
  const [status, setStatus] = useState<ScormPackageStatus>('draft');
  const [manifestError, setManifestError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManifestError(null);

    let manifest: Record<string, unknown>;
    try {
      const parsed = JSON.parse(manifestText) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setManifestError('Manifest must be a JSON object.');
        return;
      }
      manifest = parsed as Record<string, unknown>;
    } catch {
      setManifestError('Manifest is not valid JSON.');
      return;
    }

    try {
      await create.mutateAsync({
        title: title.trim(),
        scormVersion: version,
        launchUrl: launchUrl.trim(),
        manifest,
        status,
      });
      publish({ tone: 'success', title: 'Package registered' });
      setTitle('');
      setLaunchUrl('');
      setManifestText('{}');
      setVersion('1.2');
      setStatus('draft');
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not register. Try again.';
      publish({ tone: 'danger', title: 'Registration failed', description: message });
    }
  };

  const canSubmit = title.trim().length > 0 && launchUrl.trim().length > 0 && !create.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register SCORM package</DialogTitle>
          <DialogDescription>
            Point at a hosted SCORM package. Upload the zip via Files first to get a launch URL.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Title" id="scorm-title" required>
            <Input
              id="scorm-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={180}
              placeholder="Onboarding module 1"
              autoFocus
            />
          </FormField>
          <FormField label="SCORM version" id="scorm-version" required>
            <Select value={version} onValueChange={(v) => setVersion(v as ScormVersion)}>
              <SelectTrigger id="scorm-version">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.2">1.2</SelectItem>
                <SelectItem value="2004">2004</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Launch URL" id="scorm-launch" required>
            <Input
              id="scorm-launch"
              type="url"
              value={launchUrl}
              onChange={(e) => setLaunchUrl(e.target.value)}
              placeholder="https://files.example/scorm/onboarding/index.html"
            />
          </FormField>
          <FormField label="Manifest (JSON)" id="scorm-manifest" error={manifestError}>
            <Textarea
              id="scorm-manifest"
              value={manifestText}
              onChange={(e) => setManifestText(e.target.value)}
              rows={6}
              placeholder='{ "identifier": "...", "organizations": { ... } }'
            />
          </FormField>
          <FormField label="Status" id="scorm-status" required>
            <Select value={status} onValueChange={(v) => setStatus(v as ScormPackageStatus)}>
              <SelectTrigger id="scorm-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={create.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit} loading={create.isPending}>
              Register
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
