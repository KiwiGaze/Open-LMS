import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseFinalGrade,
  CourseGradingScheme,
  CourseGradingSchemeEntry,
  CourseGradingSchemeStatus,
  DiscussionGradebookEntry,
  GradeAppeal,
  GradeAppealId,
  GradeAppealStatus,
  GradeHistory,
  GradebookCategory,
  GradebookCategoryId,
  GradebookCategoryStatus,
  GradebookEntry,
  GradebookManualGrade,
  GradebookManualItem,
  GradebookManualItemId,
  GradebookManualItemStatus,
  IntegrationConnectionId,
  SisFinalGradeSubmission,
  UserId,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';
import { SubmissionGradePathParams } from './submission-grades.ts';

export const CourseGradingSchemeResponse = CourseGradingScheme.openapi('CourseGradingScheme');
export const GradebookCategoryResponse = GradebookCategory.openapi('GradebookCategory');
export const GradebookManualItemResponse = GradebookManualItem.openapi('GradebookManualItem');
export const GradebookManualGradeResponse = GradebookManualGrade.openapi('GradebookManualGrade', {
  description:
    'Per-student grade for a manual gradebook item. score and maxScore must be finite numbers, and score cannot exceed maxScore.',
});
export const GradebookEntryResponse = GradebookEntry.openapi('GradebookEntry', {
  description:
    'Course gradebook entry. gradebookCategoryId and gradebookCategoryName are both populated for categorized assignments and both null for uncategorized assignments.',
});
export const CourseFinalGradeResponse = CourseFinalGrade.openapi('CourseFinalGrade');
export const SisFinalGradeSubmissionResponse =
  SisFinalGradeSubmission.openapi('SisFinalGradeSubmission');
export const GradeHistoryResponse = GradeHistory.openapi('GradeHistory');
export const GradeAppealResponse = GradeAppeal.openapi('GradeAppeal');
export const SaveGradebookManualGradeBody = z
  .object({
    score: z.number().finite().nonnegative().openapi({
      description: 'Manual score to record for the student.',
      example: 8,
    }),
    status: z.enum(['draft', 'published', 'incomplete']).openapi({
      description:
        'Whether the manual grade is still a staff draft, visible to students, or marked incomplete.',
      example: 'published',
    }),
  })
  .strict();

export const CourseGradebookManualItemPathParams = CourseAssignmentPathParams.extend({
  manualItemId: GradebookManualItemId.openapi({
    param: {
      name: 'manualItemId',
      in: 'path',
      description: 'Manual gradebook item identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE84',
  }),
});

export const CourseGradebookManualGradePathParams = CourseGradebookManualItemPathParams.extend({
  studentId: UserId.openapi({
    param: {
      name: 'studentId',
      in: 'path',
      description: 'Student user identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE84',
  }),
});

export const listGradebookCategoriesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/categories',
  tags: ['Gradebook'],
  operationId: 'listGradebookCategories',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Gradebook categories visible to the authenticated user for the course.',
      content: {
        'application/json': {
          schema: GradebookCategoryResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateGradebookCategoryBody = z
  .object({
    name: z.string().min(1).max(180).openapi({
      description: 'Gradebook category name.',
      example: 'Homework',
    }),
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the course gradebook. Unique per course.',
      example: 0,
    }),
    weightPercent: z.number().nonnegative().max(100).nullable().openapi({
      description: 'Optional percentage weight for the category. Null disables weighting.',
      example: 40,
    }),
    dropLowest: z.number().int().nonnegative().openapi({
      description: 'Number of lowest grades to drop when computing the category total.',
      example: 1,
    }),
    status: GradebookCategoryStatus.openapi({
      description: 'Lifecycle status for the gradebook category.',
      example: 'active',
    }),
  })
  .strict();

export const createGradebookCategoryRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/categories',
  tags: ['Gradebook'],
  operationId: 'createGradebookCategory',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateGradebookCategoryBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created gradebook category.',
      content: {
        'application/json': {
          schema: GradebookCategoryResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: conflictResponse,
  },
});

export const GradebookCategoryPathParams = CourseAssignmentPathParams.extend({
  gradebookCategoryId: GradebookCategoryId.openapi({
    param: {
      name: 'gradebookCategoryId',
      in: 'path',
      description: 'Gradebook category identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE3G',
  }),
});

export const UpdateGradebookCategoryBody = CreateGradebookCategoryBody;

export const updateGradebookCategoryRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/categories/{gradebookCategoryId}',
  tags: ['Gradebook'],
  operationId: 'updateGradebookCategory',
  security: [{ bearerAuth: [] }],
  request: {
    params: GradebookCategoryPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateGradebookCategoryBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated gradebook category.',
      content: {
        'application/json': {
          schema: GradebookCategoryResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const deleteGradebookCategoryRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/categories/{gradebookCategoryId}',
  tags: ['Gradebook'],
  operationId: 'deleteGradebookCategory',
  security: [{ bearerAuth: [] }],
  request: {
    params: GradebookCategoryPathParams,
  },
  responses: {
    204: {
      description: 'Gradebook category deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listCourseGradingSchemesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/grading-schemes',
  tags: ['Gradebook'],
  operationId: 'listCourseGradingSchemes',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course grading schemes visible to the authenticated user for the course.',
      content: {
        'application/json': {
          schema: CourseGradingSchemeResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCourseGradingSchemeBody = z
  .object({
    name: z.string().min(1).max(180).openapi({
      description: 'Grading scheme name. Unique per course.',
      example: 'Standard 4-tier',
    }),
    status: CourseGradingSchemeStatus.openapi({
      description: 'Lifecycle status for the grading scheme.',
      example: 'active',
    }),
    entries: CourseGradingSchemeEntry.array().min(1).openapi({
      description:
        'Ordered grading bands. Each entry maps a letter label to a minPercent. Sort descending; labels must be unique.',
    }),
  })
  .strict();

export const createCourseGradingSchemeRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/grading-schemes',
  tags: ['Gradebook'],
  operationId: 'createCourseGradingScheme',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseGradingSchemeBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course grading scheme.',
      content: {
        'application/json': {
          schema: CourseGradingSchemeResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: conflictResponse,
  },
});

export const listGradebookEntriesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook',
  tags: ['Gradebook'],
  operationId: 'listGradebookEntries',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Gradebook entries visible to the authenticated user for the course.',
      content: {
        'application/json': {
          schema: GradebookEntryResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listCourseFinalGradesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/final-grades',
  tags: ['Gradebook'],
  operationId: 'listCourseFinalGrades',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description:
        'Calculated final course grades using active category weights, drop-lowest rules, extra credit, and active grading schemes.',
      content: {
        'application/json': {
          schema: CourseFinalGradeResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const exportCourseFinalGradesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/final-grades/export',
  tags: ['Gradebook'],
  operationId: 'exportCourseFinalGradesCsv',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Calculated final course grades as a CSV file. Staff-only.',
      content: {
        'text/csv': {
          schema: z.string().openapi({
            description: 'CSV body with one row per calculated student final grade.',
          }),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const SubmitCourseFinalGradesToSisBody = z
  .object({
    integrationConnectionId: IntegrationConnectionId.openapi({
      description:
        'Enabled SIS CSV integration connection that should receive this final grade file.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE3S',
    }),
  })
  .strict();

export const submitCourseFinalGradesToSisRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/final-grades/sis-submissions',
  tags: ['Gradebook'],
  operationId: 'submitCourseFinalGradesToSis',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: SubmitCourseFinalGradesToSisBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'SIS final grade submission queued for dispatch.',
      content: {
        'application/json': {
          schema: SisFinalGradeSubmissionResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listSubmissionGradeHistoryRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/grade/history',
  tags: ['Gradebook'],
  operationId: 'listSubmissionGradeHistory',
  security: [{ bearerAuth: [] }],
  request: {
    params: SubmissionGradePathParams,
  },
  responses: {
    200: {
      description:
        'Grade history for a submission. Visible to course staff and the owning student.',
      content: {
        'application/json': {
          schema: GradeHistoryResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const CreateGradeAppealBody = z
  .object({
    reason: z.string().min(1).max(4000).openapi({
      description: 'Student explanation of the disputed grade.',
      example: 'The rubric total appears incorrect.',
    }),
  })
  .strict();

export const createGradeAppealRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/grade/appeals',
  tags: ['Gradebook'],
  operationId: 'createGradeAppeal',
  security: [{ bearerAuth: [] }],
  request: {
    params: SubmissionGradePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateGradeAppealBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created grade appeal for the submission grade.',
      content: {
        'application/json': {
          schema: GradeAppealResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const GradeAppealPathParams = CourseAssignmentPathParams.extend({
  gradeAppealId: GradeAppealId.openapi({
    param: {
      name: 'gradeAppealId',
      in: 'path',
      description: 'Grade appeal identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE88',
  }),
});

export const UpdateGradeAppealBody = z
  .object({
    status: GradeAppealStatus.openapi({
      description: 'Updated appeal workflow status.',
      example: 'resolved',
    }),
    resolution: z.string().min(1).max(4000).nullable().openapi({
      description: 'Required for resolved or rejected appeals.',
      example: 'Score adjusted after rubric review.',
    }),
  })
  .strict();

export const listGradeAppealsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/appeals',
  tags: ['Gradebook'],
  operationId: 'listGradeAppeals',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Grade appeals visible to the authenticated user.',
      content: {
        'application/json': {
          schema: GradeAppealResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const updateGradeAppealRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/appeals/{gradeAppealId}',
  tags: ['Gradebook'],
  operationId: 'updateGradeAppeal',
  security: [{ bearerAuth: [] }],
  request: {
    params: GradeAppealPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateGradeAppealBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated grade appeal.',
      content: {
        'application/json': {
          schema: GradeAppealResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const DiscussionGradebookEntryResponse = DiscussionGradebookEntry.openapi(
  'DiscussionGradebookEntry',
);

export const listDiscussionGradebookEntriesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-gradebook',
  tags: ['Gradebook'],
  operationId: 'listDiscussionGradebookEntries',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Discussion-post gradebook entries for the course.',
      content: {
        'application/json': {
          schema: DiscussionGradebookEntryResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const exportGradebookRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/export',
  tags: ['Gradebook'],
  operationId: 'exportGradebookCsv',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course gradebook as a CSV file. Staff-only.',
      content: {
        'text/csv': {
          schema: z.string().openapi({
            description: 'CSV body with one row per published gradebook entry.',
          }),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const exportDiscussionGradebookRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/discussion-gradebook/export',
  tags: ['Gradebook'],
  operationId: 'exportDiscussionGradebookCsv',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course discussion gradebook as a CSV file. Staff-only.',
      content: {
        'text/csv': {
          schema: z.string().openapi({
            description: 'CSV body with one row per discussion-post grade.',
          }),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listGradebookManualItemsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items',
  tags: ['Gradebook'],
  operationId: 'listGradebookManualItems',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Manual gradebook items visible to the authenticated user for the course.',
      content: {
        'application/json': {
          schema: GradebookManualItemResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateGradebookManualItemBody = z
  .object({
    gradebookCategoryId: GradebookCategoryId.nullable().openapi({
      description: 'Optional category the item rolls up into. Null leaves the item uncategorized.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE8F',
    }),
    title: z.string().min(1).max(180).openapi({
      description: 'Manual gradebook item title.',
      example: 'Participation',
    }),
    description: z.string().min(1).max(2000).nullable().openapi({
      description: 'Optional learner-facing description.',
      example: 'Weekly discussion contributions.',
    }),
    maxScore: z.number().finite().positive().openapi({
      description: 'Maximum score for this manual gradebook item.',
      example: 100,
    }),
    dueAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional due date in ISO 8601 format.',
        example: '2026-09-15T17:00:00.000Z',
      }),
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the course manual gradebook. Unique per course.',
      example: 0,
    }),
    status: GradebookManualItemStatus.openapi({
      description: 'Lifecycle status for the manual gradebook item.',
      example: 'active',
    }),
    extraCredit: z.boolean().optional().openapi({
      description:
        'When true, this item is treated as extra credit: points contribute to earned score but not to the maximum points possible.',
      example: false,
    }),
  })
  .strict();

export const createGradebookManualItemRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items',
  tags: ['Gradebook'],
  operationId: 'createGradebookManualItem',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateGradebookManualItemBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created manual gradebook item.',
      content: {
        'application/json': {
          schema: GradebookManualItemResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: conflictResponse,
  },
});

export const UpdateGradebookManualItemBody = CreateGradebookManualItemBody;

export const updateGradebookManualItemRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items/{manualItemId}',
  tags: ['Gradebook'],
  operationId: 'updateGradebookManualItem',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseGradebookManualItemPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateGradebookManualItemBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated manual gradebook item.',
      content: {
        'application/json': {
          schema: GradebookManualItemResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const deleteGradebookManualItemRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items/{manualItemId}',
  tags: ['Gradebook'],
  operationId: 'deleteGradebookManualItem',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseGradebookManualItemPathParams,
  },
  responses: {
    204: {
      description: 'Manual gradebook item deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listGradebookManualGradesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items/{manualItemId}/grades',
  tags: ['Gradebook'],
  operationId: 'listGradebookManualGrades',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseGradebookManualItemPathParams,
  },
  responses: {
    200: {
      description: 'Manual gradebook grades visible to the authenticated user for the item.',
      content: {
        'application/json': {
          schema: GradebookManualGradeResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const saveGradebookManualGradeRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/gradebook/manual-items/{manualItemId}/grades/{studentId}',
  tags: ['Gradebook'],
  operationId: 'saveGradebookManualGrade',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseGradebookManualGradePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: SaveGradebookManualGradeBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Saved manual gradebook grade for the student.',
      content: {
        'application/json': {
          schema: GradebookManualGradeResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
