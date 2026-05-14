import { dispatchOutboxEvents, readOutboxDispatchLimit } from '../src/outbox-dispatch.ts';

const tenantId = process.env.OUTBOX_DISPATCH_TENANT_ID;

if (!tenantId) {
  throw new Error('OUTBOX_DISPATCH_TENANT_ID is required to dispatch outbox events.');
}

const result = await dispatchOutboxEvents(process.env, {
  tenantId,
  limit: readOutboxDispatchLimit(process.env),
});

console.log(JSON.stringify(result));
