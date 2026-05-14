import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getAssignmentById: vi.fn(),
  getSubmissionById: vi.fn(),
  listSubmissionPlagiarismReports: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  recordSubmissionPlagiarismReport: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getAssignmentById: coreMocks.getAssignmentById,
    getSubmissionById: coreMocks.getSubmissionById,
    listSubmissionPlagiarismReports: coreMocks.listSubmissionPlagiarismReports,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    recordSubmissionPlagiarismReport: coreMocks.recordSubmissionPlagiarismReport,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const submissionId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const integrationConnectionId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const now = new Date('2026-05-12T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureCourseAccess = (tenantRole: TenantRole, courseRole: CourseRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role: tenantRole }]);
  coreMocks.listUserCourseMemberships.mockResolvedValue(
    courseRole ? [{ tenantId, courseId, role: courseRole }] : [],
  );
};

const sampleSubmission = () => ({ id: submissionId, tenantId, assignmentId });
const sampleAssignment = () => ({ id: assignmentId, tenantId, courseId });
const sampleReport = () => ({
  id: '01J9QW7B6N5W2YH3D3A1V0KE8A',
  tenantId,
  courseId,
  submissionId,
  integrationConnectionId,
  similarityPercent: 12.5,
  reportUrl: 'https://provider.example/report/abc',
  status: 'complete',
  checkedAt: now,
  createdAt: now,
  updatedAt: now,
});

const recordInput = {
  integrationConnectionId,
  similarityPercent: 12.5,
  reportUrl: 'https://provider.example/report/abc',
  status: 'complete' as const,
  checkedAt: now,
};

describe('plagiarism report API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getSubmissionById.mockResolvedValue(sampleSubmission());
    coreMocks.getAssignmentById.mockResolvedValue(sampleAssignment());
    coreMocks.recordSubmissionPlagiarismReport.mockResolvedValue(sampleReport());
    coreMocks.listSubmissionPlagiarismReports.mockResolvedValue([sampleReport()]);
    configureCourseAccess('student', 'student');
  });

  it('records a report for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.recordSubmissionPlagiarismReport(
        actorUserId,
        tenantId,
        submissionId,
        recordInput,
      ),
    ).resolves.toMatchObject({ id: '01J9QW7B6N5W2YH3D3A1V0KE8A', status: 'complete' });

    expect(coreMocks.recordSubmissionPlagiarismReport).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      submissionId,
      ...recordInput,
    });
  });

  it('returns not_found when submission is missing', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.getSubmissionById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.recordSubmissionPlagiarismReport(
        actorUserId,
        tenantId,
        submissionId,
        recordInput,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('rejects students from recording plagiarism reports', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.recordSubmissionPlagiarismReport(
        actorUserId,
        tenantId,
        submissionId,
        recordInput,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.recordSubmissionPlagiarismReport).not.toHaveBeenCalled();
  });

  it('lists reports for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const reports = await dependencies.listSubmissionPlagiarismReports(
      actorUserId,
      tenantId,
      submissionId,
    );

    expect(reports).toHaveLength(1);
    expect(coreMocks.listSubmissionPlagiarismReports).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      submissionId,
    });
  });

  it('rejects students from listing plagiarism reports', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listSubmissionPlagiarismReports(actorUserId, tenantId, submissionId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.listSubmissionPlagiarismReports).not.toHaveBeenCalled();
  });
});
