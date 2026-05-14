'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { SubmissionPlagiarismReport } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';

export function useSubmissionPlagiarismReportsQuery(
  tenantId: string | null,
  submissionId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && submissionId
        ? queryKeys.submissionPlagiarismReports(tenantId, submissionId)
        : ['plagiarism-reports', 'inactive'],
    queryFn: () =>
      apiFetch<SubmissionPlagiarismReport[]>(
        `/tenants/${tenantId}/submissions/${submissionId}/plagiarism-reports`,
      ),
    enabled: Boolean(tenantId && submissionId),
  });
}

// Returns the most recent plagiarism report for a submission, preferring
// reports with `complete` status. The schema types `checkedAt` as `Date`; the
// JSON response carries an ISO string. Coerce both to numeric timestamps
// before comparing — `Date.toString()` is locale-formatted and does not sort
// chronologically. Returns `null` when no reports exist.
const toTimestamp = (value: Date | string): number =>
  value instanceof Date ? value.getTime() : Date.parse(value);

export function pickLatestPlagiarismReport(
  reports: SubmissionPlagiarismReport[] | undefined,
): SubmissionPlagiarismReport | null {
  if (!reports || reports.length === 0) return null;
  const complete = reports.filter((report) => report.status === 'complete');
  const candidates = complete.length > 0 ? complete : reports;
  return (
    candidates.slice().sort((a, b) => toTimestamp(b.checkedAt) - toTimestamp(a.checkedAt))[0] ??
    null
  );
}
