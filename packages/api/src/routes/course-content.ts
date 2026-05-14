import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseContentAccessPolicy,
  CourseContentVisibility,
  CourseModule,
  CourseModuleId,
  CoursePage,
  CoursePageId,
  CoursePageVisibility,
  CourseResource,
  CourseResourceId,
  CourseResourceType,
  CourseSyllabus,
  CourseSyllabusVisibility,
  CourseUnit,
  CourseUnitId,
  LearningObjective,
  LearningObjectiveCoverage,
  LearningObjectiveId,
  LearningObjectiveMastery,
  LearningObjectiveStatus,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const CourseModuleResponse = CourseModule.openapi('CourseModule');
export const CourseUnitResponse = CourseUnit.openapi('CourseUnit');
export const CourseResourceResponse = CourseResource.openapi('CourseResource');
export const LearningObjectiveResponse = LearningObjective.openapi('LearningObjective');
export const LearningObjectiveMasteryResponse = LearningObjectiveMastery.openapi(
  'LearningObjectiveMastery',
  {
    description:
      'Per-student mastery state for a course learning objective. score and maxScore must both be null or both be finite numbers, and score cannot exceed maxScore.',
  },
);
export const CourseSyllabusResponse = CourseSyllabus.openapi('CourseSyllabus');
export const CoursePageResponse = CoursePage.openapi('CoursePage');
export const CreateCoursePageBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Course page title.',
      example: 'Evidence page',
    }),
    body: z.string().min(1).openapi({
      description: 'Course page body.',
      example: 'Evidence needs reasoning that connects it to a claim.',
    }),
    visibility: CoursePageVisibility.openapi({
      description: 'Whether learners can see the page.',
      example: 'published',
    }),
    learningObjectiveIds: LearningObjectiveId.array().openapi({
      description: 'Learning objectives aligned to this page.',
      example: ['01J9QW7B6N5W2YH3D3A1V0KE34'],
    }),
  })
  .strict();

export const CoursePagePathParams = CourseAssignmentPathParams.extend({
  pageId: CoursePageId.openapi({
    param: {
      name: 'pageId',
      in: 'path',
      description: 'Course page identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE35',
  }),
});

export const CourseUnitsQuery = z.object({
  moduleId: CourseModuleId.optional().openapi({
    description: 'Optional module filter.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE31',
  }),
});

export const CourseResourcesQuery = z.object({
  moduleId: CourseModuleId.optional().openapi({
    description: 'Optional module filter.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE31',
  }),
  unitId: CourseUnitId.optional().openapi({
    description: 'Optional unit filter.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE32',
  }),
});

export const listCourseModulesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules',
  tags: ['Course Content'],
  operationId: 'listCourseModules',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course modules visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CourseModuleResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCourseModuleBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Course module title.',
      example: 'Foundations of evidence-based writing',
    }),
    summary: z.string().min(1).max(2_000).nullable().openapi({
      description: 'Optional course module summary.',
      example: 'Introduces the core argument structure used throughout the course.',
    }),
    visibility: CourseContentVisibility.openapi({
      description: 'Whether learners can see the module.',
      example: 'published',
    }),
    accessPolicy: CourseContentAccessPolicy.openapi({
      description: 'Who is allowed to read the module contents.',
      example: 'course_member',
    }),
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the course.',
      example: 0,
    }),
    learningObjectiveIds: LearningObjectiveId.array().openapi({
      description: 'Learning objectives aligned to this module.',
      example: ['01J9QW7B6N5W2YH3D3A1V0KE34'],
    }),
  })
  .strict();

export const createCourseModuleRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules',
  tags: ['Course Content'],
  operationId: 'createCourseModule',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseModuleBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course module.',
      content: {
        'application/json': {
          schema: CourseModuleResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listCourseUnitsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/units',
  tags: ['Course Content'],
  operationId: 'listCourseUnits',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    query: CourseUnitsQuery,
  },
  responses: {
    200: {
      description: 'Course units visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CourseUnitResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCourseUnitBody = z
  .object({
    moduleId: CourseModuleId.openapi({
      description: 'Parent module identifier.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE31',
    }),
    title: z.string().min(1).max(180).openapi({
      description: 'Course unit title.',
      example: 'Defining a claim',
    }),
    summary: z.string().min(1).max(2_000).nullable().openapi({
      description: 'Optional course unit summary.',
      example: 'How to phrase a defensible thesis statement.',
    }),
    visibility: CourseContentVisibility.openapi({
      description: 'Whether learners can see the unit.',
      example: 'published',
    }),
    accessPolicy: CourseContentAccessPolicy.openapi({
      description: 'Who is allowed to read the unit contents.',
      example: 'course_member',
    }),
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the parent module.',
      example: 0,
    }),
    learningObjectiveIds: LearningObjectiveId.array().openapi({
      description: 'Learning objectives aligned to this unit.',
      example: ['01J9QW7B6N5W2YH3D3A1V0KE34'],
    }),
  })
  .strict();

export const createCourseUnitRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/units',
  tags: ['Course Content'],
  operationId: 'createCourseUnit',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseUnitBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course unit.',
      content: {
        'application/json': {
          schema: CourseUnitResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CourseUnitPathParams = CourseAssignmentPathParams.extend({
  courseUnitId: CourseUnitId.openapi({
    param: {
      name: 'courseUnitId',
      in: 'path',
      description: 'Course unit identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE32',
  }),
});

export const UpdateCourseUnitBody = CreateCourseUnitBody;

export const updateCourseUnitRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/units/{courseUnitId}',
  tags: ['Course Content'],
  operationId: 'updateCourseUnit',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseUnitPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseUnitBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course unit.',
      content: {
        'application/json': {
          schema: CourseUnitResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteCourseUnitRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/units/{courseUnitId}',
  tags: ['Course Content'],
  operationId: 'deleteCourseUnit',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseUnitPathParams,
  },
  responses: {
    204: {
      description: 'Course unit deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listCourseResourcesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/resources',
  tags: ['Course Content'],
  operationId: 'listCourseResources',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    query: CourseResourcesQuery,
  },
  responses: {
    200: {
      description: 'Course resources visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CourseResourceResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCourseResourceBody = z
  .object({
    moduleId: CourseModuleId.nullable().openapi({
      description: 'Optional parent module identifier.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE31',
    }),
    unitId: CourseUnitId.nullable().openapi({
      description: 'Optional parent unit identifier; requires moduleId when set.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE32',
    }),
    resourceType: CourseResourceType.openapi({
      description: 'Resource classification used for filtering and presentation.',
      example: 'reading_material',
    }),
    title: z.string().min(1).max(180).openapi({
      description: 'Course resource title.',
      example: 'Argument structure primer',
    }),
    body: z.string().min(1).openapi({
      description: 'Course resource body content.',
      example: 'Claim → reasoning → evidence.',
    }),
    sourceUri: z.string().min(1).nullable().openapi({
      description: 'Optional external URI for the resource.',
      example: 'https://example.test/welcome',
    }),
    visibility: CourseContentVisibility.openapi({
      description: 'Whether learners can see the resource.',
      example: 'published',
    }),
    accessPolicy: CourseContentAccessPolicy.openapi({
      description: 'Who is allowed to read the resource.',
      example: 'course_member',
    }),
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the resource scope.',
      example: 0,
    }),
    learningObjectiveIds: LearningObjectiveId.array().openapi({
      description: 'Learning objectives aligned to this resource.',
      example: ['01J9QW7B6N5W2YH3D3A1V0KE34'],
    }),
  })
  .strict()
  .superRefine((resource, context) => {
    if (resource.unitId !== null && resource.moduleId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unit resources must include their parent module.',
        path: ['moduleId'],
      });
    }
  });

export const createCourseResourceRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/resources',
  tags: ['Course Content'],
  operationId: 'createCourseResource',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseResourceBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course resource.',
      content: {
        'application/json': {
          schema: CourseResourceResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CourseResourcePathParams = CourseAssignmentPathParams.extend({
  courseResourceId: CourseResourceId.openapi({
    param: {
      name: 'courseResourceId',
      in: 'path',
      description: 'Course resource identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE36',
  }),
});

export const UpdateCourseResourceBody = CreateCourseResourceBody;

export const updateCourseResourceRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/resources/{courseResourceId}',
  tags: ['Course Content'],
  operationId: 'updateCourseResource',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseResourcePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseResourceBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course resource.',
      content: {
        'application/json': {
          schema: CourseResourceResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteCourseResourceRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/resources/{courseResourceId}',
  tags: ['Course Content'],
  operationId: 'deleteCourseResource',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseResourcePathParams,
  },
  responses: {
    204: {
      description: 'Course resource deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listLearningObjectivesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objectives',
  tags: ['Course Content'],
  operationId: 'listLearningObjectives',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Learning objectives visible to the authenticated user for the course.',
      content: {
        'application/json': {
          schema: LearningObjectiveResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateLearningObjectiveBody = z
  .object({
    code: z.string().min(1).max(48).openapi({
      description: 'Short, course-unique objective code used for alignment references.',
      example: 'LO-1',
    }),
    title: z.string().min(1).max(180).openapi({
      description: 'Learning objective title.',
      example: 'Construct evidence-based arguments',
    }),
    description: z.string().min(1).max(2_000).nullable().openapi({
      description: 'Optional long-form rationale for the objective.',
      example: 'Students can defend claims with cited evidence.',
    }),
    status: LearningObjectiveStatus.openapi({
      description: 'Lifecycle status for the objective.',
      example: 'active',
    }),
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the course.',
      example: 0,
    }),
  })
  .strict();

export const createLearningObjectiveRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objectives',
  tags: ['Course Content'],
  operationId: 'createLearningObjective',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateLearningObjectiveBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created learning objective.',
      content: {
        'application/json': {
          schema: LearningObjectiveResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: conflictResponse,
  },
});

export const LearningObjectivePathParams = CourseAssignmentPathParams.extend({
  learningObjectiveId: LearningObjectiveId.openapi({
    param: {
      name: 'learningObjectiveId',
      in: 'path',
      description: 'Learning objective identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE34',
  }),
});

export const UpdateLearningObjectiveBody = CreateLearningObjectiveBody;

export const updateLearningObjectiveRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objectives/{learningObjectiveId}',
  tags: ['Course Content'],
  operationId: 'updateLearningObjective',
  security: [{ bearerAuth: [] }],
  request: {
    params: LearningObjectivePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateLearningObjectiveBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated learning objective.',
      content: {
        'application/json': {
          schema: LearningObjectiveResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const deleteLearningObjectiveRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objectives/{learningObjectiveId}',
  tags: ['Course Content'],
  operationId: 'deleteLearningObjective',
  security: [{ bearerAuth: [] }],
  request: {
    params: LearningObjectivePathParams,
  },
  responses: {
    204: {
      description: 'Learning objective deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const LearningObjectiveCoverageResponse = LearningObjectiveCoverage.openapi(
  'LearningObjectiveCoverage',
);

export const getLearningObjectiveCoverageRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objectives/{learningObjectiveId}/coverage',
  tags: ['Course Content'],
  operationId: 'getLearningObjectiveCoverage',
  security: [{ bearerAuth: [] }],
  request: {
    params: LearningObjectivePathParams,
  },
  responses: {
    200: {
      description:
        'Content (modules, units, pages) that references this learning objective. Staff-only.',
      content: {
        'application/json': {
          schema: LearningObjectiveCoverageResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listLearningObjectiveMasteryRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/learning-objective-mastery',
  tags: ['Course Content'],
  operationId: 'listLearningObjectiveMastery',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description:
        'Learning objective mastery records visible to the authenticated user for the course.',
      content: {
        'application/json': {
          schema: LearningObjectiveMasteryResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const getCourseSyllabusRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/syllabus',
  tags: ['Course Content'],
  operationId: 'getCourseSyllabus',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Canonical course syllabus visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CourseSyllabusResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const UpsertCourseSyllabusBody = z
  .object({
    body: z.string().min(1).openapi({
      description: 'Course syllabus body content.',
      example: 'Course policies, grading expectations, and weekly rhythm.',
    }),
    visibility: CourseSyllabusVisibility.openapi({
      description: 'Whether learners can see the syllabus.',
      example: 'published',
    }),
  })
  .strict();

export const upsertCourseSyllabusRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/syllabus',
  tags: ['Course Content'],
  operationId: 'upsertCourseSyllabus',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpsertCourseSyllabusBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Upserted course syllabus. version is incremented on each successful update.',
      content: {
        'application/json': {
          schema: CourseSyllabusResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listCoursePagesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/pages',
  tags: ['Course Content'],
  operationId: 'listCoursePages',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course pages visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CoursePageResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const createCoursePageRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/pages',
  tags: ['Course Content'],
  operationId: 'createCoursePage',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCoursePageBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course page.',
      content: {
        'application/json': {
          schema: CoursePageResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const getCoursePageRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/pages/{pageId}',
  tags: ['Course Content'],
  operationId: 'getCoursePage',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePagePathParams,
  },
  responses: {
    200: {
      description: 'Course page visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CoursePageResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const UpdateCoursePageBody = CreateCoursePageBody;

export const updateCoursePageRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/pages/{pageId}',
  tags: ['Course Content'],
  operationId: 'updateCoursePage',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePagePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCoursePageBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course page.',
      content: {
        'application/json': {
          schema: CoursePageResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteCoursePageRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/pages/{pageId}',
  tags: ['Course Content'],
  operationId: 'deleteCoursePage',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePagePathParams,
  },
  responses: {
    204: {
      description: 'Course page deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const CourseModulePathParams = CourseAssignmentPathParams.extend({
  courseModuleId: CourseModuleId.openapi({
    param: {
      name: 'courseModuleId',
      in: 'path',
      description: 'Course module identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE3R',
  }),
});

export const UpdateCourseModuleBody = CreateCourseModuleBody;

export const updateCourseModuleRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{courseModuleId}',
  tags: ['Course Content'],
  operationId: 'updateCourseModule',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseModulePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseModuleBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course module.',
      content: {
        'application/json': {
          schema: CourseModuleResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteCourseModuleRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{courseModuleId}',
  tags: ['Course Content'],
  operationId: 'deleteCourseModule',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseModulePathParams,
  },
  responses: {
    204: {
      description: 'Course module deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
