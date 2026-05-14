'use client';

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
import { useUploadFileMutation } from '@/lib/api/queries/files.ts';
import { fileToBase64, formatBytes } from '@/lib/files/encoding.ts';
import type { FileVisibility } from '@openlms/contracts';
import { UploadCloud } from 'lucide-react';
import { useState } from 'react';

const VISIBILITY_OPTIONS: { value: FileVisibility; label: string; description: string }[] = [
  {
    value: 'course_member',
    label: 'Course members',
    description: 'Everyone enrolled in the course can view and download.',
  },
  {
    value: 'course_staff',
    label: 'Course staff',
    description: 'Only instructors and teaching assistants.',
  },
  {
    value: 'owner_and_instructors',
    label: 'You and instructors',
    description: 'You and any instructor with roster access.',
  },
  { value: 'private', label: 'Private', description: 'Only you can see this file.' },
];

const MAX_BYTES = 25 * 1024 * 1024;

export function UploadFileDialog({
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
  const upload = useUploadFileMutation(tenantId);
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<FileVisibility>('course_member');
  const [altText, setAltText] = useState('');

  const reset = () => {
    setFile(null);
    setVisibility('course_member');
    setAltText('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    if (file.size === 0) {
      publish({ tone: 'danger', title: 'Empty file', description: 'Pick a non-empty file.' });
      return;
    }
    if (file.size > MAX_BYTES) {
      publish({
        tone: 'danger',
        title: 'File too large',
        description: `Max upload is ${formatBytes(MAX_BYTES)}.`,
      });
      return;
    }

    try {
      const contentBase64 = await fileToBase64(file);
      await upload.mutateAsync({
        courseId,
        filename: file.name,
        mediaType: file.type || 'application/octet-stream',
        contentBase64,
        visibility,
        altText: altText.trim() ? altText.trim() : null,
      });
      publish({ tone: 'success', title: 'File uploaded', description: file.name });
      reset();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Upload failed. Try again.';
      publish({ tone: 'danger', title: 'Upload failed', description: message });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload file</DialogTitle>
          <DialogDescription>
            Files appear in the course library for selected viewers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file-input">File</Label>
            <Input
              id="file-input"
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <p className="text-xs text-(--color-text-muted)">
                {file.name} · {formatBytes(file.size)} · {file.type || 'unknown type'}
              </p>
            ) : (
              <p className="text-xs text-(--color-text-subtle)">
                Max {formatBytes(MAX_BYTES)} per upload.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as FileVisibility)}>
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-(--color-text-subtle)">
              {VISIBILITY_OPTIONS.find((opt) => opt.value === visibility)?.description}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="alt-text">Alt text (optional)</Label>
            <Input
              id="alt-text"
              type="text"
              maxLength={500}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Short description for screen readers"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={upload.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!file || !tenantId || upload.isPending}
              loading={upload.isPending}
            >
              <UploadCloud className="size-4" aria-hidden /> Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
