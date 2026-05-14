import { z } from 'zod';
import { TenantId, UserId, XapiStatementId } from './ids.ts';

const XapiJsonObject = z.object({}).catchall(z.unknown());
const XapiStatementUuid = z.string().uuid();
const XapiIri = z.string().url().max(2048);

export const XapiStatementIngest = z
  .object({
    id: XapiStatementUuid.optional(),
    actor: XapiJsonObject,
    verb: XapiJsonObject.extend({
      id: XapiIri,
    }),
    object: XapiJsonObject.extend({
      id: XapiIri,
    }),
    result: XapiJsonObject.optional(),
    context: XapiJsonObject.optional(),
    timestamp: z.string().datetime().optional(),
  })
  .strict();
export type XapiStatementIngest = z.infer<typeof XapiStatementIngest>;

export const XapiStatement = z
  .object({
    id: XapiStatementId,
    tenantId: TenantId,
    statementId: XapiStatementUuid,
    receivedById: UserId,
    actor: XapiJsonObject,
    verb: XapiJsonObject.extend({
      id: XapiIri,
    }),
    object: XapiJsonObject.extend({
      id: XapiIri,
    }),
    result: XapiJsonObject.nullable(),
    context: XapiJsonObject.nullable(),
    timestamp: z.date().nullable(),
    storedAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type XapiStatement = z.infer<typeof XapiStatement>;
