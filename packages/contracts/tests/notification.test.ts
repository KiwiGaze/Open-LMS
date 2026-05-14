import { describe, expect, it } from 'vitest';
import { NotificationPreference, NotificationRecord } from '../src/index.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

describe('notification contracts', () => {
  it('models notification records for in-app delivery state', () => {
    const notification = NotificationRecord.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      recipientId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      category: 'feedback_published',
      title: 'Feedback published',
      body: 'Your instructor published feedback for Evidence essay.',
      resourceType: 'published_feedback',
      resourceId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      deliveryState: 'pending',
      readAt: null,
      createdAt: now,
    });

    expect(notification.deliveryState).toBe('pending');
  });

  it('models per-channel notification preferences for a tenant user', () => {
    const preference = NotificationPreference.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      category: 'grade_published',
      channel: 'email',
      frequency: 'daily_digest',
      createdAt: now,
      updatedAt: now,
    });

    expect(preference).toMatchObject({
      category: 'grade_published',
      channel: 'email',
      frequency: 'daily_digest',
    });
  });

  it('models push notification preferences separately from device tokens', () => {
    const preference = NotificationPreference.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      category: 'grade_published',
      channel: 'push',
      frequency: 'immediate',
      createdAt: now,
      updatedAt: now,
    });

    expect(preference.channel).toBe('push');
  });

  it('models announcement publication preferences', () => {
    const preference = NotificationPreference.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      category: 'announcement_published',
      channel: 'in_app',
      frequency: 'immediate',
      createdAt: now,
      updatedAt: now,
    });

    expect(preference.category).toBe('announcement_published');
  });

  it('models discussion reply preferences', () => {
    const preference = NotificationPreference.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE32',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      category: 'discussion_reply',
      channel: 'in_app',
      frequency: 'immediate',
      createdAt: now,
      updatedAt: now,
    });

    expect(preference.category).toBe('discussion_reply');
  });

  it('models calendar reminder preferences', () => {
    const preference = NotificationPreference.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      category: 'calendar_reminder',
      channel: 'push',
      frequency: 'immediate',
      createdAt: now,
      updatedAt: now,
    });

    expect(preference.category).toBe('calendar_reminder');
  });
});
