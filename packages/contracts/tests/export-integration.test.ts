import { describe, expect, it } from 'vitest';
import {
  CourseExternalTool,
  ExportJobRecord,
  FeedbackGradeExportRow,
  IntegrationConnection,
  Lti1p3AgsResult,
  Lti1p3AgsScore,
  Lti1p3ConnectionConfig,
  Lti1p3DeepLinkingContentItem,
  Lti1p3DeepLinkingLaunchRequest,
  Lti1p3DeepLinkingReturnBody,
  Lti1p3DeepLinkingReturnResult,
  Lti1p3DeepLinkingSession,
  Lti1p3DeepLinkingSessionData,
  Lti1p3DeepLinkingSettings,
  Lti1p3JsonWebKeySet,
  Lti1p3LaunchAuthorizationRequest,
  Lti1p3LaunchAuthorizationResponse,
  Lti1p3NamesRolesContext,
  Lti1p3NamesRolesMember,
  Lti1p3NamesRolesMembershipContainer,
  Lti1p3OidcAuthorizationRequest,
  Lti1p3OidcLoginInitiation,
  Lti1p3PlatformKey,
  Lti1p3PublicJwk,
  Lti1p3ServiceAccessToken,
  Lti1p3ServiceTokenRequest,
  lti1p3AgsResultReadonlyScope,
  lti1p3AgsScoreScope,
  lti1p3NamesRolesContextMembershipReadonlyScope,
} from '../src/index.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2S';
const userId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const encryptedPrivateJwk = JSON.stringify({
  ciphertextBase64: 'cHJpdmF0ZQ==',
  ivBase64: 'AAAAAAAAAAAAAAAA',
  authTagBase64: 'AAAAAAAAAAAAAAAAAAAAAA==',
});

describe('export and integration contracts', () => {
  it('models a tenant-scoped feedback and grade export job', () => {
    const job = ExportJobRecord.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      tenantId,
      requestedById: userId,
      exportType: 'feedback_and_grades',
      format: 'csv',
      status: 'queued',
      filters: {
        courseId: null,
        assignmentId,
        studentId: null,
        submittedFrom: null,
        submittedTo: null,
      },
      storageFileId: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    });

    expect(job.exportType).toBe('feedback_and_grades');
    expect(job.filters.assignmentId).toBe(assignmentId);
  });

  it('models export rows without exposing teacher-only AI draft notes', () => {
    const row = FeedbackGradeExportRow.parse({
      assignmentId,
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      score: 8.5,
      maxScore: 10,
      gradeStatus: 'published',
      feedbackVersion: 2,
      feedbackSource: 'ai_assisted',
      overallComment: 'Stronger evidence explanation in the revised draft.',
      publishedAt: now,
    });

    expect(row).not.toHaveProperty('teacherNote');
  });

  it('models basic external integration connections', () => {
    const connection = IntegrationConnection.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE30',
      tenantId,
      providerType: 'generic_webhook',
      displayName: 'District reporting webhook',
      status: 'enabled',
      config: {
        endpointUrl: 'https://example.edu/open-lms/events',
        eventTypes: ['grade.exported'],
      },
      createdAt: now,
      updatedAt: now,
    });

    expect(connection.status).toBe('enabled');
  });

  it('models LTI 1.3 connection launch configuration', () => {
    const config = Lti1p3ConnectionConfig.parse({
      issuer: 'https://lms.example.edu',
      clientId: 'client-123',
      deploymentId: 'deployment-456',
      oidcLoginUrl: 'https://tools.example.edu/oidc/login',
      redirectUris: ['https://tools.example.edu/lti/launch'],
      toolJwks: {
        keys: [
          {
            kty: 'RSA',
            kid: 'tool-key-1',
            use: 'sig',
            alg: 'RS256',
            n: 'sXch3n91Z0-SKpR6aSpsNQ',
            e: 'AQAB',
          },
        ],
      },
    });

    expect(config.clientId).toBe('client-123');
    expect(config.toolJwks?.keys[0]?.kid).toBe('tool-key-1');
  });

  it('rejects LTI 1.3 connection configuration without HTTPS URLs', () => {
    expect(() =>
      Lti1p3ConnectionConfig.parse({
        issuer: 'http://lms.example.edu',
        clientId: 'client-123',
        deploymentId: 'deployment-456',
        oidcLoginUrl: 'https://tools.example.edu/oidc/login',
        redirectUris: ['https://tools.example.edu/lti/launch'],
      }),
    ).toThrow();

    expect(() =>
      Lti1p3ConnectionConfig.parse({
        issuer: 'https://lms.example.edu',
        clientId: 'client-123',
        deploymentId: 'deployment-456',
        oidcLoginUrl: 'http://tools.example.edu/oidc/login',
        redirectUris: ['https://tools.example.edu/lti/launch'],
      }),
    ).toThrow();
  });

  it('models an LTI 1.3 OIDC login initiation response', () => {
    const initiation = Lti1p3OidcLoginInitiation.parse({
      method: 'redirect',
      url: 'https://tools.example.edu/oidc/login?iss=https%3A%2F%2Flms.example.edu',
    });

    expect(initiation.method).toBe('redirect');
  });

  it('models LTI 1.3 service tokens and NRPS membership containers', () => {
    const tokenRequest = Lti1p3ServiceTokenRequest.parse({
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: 'header.payload.signature',
      scope: lti1p3NamesRolesContextMembershipReadonlyScope,
    });
    const tokenResponse = Lti1p3ServiceAccessToken.parse({
      access_token: 'header.payload.signature',
      token_type: 'bearer',
      expires_in: 3600,
      scope: lti1p3NamesRolesContextMembershipReadonlyScope,
    });
    const context = Lti1p3NamesRolesContext.parse({
      id: courseId,
      label: 'WRIT-101',
      title: 'Evidence-Based Writing',
    });
    const member = Lti1p3NamesRolesMember.parse({
      status: 'Active',
      name: 'Ada Lovelace',
      email: 'ada@example.edu',
      user_id: userId,
      roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
    });
    const container = Lti1p3NamesRolesMembershipContainer.parse({
      id: 'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE2T/courses/01J9QW7B6N5W2YH3D3A1V0KE2S/lti-1p3/namesroles',
      context,
      members: [member],
    });

    expect(tokenRequest.scope).toBe(lti1p3NamesRolesContextMembershipReadonlyScope);
    expect(tokenResponse.expires_in).toBe(3600);
    expect(container.members[0]?.roles).toEqual([
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
    ]);
  });

  it('models LTI 1.3 AGS scores and results', () => {
    const score = Lti1p3AgsScore.parse({
      timestamp: '2026-05-10T00:00:00.000Z',
      scoreGiven: 9,
      scoreMaximum: 10,
      activityProgress: 'Completed',
      gradingProgress: 'FullyGraded',
      userId,
      comment: 'Strong evidence.',
    });
    const result = Lti1p3AgsResult.parse({
      id: 'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE2T/courses/01J9QW7B6N5W2YH3D3A1V0KE2S/assignments/01J9QW7B6N5W2YH3D3A1V0KE2W/external-tools/01J9QW7B6N5W2YH3D3A1V0KE33/lti-ags/lineitem/results/01J9QW7B6N5W2YH3D3A1V0KE2V',
      scoreOf:
        'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE2T/courses/01J9QW7B6N5W2YH3D3A1V0KE2S/assignments/01J9QW7B6N5W2YH3D3A1V0KE2W/external-tools/01J9QW7B6N5W2YH3D3A1V0KE33/lti-ags/lineitem',
      userId,
      resultScore: 9,
      resultMaximum: 10,
    });

    expect(score.timestamp).toEqual(now);
    expect(result.userId).toBe(userId);
    expect(lti1p3AgsScoreScope).toBe('https://purl.imsglobal.org/spec/lti-ags/scope/score');
    expect(lti1p3AgsResultReadonlyScope).toBe(
      'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
    );
  });

  it('models LTI 1.3 deep linking request settings', () => {
    const settings = Lti1p3DeepLinkingSettings.parse({
      deep_link_return_url: 'https://lms.example.edu/api/v1/lti-1p3/deep-linking/return',
      accept_types: ['ltiResourceLink'],
      accept_presentation_document_targets: ['iframe', 'window'],
      accept_multiple: true,
      data: 'eyJ0ZW5hbnRJZCI6IjAxSjlRVzdCNk41VzJZSDNEM0ExVjBLRTJUIn0',
    });
    const request = Lti1p3DeepLinkingLaunchRequest.parse({
      redirectUri: 'https://tools.example.edu/lti/launch',
      state: 'state-123',
      nonce: 'nonce-456',
      deepLinkReturnUrl: settings.deep_link_return_url,
    });

    expect(settings.accept_types).toEqual(['ltiResourceLink']);
    expect(request.deepLinkReturnUrl).toBe(
      'https://lms.example.edu/api/v1/lti-1p3/deep-linking/return',
    );
  });

  it('models LTI 1.3 deep linking return sessions and content items', () => {
    const session = Lti1p3DeepLinkingSession.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE34',
      tenantId,
      courseId,
      toolId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      actorUserId: userId,
      status: 'pending',
      createdAt: now,
      expiresAt: new Date('2026-05-10T01:00:00.000Z'),
      completedAt: null,
      updatedAt: now,
    });
    const data = Lti1p3DeepLinkingSessionData.parse({ sessionId: session.id });
    const item = Lti1p3DeepLinkingContentItem.parse({
      type: 'ltiResourceLink',
      title: 'Chapter 12 quiz',
      text: 'External quiz activity.',
      url: 'https://tools.example.edu/lti/launch/chapter-12',
    });
    const body = Lti1p3DeepLinkingReturnBody.parse({ JWT: 'header.payload.signature' });
    const result = Lti1p3DeepLinkingReturnResult.parse({
      createdExternalTools: [],
      ignoredContentItemCount: 0,
    });

    expect(data.sessionId).toBe(session.id);
    expect(item.title).toBe('Chapter 12 quiz');
    expect(body.JWT).toBe('header.payload.signature');
    expect(result.ignoredContentItemCount).toBe(0);
  });

  it('models an LTI 1.3 OIDC authorization request from a tool redirect', () => {
    const request = Lti1p3OidcAuthorizationRequest.parse({
      scope: 'openid',
      response_type: 'id_token',
      response_mode: 'form_post',
      prompt: 'none',
      client_id: 'client-123',
      redirect_uri: 'https://tools.example.edu/lti/launch',
      login_hint: userId,
      lti_message_hint: 'eyJ0ZW5hbnRJZCI6IjAxSjlRVzdCNk41VzJZSDNEM0ExVjBLRTJUIn0',
      nonce: 'nonce-456',
      state: 'state-123',
    });

    expect(request.response_type).toBe('id_token');
    expect(request.redirect_uri).toBe('https://tools.example.edu/lti/launch');
  });

  it('models LTI 1.3 platform public keys and JWKS responses', () => {
    const publicJwk = Lti1p3PublicJwk.parse({
      kty: 'RSA',
      kid: 'platform-key-1',
      use: 'sig',
      alg: 'RS256',
      n: 'sXch3n91Z0-SKpR6aSpsNQ',
      e: 'AQAB',
    });
    const key = Lti1p3PlatformKey.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      tenantId,
      keyId: 'platform-key-1',
      status: 'active',
      publicJwk,
      encryptedPrivateJwk,
      createdAt: now,
      updatedAt: now,
    });
    const jwks = Lti1p3JsonWebKeySet.parse({ keys: [publicJwk] });

    expect(key.publicJwk.kid).toBe('platform-key-1');
    expect(jwks.keys).toEqual([publicJwk]);
  });

  it('rejects LTI 1.3 platform keys that are not RS256 signing keys', () => {
    expect(() =>
      Lti1p3PublicJwk.parse({
        kty: 'EC',
        kid: 'platform-key-1',
        use: 'sig',
        alg: 'ES256',
        n: 'sXch3n91Z0-SKpR6aSpsNQ',
        e: 'AQAB',
      }),
    ).toThrow();

    expect(() =>
      Lti1p3PublicJwk.parse({
        kty: 'RSA',
        kid: 'platform-key-1',
        use: 'enc',
        alg: 'RS256',
        n: 'sXch3n91Z0-SKpR6aSpsNQ',
        e: 'AQAB',
      }),
    ).toThrow();
  });

  it('models an LTI 1.3 launch authorization form-post response', () => {
    const request = Lti1p3LaunchAuthorizationRequest.parse({
      redirectUri: 'https://tools.example.edu/lti/launch',
      state: 'state-123',
      nonce: 'nonce-456',
    });
    const response = Lti1p3LaunchAuthorizationResponse.parse({
      method: 'form_post',
      url: request.redirectUri,
      fields: {
        id_token: 'header.payload.signature',
        state: request.state,
      },
    });

    expect(response.fields.state).toBe('state-123');
  });

  it('models course external tool placements backed by integration connections', () => {
    const tool = CourseExternalTool.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId,
      courseId,
      integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE30',
      name: 'Lab simulator',
      description: 'Launch the virtual science lab.',
      launchUrl: 'https://tools.example.edu/lti/launch/lab-simulator',
      placement: 'module_item',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    expect(tool.placement).toBe('module_item');
  });

  it('rejects course external tool placements without a valid launch URL', () => {
    expect(() =>
      CourseExternalTool.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE31',
        tenantId,
        courseId,
        integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE30',
        name: 'Lab simulator',
        description: null,
        launchUrl: 'tools.example.edu/lti/launch/lab-simulator',
        placement: 'module_item',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('rejects course external tool launch URLs that are not HTTPS', () => {
    const tool = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId,
      courseId,
      integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE30',
      name: 'Lab simulator',
      description: null,
      placement: 'module_item',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    expect(() =>
      CourseExternalTool.parse({ ...tool, launchUrl: 'http://tools.example.edu/lab' }),
    ).toThrow();
    expect(() => CourseExternalTool.parse({ ...tool, launchUrl: 'javascript:alert(1)' })).toThrow();
    expect(() =>
      CourseExternalTool.parse({ ...tool, launchUrl: 'data:text/html,<script></script>' }),
    ).toThrow();
  });
});
