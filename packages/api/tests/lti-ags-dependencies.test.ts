import {
  UserId,
  lti1p3AgsResultReadonlyScope,
  lti1p3AgsScoreScope,
  lti1p3NamesRolesContextMembershipReadonlyScope,
} from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getAssignmentById: vi.fn(),
  getCourseExternalToolForCourse: vi.fn(),
  getIntegrationConnectionById: vi.fn(),
  listActiveLti1p3PlatformKeys: vi.fn(),
  listCourseExternalToolOutcomesForAssignment: vi.fn(),
  listCourseMemberships: vi.fn(),
  recordCourseExternalToolOutcome: vi.fn(),
  verifyLti1p3ServiceAccessToken: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getAssignmentById: coreMocks.getAssignmentById,
    getCourseExternalToolForCourse: coreMocks.getCourseExternalToolForCourse,
    getIntegrationConnectionById: coreMocks.getIntegrationConnectionById,
    listActiveLti1p3PlatformKeys: coreMocks.listActiveLti1p3PlatformKeys,
    listCourseExternalToolOutcomesForAssignment:
      coreMocks.listCourseExternalToolOutcomesForAssignment,
    listCourseMemberships: coreMocks.listCourseMemberships,
    recordCourseExternalToolOutcome: coreMocks.recordCourseExternalToolOutcome,
    verifyLti1p3ServiceAccessToken: coreMocks.verifyLti1p3ServiceAccessToken,
  };
});

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const studentId = UserId.parse('01J9QW7B6N5W2YH3D3A1V0KE88');
const toolId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const integrationConnectionId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const now = new Date('2026-05-12T00:00:00.000Z');
const publicJwk = {
  kty: 'RSA' as const,
  kid: 'platform-key-1',
  use: 'sig' as const,
  alg: 'RS256' as const,
  n: 'sXch3n91Z0-SKpR6aSpsNQ',
  e: 'AQAB',
};

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
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
    toolJwks: { keys: [publicJwk] },
  },
  createdAt: now,
  updatedAt: now,
});

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
  createdAt: now,
  updatedAt: now,
});

const sampleAssignment = () => ({
  id: assignmentId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  position: null,
  title: 'Evidence lab',
  instructions: 'Complete the lab.',
  status: 'published' as const,
  dueAt: null,
  allowResubmission: false,
  activeRubricId: null,
  aiSettings: {
    precheckEnabled: false,
    feedbackDraftEnabled: false,
    scoreSuggestionEnabled: false,
  },
  latePenaltyPercentPerDay: null,
  lateMaxPenaltyPercent: null,
  extraCredit: false,
  anonymousGradingEnabled: false,
  groupSubmissionEnabled: false,
  groupSetId: null,
  gradingLocked: false,
  createdAt: now,
  updatedAt: now,
});

const sampleOutcome = () => ({
  id: '01J9QW7B6N5W2YH3D3A1V0KE8B',
  tenantId,
  courseId,
  assignmentId,
  studentId,
  externalToolId: toolId,
  score: 9,
  maxScore: 10,
  status: 'published' as const,
  reportedAt: now,
  createdAt: now,
  updatedAt: now,
});

describe('LTI AGS API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listActiveLti1p3PlatformKeys.mockResolvedValue([{ publicJwk }]);
    coreMocks.verifyLti1p3ServiceAccessToken.mockReturnValue({
      tenantId,
      integrationConnectionId,
      clientId: 'client-123',
      scopes: [lti1p3AgsScoreScope],
    });
    coreMocks.getIntegrationConnectionById.mockResolvedValue(sampleConnection());
    coreMocks.getCourseExternalToolForCourse.mockResolvedValue(sampleTool());
    coreMocks.getAssignmentById.mockResolvedValue(sampleAssignment());
    coreMocks.listCourseMemberships.mockResolvedValue([
      {
        tenantId,
        courseId,
        userId: studentId,
        role: 'student',
        status: 'active',
      },
    ]);
    coreMocks.recordCourseExternalToolOutcome.mockResolvedValue(sampleOutcome());
    coreMocks.listCourseExternalToolOutcomesForAssignment.mockResolvedValue([sampleOutcome()]);
  });

  it('publishes AGS scores for the tool connection installed in the course', async () => {
    const dependencies = createDependencies();

    await dependencies.publishLti1p3AgsScore(
      'service.header.payload.signature',
      tenantId,
      courseId,
      assignmentId,
      toolId,
      {
        timestamp: now,
        scoreGiven: 9,
        scoreMaximum: 10,
        activityProgress: 'Completed',
        gradingProgress: 'FullyGraded',
        userId: studentId,
      },
    );

    expect(coreMocks.verifyLti1p3ServiceAccessToken).toHaveBeenCalledWith({
      accessToken: 'service.header.payload.signature',
      expectedTenantId: tenantId,
      requiredScope: lti1p3AgsScoreScope,
      platformKeys: [publicJwk],
    });
    expect(coreMocks.recordCourseExternalToolOutcome).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      assignmentId,
      externalToolId: toolId,
      studentId,
      score: 9,
      maxScore: 10,
      status: 'published',
      reportedAt: now,
    });
  });

  it('lists AGS results for the tool connection installed in the course', async () => {
    coreMocks.verifyLti1p3ServiceAccessToken.mockReturnValue({
      tenantId,
      integrationConnectionId,
      clientId: 'client-123',
      scopes: [lti1p3AgsResultReadonlyScope],
    });
    const dependencies = createDependencies();

    const results = await dependencies.listLti1p3AgsResults(
      'service.header.payload.signature',
      tenantId,
      courseId,
      assignmentId,
      toolId,
      studentId,
    );

    expect(coreMocks.verifyLti1p3ServiceAccessToken).toHaveBeenCalledWith({
      accessToken: 'service.header.payload.signature',
      expectedTenantId: tenantId,
      requiredScope: lti1p3AgsResultReadonlyScope,
      platformKeys: [publicJwk],
    });
    expect(results).toEqual([
      {
        id: `https://lms.example.edu/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/external-tools/${toolId}/lti-ags/lineitem/results/${studentId}`,
        scoreOf: `https://lms.example.edu/api/v1/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/external-tools/${toolId}/lti-ags/lineitem`,
        userId: studentId,
        resultScore: 9,
        resultMaximum: 10,
      },
    ]);
  });

  it('rejects AGS score writes when the service token does not include the score scope', async () => {
    coreMocks.verifyLti1p3ServiceAccessToken.mockImplementation(() => {
      throw new Error('LTI service access token does not include the required scope.');
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.publishLti1p3AgsScore(
        'service.header.payload.signature',
        tenantId,
        courseId,
        assignmentId,
        toolId,
        {
          timestamp: now,
          scoreGiven: 9,
          scoreMaximum: 10,
          activityProgress: 'Completed',
          gradingProgress: 'FullyGraded',
          userId: studentId,
        },
      ),
    ).rejects.toMatchObject({ code: 'unauthorized' });

    expect(coreMocks.recordCourseExternalToolOutcome).not.toHaveBeenCalled();
  });

  it('rejects AGS access when the token connection does not own the course tool', async () => {
    coreMocks.getCourseExternalToolForCourse.mockResolvedValue({
      ...sampleTool(),
      integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE99',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.publishLti1p3AgsScore(
        'service.header.payload.signature',
        tenantId,
        courseId,
        assignmentId,
        toolId,
        {
          timestamp: now,
          scoreGiven: 9,
          scoreMaximum: 10,
          activityProgress: 'Completed',
          gradingProgress: 'FullyGraded',
          userId: studentId,
        },
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.recordCourseExternalToolOutcome).not.toHaveBeenCalled();
  });

  it('rejects AGS score writes for learners who are not active course members', async () => {
    coreMocks.listCourseMemberships.mockResolvedValue([]);
    const dependencies = createDependencies();

    await expect(
      dependencies.publishLti1p3AgsScore(
        'service.header.payload.signature',
        tenantId,
        courseId,
        assignmentId,
        toolId,
        {
          timestamp: now,
          scoreGiven: 9,
          scoreMaximum: 10,
          activityProgress: 'Completed',
          gradingProgress: 'FullyGraded',
          userId: studentId,
        },
      ),
    ).rejects.toMatchObject({ code: 'bad_request' });

    expect(coreMocks.recordCourseExternalToolOutcome).not.toHaveBeenCalled();
  });

  it('does not convert AGS outcome persistence failures into bad requests', async () => {
    const databaseError = new Error('database unavailable');
    coreMocks.recordCourseExternalToolOutcome.mockRejectedValue(databaseError);
    const dependencies = createDependencies();

    await expect(
      dependencies.publishLti1p3AgsScore(
        'service.header.payload.signature',
        tenantId,
        courseId,
        assignmentId,
        toolId,
        {
          timestamp: now,
          scoreGiven: 9,
          scoreMaximum: 10,
          activityProgress: 'Completed',
          gradingProgress: 'FullyGraded',
          userId: studentId,
        },
      ),
    ).rejects.toBe(databaseError);
  });
});
