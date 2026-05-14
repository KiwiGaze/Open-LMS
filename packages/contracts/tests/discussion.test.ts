import { describe, expect, it } from 'vitest';
import { DiscussionPost, DiscussionTopic, DiscussionTopicSubscription } from '../src/discussion.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const unitId = '01J9QW7B6N5W2YH3D3A1V0KE32';
const topicId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const authorId = '01J9QW7B6N5W2YH3D3A1V0KE2X';

describe('discussion contracts', () => {
  it('accepts course discussion topics with visibility state', () => {
    expect(
      DiscussionTopic.parse({
        id: topicId,
        tenantId,
        courseId,
        moduleId,
        unitId,
        title: 'Essay workshop',
        prompt: 'Share one paragraph and ask for one specific kind of feedback.',
        visibility: 'published',
        position: 0,
        createdAt: now,
        updatedAt: now,
      }),
    ).toEqual({
      id: topicId,
      tenantId,
      courseId,
      moduleId,
      unitId,
      title: 'Essay workshop',
      prompt: 'Share one paragraph and ask for one specific kind of feedback.',
      visibility: 'published',
      position: 0,
      gradingEnabled: false,
      pointsPossible: null,
      rubricId: null,
      requirePostBeforeSeeingOthers: false,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('rejects graded discussion topics without pointsPossible', () => {
    expect(() =>
      DiscussionTopic.parse({
        id: topicId,
        tenantId,
        courseId,
        moduleId,
        unitId,
        title: 'Essay workshop',
        prompt: 'Share one paragraph and ask for one specific kind of feedback.',
        visibility: 'published',
        position: 0,
        gradingEnabled: true,
        pointsPossible: null,
        rubricId: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow('Graded discussion topics must declare pointsPossible.');
  });

  it('rejects unit discussion topic placement without a module', () => {
    expect(() =>
      DiscussionTopic.parse({
        id: topicId,
        tenantId,
        courseId,
        moduleId: null,
        unitId,
        title: 'Essay workshop',
        prompt: 'Share one paragraph and ask for one specific kind of feedback.',
        visibility: 'published',
        position: 0,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow('Unit discussion topics must include their parent module.');
  });

  it('accepts threaded discussion posts with moderation state', () => {
    expect(
      DiscussionPost.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
        tenantId,
        topicId,
        authorId,
        parentPostId: null,
        body: 'I am unsure whether my evidence connects clearly enough.',
        status: 'published',
        createdAt: now,
        updatedAt: now,
      }),
    ).toEqual({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      tenantId,
      topicId,
      authorId,
      parentPostId: null,
      body: 'I am unsure whether my evidence connects clearly enough.',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('accepts draft discussion posts', () => {
    expect(
      DiscussionPost.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE33',
        tenantId,
        topicId,
        authorId,
        parentPostId: null,
        body: 'I need to finish this reply later.',
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      status: 'draft',
      authorId,
    });
  });

  it('accepts discussion topic subscriptions', () => {
    expect(
      DiscussionTopicSubscription.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE30',
        tenantId,
        topicId,
        userId: authorId,
        createdAt: now,
      }),
    ).toEqual({
      id: '01J9QW7B6N5W2YH3D3A1V0KE30',
      tenantId,
      topicId,
      userId: authorId,
      createdAt: now,
    });
  });
});
