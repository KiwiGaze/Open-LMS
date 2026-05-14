import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseCredential,
  CourseCredentialId,
  CourseCredentialStatus,
  CourseCredentialType,
  CredentialAward,
  CredentialAwardStatus,
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

export const CourseCredentialResponse = CourseCredential.openapi('CourseCredential');
export const CredentialAwardResponse = CredentialAward.openapi('CredentialAward');

export const CourseCredentialPathParams = CourseAssignmentPathParams.extend({
  credentialId: CourseCredentialId.openapi({
    param: {
      name: 'credentialId',
      in: 'path',
      description: 'Course credential identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE4R',
  }),
});

export const listCredentialsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials',
  tags: ['Credentials'],
  operationId: 'listCredentials',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course credentials visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CourseCredentialResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCourseCredentialBody = z
  .object({
    credentialType: CourseCredentialType.openapi({
      description: 'Whether the credential is a badge or a certificate.',
      example: 'badge',
    }),
    title: z.string().min(1).max(180).openapi({
      description: 'Credential title displayed to learners.',
      example: 'Evidence-based writing badge',
    }),
    description: z.string().min(1).max(4_000).nullable().openapi({
      description: 'Optional learner-facing description.',
      example: 'Awarded for sustained evidence-based argumentation.',
    }),
    criteriaSummary: z.string().min(1).max(4_000).openapi({
      description: 'Summary of the criteria required to earn the credential.',
      example: 'Earn 85% or higher on at least three essay rubrics.',
    }),
    status: CourseCredentialStatus.openapi({
      description: 'Lifecycle status for the credential.',
      example: 'draft',
    }),
    imageUrl: z.string().url().nullable().openapi({
      description: 'Optional credential image URL.',
      example: 'https://images.example.test/badges/evidence-writing.png',
    }),
  })
  .strict();

export const createCourseCredentialRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials',
  tags: ['Credentials'],
  operationId: 'createCourseCredential',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseCredentialBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course credential.',
      content: {
        'application/json': {
          schema: CourseCredentialResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const UpdateCourseCredentialBody = CreateCourseCredentialBody;

export const updateCourseCredentialRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials/{credentialId}',
  tags: ['Credentials'],
  operationId: 'updateCourseCredential',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseCredentialPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseCredentialBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course credential.',
      content: {
        'application/json': {
          schema: CourseCredentialResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteCourseCredentialRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials/{credentialId}',
  tags: ['Credentials'],
  operationId: 'deleteCourseCredential',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseCredentialPathParams,
  },
  responses: {
    204: {
      description: 'Course credential deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listCredentialAwardsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials/{credentialId}/awards',
  tags: ['Credentials'],
  operationId: 'listCredentialAwards',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseCredentialPathParams,
  },
  responses: {
    200: {
      description: 'Credential awards visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CredentialAwardResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const CreateCredentialAwardBody = z
  .object({
    studentId: UserId.openapi({
      description: 'Identifier of the student receiving the award.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE8P',
    }),
    status: CredentialAwardStatus.openapi({
      description: 'Award lifecycle state.',
      example: 'issued',
    }),
    issuedAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .openapi({
        description: 'Issuance timestamp in ISO 8601 format.',
        example: '2026-05-10T00:00:00.000Z',
      }),
    revokedAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional revocation timestamp in ISO 8601 format.',
        example: null,
      }),
    expiresAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional expiry timestamp in ISO 8601 format.',
        example: '2027-05-10T00:00:00.000Z',
      }),
  })
  .strict();

export const createCredentialAwardRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/credentials/{credentialId}/awards',
  tags: ['Credentials'],
  operationId: 'createCredentialAward',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseCredentialPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCredentialAwardBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created credential award.',
      content: {
        'application/json': {
          schema: CredentialAwardResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});
