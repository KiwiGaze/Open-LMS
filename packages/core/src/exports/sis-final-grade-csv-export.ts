import {
  CourseFinalGrade,
  type CourseFinalGrade as CourseFinalGradeContract,
} from '@openlms/contracts';

const csvHeaders = [
  'tenant_id',
  'course_id',
  'student_id',
  'score',
  'max_score',
  'percent',
  'letter_grade',
  'computed_at',
];

const toCsvValue = (value: string | number | null): string => {
  if (value === null) {
    return '';
  }

  const text = String(value);
  if (!/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
};

const toExportValues = (grade: CourseFinalGradeContract): (string | number | null)[] => [
  grade.tenantId,
  grade.courseId,
  grade.studentId,
  grade.score,
  grade.maxScore,
  grade.percent,
  grade.letterGrade,
  grade.computedAt.toISOString(),
];

export const serializeSisFinalGradesAsCsv = (grades: CourseFinalGradeContract[]): string => {
  const body = grades
    .map((grade) => CourseFinalGrade.parse(grade))
    .map((grade) => toExportValues(grade).map(toCsvValue).join(','));

  return [csvHeaders.join(','), ...body].join('\n');
};
