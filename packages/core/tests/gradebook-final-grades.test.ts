import {
  AssignmentId,
  CourseGradingScheme,
  GradeId,
  GradebookCategory,
  GradebookEntry,
  GradebookManualGrade,
  GradebookManualItem,
  SubmissionId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { calculateCourseFinalGrades } from '../src/gradebook/calculation.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE32';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE33';
const now = new Date('2026-05-13T00:00:00.000Z');

const homeworkCategory = GradebookCategory.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE34',
  tenantId,
  courseId,
  name: 'Homework',
  position: 0,
  weightPercent: 40,
  dropLowest: 1,
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const examCategory = GradebookCategory.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE35',
  tenantId,
  courseId,
  name: 'Exams',
  position: 1,
  weightPercent: 60,
  dropLowest: 0,
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const entry = (overrides: Partial<GradebookEntry>): GradebookEntry =>
  GradebookEntry.parse({
    id: `gradebook_entry:${overrides.gradeId ?? '01J9QW7B6N5W2YH3D3A1V0KE40'}`,
    tenantId,
    courseId,
    assignmentId: overrides.assignmentId ?? '01J9QW7B6N5W2YH3D3A1V0KE36',
    assignmentTitle: overrides.assignmentTitle ?? 'Assignment',
    assignmentDueAt: null,
    assignmentExtraCredit: overrides.assignmentExtraCredit ?? false,
    gradebookCategoryId: Object.hasOwn(overrides, 'gradebookCategoryId')
      ? overrides.gradebookCategoryId
      : homeworkCategory.id,
    gradebookCategoryName: Object.hasOwn(overrides, 'gradebookCategoryName')
      ? overrides.gradebookCategoryName
      : homeworkCategory.name,
    studentId,
    submissionId: overrides.submissionId ?? '01J9QW7B6N5W2YH3D3A1V0KE37',
    submittedAt: now,
    gradeId: overrides.gradeId ?? '01J9QW7B6N5W2YH3D3A1V0KE40',
    score: overrides.score ?? 8,
    maxScore: overrides.maxScore ?? 10,
    gradeStatus: overrides.gradeStatus ?? 'published',
    gradeSource: overrides.gradeSource ?? 'manual',
    gradedAt: now,
  });

const participationItem = GradebookManualItem.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE41',
  tenantId,
  courseId,
  gradebookCategoryId: examCategory.id,
  title: 'Participation boost',
  description: null,
  maxScore: 5,
  dueAt: null,
  position: 0,
  status: 'active',
  extraCredit: true,
  createdAt: now,
  updatedAt: now,
});

const participationGrade = GradebookManualGrade.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE42',
  tenantId,
  gradebookManualItemId: participationItem.id,
  studentId,
  score: 5,
  maxScore: 5,
  status: 'published',
  source: 'manual',
  gradedAt: now,
  createdAt: now,
  updatedAt: now,
});

const scheme = CourseGradingScheme.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE43',
  tenantId,
  courseId,
  name: 'Letters',
  status: 'active',
  entries: [
    { label: 'A', minPercent: 90 },
    { label: 'B', minPercent: 80 },
    { label: 'C', minPercent: 70 },
    { label: 'F', minPercent: 0 },
  ],
  createdAt: now,
  updatedAt: now,
});

describe('calculateCourseFinalGrades', () => {
  it('rolls up weighted categories, drops the lowest non-extra-credit item, and applies a letter scheme', () => {
    const grades = calculateCourseFinalGrades({
      tenantId,
      courseId,
      categories: [homeworkCategory, examCategory],
      assignmentEntries: [
        entry({ gradeId: GradeId.parse('01J9QW7B6N5W2YH3D3A1V0KE44'), score: 6 }),
        entry({
          assignmentId: AssignmentId.parse('01J9QW7B6N5W2YH3D3A1V0KE45'),
          submissionId: SubmissionId.parse('01J9QW7B6N5W2YH3D3A1V0KE46'),
          gradeId: GradeId.parse('01J9QW7B6N5W2YH3D3A1V0KE47'),
          score: 10,
        }),
        entry({
          assignmentId: AssignmentId.parse('01J9QW7B6N5W2YH3D3A1V0KE48'),
          submissionId: SubmissionId.parse('01J9QW7B6N5W2YH3D3A1V0KE49'),
          gradeId: GradeId.parse('01J9QW7B6N5W2YH3D3A1V0KE4A'),
          gradebookCategoryId: examCategory.id,
          gradebookCategoryName: examCategory.name,
          score: 85,
          maxScore: 100,
        }),
      ],
      manualItems: [participationItem],
      manualGrades: [participationGrade],
      gradingScheme: scheme,
      computedAt: now,
    });

    expect(grades).toHaveLength(1);
    expect(grades[0]?.percent).toBeCloseTo(94, 10);
    expect(grades[0]?.letterGrade).toBe('A');
    expect(grades[0]?.categoryRollups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId: homeworkCategory.id,
          percent: 100,
          droppedItemIds: ['assignment:01J9QW7B6N5W2YH3D3A1V0KE36:01J9QW7B6N5W2YH3D3A1V0KE37'],
        }),
        expect.objectContaining({
          categoryId: examCategory.id,
          score: 90,
          maxScore: 100,
          percent: 90,
        }),
      ]),
    );
  });

  it('includes incomplete visible grades in final-grade rollups', () => {
    const grades = calculateCourseFinalGrades({
      tenantId,
      courseId,
      categories: [],
      assignmentEntries: [
        entry({
          gradebookCategoryId: null,
          gradebookCategoryName: null,
          score: 0,
          maxScore: 10,
          gradeStatus: 'incomplete',
        }),
      ],
      manualItems: [
        {
          ...participationItem,
          gradebookCategoryId: null,
          extraCredit: false,
        },
      ],
      manualGrades: [{ ...participationGrade, status: 'incomplete' }],
      gradingScheme: scheme,
      computedAt: now,
    });

    expect(grades).toHaveLength(1);
    expect(grades[0]?.score).toBe(5);
    expect(grades[0]?.maxScore).toBe(15);
  });
});
