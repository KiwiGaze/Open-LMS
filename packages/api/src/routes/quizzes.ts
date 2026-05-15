import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseModuleId,
  CourseUnitId,
  QtiQuizItemExport,
  QtiQuizItemImportRequest,
  QtiQuizItemImportResult,
  QuestionBank,
  QuestionBankId,
  QuestionBankQuestion,
  QuestionBankStatus,
  Quiz,
  QuizAggregateGrade,
  QuizAllowedIpRange,
  QuizAttempt,
  QuizAttemptId,
  QuizAttemptQuestionGrade,
  QuizAttemptResponseAnswer,
  QuizAttemptResponse as QuizAttemptResponseContract,
  QuizEffectiveSettings,
  QuizId,
  QuizOverride,
  QuizOverrideId,
  QuizOverrideStatus,
  QuizOverrideTargetType,
  QuizQuestion,
  QuizQuestionAnswerKey,
  QuizQuestionChoice,
  QuizQuestionId,
  QuizQuestionType,
  QuizStatus,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const QuizResponse = Quiz.openapi('Quiz');
export const QuizQuestionResponse = QuizQuestion.openapi('QuizQuestion');
export const QuizAttemptSummaryResponse = QuizAttempt.openapi('QuizAttempt');
export const QuizAttemptQuestionGradeResponse = QuizAttemptQuestionGrade.openapi(
  'QuizAttemptQuestionGrade',
);
export const QuizAttemptResponseResponse =
  QuizAttemptResponseContract.openapi('QuizAttemptResponse');
export const QuizOverrideResponse = QuizOverride.openapi('QuizOverride');
export const QuizEffectiveSettingsResponse = QuizEffectiveSettings.openapi('QuizEffectiveSettings');
export const QuestionBankResponse = QuestionBank.openapi('QuestionBank');
export const QuestionBankQuestionResponse = QuestionBankQuestion.openapi('QuestionBankQuestion');
export const QtiQuizItemExportResponse = QtiQuizItemExport.openapi('QtiQuizItemExport');
export const QtiQuizItemImportRequestBody = QtiQuizItemImportRequest.openapi(
  'QtiQuizItemImportRequest',
);
export const QtiQuizItemImportResultResponse =
  QtiQuizItemImportResult.openapi('QtiQuizItemImportResult');

const NullableDateTime = () =>
  z
    .string()
    .datetime({ offset: true })
    .transform((value) => new Date(value))
    .nullable();

export const SaveQuizAttemptResponseBody = z.object({
  answer: QuizAttemptResponseAnswer.openapi('QuizAttemptResponseAnswer'),
});

export const StartQuizAttemptBody = z
  .object({
    accessPassword: z.string().min(1).max(256).nullable().optional().openapi({
      description: 'Access password for protected quizzes.',
      example: 'exam-room-4',
    }),
  })
  .strict();

export const RecordQuizAttemptQuestionGradeBody = z
  .object({
    score: z.number().int().nonnegative().openapi({
      description: 'Manual score for this quiz question.',
      example: 4,
    }),
    feedback: z.string().min(1).max(4_000).nullable().openapi({
      description: 'Optional staff feedback for this manually graded question.',
      example: 'Clear explanation with relevant evidence.',
    }),
  })
  .strict();

export const QuizzesQuery = z.object({
  moduleId: CourseModuleId.optional().openapi({
    description: 'Optional module filter for module-placed quizzes.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE31',
  }),
  unitId: CourseUnitId.optional().openapi({
    description: 'Optional unit filter for unit-placed quizzes.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE32',
  }),
});

export const CourseQuizPathParams = CourseAssignmentPathParams.extend({
  quizId: QuizId.openapi({
    param: {
      name: 'quizId',
      in: 'path',
      description: 'Quiz identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE43',
  }),
});

export const CourseQuizAttemptPathParams = CourseQuizPathParams.extend({
  attemptId: QuizAttemptId.openapi({
    param: {
      name: 'attemptId',
      in: 'path',
      description: 'Quiz attempt identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE5E',
  }),
});

export const CourseQuizOverridePathParams = CourseQuizPathParams.extend({
  overrideId: QuizOverrideId.openapi({
    param: {
      name: 'overrideId',
      in: 'path',
      description: 'Quiz override identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE45',
  }),
});

export const CourseQuizAttemptQuestionPathParams = CourseQuizAttemptPathParams.extend({
  questionId: QuizQuestionId.openapi({
    param: {
      name: 'questionId',
      in: 'path',
      description: 'Quiz question identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE44',
  }),
});

export const CourseQuestionBankPathParams = CourseAssignmentPathParams.extend({
  questionBankId: QuestionBankId.openapi({
    param: {
      name: 'questionBankId',
      in: 'path',
      description: 'Question bank identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE77',
  }),
});

export const CreateQuizBody = z
  .object({
    moduleId: CourseModuleId.nullable().openapi({
      description: 'Optional parent module identifier.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE31',
    }),
    unitId: CourseUnitId.nullable().openapi({
      description: 'Optional parent unit identifier; requires moduleId when set.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE32',
    }),
    position: z.number().int().nonnegative().nullable().openapi({
      description: 'Sort position within the parent module or unit.',
      example: 0,
    }),
    title: z.string().min(1).max(180).openapi({
      description: 'Quiz title.',
      example: 'Argumentation quiz',
    }),
    description: z.string().min(1).max(4_000).nullable().openapi({
      description: 'Optional learner-facing description.',
      example: 'Multiple-choice on evidence and reasoning.',
    }),
    status: QuizStatus.openapi({
      description: 'Lifecycle status for the quiz.',
      example: 'draft',
    }),
    opensAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional opens-at timestamp.',
        example: '2026-09-10T00:00:00.000Z',
      }),
    closesAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional closes-at timestamp.',
        example: '2026-09-15T23:59:00.000Z',
      }),
    timeLimitMinutes: z.number().int().positive().nullable().openapi({
      description: 'Optional time limit in minutes.',
      example: 30,
    }),
    shuffleQuestions: z.boolean().openapi({
      description: 'Whether quiz questions are shuffled per attempt.',
      example: false,
    }),
    maxAttempts: z.number().int().positive().openapi({
      description: 'Maximum number of attempts allowed.',
      example: 2,
    }),
    accessPassword: z.string().min(1).max(256).nullable().optional().openapi({
      description: 'Optional access password to require before learners can start attempts.',
      example: 'exam-room-4',
    }),
    allowedIpRanges: z
      .array(QuizAllowedIpRange)
      .max(50)
      .optional()
      .openapi({
        description: 'Optional IPv4 addresses or CIDR ranges allowed to start quiz attempts.',
        example: ['203.0.113.0/24'],
      }),
  })
  .strict()
  .superRefine((quiz, context) => {
    if (quiz.unitId !== null && quiz.moduleId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unit quizzes must include their parent module.',
        path: ['moduleId'],
      });
    }
  });

export const createQuizRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes',
  tags: ['Quizzes'],
  operationId: 'createQuiz',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateQuizBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created quiz.',
      content: {
        'application/json': {
          schema: QuizResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const UpdateQuizBody = CreateQuizBody;

export const updateQuizRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}',
  tags: ['Quizzes'],
  operationId: 'updateQuiz',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateQuizBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated quiz.',
      content: {
        'application/json': {
          schema: QuizResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteQuizRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}',
  tags: ['Quizzes'],
  operationId: 'deleteQuiz',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
  },
  responses: {
    204: {
      description: 'Quiz deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listQuizzesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes',
  tags: ['Quizzes'],
  operationId: 'listQuizzes',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    query: QuizzesQuery,
  },
  responses: {
    200: {
      description: 'Quizzes visible to the authenticated user.',
      content: {
        'application/json': {
          schema: QuizResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const getQuizRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}',
  tags: ['Quizzes'],
  operationId: 'getQuiz',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
  },
  responses: {
    200: {
      description: 'Quiz visible to the authenticated user.',
      content: {
        'application/json': {
          schema: QuizResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listQuizQuestionsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/questions',
  tags: ['Quizzes'],
  operationId: 'listQuizQuestions',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
  },
  responses: {
    200: {
      description: 'Quiz questions visible to the authenticated user without answer keys.',
      content: {
        'application/json': {
          schema: QuizQuestionResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const CreateQuizQuestionBody = z
  .object({
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the quiz. Unique per quiz.',
      example: 0,
    }),
    questionType: QuizQuestionType.openapi({
      description: 'Question type.',
      example: 'multiple_choice',
    }),
    prompt: z.string().min(1).openapi({
      description: 'Question prompt presented to learners.',
      example: 'Which element connects evidence to a claim?',
    }),
    points: z.number().int().nonnegative().openapi({
      description: 'Points awarded for a correct answer.',
      example: 2,
    }),
    choices: QuizQuestionChoice.array().openapi({
      description: 'Choices for selection-based questions; empty for free-response.',
    }),
    answerKey: QuizQuestionAnswerKey.nullable().optional().openapi({
      description:
        'Private staff-only answer key used for automatic grading. Omit or set null for manually graded questions.',
    }),
  })
  .strict();

export const createQuizQuestionRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/questions',
  tags: ['Quizzes'],
  operationId: 'createQuizQuestion',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateQuizQuestionBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created quiz question.',
      content: {
        'application/json': {
          schema: QuizQuestionResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const exportQuizQtiItemsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/qti-items',
  tags: ['Quizzes'],
  operationId: 'exportQuizQtiItems',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
  },
  responses: {
    200: {
      description: 'QTI 2.1 assessment item XML for quiz questions.',
      content: {
        'application/json': {
          schema: QtiQuizItemExportResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const importQuizQtiItemsRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/qti-items/import',
  tags: ['Quizzes'],
  operationId: 'importQuizQtiItems',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: QtiQuizItemImportRequestBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Imported quiz questions created from QTI assessment items.',
      content: {
        'application/json': {
          schema: QtiQuizItemImportResultResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

const refineQuizOverrideWindow = <T extends { opensAt: Date | null; closesAt: Date | null }>(
  override: T,
  context: z.RefinementCtx,
): void => {
  if (
    override.opensAt !== null &&
    override.closesAt !== null &&
    override.closesAt.getTime() <= override.opensAt.getTime()
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Quiz override close time must be after open time.',
      path: ['closesAt'],
    });
  }
};

export const CreateQuizOverrideBody = z
  .object({
    targetType: QuizOverrideTargetType.openapi({
      description: 'Whether this override targets an individual user, group, or section.',
      example: 'user',
    }),
    targetId: z.string().min(1).openapi({
      description: 'Identifier of the target (user id, group id, or section id).',
      example: '01J9QW7B6N5W2YH3D3A1V0KE2W',
    }),
    opensAt: NullableDateTime().openapi({
      description: 'When the override availability window opens (or null).',
      example: '2026-09-10T00:00:00.000Z',
    }),
    closesAt: NullableDateTime().openapi({
      description: 'When the override availability window closes (or null).',
      example: '2026-09-17T23:59:00.000Z',
    }),
    timeLimitMinutes: z.number().int().positive().nullable().openapi({
      description: 'Optional extended time limit in minutes.',
      example: 60,
    }),
    maxAttempts: z.number().int().positive().nullable().openapi({
      description: 'Optional maximum attempts override.',
      example: 2,
    }),
    status: QuizOverrideStatus.openapi({
      description: 'Lifecycle status for this override.',
      example: 'active',
    }),
  })
  .strict()
  .superRefine(refineQuizOverrideWindow);

export const UpdateQuizOverrideBody = z
  .object({
    opensAt: NullableDateTime().openapi({
      description: 'When the override availability window opens (or null).',
      example: '2026-09-10T00:00:00.000Z',
    }),
    closesAt: NullableDateTime().openapi({
      description: 'When the override availability window closes (or null).',
      example: '2026-09-17T23:59:00.000Z',
    }),
    timeLimitMinutes: z.number().int().positive().nullable().openapi({
      description: 'Optional extended time limit in minutes.',
      example: 60,
    }),
    maxAttempts: z.number().int().positive().nullable().openapi({
      description: 'Optional maximum attempts override.',
      example: 2,
    }),
    status: QuizOverrideStatus.openapi({
      description: 'Lifecycle status for this override.',
      example: 'active',
    }),
  })
  .strict()
  .superRefine(refineQuizOverrideWindow);

export const listQuizOverridesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/overrides',
  tags: ['Quizzes'],
  operationId: 'listQuizOverrides',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
  },
  responses: {
    200: {
      description: 'Quiz accommodations and availability overrides visible to course staff.',
      content: {
        'application/json': {
          schema: QuizOverrideResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const createQuizOverrideRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/overrides',
  tags: ['Quizzes'],
  operationId: 'createQuizOverride',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateQuizOverrideBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created quiz override.',
      content: {
        'application/json': {
          schema: QuizOverrideResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const updateQuizOverrideRoute = createRoute({
  method: 'patch',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/overrides/{overrideId}',
  tags: ['Quizzes'],
  operationId: 'updateQuizOverride',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizOverridePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateQuizOverrideBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated quiz override.',
      content: {
        'application/json': {
          schema: QuizOverrideResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteQuizOverrideRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/overrides/{overrideId}',
  tags: ['Quizzes'],
  operationId: 'deleteQuizOverride',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizOverridePathParams,
  },
  responses: {
    204: {
      description: 'Quiz override deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const getQuizEffectiveSettingsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/effective-settings',
  tags: ['Quizzes'],
  operationId: 'getQuizEffectiveSettings',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
  },
  responses: {
    200: {
      description: 'Quiz settings after applying accommodations for the authenticated user.',
      content: {
        'application/json': {
          schema: QuizEffectiveSettingsResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listQuizAttemptsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts',
  tags: ['Quizzes'],
  operationId: 'listQuizAttempts',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
  },
  responses: {
    200: {
      description: 'Quiz attempts visible to the authenticated user.',
      content: {
        'application/json': {
          schema: QuizAttemptSummaryResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const QuizAggregateGradeResponse = QuizAggregateGrade.openapi('QuizAggregateGrade');

export const listQuizAggregateGradesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/grades',
  tags: ['Quizzes'],
  operationId: 'listQuizAggregateGrades',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
  },
  responses: {
    200: {
      description:
        'Per-student aggregated grades for this quiz, computed using the quiz gradingMethod. Staff-only.',
      content: {
        'application/json': {
          schema: QuizAggregateGradeResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listQuizAttemptQuestionGradesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/question-grades',
  tags: ['Quizzes'],
  operationId: 'listQuizAttemptQuestionGrades',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizAttemptPathParams,
  },
  responses: {
    200: {
      description: 'Manual question grades recorded for this quiz attempt. Staff-only.',
      content: {
        'application/json': {
          schema: QuizAttemptQuestionGradeResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const recordQuizAttemptQuestionGradeRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/question-grades/{questionId}',
  tags: ['Quizzes'],
  operationId: 'recordQuizAttemptQuestionGrade',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizAttemptQuestionPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: RecordQuizAttemptQuestionGradeBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Manual question grade recorded for this quiz attempt.',
      content: {
        'application/json': {
          schema: QuizAttemptQuestionGradeResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const regradeQuizAttemptRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/regrade',
  tags: ['Quizzes'],
  operationId: 'regradeQuizAttempt',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizAttemptPathParams,
  },
  responses: {
    200: {
      description: 'Quiz attempt regraded from automatic and manual question scores.',
      content: {
        'application/json': {
          schema: QuizAttemptSummaryResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const startQuizAttemptRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts',
  tags: ['Quizzes'],
  operationId: 'startQuizAttempt',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizPathParams,
    body: {
      required: false,
      content: {
        'application/json': {
          schema: StartQuizAttemptBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Quiz attempt started for the authenticated learner.',
      content: {
        'application/json': {
          schema: QuizAttemptSummaryResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const submitQuizAttemptRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/submit',
  tags: ['Quizzes'],
  operationId: 'submitQuizAttempt',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizAttemptPathParams,
  },
  responses: {
    200: {
      description: 'Quiz attempt submitted by the owning learner.',
      content: {
        'application/json': {
          schema: QuizAttemptSummaryResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listQuizAttemptResponsesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses',
  tags: ['Quizzes'],
  operationId: 'listQuizAttemptResponses',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizAttemptPathParams,
  },
  responses: {
    200: {
      description: 'Learner responses recorded for a quiz attempt.',
      content: {
        'application/json': {
          schema: QuizAttemptResponseResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const saveQuizAttemptResponseRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}/responses/{questionId}',
  tags: ['Quizzes'],
  operationId: 'saveQuizAttemptResponse',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuizAttemptQuestionPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: SaveQuizAttemptResponseBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Learner response saved for a quiz attempt question.',
      content: {
        'application/json': {
          schema: QuizAttemptResponseResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listQuestionBanksRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks',
  tags: ['Quizzes'],
  operationId: 'listQuestionBanks',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Question banks visible to course staff.',
      content: {
        'application/json': {
          schema: QuestionBankResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateQuestionBankBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Question bank title.',
      example: 'Argumentation question bank',
    }),
    description: z.string().min(1).max(4_000).nullable().openapi({
      description: 'Optional learner-facing description.',
      example: 'Multiple-choice and short-response items aligned to LO-1.',
    }),
    status: QuestionBankStatus.openapi({
      description: 'Lifecycle status for the question bank.',
      example: 'active',
    }),
  })
  .strict();

export const createQuestionBankRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks',
  tags: ['Quizzes'],
  operationId: 'createQuestionBank',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateQuestionBankBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created question bank.',
      content: {
        'application/json': {
          schema: QuestionBankResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const UpdateQuestionBankBody = CreateQuestionBankBody;

export const updateQuestionBankRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks/{questionBankId}',
  tags: ['Quizzes'],
  operationId: 'updateQuestionBank',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuestionBankPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateQuestionBankBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated question bank.',
      content: {
        'application/json': {
          schema: QuestionBankResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteQuestionBankRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks/{questionBankId}',
  tags: ['Quizzes'],
  operationId: 'deleteQuestionBank',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuestionBankPathParams,
  },
  responses: {
    204: {
      description: 'Question bank deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listQuestionBankQuestionsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks/{questionBankId}/questions',
  tags: ['Quizzes'],
  operationId: 'listQuestionBankQuestions',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuestionBankPathParams,
  },
  responses: {
    200: {
      description: 'Question bank questions visible to course staff without answer keys.',
      content: {
        'application/json': {
          schema: QuestionBankQuestionResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const CreateQuestionBankQuestionBody = z
  .object({
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the question bank. Unique per bank.',
      example: 0,
    }),
    questionType: QuizQuestionType.openapi({
      description: 'Question type.',
      example: 'multiple_choice',
    }),
    prompt: z.string().min(1).openapi({
      description: 'Question prompt presented to learners.',
      example: 'Which element connects evidence to a claim?',
    }),
    points: z.number().int().nonnegative().openapi({
      description: 'Points awarded for a correct answer.',
      example: 2,
    }),
    choices: QuizQuestionChoice.array().openapi({
      description: 'Choices for selection-based questions; empty for free-response.',
    }),
  })
  .strict();

export const createQuestionBankQuestionRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/question-banks/{questionBankId}/questions',
  tags: ['Quizzes'],
  operationId: 'createQuestionBankQuestion',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseQuestionBankPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateQuestionBankQuestionBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created question bank question.',
      content: {
        'application/json': {
          schema: QuestionBankQuestionResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});
