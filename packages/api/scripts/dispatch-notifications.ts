import {
  dispatchNotificationDeliveries,
  readNotificationDispatchLimit,
} from '../src/notification-delivery.ts';

const tenantId = process.env.NOTIFICATION_DISPATCH_TENANT_ID;

if (!tenantId) {
  throw new Error('NOTIFICATION_DISPATCH_TENANT_ID is required to dispatch notifications.');
}

const result = await dispatchNotificationDeliveries(process.env, {
  tenantId,
  limit: readNotificationDispatchLimit(process.env),
});

console.log(JSON.stringify(result));
