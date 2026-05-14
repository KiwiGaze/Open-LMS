import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseId,
  ScormAttempt,
  ScormCompletionStatus,
  ScormPackage,
  ScormPackageId,
  ScormPackageStatus,
  ScormRuntimeCommit,
  ScormRuntimeState,
  ScormSuccessStatus,
  ScormVersion,
  TenantId,
} from '@openlms/contracts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const ScormPackageResponse = ScormPackage.openapi('ScormPackage');
export const ScormAttemptResponse = ScormAttempt.openapi('ScormAttempt');
export const ScormRuntimeCommitBody = ScormRuntimeCommit.openapi('ScormRuntimeCommit');
export const ScormRuntimeStateResponse = ScormRuntimeState.openapi('ScormRuntimeState');
export const ScormRuntimeBridgeScriptResponse = z.string().openapi({
  description:
    'JavaScript bridge exposing SCORM 1.2 window.API and SCORM 2004 window.API_1484_11 runtime adapters.',
  example: '(() => { window.API = {}; window.API_1484_11 = {}; })();',
});

export const CourseScormPathParams = z.object({
  tenantId: TenantId.openapi({
    param: { name: 'tenantId', in: 'path', description: 'Tenant identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0A',
  }),
  courseId: CourseId.openapi({
    param: { name: 'courseId', in: 'path', description: 'Course identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0B',
  }),
});

export const ScormPackagePathParams = CourseScormPathParams.extend({
  scormPackageId: ScormPackageId.openapi({
    param: { name: 'scormPackageId', in: 'path', description: 'SCORM package identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0C',
  }),
});

export const CreateScormPackageBody = z
  .object({
    title: z.string().min(1).max(180),
    scormVersion: ScormVersion,
    launchUrl: z.string().min(1).max(2048).url(),
    manifest: z.record(z.unknown()),
    status: ScormPackageStatus,
  })
  .strict();

export const UpsertScormAttemptBody = z
  .object({
    completionStatus: ScormCompletionStatus,
    successStatus: ScormSuccessStatus,
    scoreScaled: z.number().finite().min(0).max(1).nullable(),
    totalTimeSeconds: z.number().finite().nonnegative().nullable(),
    suspendData: z.string().max(64_000).nullable(),
  })
  .strict();

export const listScormPackagesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages',
  tags: ['CourseContent'],
  operationId: 'listScormPackages',
  security: [{ bearerAuth: [] }],
  request: { params: CourseScormPathParams },
  responses: {
    200: {
      description: 'SCORM packages visible in the course.',
      content: { 'application/json': { schema: ScormPackageResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const createScormPackageRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages',
  tags: ['CourseContent'],
  operationId: 'createScormPackage',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseScormPathParams,
    body: { required: true, content: { 'application/json': { schema: CreateScormPackageBody } } },
  },
  responses: {
    201: {
      description: 'SCORM package created.',
      content: { 'application/json': { schema: ScormPackageResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const upsertScormAttemptRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages/{scormPackageId}/attempt',
  tags: ['CourseContent'],
  operationId: 'upsertScormAttempt',
  security: [{ bearerAuth: [] }],
  request: {
    params: ScormPackagePathParams,
    body: { required: true, content: { 'application/json': { schema: UpsertScormAttemptBody } } },
  },
  responses: {
    200: {
      description: 'SCORM attempt state stored for the calling user.',
      content: { 'application/json': { schema: ScormAttemptResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const initializeScormRuntimeRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages/{scormPackageId}/runtime/initialize',
  tags: ['CourseContent'],
  operationId: 'initializeScormRuntime',
  security: [{ bearerAuth: [] }],
  request: {
    params: ScormPackagePathParams,
  },
  responses: {
    200: {
      description: 'SCORM runtime state initialized for LMSInitialize.',
      content: { 'application/json': { schema: ScormRuntimeStateResponse } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const getScormRuntimeBridgeScriptRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages/{scormPackageId}/runtime/bridge.js',
  tags: ['CourseContent'],
  operationId: 'getScormRuntimeBridgeScript',
  request: {
    params: ScormPackagePathParams,
  },
  responses: {
    200: {
      description: 'SCORM 1.2 and 2004 JavaScript runtime bridge for legacy package launches.',
      content: { 'application/javascript': { schema: ScormRuntimeBridgeScriptResponse } },
    },
  },
});

export const commitScormRuntimeRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages/{scormPackageId}/runtime/commit',
  tags: ['CourseContent'],
  operationId: 'commitScormRuntime',
  security: [{ bearerAuth: [] }],
  request: {
    params: ScormPackagePathParams,
    body: { required: true, content: { 'application/json': { schema: ScormRuntimeCommitBody } } },
  },
  responses: {
    200: {
      description: 'SCORM runtime values committed for LMSCommit.',
      content: { 'application/json': { schema: ScormRuntimeStateResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const finishScormRuntimeRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/scorm-packages/{scormPackageId}/runtime/finish',
  tags: ['CourseContent'],
  operationId: 'finishScormRuntime',
  security: [{ bearerAuth: [] }],
  request: {
    params: ScormPackagePathParams,
    body: { required: true, content: { 'application/json': { schema: ScormRuntimeCommitBody } } },
  },
  responses: {
    200: {
      description: 'SCORM runtime values committed for LMSFinish.',
      content: { 'application/json': { schema: ScormRuntimeStateResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
