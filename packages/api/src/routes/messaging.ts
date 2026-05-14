import { createRoute, z } from '@hono/zod-openapi';
import {
  ConversationMessage,
  ConversationThread,
  ConversationThreadId,
  CourseId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const ConversationThreadResponse = ConversationThread.openapi('ConversationThread');
export const ConversationMessageResponse = ConversationMessage.openapi('ConversationMessage');

export const CourseConversationPathParams = CourseAssignmentPathParams.extend({
  threadId: ConversationThreadId.openapi({
    param: {
      name: 'threadId',
      in: 'path',
      description: 'Conversation thread identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE4Y',
  }),
});

export const listConversationThreadsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/conversations',
  tags: ['Messaging'],
  operationId: 'listConversationThreads',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Conversation threads visible to the authenticated user.',
      content: {
        'application/json': {
          schema: ConversationThreadResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateConversationThreadBody = z
  .object({
    subject: z.string().min(1).max(180).openapi({
      description: 'Subject line displayed in conversation lists.',
      example: 'Question about Module 3 essay',
    }),
    participantIds: z
      .array(UserId)
      .min(1)
      .max(50)
      .openapi({
        description:
          'Course members to include in the conversation. The authenticated user is added automatically.',
        example: ['01J9QW7B6N5W2YH3D3A1V0KE88'],
      }),
    body: z.string().min(1).max(4000).openapi({
      description: 'Initial message body posted into the new thread.',
      example: 'Hi, I had a question about the rubric for the essay assignment.',
    }),
  })
  .strict();

export const createConversationThreadRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/conversations',
  tags: ['Messaging'],
  operationId: 'createConversationThread',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateConversationThreadBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Conversation thread created with its initial message.',
      content: {
        'application/json': {
          schema: ConversationThreadResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listConversationMessagesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/conversations/{threadId}/messages',
  tags: ['Messaging'],
  operationId: 'listConversationMessages',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseConversationPathParams,
  },
  responses: {
    200: {
      description: 'Conversation messages visible to the authenticated user.',
      content: {
        'application/json': {
          schema: ConversationMessageResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const CreateConversationMessageBody = z
  .object({
    body: z.string().min(1).max(4000).openapi({
      description: 'Message body to post in the conversation thread.',
      example: 'Thanks — submitting the revision now.',
    }),
  })
  .strict();

export const createConversationMessageRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/conversations/{threadId}/messages',
  tags: ['Messaging'],
  operationId: 'createConversationMessage',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseConversationPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateConversationMessageBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Conversation message created.',
      content: {
        'application/json': {
          schema: ConversationMessageResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const TenantInboxPathParams = z.object({
  tenantId: TenantId.openapi({
    param: { name: 'tenantId', in: 'path', description: 'Tenant identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0A',
  }),
});

export const TenantInboxThreadPathParams = TenantInboxPathParams.extend({
  threadId: ConversationThreadId.openapi({
    param: { name: 'threadId', in: 'path', description: 'Conversation thread identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE4Y',
  }),
});

export const listInboxThreadsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/inbox/threads',
  tags: ['Messaging'],
  operationId: 'listInboxThreads',
  security: [{ bearerAuth: [] }],
  request: { params: TenantInboxPathParams },
  responses: {
    200: {
      description:
        'Conversation threads where the authenticated user is a participant, across all courses (including tenant-wide threads without a courseId).',
      content: { 'application/json': { schema: ConversationThreadResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateInboxThreadBody = z
  .object({
    subject: z.string().min(1).max(180).openapi({
      description: 'Subject line displayed in conversation lists.',
      example: 'Welcome to the new term',
    }),
    participantIds: z.array(UserId).min(1).max(50).openapi({
      description: 'Tenant members to include. The authenticated user is added automatically.',
    }),
    body: z.string().min(1).max(4000).openapi({
      description: 'Initial message body for the new thread.',
    }),
    courseId: CourseId.nullable().default(null).openapi({
      description: 'Optional course scope. Null creates a tenant-wide thread.',
    }),
  })
  .strict();

export const createInboxThreadRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/inbox/threads',
  tags: ['Messaging'],
  operationId: 'createInboxThread',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantInboxPathParams,
    body: {
      required: true,
      content: { 'application/json': { schema: CreateInboxThreadBody } },
    },
  },
  responses: {
    201: {
      description: 'Created conversation thread (course-scoped or tenant-wide).',
      content: { 'application/json': { schema: ConversationThreadResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listInboxThreadMessagesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/inbox/threads/{threadId}/messages',
  tags: ['Messaging'],
  operationId: 'listInboxThreadMessages',
  security: [{ bearerAuth: [] }],
  request: { params: TenantInboxThreadPathParams },
  responses: {
    200: {
      description:
        'Messages in a thread visible to the authenticated participant. Works for both course-scoped and tenant-wide threads.',
      content: { 'application/json': { schema: ConversationMessageResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const CreateInboxThreadMessageBody = z
  .object({
    body: z.string().min(1).max(4000).openapi({
      description: 'Message body to post.',
    }),
  })
  .strict();

export const createInboxThreadMessageRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/inbox/threads/{threadId}/messages',
  tags: ['Messaging'],
  operationId: 'createInboxThreadMessage',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantInboxThreadPathParams,
    body: {
      required: true,
      content: { 'application/json': { schema: CreateInboxThreadMessageBody } },
    },
  },
  responses: {
    201: {
      description: 'Created message.',
      content: { 'application/json': { schema: ConversationMessageResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
