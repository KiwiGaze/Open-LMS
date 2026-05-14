import { z } from 'zod';
import { CourseId, CourseMeetingId, TenantId } from './ids.ts';

export const CourseMeetingProvider = z.enum(['bbb', 'zoom', 'teams', 'google_meet', 'other']);
export type CourseMeetingProvider = z.infer<typeof CourseMeetingProvider>;

export const CourseMeetingStatus = z.enum(['scheduled', 'in_progress', 'ended', 'cancelled']);
export type CourseMeetingStatus = z.infer<typeof CourseMeetingStatus>;

const SecureMeetingUrl = z
  .string()
  .url()
  .max(2_048)
  .regex(/^https:\/\//, 'Meeting URL must use HTTPS.');

export const CourseMeeting = z
  .object({
    id: CourseMeetingId,
    tenantId: TenantId,
    courseId: CourseId,
    title: z.string().min(1).max(180),
    description: z.string().min(1).max(2_000).nullable(),
    provider: CourseMeetingProvider,
    externalUrl: SecureMeetingUrl,
    startsAt: z.date(),
    endsAt: z.date().nullable(),
    recordingUrl: SecureMeetingUrl.nullable().default(null),
    playbackUrl: SecureMeetingUrl.nullable().default(null),
    status: CourseMeetingStatus,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((meeting, context) => {
    if (meeting.endsAt && meeting.endsAt.getTime() <= meeting.startsAt.getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Course meeting end time must be after the start time.',
        path: ['endsAt'],
      });
    }
  });
export type CourseMeeting = z.infer<typeof CourseMeeting>;
