import {
  CourseExternalToolId,
  CourseId,
  Lti1p3DeepLinkingSessionId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  decodeLti1p3LaunchMessageHint,
  encodeLti1p3LaunchMessageHint,
  resolveLti1p3OidcAuthorizationRequest,
} from '../src/lti/oidc-authorization.ts';

const tenantId = TenantId.parse('01J9QW7B6N5W2YH3D3A1V0KE2T');
const courseId = CourseId.parse('01J9QW7B6N5W2YH3D3A1V0KE2S');
const actorUserId = UserId.parse('01J9QW7B6N5W2YH3D3A1V0KE2V');
const toolId = CourseExternalToolId.parse('01J9QW7B6N5W2YH3D3A1V0KE31');
const deepLinkingSessionId = Lti1p3DeepLinkingSessionId.parse('01J9QW7B6N5W2YH3D3A1V0KE34');

describe('LTI 1.3 OIDC authorization request resolution', () => {
  it('decodes the launch message hint and resolves launch inputs', () => {
    const ltiMessageHint = encodeLti1p3LaunchMessageHint({
      tenantId,
      courseId,
      toolId,
      actorUserId,
      launchType: 'resource_link',
    });

    const resolved = resolveLti1p3OidcAuthorizationRequest({
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

    expect(resolved).toEqual({
      actorUserId,
      tenantId,
      courseId,
      toolId,
      launchType: 'resource_link',
      clientId: 'client-123',
      launchRequest: {
        redirectUri: 'https://tools.example.edu/lti/launch',
        nonce: 'nonce-456',
        state: 'state-123',
      },
    });
    expect(decodeLti1p3LaunchMessageHint(ltiMessageHint)).toEqual({
      actorUserId,
      tenantId,
      courseId,
      toolId,
      launchType: 'resource_link',
    });
  });

  it('resolves deep linking launch inputs with the persisted session id', () => {
    const ltiMessageHint = encodeLti1p3LaunchMessageHint({
      tenantId,
      courseId,
      toolId,
      actorUserId,
      launchType: 'deep_linking',
      deepLinkingSessionId,
    });

    const resolved = resolveLti1p3OidcAuthorizationRequest({
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

    expect(resolved).toMatchObject({
      launchType: 'deep_linking',
      deepLinkingSessionId,
    });
  });

  it('rejects requests where login_hint does not match the launch message hint actor', () => {
    const ltiMessageHint = encodeLti1p3LaunchMessageHint({
      tenantId,
      courseId,
      toolId,
      actorUserId,
      launchType: 'resource_link',
    });

    expect(() =>
      resolveLti1p3OidcAuthorizationRequest({
        scope: 'openid',
        response_type: 'id_token',
        response_mode: 'form_post',
        prompt: 'none',
        client_id: 'client-123',
        redirect_uri: 'https://tools.example.edu/lti/launch',
        login_hint: '01J9QW7B6N5W2YH3D3A1V0KE99',
        lti_message_hint: ltiMessageHint,
        nonce: 'nonce-456',
        state: 'state-123',
      }),
    ).toThrow(/login_hint must match/);
  });

  it('rejects authorization requests without the openid scope', () => {
    const ltiMessageHint = encodeLti1p3LaunchMessageHint({
      tenantId,
      courseId,
      toolId,
      actorUserId,
      launchType: 'resource_link',
    });

    expect(() =>
      resolveLti1p3OidcAuthorizationRequest({
        scope: 'profile',
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
    ).toThrow(/openid/);
  });
});
