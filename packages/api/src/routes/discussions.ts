import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseModuleId,
  CourseUnitId,
  DiscussionPost,
  DiscussionPostGrade,
  DiscussionPostGradeStatus,
  DiscussionPostId,
  DiscussionTopic,
  DiscussionTopicId,
  DiscussionTopicSubscription,
  DiscussionTopicVisibility,
  RubricId,
  UserId,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const DiscussionTopicResponse = DiscussionTopic.openapi('DiscussionTopic');
export const DiscussionTopicSubscriptionResponse = DiscussionTopicSubscription.openapi(
  'DiscussionTopicSubscription',
);
export const DiscussionPostResponse = DiscussionPost.openapi('DiscussionPost');
const CreateDiscussionTopicBaseBody = {
  title: z.string().min(1).max(180).openapi({
    description: 'Discussion topic title.',
    example: 'Week 2 evidence workshop',
  }),
  prompt: z.string().min(1).max(4000).nullable().optional().openapi({
    description: 'Optional prompt shown before the discussion posts.',
    example: 'Share the sentence where your evidence needs the most help.',
  }),
  visibility: DiscussionTopicVisibility.openapi({
    description: 'Whether learners can see the topic.',
    example: 'draft',
  }),
  position: z.number().int().nonnegative().openapi({
    description: 'Sort position within the course or module placement.',
    example: 2,
  }),
  gradingEnabled: z.boolean().optional().openapi({
    description: 'When true, the topic is graded. Each post may carry a per-student grade.',
    example: false,
  }),
  pointsPossible: z.number().finite().nonnegative().nullable().optional().openapi({
    description:
      'Maximum score awardable for posts in this topic. Required when grading is enabled.',
    example: 10,
  }),
  rubricId: RubricId.nullable().optional().openapi({
    description: 'Optional rubric used to score discussion posts.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  }),
};

export const CreateDiscussionTopicBody = z.union([
  z
    .object({
      ...CreateDiscussionTopicBaseBody,
      moduleId: z.null().optional().openapi({
        description: 'No module placement for course-level topics.',
        example: null,
      }),
      unitId: z.null().optional().openapi({
        description: 'No unit placement for course-level topics.',
        example: null,
      }),
    })
    .strict(),
  z
    .object({
      ...CreateDiscussionTopicBaseBody,
      moduleId: CourseModuleId.openapi({
        description: 'Module placement for this discussion topic.',
        example: '01J9QW7B6N5W2YH3D3A1V0KE31',
      }),
      unitId: z.null().optional().openapi({
        description: 'No unit placement for module-level topics.',
        example: null,
      }),
    })
    .strict(),
  z
    .object({
      ...CreateDiscussionTopicBaseBody,
      moduleId: CourseModuleId.openapi({
        description: 'Parent module placement for this discussion topic.',
        example: '01J9QW7B6N5W2YH3D3A1V0KE31',
      }),
      unitId: CourseUnitId.openapi({
        description: 'Unit placement for this discussion topic.',
        example: '01J9QW7B6N5W2YH3D3A1V0KE32',
      }),
    })
    .strict(),
]);
export const CreateDiscussionPostBody = z
  .object({
    body: z.string().min(1).openapi({
      description: 'Post body to publish in the discussion topic.',
      example: 'I can clarify the evidence in the second sentence.',
    }),
    parentPostId: DiscussionPostId.nullable().optional().openapi({
      description: 'Optional parent discussion post identifier for threaded replies.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE3A',
    }),
    status: z.enum(['draft', 'published']).optional().openapi({
      description: 'Initial post workflow state. Omit to publish immediately.',
      example: 'draft',
    }),
  })
  .strict();

export const DiscussionTopicPathParams = CourseAssignmentPathParams.extend({
  topicId: DiscussionTopicId.openapi({
    param: {
      name: 'topicId',
      in: 'path',
      description: 'Discussion topic identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE39',
  }),
});

export const DiscussionTopicsQuery = z.object({
  moduleId: CourseModuleId.optional().openapi({
    description: 'Optional module filter for module-placed discussion topics.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE31',
  }),
  unitId: CourseUnitId.optional().openapi({
    description: 'Optional unit filter for unit-placed discussion topics.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE32',
  }),
});

export const listDiscussionTopicsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics',
  tags: ['Discussions'],
  operationId: 'listDiscussionTopics',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    query: DiscussionTopicsQuery,
  },
  responses: {
    200: {
      description: 'Discussion topics visible to the authenticated user.',
      content: {
        'application/json': {
          schema: DiscussionTopicResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const createDiscussionTopicRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics',
  tags: ['Discussions'],
  operationId: 'createDiscussionTopic',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateDiscussionTopicBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created discussion topic.',
      content: {
        'application/json': {
          schema: DiscussionTopicResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const UpdateDiscussionTopicBody = CreateDiscussionTopicBody;

export const updateDiscussionTopicRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}',
  tags: ['Discussions'],
  operationId: 'updateDiscussionTopic',
  security: [{ bearerAuth: [] }],
  request: {
    params: DiscussionTopicPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateDiscussionTopicBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated discussion topic.',
      content: {
        'application/json': {
          schema: DiscussionTopicResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteDiscussionTopicRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}',
  tags: ['Discussions'],
  operationId: 'deleteDiscussionTopic',
  security: [{ bearerAuth: [] }],
  request: {
    params: DiscussionTopicPathParams,
  },
  responses: {
    204: {
      description: 'Discussion topic deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const subscribeDiscussionTopicRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/subscription',
  tags: ['Discussions'],
  operationId: 'subscribeDiscussionTopic',
  security: [{ bearerAuth: [] }],
  request: {
    params: DiscussionTopicPathParams,
  },
  responses: {
    200: {
      description: 'Current user discussion topic subscription.',
      content: {
        'application/json': {
          schema: DiscussionTopicSubscriptionResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const unsubscribeDiscussionTopicRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/subscription',
  tags: ['Discussions'],
  operationId: 'unsubscribeDiscussionTopic',
  security: [{ bearerAuth: [] }],
  request: {
    params: DiscussionTopicPathParams,
  },
  responses: {
    204: {
      description: 'Current user unsubscribed from the discussion topic.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listDiscussionPostsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts',
  tags: ['Discussions'],
  operationId: 'listDiscussionPosts',
  security: [{ bearerAuth: [] }],
  request: {
    params: DiscussionTopicPathParams,
  },
  responses: {
    200: {
      description: 'Discussion posts visible to the authenticated user.',
      content: {
        'application/json': {
          schema: DiscussionPostResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const createDiscussionPostRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts',
  tags: ['Discussions'],
  operationId: 'createDiscussionPost',
  security: [{ bearerAuth: [] }],
  request: {
    params: DiscussionTopicPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateDiscussionPostBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created discussion post.',
      content: {
        'application/json': {
          schema: DiscussionPostResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const DiscussionPostPathParams = DiscussionTopicPathParams.extend({
  postId: DiscussionPostId.openapi({
    param: {
      name: 'postId',
      in: 'path',
      description: 'Discussion post identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE3A',
  }),
});

export const UpdateDiscussionPostBody = z
  .object({
    body: z.string().min(1).openapi({
      description: 'Updated post body.',
      example: 'I can clarify the evidence in the second sentence (edited).',
    }),
    status: z.enum(['draft', 'published']).optional().openapi({
      description: 'Updated post workflow state. Use published to publish a saved draft.',
      example: 'published',
    }),
  })
  .strict();

export const updateDiscussionPostRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts/{postId}',
  tags: ['Discussions'],
  operationId: 'updateDiscussionPost',
  security: [{ bearerAuth: [] }],
  request: {
    params: DiscussionPostPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateDiscussionPostBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated discussion post.',
      content: {
        'application/json': {
          schema: DiscussionPostResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteDiscussionPostRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts/{postId}',
  tags: ['Discussions'],
  operationId: 'deleteDiscussionPost',
  security: [{ bearerAuth: [] }],
  request: {
    params: DiscussionPostPathParams,
  },
  responses: {
    204: {
      description: 'Discussion post deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const DiscussionPostGradeResponse = DiscussionPostGrade.openapi('DiscussionPostGrade');

export const DiscussionPostGradesQuery = z.object({
  studentId: UserId.optional().openapi({
    description: 'Optional filter to a single student.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  }),
});

export const UpsertDiscussionPostGradeBody = z
  .object({
    score: z.number().finite().nonnegative().openapi({
      description: 'Score awarded for the post.',
      example: 8,
    }),
    maxScore: z.number().finite().positive().openapi({
      description: 'Maximum points possible for this grade.',
      example: 10,
    }),
    status: DiscussionPostGradeStatus.openapi({
      description: 'Workflow status for the grade.',
      example: 'draft',
    }),
    comment: z.string().min(1).max(4_000).nullable().openapi({
      description: 'Optional grader comment shown to the student when published.',
      example: 'Strong analysis. Strengthen the citation in paragraph two.',
    }),
  })
  .strict();

export const listDiscussionPostGradesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/grades',
  tags: ['Discussions'],
  operationId: 'listDiscussionPostGrades',
  security: [{ bearerAuth: [] }],
  request: {
    params: DiscussionTopicPathParams,
    query: DiscussionPostGradesQuery,
  },
  responses: {
    200: {
      description: 'Discussion post grades for the topic.',
      content: { 'application/json': { schema: DiscussionPostGradeResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const upsertDiscussionPostGradeRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-topics/{topicId}/posts/{postId}/grade',
  tags: ['Discussions'],
  operationId: 'upsertDiscussionPostGrade',
  security: [{ bearerAuth: [] }],
  request: {
    params: DiscussionPostPathParams,
    body: {
      required: true,
      content: { 'application/json': { schema: UpsertDiscussionPostGradeBody } },
    },
  },
  responses: {
    200: {
      description: 'Stored discussion post grade.',
      content: { 'application/json': { schema: DiscussionPostGradeResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
