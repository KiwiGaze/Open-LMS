import {
  AiFeedbackDraft,
  CourseGradingScheme,
  FeedbackDialogue,
  FeedbackDialogueMessage,
  Grade,
  GradebookCategory,
  GradebookEntry,
  GradebookManualGrade,
  GradebookManualItem,
  PublishedFeedback,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  getGradeBySubmissionId,
  getGradebookManualItemForCourse,
  getLatestPublishedFeedbackForSubmission,
  listCourseGradingSchemesForCourse,
  listFeedbackDialogueMessages,
  listGradebookCategoriesForCourse,
  listGradebookEntriesForCourse,
  listGradebookManualGradesForItem,
  listGradebookManualItemsForCourse,
  listGradesForTenant,
  listPendingAiFeedbackDraftsForReview,
  recordGradebookManualGrade,
  saveFeedbackDialogue,
  saveFeedbackDialogueMessage,
  saveGrade,
  savePublishedFeedback,
  transitionAiFeedbackDraftAfterReview,
  updateGrade,
} from '../src/feedback/repository.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const submissionId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE32';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE33';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE34';
const gradebookCategoryId = '01J9QW7B6N5W2YH3D3A1V0KE38';
const gradebookManualItemId = '01J9QW7B6N5W2YH3D3A1V0KE3M';
const gradebookManualGradeId = '01J9QW7B6N5W2YH3D3A1V0KE3N';

const feedbackDraft = AiFeedbackDraft.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  tenantId,
  submissionId,
  contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE31',
  promptIdentifier: 'feedback_draft.default',
  promptVersion: '2026-05-10.1',
  providerType: 'openai_compatible',
  model: 'feedback-model',
  idempotencyKey: 'feedback-draft-review-queue',
  status: 'generated',
  criterionFeedback: [
    {
      criterionId: 'criterion-evidence',
      studentFacingComment: 'Explain how the evidence supports the claim.',
      teacherNote: 'Needs review before students see it.',
      evidence: ['Evidence appears here.'],
      suggestedLevelId: 'developing',
      suggestedScore: null,
    },
  ],
  overallComment: 'Ready for instructor review.',
  createdAt: now,
});

const grade = Grade.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  tenantId,
  submissionId,
  score: 8.5,
  maxScore: 10,
  status: 'published',
  source: 'manual',
  createdAt: now,
  updatedAt: now,
});

const gradebookCategory = GradebookCategory.parse({
  id: gradebookCategoryId,
  tenantId,
  courseId,
  name: 'Essays',
  position: 0,
  weightPercent: 40,
  dropLowest: 1,
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const courseGradingScheme = CourseGradingScheme.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE3D',
  tenantId,
  courseId,
  name: 'Letter grades',
  status: 'active',
  entries: [
    { label: 'A', minPercent: 90 },
    { label: 'B', minPercent: 80 },
    { label: 'C', minPercent: 70 },
    { label: 'D', minPercent: 60 },
    { label: 'F', minPercent: 0 },
  ],
  createdAt: now,
  updatedAt: now,
});

const gradebookManualItem = GradebookManualItem.parse({
  id: gradebookManualItemId,
  tenantId,
  courseId,
  gradebookCategoryId,
  title: 'In-class participation',
  description: 'Participation points recorded outside assignment submissions.',
  maxScore: 10,
  dueAt: null,
  position: 2,
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const gradebookManualGrade = GradebookManualGrade.parse({
  id: gradebookManualGradeId,
  tenantId,
  gradebookManualItemId,
  studentId,
  score: 9,
  maxScore: 10,
  status: 'published',
  source: 'manual',
  gradedAt: now,
  createdAt: now,
  updatedAt: now,
});

const publishedFeedback = PublishedFeedback.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
  tenantId,
  submissionId,
  source: 'ai_assisted',
  humanReviewId: '01J9QW7B6N5W2YH3D3A1V0KE30',
  criterionFeedback: [
    {
      criterionId: 'criterion-evidence',
      studentFacingComment: 'Explain how the evidence supports the claim.',
      teacherNote: null,
      evidence: ['Evidence appears here.'],
      suggestedLevelId: null,
      suggestedScore: null,
    },
  ],
  overallComment: 'Published feedback for the student.',
  linkedGradeId: grade.id,
  version: 2,
  publishedAt: now,
});

const feedbackDialogue = FeedbackDialogue.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE3P',
  tenantId,
  publishedFeedbackId: publishedFeedback.id,
  submissionId,
  status: 'open',
  openedById: studentId,
  createdAt: now,
  updatedAt: now,
});

const feedbackDialogueMessage = FeedbackDialogueMessage.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE3Q',
  tenantId,
  dialogueId: feedbackDialogue.id,
  authorRole: 'student',
  authorId: studentId,
  criterionId: 'criterion-evidence',
  body: 'What does unclear evidence mean here?',
  contextPackageId: null,
  aiGenerationLogId: null,
  createdAt: now,
});

const createInsertOnlyDb = <T>(rows: T[]): Database =>
  ({
    insert: () => ({
      values: (value: T) => ({
        returning: async () => {
          rows.push(value);
          return [value];
        },
      }),
    }),
  }) as unknown as Database;

const createSelectOnlyDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

type GradebookRow = {
  gradeId: string;
  tenantId: string;
  courseId: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentDueAt: Date | null;
  gradebookCategoryId: string | null;
  gradebookCategoryName: string | null;
  studentId: string;
  submissionId: string;
  submittedAt: Date;
  score: number;
  maxScore: number;
  gradeStatus: Grade['status'];
  gradeSource: Grade['source'];
  gradedAt: Date;
};

const gradebookRow: GradebookRow = {
  gradeId: grade.id,
  tenantId,
  courseId,
  assignmentId,
  assignmentTitle: 'Evidence essay',
  assignmentDueAt: now,
  gradebookCategoryId,
  gradebookCategoryName: 'Essays',
  studentId,
  submissionId,
  submittedAt: now,
  score: grade.score,
  maxScore: grade.maxScore,
  gradeStatus: grade.status,
  gradeSource: grade.source,
  gradedAt: grade.updatedAt,
};

const createGradebookDb = (rows: GradebookRow[]): Database =>
  ({
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          innerJoin: () => ({
            leftJoin: () => ({
              leftJoin: () => ({
                where: () => ({
                  orderBy: async () =>
                    rows
                      .filter((row) => row.tenantId === tenantId)
                      .filter((row) => row.courseId === courseId)
                      .filter((row) => row.gradeStatus === 'published')
                      .filter((row) => row.studentId === studentId),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  }) as unknown as Database;

const createGradebookCategoryListDb = (rows: GradebookCategory[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.status === 'active' || row.status === 'archived')
              .sort(
                (left, right) =>
                  left.position - right.position || left.name.localeCompare(right.name),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const extractDrizzleStringValues = (value: unknown, seen = new Set<object>()): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractDrizzleStringValues(item, seen));
  }

  return Object.values(value as Record<string, unknown>).flatMap((item) =>
    extractDrizzleStringValues(item, seen),
  );
};

const getObjectProperty = (value: unknown, property: string): unknown => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return (value as Record<string, unknown>)[property];
};

const createCourseGradingSchemeListDb = (rows: CourseGradingScheme[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => ({
          orderBy: async (...orderExpressions: unknown[]) => {
            const stringValues = extractDrizzleStringValues(condition);
            const requestedStatuses = ['active', 'archived'].filter((status) =>
              stringValues.includes(status),
            );

            if (orderExpressions.length !== 2) {
              throw new Error('Course grading schemes must be ordered by name and id.');
            }

            return rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => requestedStatuses.includes(row.status))
              .sort(
                (left, right) =>
                  left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
              );
          },
        }),
      }),
    }),
  }) as unknown as Database;

const createGradebookManualItemListDb = (rows: GradebookManualItem[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => ({
          orderBy: async (...orderExpressions: unknown[]) => {
            const stringValues = extractDrizzleStringValues(condition);
            const requestedStatuses = ['active', 'archived'].filter((status) =>
              stringValues.includes(status),
            );

            if (orderExpressions.length !== 3) {
              throw new Error('Manual gradebook items must be ordered by position, title, and id.');
            }

            return rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => requestedStatuses.includes(row.status))
              .sort(
                (left, right) =>
                  left.position - right.position ||
                  left.title.localeCompare(right.title) ||
                  left.id.localeCompare(right.id),
              );
          },
          limit: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.id === gradebookManualItemId)
              .slice(0, 1),
        }),
      }),
    }),
  }) as unknown as Database;

const createGradebookManualGradeListDb = (rows: GradebookManualGrade[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => ({
          orderBy: async (...orderExpressions: unknown[]) => {
            const stringValues = extractDrizzleStringValues(condition);
            const requestedStatuses = [
              'draft',
              'published',
              'locked',
              'appealed',
              'revised',
            ].filter((status) => stringValues.includes(status));
            const requestsSignedInStudent = stringValues.includes(studentId);

            if (orderExpressions.length !== 2) {
              throw new Error(
                'Manual gradebook grades must be ordered by student and graded date.',
              );
            }

            return rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.gradebookManualItemId === gradebookManualItemId)
              .filter((row) => requestedStatuses.includes(row.status))
              .filter((row) => !requestsSignedInStudent || row.studentId === studentId)
              .sort(
                (left, right) =>
                  left.studentId.localeCompare(right.studentId) ||
                  left.gradedAt.getTime() - right.gradedAt.getTime(),
              );
          },
        }),
      }),
    }),
  }) as unknown as Database;

const createGradebookManualGradeUpsertDb = (
  rows: GradebookManualGrade[],
  capture: { executionSql: string[]; options: unknown },
  queryResult: { itemMaxScore?: number | null; hasStudent?: boolean } = {},
): Database =>
  ({
    transaction: async (callback: (tx: Database) => Promise<GradebookManualGrade>) => {
      let executionIndex = 0;
      const tx = {
        execute: async (query: unknown) => {
          executionIndex += 1;
          capture.executionSql.push(extractDrizzleStringValues(query).join(' '));

          if (executionIndex === 1) {
            return queryResult.itemMaxScore === null
              ? []
              : [{ max_score: queryResult.itemMaxScore ?? 10 }];
          }

          return queryResult.hasStudent === false ? [] : [{ id: 'course-membership' }];
        },
        insert: () => ({
          values: (value: GradebookManualGrade) => ({
            onConflictDoUpdate: (options: unknown) => {
              capture.options = options;
              return {
                returning: async () => {
                  const existingIndex = rows.findIndex(
                    (row) =>
                      row.tenantId === value.tenantId &&
                      row.gradebookManualItemId === value.gradebookManualItemId &&
                      row.studentId === value.studentId,
                  );

                  if (existingIndex === -1) {
                    rows.push(value);
                    return [value];
                  }

                  const updated = GradebookManualGrade.parse({
                    ...rows[existingIndex],
                    ...(options as { set: Partial<GradebookManualGrade> }).set,
                  });
                  rows[existingIndex] = updated;
                  return [updated];
                },
              };
            },
          }),
        }),
      } as unknown as Database;

      return callback(tx);
    },
  }) as unknown as Database;

const createOrderedLimitSelectDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async () => rows,
          }),
        }),
      }),
    }),
  }) as unknown as Database;

const createReferenceCheckingDb = <T>(referencedRows: unknown[], insertedRows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => referencedRows,
        }),
      }),
    }),
    insert: () => ({
      values: (value: T) => ({
        returning: async () => {
          insertedRows.push(value);
          return [value];
        },
      }),
    }),
  }) as unknown as Database;

const createQueuedReferenceCheckingDb = <T>(
  referencedRows: unknown[][],
  insertedRows: T[],
): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => referencedRows.shift() ?? [],
        }),
      }),
    }),
    insert: () => ({
      values: (value: T) => ({
        returning: async () => {
          insertedRows.push(value);
          return [value];
        },
      }),
    }),
  }) as unknown as Database;

const createTransitionDb = <T>(rows: T[]): Database =>
  ({
    update: () => ({
      set: (patch: Partial<T>) => ({
        where: () => ({
          returning: async () => {
            const [row] = rows;
            if (!row) {
              return [];
            }

            const updated = { ...row, ...patch };
            rows[0] = updated as T;
            return [updated];
          },
        }),
      }),
    }),
  }) as unknown as Database;

describe('review queue and gradebook repositories', () => {
  it('lists generated AI feedback drafts for instructor review', async () => {
    const queue = await listPendingAiFeedbackDraftsForReview(
      createSelectOnlyDb([feedbackDraft]),
      tenantId,
    );

    expect(queue).toEqual([feedbackDraft]);
  });

  it('marks AI feedback drafts reviewed or rejected after human decisions', async () => {
    const acceptedRows = [feedbackDraft];
    const rejectedRows = [feedbackDraft];

    await expect(
      transitionAiFeedbackDraftAfterReview(createTransitionDb(acceptedRows), {
        tenantId,
        aiFeedbackDraftId: feedbackDraft.id,
        decision: 'edit',
      }),
    ).resolves.toEqual({ ...feedbackDraft, status: 'reviewed' });
    await expect(
      transitionAiFeedbackDraftAfterReview(createTransitionDb(rejectedRows), {
        tenantId,
        aiFeedbackDraftId: feedbackDraft.id,
        decision: 'reject',
      }),
    ).resolves.toEqual({ ...feedbackDraft, status: 'rejected' });
  });

  it('stores and reads official grades by tenant-scoped submission', async () => {
    const rows: Grade[] = [];
    const saved = await saveGrade(createInsertOnlyDb(rows), grade);
    const found = await getGradeBySubmissionId(createSelectOnlyDb([grade]), tenantId, submissionId);

    expect(saved).toEqual(grade);
    expect(found).toEqual(grade);
  });

  it('lists grades for a tenant gradebook view', async () => {
    const grades = await listGradesForTenant(createSelectOnlyDb([grade]), tenantId);

    expect(grades).toEqual([grade]);
  });

  it('lists course gradebook entries with assignment and submission context', async () => {
    const uncategorizedRow = {
      ...gradebookRow,
      gradeId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE36',
      assignmentTitle: 'Reading response',
      gradebookCategoryId: null,
      gradebookCategoryName: null,
    };

    await expect(
      listGradebookEntriesForCourse(
        createGradebookDb([
          gradebookRow,
          uncategorizedRow,
          { ...gradebookRow, gradeId: '01J9QW7B6N5W2YH3D3A1V0KE37', gradeStatus: 'draft' },
          {
            ...gradebookRow,
            gradeId: '01J9QW7B6N5W2YH3D3A1V0KE3H',
            studentId: '01J9QW7B6N5W2YH3D3A1V0KE3J',
          },
        ]),
        {
          tenantId,
          courseId,
          studentId,
          statuses: ['published'],
        },
      ),
    ).resolves.toEqual([
      GradebookEntry.parse({
        id: `gradebook_entry:${grade.id}`,
        tenantId,
        courseId,
        assignmentId,
        assignmentTitle: 'Evidence essay',
        assignmentDueAt: now,
        gradebookCategoryId,
        gradebookCategoryName: 'Essays',
        studentId,
        submissionId,
        submittedAt: now,
        gradeId: grade.id,
        score: grade.score,
        maxScore: grade.maxScore,
        gradeStatus: grade.status,
        gradeSource: grade.source,
        gradedAt: grade.updatedAt,
      }),
      GradebookEntry.parse({
        id: `gradebook_entry:${uncategorizedRow.gradeId}`,
        tenantId,
        courseId,
        assignmentId: uncategorizedRow.assignmentId,
        assignmentTitle: 'Reading response',
        assignmentDueAt: now,
        gradebookCategoryId: null,
        gradebookCategoryName: null,
        studentId,
        submissionId,
        submittedAt: now,
        gradeId: uncategorizedRow.gradeId,
        score: grade.score,
        maxScore: grade.maxScore,
        gradeStatus: grade.status,
        gradeSource: grade.source,
        gradedAt: grade.updatedAt,
      }),
    ]);
  });

  it('lists requested gradebook categories in course order', async () => {
    const laterCategory = GradebookCategory.parse({
      ...gradebookCategory,
      id: '01J9QW7B6N5W2YH3D3A1V0KE39',
      name: 'Quizzes',
      position: 1,
      weightPercent: 20,
      dropLowest: 0,
    });
    const archivedCategory = GradebookCategory.parse({
      ...gradebookCategory,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3A',
      name: 'Archived exams',
      status: 'archived',
    });
    const otherCourseCategory = GradebookCategory.parse({
      ...gradebookCategory,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3B',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE3C',
    });

    await expect(
      listGradebookCategoriesForCourse(
        createGradebookCategoryListDb([
          laterCategory,
          archivedCategory,
          otherCourseCategory,
          gradebookCategory,
        ]),
        { tenantId, courseId, statuses: ['active', 'archived'] },
      ),
    ).resolves.toEqual([archivedCategory, gradebookCategory, laterCategory]);
  });

  it('lists requested course grading schemes by name and id', async () => {
    const earlierMatchingNameScheme = CourseGradingScheme.parse({
      ...courseGradingScheme,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3C',
    });
    const archivedScheme = CourseGradingScheme.parse({
      ...courseGradingScheme,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3E',
      name: 'Archived letters',
      status: 'archived',
    });
    const otherCourseScheme = CourseGradingScheme.parse({
      ...courseGradingScheme,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3F',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE3G',
    });

    await expect(
      listCourseGradingSchemesForCourse(
        createCourseGradingSchemeListDb([
          courseGradingScheme,
          otherCourseScheme,
          archivedScheme,
          earlierMatchingNameScheme,
        ]),
        { tenantId, courseId, statuses: ['active', 'archived'] },
      ),
    ).resolves.toEqual([archivedScheme, earlierMatchingNameScheme, courseGradingScheme]);
  });

  it('lists requested manual gradebook items in course order', async () => {
    const earlierItem = GradebookManualItem.parse({
      ...gradebookManualItem,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3P',
      title: 'Midterm paper presentation',
      position: 1,
    });
    const archivedItem = GradebookManualItem.parse({
      ...gradebookManualItem,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3Q',
      title: 'Archived lab notebook',
      position: 0,
      status: 'archived',
    });
    const otherCourseItem = GradebookManualItem.parse({
      ...gradebookManualItem,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3R',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE3S',
    });

    await expect(
      listGradebookManualItemsForCourse(
        createGradebookManualItemListDb([
          gradebookManualItem,
          otherCourseItem,
          archivedItem,
          earlierItem,
        ]),
        { tenantId, courseId, statuses: ['active', 'archived'] },
      ),
    ).resolves.toEqual([archivedItem, earlierItem, gradebookManualItem]);
  });

  it('reads a manual gradebook item by tenant-scoped course', async () => {
    await expect(
      getGradebookManualItemForCourse(
        createGradebookManualItemListDb([gradebookManualItem]),
        tenantId,
        courseId,
        gradebookManualItemId,
      ),
    ).resolves.toEqual(gradebookManualItem);
  });

  it('lists manual gradebook grades for a course item and optional student', async () => {
    const hiddenGrade = GradebookManualGrade.parse({
      ...gradebookManualGrade,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3T',
      status: 'draft',
    });
    const otherStudentGrade = GradebookManualGrade.parse({
      ...gradebookManualGrade,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3V',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE3W',
    });

    await expect(
      listGradebookManualGradesForItem(
        createGradebookManualGradeListDb([hiddenGrade, otherStudentGrade, gradebookManualGrade]),
        {
          tenantId,
          gradebookManualItemId,
          studentId,
          statuses: ['published'],
        },
      ),
    ).resolves.toEqual([gradebookManualGrade]);
  });

  it('records manual gradebook grades through the item-student identity', async () => {
    const rows: GradebookManualGrade[] = [];
    const capture = { executionSql: [] as string[], options: null as unknown };

    await expect(
      recordGradebookManualGrade(
        createGradebookManualGradeUpsertDb(rows, capture),
        {
          tenantId,
          courseId,
          gradebookManualItemId,
          studentId,
          score: 8,
          status: 'published',
        },
        now,
      ),
    ).resolves.toMatchObject({
      tenantId,
      gradebookManualItemId,
      studentId,
      score: 8,
      maxScore: 10,
      status: 'published',
      source: 'manual',
      gradedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    expect(rows).toHaveLength(1);
    expect(capture.executionSql).toHaveLength(2);
    expect(capture.executionSql.every((query) => query.includes('FOR UPDATE'))).toBe(true);
    const target = getObjectProperty(capture.options, 'target');
    const set = getObjectProperty(capture.options, 'set');
    expect(Array.isArray(target)).toBe(true);
    expect((target as { name?: string }[]).map((column) => column.name)).toEqual([
      'tenant_id',
      'gradebook_manual_item_id',
      'student_id',
    ]);
    expect(set).toMatchObject({
      score: 8,
      maxScore: 10,
      status: 'published',
      source: 'manual',
      gradedAt: now,
      updatedAt: now,
    });
  });

  it('updates existing manual gradebook grades on conflict', async () => {
    const existingGrade = GradebookManualGrade.parse({
      ...gradebookManualGrade,
      score: 4,
      status: 'draft',
      gradedAt: new Date('2026-05-09T00:00:00.000Z'),
      updatedAt: new Date('2026-05-09T00:00:00.000Z'),
    });
    const rows = [existingGrade];
    const capture = { executionSql: [] as string[], options: null as unknown };

    await expect(
      recordGradebookManualGrade(
        createGradebookManualGradeUpsertDb(rows, capture, { itemMaxScore: 12 }),
        {
          tenantId,
          courseId,
          gradebookManualItemId,
          studentId,
          score: 11,
          status: 'published',
        },
        now,
      ),
    ).resolves.toMatchObject({
      id: existingGrade.id,
      score: 11,
      maxScore: 12,
      status: 'published',
      source: 'manual',
      gradedAt: now,
      updatedAt: now,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: existingGrade.id,
      score: 11,
      maxScore: 12,
      status: 'published',
      source: 'manual',
      gradedAt: now,
      updatedAt: now,
    });
  });

  it('rejects manual grade records when the active item or course student is unavailable', async () => {
    await expect(
      recordGradebookManualGrade(
        createGradebookManualGradeUpsertDb(
          [],
          { executionSql: [], options: null },
          {
            itemMaxScore: null,
          },
        ),
        {
          tenantId,
          courseId,
          gradebookManualItemId,
          studentId,
          score: 8,
          status: 'published',
        },
        now,
      ),
    ).rejects.toThrow('Manual gradebook item is not active in this course.');

    await expect(
      recordGradebookManualGrade(
        createGradebookManualGradeUpsertDb(
          [],
          { executionSql: [], options: null },
          {
            hasStudent: false,
          },
        ),
        {
          tenantId,
          courseId,
          gradebookManualItemId,
          studentId,
          score: 8,
          status: 'published',
        },
        now,
      ),
    ).rejects.toThrow('Student is not enrolled in this course.');
  });

  it('rejects manual grade records above the current item max score', async () => {
    await expect(
      recordGradebookManualGrade(
        createGradebookManualGradeUpsertDb(
          [],
          { executionSql: [], options: null },
          {
            itemMaxScore: 6,
          },
        ),
        {
          tenantId,
          courseId,
          gradebookManualItemId,
          studentId,
          score: 8,
          status: 'published',
        },
        now,
      ),
    ).rejects.toThrow('Manual gradebook grade score cannot exceed the item max score.');
  });

  it('filters course grading schemes by requested status', async () => {
    const archivedScheme = CourseGradingScheme.parse({
      ...courseGradingScheme,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3E',
      name: 'Archived letters',
      status: 'archived',
    });

    await expect(
      listCourseGradingSchemesForCourse(
        createCourseGradingSchemeListDb([archivedScheme, courseGradingScheme]),
        { tenantId, courseId, statuses: ['active'] },
      ),
    ).resolves.toEqual([courseGradingScheme]);
  });

  it('updates grade score and publication status by tenant and grade id', async () => {
    const rows = [grade];
    const updatedAt = new Date('2026-05-10T01:00:00.000Z');

    const updated = await updateGrade(createTransitionDb(rows), {
      tenantId,
      gradeId: grade.id,
      score: 9,
      maxScore: 10,
      status: 'published',
      updatedAt,
    });

    expect(updated).toEqual({ ...grade, score: 9, status: 'published', updatedAt });
  });

  it('reads the latest published feedback by tenant-scoped submission for student view', async () => {
    const found = await getLatestPublishedFeedbackForSubmission(
      createOrderedLimitSelectDb([publishedFeedback]),
      tenantId,
      submissionId,
    );

    expect(found).toEqual(publishedFeedback);
    expect(found?.criterionFeedback[0]?.teacherNote).toBeNull();
  });

  it('stores feedback dialogues and criterion-scoped messages', async () => {
    const dialogues: FeedbackDialogue[] = [];
    const messages: FeedbackDialogueMessage[] = [];

    await expect(
      saveFeedbackDialogue(createInsertOnlyDb(dialogues), feedbackDialogue),
    ).resolves.toEqual(feedbackDialogue);
    await expect(
      saveFeedbackDialogueMessage(createInsertOnlyDb(messages), feedbackDialogueMessage),
    ).resolves.toEqual(feedbackDialogueMessage);

    expect(dialogues).toEqual([feedbackDialogue]);
    expect(messages[0]?.criterionId).toBe('criterion-evidence');
  });

  it('lists feedback dialogue messages in creation order', async () => {
    await expect(
      listFeedbackDialogueMessages(createSelectOnlyDb([feedbackDialogueMessage]), {
        tenantId,
        dialogueId: feedbackDialogue.id,
      }),
    ).resolves.toEqual([feedbackDialogueMessage]);
  });

  it('rejects published feedback when tenant-scoped submission references are missing', async () => {
    const insertedRows: PublishedFeedback[] = [];

    await expect(
      savePublishedFeedback(createReferenceCheckingDb([], insertedRows), publishedFeedback),
    ).rejects.toThrow(/submission/i);

    expect(insertedRows).toHaveLength(0);
  });

  it('rejects published feedback linked to a grade for another submission', async () => {
    const insertedRows: PublishedFeedback[] = [];
    const otherSubmissionId = '01J9QW7B6N5W2YH3D3A1V0KE32';
    const feedbackWithOtherSubmissionGrade = PublishedFeedback.parse({
      ...publishedFeedback,
      humanReviewId: null,
      linkedGradeId: grade.id,
    });

    await expect(
      savePublishedFeedback(
        createQueuedReferenceCheckingDb(
          [[{ id: submissionId }], [{ id: grade.id, submissionId: otherSubmissionId }]],
          insertedRows,
        ),
        feedbackWithOtherSubmissionGrade,
      ),
    ).rejects.toThrow(/same submission/i);

    expect(insertedRows).toHaveLength(0);
  });

  it('rejects published feedback linked to a human review for another submission', async () => {
    const insertedRows: PublishedFeedback[] = [];
    const otherSubmissionId = '01J9QW7B6N5W2YH3D3A1V0KE32';
    const otherDraftId = '01J9QW7B6N5W2YH3D3A1V0KE33';
    const feedbackWithOtherSubmissionReview = PublishedFeedback.parse({
      ...publishedFeedback,
      linkedGradeId: null,
    });

    await expect(
      savePublishedFeedback(
        createQueuedReferenceCheckingDb(
          [
            [{ id: submissionId }],
            [{ id: publishedFeedback.humanReviewId, aiFeedbackDraftId: otherDraftId }],
            [{ id: otherDraftId, submissionId: otherSubmissionId }],
          ],
          insertedRows,
        ),
        feedbackWithOtherSubmissionReview,
      ),
    ).rejects.toThrow(/same submission/i);

    expect(insertedRows).toHaveLength(0);
  });
});
