import type { CourseRole, TenantRole } from '@openlms/contracts';
import { encryptSecret, serializeEncryptedSecret } from '@openlms/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  completeLti1p3DeepLinkingSessionWithExternalTools: vi.fn(),
  createLti1p3DeepLinkingAuthorizationResponse: vi.fn(),
  createLti1p3DeepLinkingSession: vi.fn(),
  createDbHandle: vi.fn(),
  createLti1p3LaunchAuthorizationResponse: vi.fn(),
  createLti1p3OidcLoginInitiation: vi.fn(),
  createLti1p3ServiceAccessToken: vi.fn(),
  encodeLti1p3DeepLinkingSessionData: vi.fn(),
  extractLti1p3DeepLinkingReturnSessionData: vi.fn(),
  extractLti1p3ServiceTokenClientId: vi.fn(),
  getActiveLti1p3PlatformSigningKey: vi.fn(),
  getCoreSessionByToken: vi.fn(),
  getCourseById: vi.fn(),
  getCourseExternalToolForCourse: vi.fn(),
  getIntegrationConnectionById: vi.fn(),
  getLti1p3DeepLinkingSessionById: vi.fn(),
  getLti1p3IntegrationConnectionByClientId: vi.fn(),
  getUserById: vi.fn(),
  listActiveLti1p3PlatformKeys: vi.fn(),
  listCourseMemberships: vi.fn(),
  listCourseExternalToolsForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  verifyLti1p3DeepLinkingReturn: vi.fn(),
  verifyLti1p3ServiceAccessToken: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    completeLti1p3DeepLinkingSessionWithExternalTools:
      coreMocks.completeLti1p3DeepLinkingSessionWithExternalTools,
    createLti1p3DeepLinkingAuthorizationResponse:
      coreMocks.createLti1p3DeepLinkingAuthorizationResponse,
    createLti1p3DeepLinkingSession: coreMocks.createLti1p3DeepLinkingSession,
    createDbHandle: coreMocks.createDbHandle,
    createLti1p3LaunchAuthorizationResponse: coreMocks.createLti1p3LaunchAuthorizationResponse,
    createLti1p3OidcLoginInitiation: coreMocks.createLti1p3OidcLoginInitiation,
    createLti1p3ServiceAccessToken: coreMocks.createLti1p3ServiceAccessToken,
    encodeLti1p3DeepLinkingSessionData: coreMocks.encodeLti1p3DeepLinkingSessionData,
    extractLti1p3DeepLinkingReturnSessionData: coreMocks.extractLti1p3DeepLinkingReturnSessionData,
    extractLti1p3ServiceTokenClientId: coreMocks.extractLti1p3ServiceTokenClientId,
    getActiveLti1p3PlatformSigningKey: coreMocks.getActiveLti1p3PlatformSigningKey,
    getCourseById: coreMocks.getCourseById,
    getCourseExternalToolForCourse: coreMocks.getCourseExternalToolForCourse,
    getIntegrationConnectionById: coreMocks.getIntegrationConnectionById,
    getLti1p3DeepLinkingSessionById: coreMocks.getLti1p3DeepLinkingSessionById,
    getLti1p3IntegrationConnectionByClientId: coreMocks.getLti1p3IntegrationConnectionByClientId,
    getUserById: coreMocks.getUserById,
    listActiveLti1p3PlatformKeys: coreMocks.listActiveLti1p3PlatformKeys,
    listCourseMemberships: coreMocks.listCourseMemberships,
    listCourseExternalToolsForCourse: coreMocks.listCourseExternalToolsForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    verifyLti1p3DeepLinkingReturn: coreMocks.verifyLti1p3DeepLinkingReturn,
    verifyLti1p3ServiceAccessToken: coreMocks.verifyLti1p3ServiceAccessToken,
  };
});

vi.mock('@openlms/core/auth/session', () => ({
  getCoreSessionByToken: coreMocks.getCoreSessionByToken,
}));

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const toolId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const integrationConnectionId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const deepLinkingSessionId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const deepLinkingSessionData = 'eyJzZXNzaW9uSWQiOiIwMUo5UVc3QjZONVcyWUgzRDNBMVYwS0U4QSJ9';
const ltiPrivateKeyEncryptionKey = Buffer.alloc(32, 1).toString('base64');
const privateJwk = { kty: 'RSA', kid: 'platform-key-1' };
const encryptedPrivateJwk = serializeEncryptedSecret(
  encryptSecret(JSON.stringify(privateJwk), ltiPrivateKeyEncryptionKey),
);
const ltiMessageHint = Buffer.from(
  JSON.stringify({ tenantId, courseId, toolId, actorUserId, launchType: 'resource_link' }),
  'utf8',
).toString('base64url');
const deepLinkingMessageHint = Buffer.from(
  JSON.stringify({
    tenantId,
    courseId,
    toolId,
    actorUserId,
    launchType: 'deep_linking',
    deepLinkingSessionId,
  }),
  'utf8',
).toString('base64url');

const sampleTool = () => ({
  id: toolId,
  tenantId,
  courseId,
  integrationConnectionId,
  name: 'Lab simulator',
  description: 'Launch the virtual science lab.',
  launchUrl: 'https://tools.example.edu/lti/launch/lab-simulator',
  placement: 'module_item' as const,
  status: 'active' as const,
  createdAt: new Date('2026-05-10T00:00:00.000Z'),
  updatedAt: new Date('2026-05-10T00:00:00.000Z'),
});

const sampleConnection = () => ({
  id: integrationConnectionId,
  tenantId,
  providerType: 'lti_1p3' as const,
  displayName: 'Lab simulator LTI',
  status: 'enabled' as const,
  config: {
    issuer: 'https://lms.example.edu',
    clientId: 'client-123',
    deploymentId: 'deployment-456',
    oidcLoginUrl: 'https://tools.example.edu/oidc/login',
    redirectUris: ['https://tools.example.edu/lti/launch'],
    toolJwks: {
      keys: [
        {
          kty: 'RSA' as const,
          kid: 'tool-key-1',
          use: 'sig' as const,
          alg: 'RS256' as const,
          n: 'sXch3n91Z0-SKpR6aSpsNQ',
          e: 'AQAB',
        },
      ],
    },
  },
  createdAt: new Date('2026-05-10T00:00:00.000Z'),
  updatedAt: new Date('2026-05-10T00:00:00.000Z'),
});

const samplePlatformKey = () => ({
  id: '01J9QW7B6N5W2YH3D3A1V0KE89',
  tenantId,
  keyId: 'platform-key-1',
  status: 'active' as const,
  publicJwk: {
    kty: 'RSA' as const,
    kid: 'platform-key-1',
    use: 'sig' as const,
    alg: 'RS256' as const,
    n: 'sXch3n91Z0-SKpR6aSpsNQ',
    e: 'AQAB',
  },
  encryptedPrivateJwk,
  createdAt: new Date('2026-05-10T00:00:00.000Z'),
  updatedAt: new Date('2026-05-10T00:00:00.000Z'),
});

const sampleCourse = () => ({
  id: courseId,
  tenantId,
  code: 'WRIT-101',
  title: 'Evidence-Based Writing',
  status: 'active' as const,
  startsAt: null,
  endsAt: null,
  catalogCategory: null,
  academicTerm: null,
  maxEnrollments: null,
  waitlistEnabled: false,
  isBlueprint: false,
  createdAt: new Date('2026-05-10T00:00:00.000Z'),
  updatedAt: new Date('2026-05-10T00:00:00.000Z'),
});

const sampleRosterUser = () => ({
  id: actorUserId,
  email: 'ada@example.edu',
  displayName: 'Ada Lovelace',
  emailVerified: true,
  locale: null,
  timezone: null,
  createdAt: new Date('2026-05-10T00:00:00.000Z'),
  updatedAt: new Date('2026-05-10T00:00:00.000Z'),
});

const sampleCourseMembership = () => ({
  id: '01J9QW7B6N5W2YH3D3A1V0KE8C',
  tenantId,
  courseId,
  userId: actorUserId,
  role: 'student' as const,
  status: 'active' as const,
  invitedAt: null,
  acceptedAt: new Date('2026-05-10T00:00:00.000Z'),
  droppedAt: null,
  withdrawnAt: null,
  createdAt: new Date('2026-05-10T00:00:00.000Z'),
  updatedAt: new Date('2026-05-10T00:00:00.000Z'),
});

const createDependencies = (
  environment: { LTI_PRIVATE_KEY_ENCRYPTION_KEY?: string } = {
    LTI_PRIVATE_KEY_ENCRYPTION_KEY: ltiPrivateKeyEncryptionKey,
  },
) =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
    ...environment,
  });

const configureCourseAccess = (tenantRole: TenantRole, courseRole: CourseRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role: tenantRole }]);
  coreMocks.listUserCourseMemberships.mockResolvedValue(
    courseRole ? [{ tenantId, courseId, role: courseRole }] : [],
  );
};

describe('course external tool API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createLti1p3OidcLoginInitiation.mockReturnValue({
      method: 'redirect',
      url: 'https://tools.example.edu/oidc/login?iss=https%3A%2F%2Flms.example.edu',
    });
    coreMocks.createLti1p3LaunchAuthorizationResponse.mockReturnValue({
      method: 'form_post',
      url: 'https://tools.example.edu/lti/launch',
      fields: {
        id_token: 'header.payload.signature',
        state: 'state-123',
      },
    });
    coreMocks.createLti1p3DeepLinkingAuthorizationResponse.mockReturnValue({
      method: 'form_post',
      url: 'https://tools.example.edu/lti/launch',
      fields: {
        id_token: 'deep.header.payload.signature',
        state: 'state-123',
      },
    });
    coreMocks.createLti1p3ServiceAccessToken.mockReturnValue({
      access_token: 'service.header.payload.signature',
      token_type: 'bearer',
      expires_in: 3600,
      scope: 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
    });
    coreMocks.createLti1p3DeepLinkingSession.mockResolvedValue({
      id: deepLinkingSessionId,
      tenantId,
      courseId,
      toolId,
      actorUserId,
      status: 'pending',
      createdAt: new Date('2026-05-10T00:00:00.000Z'),
      expiresAt: new Date('2026-05-10T01:00:00.000Z'),
      completedAt: null,
      updatedAt: new Date('2026-05-10T00:00:00.000Z'),
    });
    coreMocks.encodeLti1p3DeepLinkingSessionData.mockReturnValue(deepLinkingSessionData);
    coreMocks.extractLti1p3DeepLinkingReturnSessionData.mockReturnValue({
      sessionId: deepLinkingSessionId,
    });
    coreMocks.extractLti1p3ServiceTokenClientId.mockReturnValue('client-123');
    coreMocks.getLti1p3DeepLinkingSessionById.mockResolvedValue({
      id: deepLinkingSessionId,
      tenantId,
      courseId,
      toolId,
      actorUserId,
      status: 'pending',
      createdAt: new Date('2026-05-10T00:00:00.000Z'),
      expiresAt: new Date('2026-05-10T01:00:00.000Z'),
      completedAt: null,
      updatedAt: new Date('2026-05-10T00:00:00.000Z'),
    });
    coreMocks.verifyLti1p3DeepLinkingReturn.mockReturnValue({
      sessionData: { sessionId: deepLinkingSessionId },
      contentItems: [
        {
          type: 'ltiResourceLink',
          title: 'Chapter 12 quiz',
          text: 'External quiz activity.',
          url: 'https://tools.example.edu/lti/launch/chapter-12',
        },
      ],
    });
    coreMocks.completeLti1p3DeepLinkingSessionWithExternalTools.mockResolvedValue({
      session: {
        id: deepLinkingSessionId,
        tenantId,
        courseId,
        toolId,
        actorUserId,
        status: 'completed',
        createdAt: new Date('2026-05-10T00:00:00.000Z'),
        expiresAt: new Date('2026-05-10T01:00:00.000Z'),
        completedAt: new Date('2026-05-10T00:05:00.000Z'),
        updatedAt: new Date('2026-05-10T00:05:00.000Z'),
      },
      externalTools: [
        {
          ...sampleTool(),
          id: '01J9QW7B6N5W2YH3D3A1V0KE8B',
          name: 'Chapter 12 quiz',
          description: 'External quiz activity.',
          launchUrl: 'https://tools.example.edu/lti/launch/chapter-12',
        },
      ],
    });
    coreMocks.getActiveLti1p3PlatformSigningKey.mockResolvedValue(samplePlatformKey());
    coreMocks.listActiveLti1p3PlatformKeys.mockResolvedValue([samplePlatformKey()]);
    coreMocks.getCourseById.mockResolvedValue(sampleCourse());
    coreMocks.getCoreSessionByToken.mockResolvedValue({
      userId: actorUserId,
      activeTenantId: tenantId,
      expiresAt: new Date('2999-05-10T00:00:00.000Z'),
    });
    coreMocks.getCourseExternalToolForCourse.mockResolvedValue(sampleTool());
    coreMocks.getIntegrationConnectionById.mockResolvedValue(sampleConnection());
    coreMocks.getLti1p3IntegrationConnectionByClientId.mockResolvedValue(sampleConnection());
    coreMocks.getUserById.mockResolvedValue(sampleRosterUser());
    coreMocks.listCourseMemberships.mockResolvedValue([sampleCourseMembership()]);
    coreMocks.listCourseExternalToolsForCourse.mockResolvedValue([]);
    coreMocks.verifyLti1p3ServiceAccessToken.mockReturnValue({
      tenantId,
      integrationConnectionId,
      clientId: 'client-123',
      scopes: ['https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly'],
    });
    configureCourseAccess('student', 'student');
  });

  it('lists active course external tools for students', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listCourseExternalTools(actorUserId, tenantId, courseId),
    ).resolves.toEqual([]);

    expect(coreMocks.listCourseExternalToolsForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['active'],
    });
  });

  it('lists active and archived course external tools for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listCourseExternalTools(actorUserId, tenantId, courseId);

    expect(coreMocks.listCourseExternalToolsForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['active', 'archived'],
    });
  });

  it('lists active and archived course external tools for tenant staff without course membership', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.listCourseExternalTools(actorUserId, tenantId, courseId);

    expect(coreMocks.listCourseExternalToolsForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['active', 'archived'],
    });
  });

  it('rejects course external tools for tenant members without course access', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listCourseExternalTools(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'You are not a member of this course. Switch courses or ask an instructor for access.',
    });

    expect(coreMocks.listCourseExternalToolsForCourse).not.toHaveBeenCalled();
  });

  it('creates an LTI 1.3 OIDC launch initiation for course students', async () => {
    const dependencies = createDependencies();

    const launch = await dependencies.launchCourseExternalToolLti1p3(
      actorUserId,
      tenantId,
      courseId,
      toolId,
    );

    expect(launch).toEqual({
      method: 'redirect',
      url: 'https://tools.example.edu/oidc/login?iss=https%3A%2F%2Flms.example.edu',
    });
    expect(coreMocks.getCourseExternalToolForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      courseId,
      toolId,
    );
    expect(coreMocks.getIntegrationConnectionById).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      integrationConnectionId,
    );
    expect(coreMocks.createLti1p3OidcLoginInitiation).toHaveBeenCalledWith({
      actorUserId,
      tenantId,
      courseId,
      tool: sampleTool(),
      connection: sampleConnection(),
      launchType: 'resource_link',
    });
  });

  it('creates an LTI 1.3 deep linking login initiation for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const launch = await dependencies.launchCourseExternalToolLti1p3DeepLinking(
      actorUserId,
      tenantId,
      courseId,
      toolId,
    );

    expect(launch).toEqual({
      method: 'redirect',
      url: 'https://tools.example.edu/oidc/login?iss=https%3A%2F%2Flms.example.edu',
    });
    expect(coreMocks.createLti1p3OidcLoginInitiation).toHaveBeenCalledWith({
      actorUserId,
      tenantId,
      courseId,
      tool: sampleTool(),
      connection: sampleConnection(),
      launchType: 'deep_linking',
      deepLinkingSessionId,
    });
    expect(coreMocks.createLti1p3DeepLinkingSession).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        actorUserId,
        tenantId,
        courseId,
        toolId,
      }),
    );
  });

  it('rejects LTI 1.3 deep linking launches for students', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.launchCourseExternalToolLti1p3DeepLinking(
        actorUserId,
        tenantId,
        courseId,
        toolId,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can start LTI deep linking. Ask an instructor for access.',
    });

    expect(coreMocks.createLti1p3OidcLoginInitiation).not.toHaveBeenCalled();
  });

  it('rejects LTI launches for tenant members without course access', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.launchCourseExternalToolLti1p3(actorUserId, tenantId, courseId, toolId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'You are not a member of this course. Switch courses or ask an instructor for access.',
    });

    expect(coreMocks.getCourseExternalToolForCourse).not.toHaveBeenCalled();
  });

  it('returns not found when launching a missing external tool', async () => {
    coreMocks.getCourseExternalToolForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.launchCourseExternalToolLti1p3(actorUserId, tenantId, courseId, toolId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'External tool was not found in this course. Check the tool id and retry the request.',
    });

    expect(coreMocks.createLti1p3OidcLoginInitiation).not.toHaveBeenCalled();
  });

  it('returns bad request when the external tool connection is missing', async () => {
    coreMocks.getIntegrationConnectionById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.launchCourseExternalToolLti1p3(actorUserId, tenantId, courseId, toolId),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Integration connection was not found in this tenant. Check the connection id and retry the request.',
    });

    expect(coreMocks.createLti1p3OidcLoginInitiation).not.toHaveBeenCalled();
  });

  it('creates a signed LTI 1.3 launch authorization response for course students', async () => {
    const dependencies = createDependencies();

    const launch = await dependencies.createCourseExternalToolLti1p3LaunchAuthorizationResponse(
      actorUserId,
      tenantId,
      courseId,
      toolId,
      {
        redirectUri: 'https://tools.example.edu/lti/launch',
        state: 'state-123',
        nonce: 'nonce-456',
      },
    );

    expect(launch).toEqual({
      method: 'form_post',
      url: 'https://tools.example.edu/lti/launch',
      fields: {
        id_token: 'header.payload.signature',
        state: 'state-123',
      },
    });
    expect(coreMocks.getActiveLti1p3PlatformSigningKey).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
    );
    expect(coreMocks.createLti1p3LaunchAuthorizationResponse).toHaveBeenCalledWith({
      actorUserId,
      tenantId,
      courseId,
      tool: sampleTool(),
      connection: sampleConnection(),
      platformKey: samplePlatformKey(),
      privateJwk,
      namesRolesServiceUrl:
        'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE85/courses/01J9QW7B6N5W2YH3D3A1V0KE86/lti-1p3/namesroles',
      roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
      request: {
        redirectUri: 'https://tools.example.edu/lti/launch',
        state: 'state-123',
        nonce: 'nonce-456',
      },
    });
  });

  it('uses an instructor LTI role for tenant staff launch authorization responses', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseExternalToolLti1p3LaunchAuthorizationResponse(
      actorUserId,
      tenantId,
      courseId,
      toolId,
      {
        redirectUri: 'https://tools.example.edu/lti/launch',
        state: 'state-123',
        nonce: 'nonce-456',
      },
    );

    expect(coreMocks.createLti1p3LaunchAuthorizationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor'],
      }),
    );
  });

  it('returns bad request when LTI signing has no active platform key', async () => {
    coreMocks.getActiveLti1p3PlatformSigningKey.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseExternalToolLti1p3LaunchAuthorizationResponse(
        actorUserId,
        tenantId,
        courseId,
        toolId,
        {
          redirectUri: 'https://tools.example.edu/lti/launch',
          state: 'state-123',
          nonce: 'nonce-456',
        },
      ),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'LTI platform signing key is not configured for this tenant. Add an active platform key and retry.',
    });

    expect(coreMocks.createLti1p3LaunchAuthorizationResponse).not.toHaveBeenCalled();
  });

  it('returns bad request when LTI private key encryption is not configured', async () => {
    const dependencies = createDependencies({ LTI_PRIVATE_KEY_ENCRYPTION_KEY: undefined });

    await expect(
      dependencies.createCourseExternalToolLti1p3LaunchAuthorizationResponse(
        actorUserId,
        tenantId,
        courseId,
        toolId,
        {
          redirectUri: 'https://tools.example.edu/lti/launch',
          state: 'state-123',
          nonce: 'nonce-456',
        },
      ),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'LTI launch signing is not configured. Set LTI_PRIVATE_KEY_ENCRYPTION_KEY and retry.',
    });

    expect(coreMocks.createLti1p3LaunchAuthorizationResponse).not.toHaveBeenCalled();
  });

  it('authorizes LTI 1.3 OIDC launch redirects for the active session user', async () => {
    const dependencies = createDependencies();

    const launch = await dependencies.authorizeLti1p3OidcLaunch('session-token', {
      scope: 'openid',
      response_type: 'id_token',
      response_mode: 'form_post',
      prompt: 'none',
      client_id: 'client-123',
      redirect_uri: 'https://tools.example.edu/lti/launch',
      login_hint: actorUserId,
      lti_message_hint: ltiMessageHint,
      nonce: 'nonce-456',
      state: 'state-123',
    });

    expect(launch).toEqual({
      method: 'form_post',
      url: 'https://tools.example.edu/lti/launch',
      fields: {
        id_token: 'header.payload.signature',
        state: 'state-123',
      },
    });
    expect(coreMocks.getCoreSessionByToken).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      'session-token',
    );
    expect(coreMocks.createLti1p3LaunchAuthorizationResponse).toHaveBeenCalledWith({
      actorUserId,
      tenantId,
      courseId,
      tool: sampleTool(),
      connection: sampleConnection(),
      platformKey: samplePlatformKey(),
      privateJwk,
      roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
      expectedClientId: 'client-123',
      namesRolesServiceUrl:
        'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE85/courses/01J9QW7B6N5W2YH3D3A1V0KE86/lti-1p3/namesroles',
      request: {
        redirectUri: 'https://tools.example.edu/lti/launch',
        state: 'state-123',
        nonce: 'nonce-456',
      },
    });
  });

  it('authorizes LTI 1.3 OIDC deep linking redirects for active course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const launch = await dependencies.authorizeLti1p3OidcLaunch('session-token', {
      scope: 'openid',
      response_type: 'id_token',
      response_mode: 'form_post',
      prompt: 'none',
      client_id: 'client-123',
      redirect_uri: 'https://tools.example.edu/lti/launch',
      login_hint: actorUserId,
      lti_message_hint: deepLinkingMessageHint,
      nonce: 'nonce-456',
      state: 'state-123',
    });

    expect(launch).toEqual({
      method: 'form_post',
      url: 'https://tools.example.edu/lti/launch',
      fields: {
        id_token: 'deep.header.payload.signature',
        state: 'state-123',
      },
    });
    expect(coreMocks.createLti1p3DeepLinkingAuthorizationResponse).toHaveBeenCalledWith({
      actorUserId,
      tenantId,
      courseId,
      tool: sampleTool(),
      connection: sampleConnection(),
      platformKey: samplePlatformKey(),
      privateJwk,
      roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor'],
      expectedClientId: 'client-123',
      request: {
        redirectUri: 'https://tools.example.edu/lti/launch',
        state: 'state-123',
        nonce: 'nonce-456',
        deepLinkReturnUrl: 'https://lms.example.edu/api/v1/lti-1p3/deep-linking/return',
      },
      data: deepLinkingSessionData,
    });
    expect(coreMocks.encodeLti1p3DeepLinkingSessionData).toHaveBeenCalledWith({
      sessionId: deepLinkingSessionId,
    });
    expect(coreMocks.createLti1p3LaunchAuthorizationResponse).not.toHaveBeenCalled();
  });

  it('processes LTI 1.3 deep linking returns into active module-item external tools', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const result = await dependencies.processLti1p3DeepLinkingReturn('tool.return.jwt');

    expect(result).toEqual({
      createdExternalTools: [
        {
          ...sampleTool(),
          id: '01J9QW7B6N5W2YH3D3A1V0KE8B',
          name: 'Chapter 12 quiz',
          description: 'External quiz activity.',
          launchUrl: 'https://tools.example.edu/lti/launch/chapter-12',
        },
      ],
      ignoredContentItemCount: 0,
    });
    expect(coreMocks.extractLti1p3DeepLinkingReturnSessionData).toHaveBeenCalledWith(
      'tool.return.jwt',
    );
    expect(coreMocks.getLti1p3DeepLinkingSessionById).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      deepLinkingSessionId,
    );
    expect(coreMocks.verifyLti1p3DeepLinkingReturn).toHaveBeenCalledWith({
      jwt: 'tool.return.jwt',
      config: sampleConnection().config,
      expectedData: deepLinkingSessionData,
    });
    expect(coreMocks.completeLti1p3DeepLinkingSessionWithExternalTools).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        sessionId: deepLinkingSessionId,
        integrationConnectionId,
        sourceLaunchUrl: sampleTool().launchUrl,
        contentItems: [
          {
            type: 'ltiResourceLink',
            title: 'Chapter 12 quiz',
            text: 'External quiz activity.',
            url: 'https://tools.example.edu/lti/launch/chapter-12',
          },
        ],
      },
    );
  });

  it('rejects LTI 1.3 deep linking returns when the original actor is no longer course staff', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.processLti1p3DeepLinkingReturn('tool.return.jwt'),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can complete LTI deep linking. Ask an instructor for access.',
    });

    expect(coreMocks.completeLti1p3DeepLinkingSessionWithExternalTools).not.toHaveBeenCalled();
  });

  it('returns conflict when an LTI 1.3 deep linking item duplicates an external tool name', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.completeLti1p3DeepLinkingSessionWithExternalTools.mockRejectedValue({
      code: '23505',
      constraint_name: 'course_external_tool_tenant_course_name_uq',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.processLti1p3DeepLinkingReturn('tool.return.jwt'),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'External tool name already exists in this course. Choose a unique name and retry the request.',
    });
  });

  it('exchanges LTI 1.3 client credentials assertions for scoped service access tokens', async () => {
    const dependencies = createDependencies();

    const token = await dependencies.createLti1p3ServiceAccessToken(tenantId, {
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: 'tool.client.assertion',
      scope: 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
    });

    expect(token).toEqual({
      access_token: 'service.header.payload.signature',
      token_type: 'bearer',
      expires_in: 3600,
      scope: 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
    });
    expect(coreMocks.extractLti1p3ServiceTokenClientId).toHaveBeenCalledWith(
      'tool.client.assertion',
    );
    expect(coreMocks.getLti1p3IntegrationConnectionByClientId).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      'client-123',
    );
    expect(coreMocks.createLti1p3ServiceAccessToken).toHaveBeenCalledWith({
      tenantId,
      integrationConnectionId,
      tokenUrl: 'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE85/lti-1p3/token',
      requestedScopes: [
        'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
      ],
      clientAssertion: 'tool.client.assertion',
      config: sampleConnection().config,
      platformKey: samplePlatformKey(),
      privateJwk,
    });
  });

  it('returns LTI 1.3 NRPS context memberships for tools installed in the course', async () => {
    coreMocks.listCourseExternalToolsForCourse.mockResolvedValue([sampleTool()]);
    const dependencies = createDependencies();

    const container = await dependencies.getLti1p3NamesRolesMemberships(
      'service.header.payload.signature',
      tenantId,
      courseId,
    );

    expect(container).toEqual({
      id: 'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE85/courses/01J9QW7B6N5W2YH3D3A1V0KE86/lti-1p3/namesroles',
      context: {
        id: courseId,
        label: 'WRIT-101',
        title: 'Evidence-Based Writing',
      },
      members: [
        {
          status: 'Active',
          name: 'Ada Lovelace',
          email: 'ada@example.edu',
          user_id: actorUserId,
          roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
        },
      ],
    });
    expect(coreMocks.verifyLti1p3ServiceAccessToken).toHaveBeenCalledWith({
      accessToken: 'service.header.payload.signature',
      expectedTenantId: tenantId,
      requiredScope: 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
      platformKeys: [samplePlatformKey().publicJwk],
    });
    expect(coreMocks.listCourseExternalToolsForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['active'],
    });
    expect(coreMocks.listCourseMemberships).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      status: 'active',
    });
  });

  it('rejects LTI 1.3 NRPS requests when the token connection has no course tool', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.getLti1p3NamesRolesMemberships(
        'service.header.payload.signature',
        tenantId,
        courseId,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'LTI service token cannot access this course because no external tool from this connection is installed in the course.',
    });
  });

  it('rejects LTI 1.3 OIDC authorization when the session user does not match login_hint', async () => {
    coreMocks.getCoreSessionByToken.mockResolvedValue({
      userId: '01J9QW7B6N5W2YH3D3A1V0KE99',
      activeTenantId: tenantId,
      expiresAt: new Date('2999-05-10T00:00:00.000Z'),
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.authorizeLti1p3OidcLaunch('session-token', {
        scope: 'openid',
        response_type: 'id_token',
        response_mode: 'form_post',
        prompt: 'none',
        client_id: 'client-123',
        redirect_uri: 'https://tools.example.edu/lti/launch',
        login_hint: actorUserId,
        lti_message_hint: ltiMessageHint,
        nonce: 'nonce-456',
        state: 'state-123',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'LTI launch session does not match the requested launch user. Sign in as the requested user and retry.',
    });

    expect(coreMocks.createLti1p3LaunchAuthorizationResponse).not.toHaveBeenCalled();
  });

  it('rejects LTI 1.3 OIDC authorization outside the active session tenant', async () => {
    coreMocks.getCoreSessionByToken.mockResolvedValue({
      userId: actorUserId,
      activeTenantId: '01J9QW7B6N5W2YH3D3A1V0KE98',
      expiresAt: new Date('2999-05-10T00:00:00.000Z'),
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.authorizeLti1p3OidcLaunch('session-token', {
        scope: 'openid',
        response_type: 'id_token',
        response_mode: 'form_post',
        prompt: 'none',
        client_id: 'client-123',
        redirect_uri: 'https://tools.example.edu/lti/launch',
        login_hint: actorUserId,
        lti_message_hint: ltiMessageHint,
        nonce: 'nonce-456',
        state: 'state-123',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'LTI launch tenant is not the active tenant for this session. Switch tenants and retry.',
    });

    expect(coreMocks.createLti1p3LaunchAuthorizationResponse).not.toHaveBeenCalled();
  });
});
