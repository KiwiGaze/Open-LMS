import { sql } from 'drizzle-orm';
import { check, foreignKey, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { tenant } from './tenant.ts';

export const notification = pgTable(
  'notification',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    deliveryState: text('delivery_state').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('notification_tenant_id_uq').on(table.tenantId, table.id),
    tenantRecipientIdUnique: uniqueIndex('notification_tenant_recipient_id_uq').on(
      table.tenantId,
      table.recipientId,
      table.id,
    ),
  }),
);

export const notificationDigestDelivery = pgTable(
  'notification_digest_delivery',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    notificationId: text('notification_id')
      .notNull()
      .references(() => notification.id, { onDelete: 'cascade' }),
    channel: text('channel').notNull(),
    frequency: text('frequency').notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    deliveredOnce: uniqueIndex('notification_digest_delivery_once_uq').on(
      table.tenantId,
      table.notificationId,
      table.channel,
      table.frequency,
    ),
    notificationForeignKey: foreignKey({
      name: 'notification_digest_delivery_notification_fk',
      columns: [table.tenantId, table.notificationId],
      foreignColumns: [notification.tenantId, notification.id],
    }).onDelete('cascade'),
    recipientNotificationForeignKey: foreignKey({
      name: 'notification_digest_delivery_recipient_notification_fk',
      columns: [table.tenantId, table.recipientId, table.notificationId],
      foreignColumns: [notification.tenantId, notification.recipientId, notification.id],
    }).onDelete('cascade'),
    channelCheck: check(
      'notification_digest_delivery_channel_check',
      sql`${table.channel} IN ('email')`,
    ),
    frequencyCheck: check(
      'notification_digest_delivery_frequency_check',
      sql`${table.frequency} IN ('daily_digest', 'weekly_digest')`,
    ),
  }),
);

export const notificationPreference = pgTable(
  'notification_preference',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    channel: text('channel').notNull(),
    frequency: text('frequency').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantUserCategoryChannelUnique: uniqueIndex(
      'notification_preference_tenant_user_category_channel_uq',
    ).on(table.tenantId, table.userId, table.category, table.channel),
    categoryCheck: check(
      'notification_preference_category_check',
      sql`${table.category} IN ('feedback_published', 'ai_generation_ready', 'review_requested', 'grade_published', 'announcement_published', 'discussion_reply', 'calendar_reminder', 'system')`,
    ),
    channelCheck: check(
      'notification_preference_channel_check',
      sql`${table.channel} IN ('in_app', 'email', 'push')`,
    ),
    frequencyCheck: check(
      'notification_preference_frequency_check',
      sql`${table.frequency} IN ('immediate', 'daily_digest', 'weekly_digest', 'off')`,
    ),
  }),
);

export const userPushToken = pgTable(
  'user_push_token',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    platform: text('platform').notNull(),
    token: text('token').notNull(),
    locale: text('locale'),
    appVersion: text('app_version'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('user_push_token_tenant_id_uq').on(table.tenantId, table.id),
    uniqueToken: uniqueIndex('user_push_token_unique_token_uq').on(
      table.tenantId,
      table.userId,
      table.platform,
      table.token,
    ),
    platformCheck: check(
      'user_push_token_platform_check',
      sql`${table.platform} IN ('ios', 'android', 'web')`,
    ),
    tokenLengthCheck: check(
      'user_push_token_length_check',
      sql`length(${table.token}) BETWEEN 1 AND 4096`,
    ),
    localeLengthCheck: check(
      'user_push_token_locale_length_check',
      sql`${table.locale} IS NULL OR length(${table.locale}) BETWEEN 2 AND 16`,
    ),
    appVersionLengthCheck: check(
      'user_push_token_app_version_length_check',
      sql`${table.appVersion} IS NULL OR length(${table.appVersion}) BETWEEN 1 AND 64`,
    ),
  }),
);
