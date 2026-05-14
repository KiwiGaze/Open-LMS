import { createRoute } from '@hono/zod-openapi';
import {
  CommonCartridgeCourseExport,
  CommonCartridgeImportRequest,
  CommonCartridgeImportResult,
} from '@openlms/contracts';
import { CoursePathParams } from './courses.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const CommonCartridgeCourseExportResponse = CommonCartridgeCourseExport.openapi(
  'CommonCartridgeCourseExport',
);
export const CommonCartridgeImportRequestBody = CommonCartridgeImportRequest.openapi(
  'CommonCartridgeImportRequest',
);
export const CommonCartridgeImportResultResponse = CommonCartridgeImportResult.openapi(
  'CommonCartridgeImportResult',
);

export const exportCourseCommonCartridgeRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/common-cartridge',
  tags: ['Courses'],
  operationId: 'exportCourseCommonCartridge',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
  },
  responses: {
    200: {
      description: 'IMS Common Cartridge course package envelope.',
      content: {
        'application/json': {
          schema: CommonCartridgeCourseExportResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const importCourseCommonCartridgeRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/common-cartridge/import',
  tags: ['Courses'],
  operationId: 'importCourseCommonCartridge',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CommonCartridgeImportRequestBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Common Cartridge package imported into the target course.',
      content: {
        'application/json': {
          schema: CommonCartridgeImportResultResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
