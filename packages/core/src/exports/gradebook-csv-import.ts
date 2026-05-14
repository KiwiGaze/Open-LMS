import {
  GradeStatus,
  type GradeStatus as GradeStatusContract,
  SubmissionId,
  type SubmissionId as SubmissionIdContract,
} from '@openlms/contracts';

export type SubmissionGradeCsvImportRow = {
  rowNumber: number;
  submissionId: SubmissionIdContract;
  score: number;
  maxScore: number;
  status: GradeStatusContract;
};

const requiredHeaders = ['submission_id', 'score', 'max_score', 'status'];

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

const parseRequiredNumber = (value: string | undefined, fieldName: string, rowNumber: number) => {
  const parsed = Number(value);
  if (value === undefined || value.trim().length === 0 || !Number.isFinite(parsed)) {
    throw new Error(`Submission grade CSV row ${rowNumber} has an invalid ${fieldName}.`);
  }

  return parsed;
};

const parseSubmissionId = (value: string | undefined, rowNumber: number): SubmissionIdContract => {
  const result = SubmissionId.safeParse(value);
  if (!result.success) {
    throw new Error(`Submission grade CSV row ${rowNumber} has an invalid submission_id.`);
  }

  return result.data;
};

const parseStatus = (value: string | undefined, rowNumber: number): GradeStatusContract => {
  const result = GradeStatus.safeParse(value);
  if (!result.success) {
    throw new Error(`Submission grade CSV row ${rowNumber} has an invalid status.`);
  }

  return result.data;
};

export const parseSubmissionGradeImportCsv = (csv: string): SubmissionGradeCsvImportRow[] => {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const [headerLine, ...bodyLines] = lines;
  if (!headerLine) {
    return [];
  }

  const headers = parseCsvLine(headerLine).map((header) => header.trim());
  const headerIndexes = new Map(headers.map((header, index) => [header, index]));
  const missingRequiredHeader = requiredHeaders.some((header) => !headerIndexes.has(header));

  if (missingRequiredHeader) {
    throw new Error(
      'Submission grade CSV must include submission_id, score, max_score, and status headers.',
    );
  }

  const submissionIdIndex = headerIndexes.get('submission_id') ?? -1;
  const scoreIndex = headerIndexes.get('score') ?? -1;
  const maxScoreIndex = headerIndexes.get('max_score') ?? -1;
  const statusIndex = headerIndexes.get('status') ?? -1;

  return bodyLines.map((line, index) => {
    const rowNumber = index + 2;
    const values = parseCsvLine(line).map((value) => value.trim());
    const score = parseRequiredNumber(values[scoreIndex], 'score', rowNumber);
    const maxScore = parseRequiredNumber(values[maxScoreIndex], 'max_score', rowNumber);

    if (score < 0) {
      throw new Error(`Submission grade CSV row ${rowNumber} has a negative score.`);
    }

    if (maxScore <= 0) {
      throw new Error(`Submission grade CSV row ${rowNumber} has a non-positive max_score.`);
    }

    if (score > maxScore) {
      throw new Error(`Submission grade CSV row ${rowNumber} has score greater than max_score.`);
    }

    return {
      rowNumber,
      submissionId: parseSubmissionId(values[submissionIdIndex], rowNumber),
      score,
      maxScore,
      status: parseStatus(values[statusIndex], rowNumber),
    };
  });
};
