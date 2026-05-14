import type { CourseExternalTool, IntegrationConnection } from '@openlms/contracts';

export type Lti1p3LaunchContext = {
  tenantId: string;
  courseId: string;
  tool: CourseExternalTool;
  connection: IntegrationConnection;
};

export const assertValidLti1p3LaunchContext = (input: Lti1p3LaunchContext): void => {
  if (input.connection.providerType !== 'lti_1p3' || input.connection.status !== 'enabled') {
    throw new Error('LTI launch requires an enabled LTI 1.3 connection.');
  }

  if (input.tool.status !== 'active') {
    throw new Error('LTI launch requires an active external tool.');
  }

  if (
    input.tool.tenantId !== input.tenantId ||
    input.tool.courseId !== input.courseId ||
    input.connection.tenantId !== input.tenantId
  ) {
    throw new Error('LTI launch requires tool and connection records in the requested scope.');
  }

  if (input.tool.integrationConnectionId !== input.connection.id) {
    throw new Error(
      'LTI launch requires the tool and connection to reference the same integration connection.',
    );
  }
};
