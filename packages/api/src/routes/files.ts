import { createRoute, z } from '@hono/zod-openapi';
import { CourseId, CreateFileUpload, FileMetadata, FileResourceId } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const FileMetadataResponse = FileMetadata.openapi('FileMetadata');
export const CreateFileUploadBody = CreateFileUpload.openapi('CreateFileUpload');
export const ListFilesQuery = z.object({
  courseId: CourseId.optional().openapi({
    description:
      'When provided, list files in the course library instead of the authenticated owner library.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  }),
});

export const FilePathParams = TenantPathParams.extend({
  fileId: FileResourceId.openapi({
    param: {
      name: 'fileId',
      in: 'path',
      description: 'File resource identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
  }),
});

export const listFilesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/files',
  tags: ['Files'],
  operationId: 'listFiles',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    query: ListFilesQuery,
  },
  responses: {
    200: {
      description: 'File metadata owned by the authenticated user in the tenant.',
      content: {
        'application/json': {
          schema: FileMetadataResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const uploadFileRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/files',
  tags: ['Files'],
  operationId: 'uploadFile',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateFileUploadBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Uploaded file metadata.',
      content: {
        'application/json': {
          schema: FileMetadataResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const getFileRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/files/{fileId}',
  tags: ['Files'],
  operationId: 'getFile',
  security: [{ bearerAuth: [] }],
  request: {
    params: FilePathParams,
  },
  responses: {
    200: {
      description: 'File metadata owned by the authenticated user.',
      content: {
        'application/json': {
          schema: FileMetadataResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const downloadFileRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/files/{fileId}/download',
  tags: ['Files'],
  operationId: 'downloadFile',
  security: [{ bearerAuth: [] }],
  request: {
    params: FilePathParams,
  },
  responses: {
    200: {
      description: 'File bytes owned by the authenticated user.',
      content: {
        'application/octet-stream': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteFileRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/files/{fileId}',
  tags: ['Files'],
  operationId: 'deleteFile',
  security: [{ bearerAuth: [] }],
  request: {
    params: FilePathParams,
  },
  responses: {
    204: {
      description: 'File metadata and stored bytes deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
