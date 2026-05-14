import {
  CourseFinalGrade,
  type CourseFinalGrade as CourseFinalGradeContract,
  type CourseGradingScheme,
  type CourseGradingSchemeEntry,
  type GradeStatus,
  type GradebookCategory,
  type GradebookCategoryId,
  type GradebookEntry,
  type GradebookManualGrade,
  type GradebookManualItem,
} from '@openlms/contracts';

export type CalculateCourseFinalGradesInput = {
  tenantId: string;
  courseId: string;
  categories: GradebookCategory[];
  assignmentEntries: GradebookEntry[];
  manualItems: GradebookManualItem[];
  manualGrades: GradebookManualGrade[];
  gradingScheme: CourseGradingScheme | null;
  computedAt?: Date;
};

type GradebookCalculationItem = {
  id: string;
  tenantId: string;
  courseId: string;
  studentId: string;
  categoryId: GradebookCategoryId | null;
  categoryName: string | null;
  score: number;
  maxScore: number;
  extraCredit: boolean;
};

type CategoryDescriptor = {
  id: GradebookCategoryId | null;
  name: string | null;
  weightPercent: number | null;
  dropLowest: number;
  position: number;
};

const visibleGradeStatuses: GradeStatus[] = [
  'published',
  'locked',
  'appealed',
  'revised',
  'incomplete',
];

const isVisibleGradeStatus = (status: GradeStatus): boolean =>
  visibleGradeStatuses.includes(status);

const toAssignmentItems = (entries: GradebookEntry[]): GradebookCalculationItem[] =>
  entries
    .filter((entry) => isVisibleGradeStatus(entry.gradeStatus))
    .map((entry) => ({
      id: `assignment:${entry.assignmentId}:${entry.submissionId}`,
      tenantId: entry.tenantId,
      courseId: entry.courseId,
      studentId: entry.studentId,
      categoryId: entry.gradebookCategoryId,
      categoryName: entry.gradebookCategoryName,
      score: entry.score,
      maxScore: entry.maxScore,
      extraCredit: entry.assignmentExtraCredit,
    }));

const toManualItems = (
  manualItems: GradebookManualItem[],
  manualGrades: GradebookManualGrade[],
): GradebookCalculationItem[] => {
  const itemById = new Map(manualItems.map((item) => [item.id, item]));

  return manualGrades
    .filter((grade) => isVisibleGradeStatus(grade.status))
    .flatMap((grade) => {
      const item = itemById.get(grade.gradebookManualItemId);
      if (!item || item.status !== 'active') {
        return [];
      }

      return [
        {
          id: `manual:${item.id}:${grade.studentId}`,
          tenantId: item.tenantId,
          courseId: item.courseId,
          studentId: grade.studentId,
          categoryId: item.gradebookCategoryId,
          categoryName: null,
          score: grade.score,
          maxScore: grade.maxScore,
          extraCredit: item.extraCredit,
        },
      ];
    });
};

const categoryDescriptorKey = (categoryId: GradebookCategoryId | null): string =>
  categoryId ?? 'uncategorized';

const buildCategoryDescriptors = (
  categories: GradebookCategory[],
  items: GradebookCalculationItem[],
): CategoryDescriptor[] => {
  const activeCategoryById = new Map(
    categories
      .filter((category) => category.status === 'active')
      .map((category) => [category.id, category]),
  );
  const descriptors = new Map<string, CategoryDescriptor>();

  for (const category of activeCategoryById.values()) {
    descriptors.set(categoryDescriptorKey(category.id), {
      id: category.id,
      name: category.name,
      weightPercent: category.weightPercent,
      dropLowest: category.dropLowest,
      position: category.position,
    });
  }

  for (const item of items) {
    if (item.categoryId && activeCategoryById.has(item.categoryId)) {
      continue;
    }

    descriptors.set(categoryDescriptorKey(null), {
      id: null,
      name: null,
      weightPercent: null,
      dropLowest: 0,
      position: Number.MAX_SAFE_INTEGER,
    });
  }

  return [...descriptors.values()].sort((left, right) => {
    if (left.position !== right.position) {
      return left.position - right.position;
    }
    return (left.name ?? '').localeCompare(right.name ?? '');
  });
};

const applyLetterGrade = (percent: number, scheme: CourseGradingScheme | null): string | null => {
  if (!scheme || scheme.status !== 'active') {
    return null;
  }

  const orderedEntries = [...scheme.entries].sort(
    (left: CourseGradingSchemeEntry, right: CourseGradingSchemeEntry) =>
      right.minPercent - left.minPercent,
  );
  return orderedEntries.find((entry) => percent >= entry.minPercent)?.label ?? null;
};

const calculateRollup = (
  descriptor: CategoryDescriptor,
  items: GradebookCalculationItem[],
): CourseFinalGradeContract['categoryRollups'][number] => {
  const categoryItems = items.filter((item) => item.categoryId === descriptor.id);
  const regularItems = categoryItems.filter((item) => !item.extraCredit);
  const extraCreditItems = categoryItems.filter((item) => item.extraCredit);
  const dropCount = Math.min(descriptor.dropLowest, Math.max(regularItems.length - 1, 0));
  const droppedIds = [...regularItems]
    .sort((left, right) => left.score / left.maxScore - right.score / right.maxScore)
    .slice(0, dropCount)
    .map((item) => item.id);
  const dropped = new Set(droppedIds);
  const countedRegularItems = regularItems.filter((item) => !dropped.has(item.id));
  const score =
    countedRegularItems.reduce((total, item) => total + item.score, 0) +
    extraCreditItems.reduce((total, item) => total + item.score, 0);
  const maxScore = countedRegularItems.reduce((total, item) => total + item.maxScore, 0);
  const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return {
    categoryId: descriptor.id,
    categoryName: descriptor.name,
    weightPercent: descriptor.weightPercent,
    score,
    maxScore,
    percent,
    droppedItemIds: droppedIds,
  };
};

const calculateTotal = (
  rollups: CourseFinalGradeContract['categoryRollups'],
): { score: number; maxScore: number; percent: number } => {
  const weightedRollups = rollups.filter(
    (rollup) => rollup.weightPercent !== null && rollup.maxScore > 0,
  );

  if (weightedRollups.length > 0) {
    const totalWeight = weightedRollups.reduce(
      (total, rollup) => total + (rollup.weightPercent ?? 0),
      0,
    );
    const weightedPercent = weightedRollups.reduce(
      (total, rollup) => total + rollup.percent * ((rollup.weightPercent ?? 0) / totalWeight),
      0,
    );
    return { score: weightedPercent, maxScore: 100, percent: weightedPercent };
  }

  const score = rollups.reduce((total, rollup) => total + rollup.score, 0);
  const maxScore = rollups.reduce((total, rollup) => total + rollup.maxScore, 0);
  const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return { score, maxScore: maxScore > 0 ? maxScore : 100, percent };
};

export const calculateCourseFinalGrades = (
  input: CalculateCourseFinalGradesInput,
): CourseFinalGradeContract[] => {
  const computedAt = input.computedAt ?? new Date();
  const items = [
    ...toAssignmentItems(input.assignmentEntries),
    ...toManualItems(input.manualItems, input.manualGrades),
  ];
  const descriptors = buildCategoryDescriptors(input.categories, items);
  const studentIds = [...new Set(items.map((item) => item.studentId))].sort();

  return studentIds.map((studentId) => {
    const studentItems = items.filter((item) => item.studentId === studentId);
    const categoryRollups = descriptors
      .map((descriptor) => calculateRollup(descriptor, studentItems))
      .filter((rollup) => rollup.score > 0 || rollup.maxScore > 0);
    const total = calculateTotal(categoryRollups);

    return CourseFinalGrade.parse({
      tenantId: input.tenantId,
      courseId: input.courseId,
      studentId,
      score: total.score,
      maxScore: total.maxScore,
      percent: total.percent,
      letterGrade: applyLetterGrade(total.percent, input.gradingScheme),
      categoryRollups,
      computedAt,
    });
  });
};
