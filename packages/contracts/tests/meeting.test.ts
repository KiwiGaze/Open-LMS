import { describe, expect, it } from 'vitest';
import { CourseMeeting } from '../src/meeting.ts';

const meeting = {
  id: '01J9QW7B6N5W2YH3D3A1V0KE92',
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE85',
  courseId: '01J9QW7B6N5W2YH3D3A1V0KE86',
  title: 'Live workshop',
  description: 'Synchronous workshop on rubrics and feedback.',
  provider: 'zoom',
  externalUrl: 'https://example.zoom.us/j/123456789',
  startsAt: new Date('2026-09-10T15:00:00.000Z'),
  endsAt: new Date('2026-09-10T16:30:00.000Z'),
  recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
  playbackUrl: 'https://media.example.edu/playback/workshop',
  status: 'scheduled',
  createdAt: new Date('2026-05-12T00:00:00.000Z'),
  updatedAt: new Date('2026-05-12T00:00:00.000Z'),
};

describe('CourseMeeting', () => {
  it('accepts secure recording and playback URLs', () => {
    expect(CourseMeeting.parse(meeting)).toMatchObject({
      recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
      playbackUrl: 'https://media.example.edu/playback/workshop',
    });
  });

  it('rejects insecure recording and playback URLs', () => {
    expect(() =>
      CourseMeeting.parse({
        ...meeting,
        recordingUrl: 'http://media.example.edu/recordings/workshop.mp4',
      }),
    ).toThrow();

    expect(() =>
      CourseMeeting.parse({
        ...meeting,
        playbackUrl: 'http://media.example.edu/playback/workshop',
      }),
    ).toThrow();
  });
});
