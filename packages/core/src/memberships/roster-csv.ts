import {
  CourseMembership,
  type CourseMembership as CourseMembershipContract,
  CourseMembershipStatus,
  type CourseMembershipStatus as CourseMembershipStatusContract,
  CourseRole,
  type CourseRole as CourseRoleContract,
  UserId,
} from '@openlms/contracts';

export type RosterCsvImportRow = {
  rowNumber: number;
  userId: string;
  role: CourseRoleContract;
  status: CourseMembershipStatusContract;
};

const rosterExportHeaders = [
  'membership_id',
  'user_id',
  'role',
  'status',
  'invited_at',
  'accepted_at',
  'dropped_at',
  'withdrawn_at',
  'created_at',
  'updated_at',
];

const toCsvValue = (value: string | null): string => {
  if (value === null) {
    return '';
  }

  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === ',' && !quoted) {
      values.push(current);
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
};

export const parseRosterCsv = (csv: string): RosterCsvImportRow[] => {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const [headerLine, ...bodyLines] = lines;
  if (!headerLine) {
    return [];
  }

  const headers = parseCsvLine(headerLine);
  const userIdIndex = headers.indexOf('user_id');
  const roleIndex = headers.indexOf('role');
  const statusIndex = headers.indexOf('status');

  if (userIdIndex < 0 || roleIndex < 0) {
    throw new Error('Roster CSV must include user_id and role headers.');
  }

  return bodyLines.map((line, index) => {
    const values = parseCsvLine(line);
    return {
      rowNumber: index + 2,
      userId: UserId.parse(values[userIdIndex]),
      role: CourseRole.parse(values[roleIndex]),
      status: CourseMembershipStatus.parse(
        statusIndex >= 0 && values[statusIndex] ? values[statusIndex] : 'active',
      ),
    };
  });
};

const toExportValues = (membership: CourseMembershipContract): string[] => [
  membership.id,
  membership.userId,
  membership.role,
  membership.status,
  membership.invitedAt?.toISOString() ?? '',
  membership.acceptedAt?.toISOString() ?? '',
  membership.droppedAt?.toISOString() ?? '',
  membership.withdrawnAt?.toISOString() ?? '',
  membership.createdAt.toISOString(),
  membership.updatedAt.toISOString(),
];

export const serializeCourseRosterCsv = (memberships: CourseMembershipContract[]): string => {
  const body = memberships
    .map((membership) => CourseMembership.parse(membership))
    .map((membership) => toExportValues(membership).map(toCsvValue).join(','));

  return [rosterExportHeaders.join(','), ...body].join('\n');
};
