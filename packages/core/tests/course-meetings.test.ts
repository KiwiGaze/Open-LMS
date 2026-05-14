import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import { createCourseMeeting, updateCourseMeeting } from '../src/meetings/repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const meetingId = '01J9QW7B6N5W2YH3D3A1V0KE92';
const startsAt = new Date('2026-09-10T15:00:00.000Z');
const endsAt = new Date('2026-09-10T16:30:00.000Z');
const now = new Date('2026-05-12T00:00:00.000Z');

const meetingInput = {
  tenantId,
  courseId,
  title: 'Live workshop',
  description: 'Synchronous workshop on rubrics and feedback.',
  provider: 'zoom' as const,
  externalUrl: 'https://example.zoom.us/j/123456789',
  startsAt,
  endsAt,
  recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
  playbackUrl: 'https://media.example.edu/playback/workshop',
  status: 'scheduled' as const,
};

describe('course meeting repository', () => {
  it('stores recording and playback URLs when creating meetings', async () => {
    const inserted: unknown[] = [];
    const db = {
      insert: () => ({
        values: (value: unknown) => ({
          returning: async () => {
            inserted.push(value);
            return [value];
          },
        }),
      }),
    } as unknown as Database;

    const meeting = await createCourseMeeting(db, meetingInput, now);

    expect(meeting).toMatchObject({
      recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
      playbackUrl: 'https://media.example.edu/playback/workshop',
    });
    expect(inserted[0]).toMatchObject({
      recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
      playbackUrl: 'https://media.example.edu/playback/workshop',
    });
  });

  it('updates recording and playback URLs for meetings', async () => {
    const updates: unknown[] = [];
    const db = {
      update: () => ({
        set: (value: unknown) => {
          updates.push(value);
          return {
            where: () => ({
              returning: async () => [
                {
                  id: meetingId,
                  ...meetingInput,
                  ...(value as Record<string, unknown>),
                  updatedAt: now,
                  createdAt: now,
                },
              ],
            }),
          };
        },
      }),
    } as unknown as Database;

    const meeting = await updateCourseMeeting(db, { meetingId, ...meetingInput }, now);

    expect(meeting).toMatchObject({
      recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
      playbackUrl: 'https://media.example.edu/playback/workshop',
    });
    expect(updates[0]).toMatchObject({
      recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
      playbackUrl: 'https://media.example.edu/playback/workshop',
    });
  });
});
