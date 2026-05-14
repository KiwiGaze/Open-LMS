import {
  CourseExternalTool,
  IntegrationConnection,
  IntegrationConnectionId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { createLti1p3OidcLoginInitiation } from '../src/lti/oidc-launch.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2S';
const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const toolId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const integrationConnectionId = '01J9QW7B6N5W2YH3D3A1V0KE30';
const deepLinkingSessionId = '01J9QW7B6N5W2YH3D3A1V0KE34';

const tool = CourseExternalTool.parse({
  id: toolId,
  tenantId,
  courseId,
  integrationConnectionId,
  name: 'Lab simulator',
  description: 'Launch the virtual science lab.',
  launchUrl: 'https://tools.example.edu/lti/launch/lab-simulator',
  placement: 'module_item' as const,
  status: 'active' as const,
  createdAt: now,
  updatedAt: now,
});

const connection = IntegrationConnection.parse({
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
    redirectUris: ['https://tools.example.edu/lti/launch/lab-simulator'],
  },
  createdAt: now,
  updatedAt: now,
});

describe('LTI 1.3 OIDC launch initiation', () => {
  it('builds a standards-shaped login initiation redirect URL', () => {
    const initiation = createLti1p3OidcLoginInitiation({
      actorUserId,
      tenantId,
      courseId,
      tool,
      connection,
    });
    const url = new URL(initiation.url);
    const messageHint = JSON.parse(
      Buffer.from(url.searchParams.get('lti_message_hint') ?? '', 'base64url').toString('utf8'),
    ) as {
      tenantId: string;
      courseId: string;
      toolId: string;
      actorUserId: string;
      launchType: string;
    };

    expect(initiation.method).toBe('redirect');
    expect(url.origin).toBe('https://tools.example.edu');
    expect(url.pathname).toBe('/oidc/login');
    expect(url.searchParams.get('iss')).toBe('https://lms.example.edu');
    expect(url.searchParams.get('login_hint')).toBe(actorUserId);
    expect(url.searchParams.get('client_id')).toBe('client-123');
    expect(url.searchParams.get('lti_deployment_id')).toBe('deployment-456');
    expect(url.searchParams.get('target_link_uri')).toBe(tool.launchUrl);
    expect(messageHint).toEqual({
      tenantId,
      courseId,
      toolId,
      actorUserId,
      launchType: 'resource_link',
    });
  });

  it('builds a deep linking login initiation redirect URL', () => {
    const initiation = createLti1p3OidcLoginInitiation({
      actorUserId,
      tenantId,
      courseId,
      tool,
      connection,
      launchType: 'deep_linking',
      deepLinkingSessionId,
    });
    const url = new URL(initiation.url);
    const messageHint = JSON.parse(
      Buffer.from(url.searchParams.get('lti_message_hint') ?? '', 'base64url').toString('utf8'),
    ) as {
      tenantId: string;
      courseId: string;
      toolId: string;
      actorUserId: string;
      launchType: string;
      deepLinkingSessionId: string;
    };

    expect(url.searchParams.get('target_link_uri')).toBe(tool.launchUrl);
    expect(messageHint).toEqual({
      tenantId,
      courseId,
      toolId,
      actorUserId,
      launchType: 'deep_linking',
      deepLinkingSessionId,
    });
  });

  it('requires a deep linking session id for deep linking login initiation', () => {
    expect(() =>
      createLti1p3OidcLoginInitiation({
        actorUserId,
        tenantId,
        courseId,
        tool,
        connection,
        launchType: 'deep_linking',
      }),
    ).toThrow(/deep linking session/);
  });

  it('rejects disabled or non-LTI connections', () => {
    expect(() =>
      createLti1p3OidcLoginInitiation({
        actorUserId,
        tenantId,
        courseId,
        tool,
        connection: { ...connection, status: 'disabled' },
      }),
    ).toThrow(/enabled LTI 1\.3 connection/);

    expect(() =>
      createLti1p3OidcLoginInitiation({
        actorUserId,
        tenantId,
        courseId,
        tool,
        connection: { ...connection, providerType: 'generic_webhook' },
      }),
    ).toThrow(/enabled LTI 1\.3 connection/);
  });

  it('rejects archived tools and mismatched connection ids', () => {
    expect(() =>
      createLti1p3OidcLoginInitiation({
        actorUserId,
        tenantId,
        courseId,
        tool: { ...tool, status: 'archived' },
        connection,
      }),
    ).toThrow(/active external tool/);

    expect(() =>
      createLti1p3OidcLoginInitiation({
        actorUserId,
        tenantId,
        courseId,
        tool: {
          ...tool,
          integrationConnectionId: IntegrationConnectionId.parse('01J9QW7B6N5W2YH3D3A1V0KE32'),
        },
        connection,
      }),
    ).toThrow(/same integration connection/);
  });
});
