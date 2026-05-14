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
import {
  type CourseMeetingInput,
  useCreateCourseMeetingMutation,
  useUpdateCourseMeetingMutation,
} from '@/lib/api/queries/meetings.ts';
import type { CourseMeeting, CourseMeetingProvider, CourseMeetingStatus } from '@openlms/contracts';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

const PROVIDERS: { value: CourseMeetingProvider; label: string }[] = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'bbb', label: 'BigBlueButton' },
  { value: 'other', label: 'Other' },
];

const STATUSES: { value: CourseMeetingStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'ended', label: 'Ended' },
  { value: 'cancelled', label: 'Cancelled' },
];

function toLocalInput(value: Date | string | null): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function MeetingDialog({
  tenantId,
  courseId,
  open,
  onOpenChange,
  existing,
}: {
  tenantId: string | null;
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: CourseMeeting | null;
}) {
  const { publish } = useToast();
  const create = useCreateCourseMeetingMutation(tenantId, courseId);
  const update = useUpdateCourseMeetingMutation(tenantId, courseId);
  const isEdit = Boolean(existing);
  const submitting = create.isPending || update.isPending;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState<CourseMeetingProvider>('zoom');
  const [externalUrl, setExternalUrl] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [status, setStatus] = useState<CourseMeetingStatus>('scheduled');
  const [errors, setErrors] = useState<{
    title?: string;
    externalUrl?: string;
    recordingUrl?: string;
    playbackUrl?: string;
    startsAt?: string;
    endsAt?: string;
  }>({});

  useEffect(() => {
    if (!open) return;
    setTitle(existing?.title ?? '');
    setDescription(existing?.description ?? '');
    setProvider(existing?.provider ?? 'zoom');
    setExternalUrl(existing?.externalUrl ?? '');
    setStartsAt(toLocalInput(existing?.startsAt ?? null));
    setEndsAt(toLocalInput(existing?.endsAt ?? null));
    setRecordingUrl(existing?.recordingUrl ?? '');
    setPlaybackUrl(existing?.playbackUrl ?? '');
    setStatus(existing?.status ?? 'scheduled');
    setErrors({});
  }, [open, existing]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedExternalUrl = externalUrl.trim();
    const trimmedRecording = recordingUrl.trim();
    const trimmedPlayback = playbackUrl.trim();
    const startIso = toIso(startsAt);
    const endIso = toIso(endsAt);

    const nextErrors: typeof errors = {};
    if (!trimmedTitle) nextErrors.title = 'Enter a meeting title.';
    if (!trimmedExternalUrl) nextErrors.externalUrl = 'Enter a join URL.';
    else if (!/^https:\/\//.test(trimmedExternalUrl))
      nextErrors.externalUrl = 'Join URL must start with https://';
    if (trimmedRecording && !/^https:\/\//.test(trimmedRecording))
      nextErrors.recordingUrl = 'Recording URL must start with https://';
    if (trimmedPlayback && !/^https:\/\//.test(trimmedPlayback))
      nextErrors.playbackUrl = 'Playback URL must start with https://';
    if (!startIso) nextErrors.startsAt = 'Pick a start time.';
    if (startIso && endIso && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      nextErrors.endsAt = 'End time must be after the start time.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !startIso) return;

    const input: CourseMeetingInput = {
      title: trimmedTitle,
      description: description.trim() ? description.trim() : null,
      provider,
      externalUrl: trimmedExternalUrl,
      startsAt: startIso,
      endsAt: endIso,
      recordingUrl: trimmedRecording ? trimmedRecording : null,
      playbackUrl: trimmedPlayback ? trimmedPlayback : null,
      status,
    };

    try {
      if (existing) {
        await update.mutateAsync({ meetingId: existing.id, input });
      } else {
        await create.mutateAsync(input);
      }
      publish({ tone: 'success', title: isEdit ? 'Meeting saved' : 'Meeting created' });
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save. Try again.';
      publish({ tone: 'danger', title: 'Save failed', description: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit meeting' : 'New meeting'}</DialogTitle>
          <DialogDescription>
            Meetings link out to a conferencing provider. Add the provider-issued join URL.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Title" id="meeting-title" required error={errors.title}>
            <Input
              id="meeting-title"
              type="text"
              maxLength={180}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              required
            />
          </FormField>

          <FormField label="Description" id="meeting-description">
            <Textarea
              id="meeting-description"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional context for learners."
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Provider" id="meeting-provider">
              <Select
                value={provider}
                onValueChange={(v) => setProvider(v as CourseMeetingProvider)}
              >
                <SelectTrigger id="meeting-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status" id="meeting-status">
              <Select value={status} onValueChange={(v) => setStatus(v as CourseMeetingStatus)}>
                <SelectTrigger id="meeting-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField
            label="Join URL"
            id="meeting-url"
            required
            error={errors.externalUrl}
            description="HTTPS URL issued by your conferencing provider."
          >
            <Input
              id="meeting-url"
              type="url"
              maxLength={2048}
              value={externalUrl}
              onChange={(e) => {
                setExternalUrl(e.target.value);
                if (errors.externalUrl) setErrors((prev) => ({ ...prev, externalUrl: undefined }));
              }}
              placeholder="https://zoom.us/j/…"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Starts at" id="meeting-starts" required error={errors.startsAt}>
              <Input
                id="meeting-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value);
                  if (errors.startsAt) setErrors((prev) => ({ ...prev, startsAt: undefined }));
                }}
                required
              />
            </FormField>
            <FormField label="Ends at" id="meeting-ends" error={errors.endsAt}>
              <Input
                id="meeting-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => {
                  setEndsAt(e.target.value);
                  if (errors.endsAt) setErrors((prev) => ({ ...prev, endsAt: undefined }));
                }}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Recording URL" id="meeting-recording" error={errors.recordingUrl}>
              <Input
                id="meeting-recording"
                type="url"
                maxLength={2048}
                value={recordingUrl}
                onChange={(e) => {
                  setRecordingUrl(e.target.value);
                  if (errors.recordingUrl)
                    setErrors((prev) => ({ ...prev, recordingUrl: undefined }));
                }}
                placeholder="https://…"
              />
            </FormField>
            <FormField label="Playback URL" id="meeting-playback" error={errors.playbackUrl}>
              <Input
                id="meeting-playback"
                type="url"
                maxLength={2048}
                value={playbackUrl}
                onChange={(e) => {
                  setPlaybackUrl(e.target.value);
                  if (errors.playbackUrl)
                    setErrors((prev) => ({ ...prev, playbackUrl: undefined }));
                }}
                placeholder="https://…"
              />
            </FormField>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting} loading={submitting}>
              <Save className="size-4" aria-hidden /> {isEdit ? 'Save changes' : 'Create meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
