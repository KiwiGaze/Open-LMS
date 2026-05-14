import { createRoute, z } from '@hono/zod-openapi';
import {
  Survey,
  SurveyId,
  SurveyQuestion,
  SurveyQuestionChoice,
  SurveyQuestionId,
  SurveyQuestionType,
  SurveyResponseAnswer,
  SurveyResponse as SurveyResponseContract,
  SurveyStatus,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const SurveyResponse = Survey.openapi('Survey');
export const SurveyQuestionResponse = SurveyQuestion.openapi('SurveyQuestion');
export const SurveyResponseSchema = SurveyResponseContract.openapi('SurveyResponse');

export const CourseSurveyPathParams = CourseAssignmentPathParams.extend({
  surveyId: SurveyId.openapi({
    param: {
      name: 'surveyId',
      in: 'path',
      description: 'Survey identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE89',
  }),
});

export const listSurveysRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys',
  tags: ['Surveys'],
  operationId: 'listSurveys',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Surveys defined in the course.',
      content: {
        'application/json': {
          schema: SurveyResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateSurveyBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Survey title shown to participants.',
      example: 'End-of-term reflection',
    }),
    description: z.string().min(1).max(4_000).nullable().openapi({
      description: 'Optional description displayed above the questions.',
      example: 'Anonymous feedback on workshop pacing.',
    }),
    status: SurveyStatus.openapi({
      description: 'Lifecycle status for the survey.',
      example: 'draft',
    }),
    opensAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional opens-at timestamp in ISO 8601 format.',
        example: '2026-09-01T00:00:00.000Z',
      }),
    closesAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional closes-at timestamp in ISO 8601 format.',
        example: '2026-09-15T23:59:00.000Z',
      }),
    allowsAnonymousResponses: z.boolean().openapi({
      description: 'If true, responses are recorded without learner identity.',
      example: true,
    }),
  })
  .strict();

export const createSurveyRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys',
  tags: ['Surveys'],
  operationId: 'createSurvey',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateSurveyBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created survey.',
      content: {
        'application/json': {
          schema: SurveyResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const UpdateSurveyBody = CreateSurveyBody;

export const updateSurveyRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys/{surveyId}',
  tags: ['Surveys'],
  operationId: 'updateSurvey',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseSurveyPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateSurveyBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated survey.',
      content: {
        'application/json': {
          schema: SurveyResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteSurveyRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys/{surveyId}',
  tags: ['Surveys'],
  operationId: 'deleteSurvey',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseSurveyPathParams,
  },
  responses: {
    204: {
      description: 'Survey deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listSurveyQuestionsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys/{surveyId}/questions',
  tags: ['Surveys'],
  operationId: 'listSurveyQuestions',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseSurveyPathParams,
  },
  responses: {
    200: {
      description: 'Questions defined in the survey.',
      content: {
        'application/json': {
          schema: SurveyQuestionResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const CreateSurveyQuestionBody = z
  .object({
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the survey. Unique per survey.',
      example: 0,
    }),
    questionType: SurveyQuestionType.openapi({
      description: 'Survey question type.',
      example: 'single_choice',
    }),
    prompt: z.string().min(1).openapi({
      description: 'Question prompt presented to participants.',
      example: 'How did the pacing feel?',
    }),
    required: z.boolean().openapi({
      description: 'If true, the question must be answered before submitting.',
      example: true,
    }),
    choices: SurveyQuestionChoice.array().openapi({
      description: 'Choices for selection-based questions; empty for free-text or rating-scale.',
    }),
  })
  .strict();

export const createSurveyQuestionRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys/{surveyId}/questions',
  tags: ['Surveys'],
  operationId: 'createSurveyQuestion',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseSurveyPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateSurveyQuestionBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created survey question.',
      content: {
        'application/json': {
          schema: SurveyQuestionResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const listSurveyResponsesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys/{surveyId}/responses',
  tags: ['Surveys'],
  operationId: 'listSurveyResponses',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseSurveyPathParams,
  },
  responses: {
    200: {
      description: 'Survey responses visible to course staff.',
      content: {
        'application/json': {
          schema: SurveyResponseSchema.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const SubmitSurveyResponseBody = z
  .object({
    surveyQuestionId: SurveyQuestionId.openapi({
      description: 'Identifier of the question being answered.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE8A',
    }),
    answer: SurveyResponseAnswer.openapi({
      description: 'Answer payload; shape depends on the question type.',
    }),
  })
  .strict();

export const submitSurveyResponseRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/surveys/{surveyId}/responses',
  tags: ['Surveys'],
  operationId: 'submitSurveyResponse',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseSurveyPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: SubmitSurveyResponseBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Recorded survey response.',
      content: {
        'application/json': {
          schema: SurveyResponseSchema,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
