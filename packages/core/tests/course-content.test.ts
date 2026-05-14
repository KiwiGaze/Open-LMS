import {
  Course,
  CourseModule,
  CourseModuleId,
  CoursePage,
  CoursePageId,
  CourseResource,
  CourseSyllabus,
  CourseUnit,
  CourseUnitId,
  LearningObjective,
  LearningObjectiveId,
  LearningObjectiveMastery,
  WikiPageId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { getLearningObjectiveCoverage } from '../src/courses/learning-objective-coverage.ts';
import {
  getCoursePageForCourse,
  getCourseSyllabusForCourse,
  getLearningObjectiveById,
  listCatalogCoursesForTenant,
  listCourseModules,
  listCoursePagesForCourse,
  listCourseResources,
  listCourseUnits,
  listCourses,
  listLearningObjectiveMasteryForCourse,
  listLearningObjectivesForCourse,
  restoreDeletedCourse,
  saveCourse,
  saveCourseModule,
  saveCoursePage,
  saveCourseResource,
  saveCourseSyllabus,
  saveCourseUnit,
  saveLearningObjective,
  softDeleteCourse,
  upsertLearningObjectiveMastery,
} from '../src/courses/repository.ts';
import type { Database } from '../src/db/client.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const otherTenantId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';
const unitId = '01J9QW7B6N5W2YH3D3A1V0KE2Z';
const pageId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const wikiPageId = '01J9QW7B6N5W2YH3D3A1V0KE32';
const syllabusId = '01J9QW7B6N5W2YH3D3A1V0KE33';
const masteryId = '01J9QW7B6N5W2YH3D3A1V0KE34';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE35';
const otherStudentId = '01J9QW7B6N5W2YH3D3A1V0KE36';

const courseA = Course.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2A',
  tenantId,
  code: 'SCI201',
  title: 'Science',
  status: 'active',
  startsAt: null,
  endsAt: null,
  createdAt: now,
  updatedAt: now,
});

const courseB = Course.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2B',
  tenantId,
  code: 'ART101',
  title: 'Art',
  status: 'active',
  startsAt: null,
  endsAt: null,
  createdAt: now,
  updatedAt: now,
});

const otherTenantCourse = Course.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2C',
  tenantId: otherTenantId,
  code: 'HIS101',
  title: 'History',
  status: 'active',
  startsAt: null,
  endsAt: null,
  createdAt: now,
  updatedAt: now,
});

const objective = LearningObjective.parse({
  id: learningObjectiveId,
  tenantId,
  courseId,
  code: 'LO-1',
  title: 'Explain how evidence supports a claim',
  description: 'Connect quoted evidence to the argument it supports.',
  status: 'active',
  position: 0,
  createdAt: now,
  updatedAt: now,
});

const courseModule = CourseModule.parse({
  id: moduleId,
  tenantId,
  courseId,
  title: 'Argument writing',
  summary: 'Evidence, claims, and reasoning.',
  visibility: 'published',
  accessPolicy: 'course_member',
  version: 1,
  position: 0,
  learningObjectiveIds: [learningObjectiveId],
  createdAt: now,
  updatedAt: now,
});

const courseUnit = CourseUnit.parse({
  id: unitId,
  tenantId,
  courseId,
  moduleId,
  title: 'Explaining evidence',
  summary: null,
  visibility: 'published',
  accessPolicy: 'course_member',
  version: 1,
  position: 0,
  learningObjectiveIds: [learningObjectiveId],
  createdAt: now,
  updatedAt: now,
});

const courseResource = CourseResource.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE30',
  tenantId,
  courseId,
  moduleId,
  unitId,
  resourceType: 'reading_material',
  title: 'Evidence guide',
  body: 'A quote needs reasoning that connects it to the claim.',
  sourceUri: null,
  visibility: 'published',
  accessPolicy: 'course_member',
  version: 1,
  position: 0,
  learningObjectiveIds: [learningObjectiveId],
  createdAt: now,
  updatedAt: now,
});

const coursePage = CoursePage.parse({
  id: pageId,
  tenantId,
  courseId,
  title: 'Evidence page',
  body: 'Evidence needs reasoning that connects it to a claim.',
  visibility: 'published',
  version: 1,
  learningObjectiveIds: [learningObjectiveId],
  createdAt: now,
  updatedAt: now,
});

const courseSyllabus = CourseSyllabus.parse({
  id: syllabusId,
  tenantId,
  courseId,
  body: 'Course policies, grading expectations, and weekly rhythm.',
  visibility: 'published',
  version: 1,
  createdAt: now,
  updatedAt: now,
});

const objectiveMastery = LearningObjectiveMastery.parse({
  id: masteryId,
  tenantId,
  courseId,
  learningObjectiveId,
  studentId,
  status: 'proficient',
  score: 8,
  maxScore: 10,
  lastAssessedAt: now,
  evidenceCount: 2,
  createdAt: now,
  updatedAt: now,
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

const createUpsertOnlyDb = <T>(row: T): Database =>
  ({
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: async () => [row],
        }),
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

const createCourseResourceListDb = (rows: CourseResource[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.moduleId === moduleId)
              .filter((row) => row.unitId === unitId)
              .sort(
                (left, right) =>
                  left.position - right.position || left.title.localeCompare(right.title),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const createCourseListDb = (rows: (typeof courseA)[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.deletedAt === null)
              .sort((left, right) => left.code.localeCompare(right.code)),
        }),
      }),
    }),
  }) as unknown as Database;

const createCourseLifecycleUpdateDb = (
  row: typeof courseA | null,
  capture: { values?: unknown; condition?: unknown },
): Database =>
  ({
    update: () => ({
      set: (values: unknown) => {
        capture.values = values;
        return {
          where: (condition: unknown) => {
            capture.condition = condition;
            return {
              returning: async () => (row === null ? [] : [row]),
            };
          },
        };
      },
    }),
  }) as unknown as Database;

const createWhereOrderCaptureDb = (capture: {
  condition: unknown;
  orderExpressions?: unknown[];
}): Database =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => {
          capture.condition = condition;
          return {
            orderBy: async (...orderExpressions: unknown[]) => {
              capture.orderExpressions = orderExpressions;
              return [];
            },
          };
        },
      }),
    }),
  }) as unknown as Database;

const createLearningObjectiveCoverageDb = (): Database => {
  let selectCount = 0;
  const rowsBySelect = [
    [{ id: moduleId }],
    [{ id: unitId }],
    [{ id: pageId }],
    [{ id: wikiPageId }],
  ];

  return {
    select: () => {
      const rows = rowsBySelect[selectCount] ?? [];
      selectCount += 1;

      return {
        from: () => ({
          where: async () => rows,
        }),
      };
    },
  } as unknown as Database;
};

const getObjectProperty = (value: unknown, propertyName: string): unknown => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return (value as Record<PropertyKey, unknown>)[propertyName];
};

const collectSqlChunkColumnNames = (value: unknown, seen = new WeakSet<object>()): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSqlChunkColumnNames(item, seen));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  const queryChunks = getObjectProperty(value, 'queryChunks');
  if (Array.isArray(queryChunks)) {
    return queryChunks.flatMap((chunk) => collectSqlChunkColumnNames(chunk, seen));
  }

  const ownName = getObjectProperty(value, 'name');
  return typeof ownName === 'string' ? [ownName] : [];
};

const collectSqlChunkParamValues = (value: unknown, seen = new WeakSet<object>()): unknown[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSqlChunkParamValues(item, seen));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  const queryChunks = getObjectProperty(value, 'queryChunks');
  if (Array.isArray(queryChunks)) {
    return queryChunks.flatMap((chunk) => collectSqlChunkParamValues(chunk, seen));
  }

  if (!Object.prototype.hasOwnProperty.call(value, 'value')) {
    return [];
  }

  const ownValue = getObjectProperty(value, 'value');
  return Array.isArray(ownValue) ? ownValue : [ownValue];
};

describe('course content repository', () => {
  it('lists courses for a tenant in code order', async () => {
    const savedRows: (typeof courseA)[] = [];

    await saveCourse(createInsertOnlyDb(savedRows), courseA);
    await saveCourse(createInsertOnlyDb(savedRows), courseB);
    await saveCourse(createInsertOnlyDb(savedRows), otherTenantCourse);

    const courses = await listCourses(createCourseListDb(savedRows), tenantId);

    expect(courses.map((course) => course.code)).toEqual(['ART101', 'SCI201']);
    expect(courses.every((course) => course.tenantId === tenantId)).toBe(true);
  });

  it('excludes soft-deleted courses from normal course lists', async () => {
    const deletedCourse = Course.parse({
      ...courseB,
      status: 'deleted',
      deletedAt: new Date('2026-05-13T12:00:00.000Z'),
    });

    const courses = await listCourses(createCourseListDb([courseA, deletedCourse]), tenantId);

    expect(courses.map((course) => course.id)).toEqual([courseA.id]);
  });

  it('soft-deletes courses without removing the record', async () => {
    const deletedAt = new Date('2026-05-13T12:00:00.000Z');
    const deletedCourse = Course.parse({
      ...courseA,
      status: 'deleted',
      deletedAt,
      updatedAt: deletedAt,
    });
    const capture = {};

    const result = await softDeleteCourse(
      createCourseLifecycleUpdateDb(deletedCourse, capture),
      { tenantId, courseId: courseA.id },
      deletedAt,
    );

    expect(result).toMatchObject({ id: courseA.id, status: 'deleted', deletedAt });
    expect(capture).toMatchObject({
      values: {
        status: 'deleted',
        deletedAt,
        updatedAt: deletedAt,
      },
    });
  });

  it('restores soft-deleted courses to draft', async () => {
    const restoredAt = new Date('2026-05-14T12:00:00.000Z');
    const restoredCourse = Course.parse({
      ...courseA,
      status: 'draft',
      deletedAt: null,
      updatedAt: restoredAt,
    });
    const capture = {};

    const result = await restoreDeletedCourse(
      createCourseLifecycleUpdateDb(restoredCourse, capture),
      { tenantId, courseId: courseA.id },
      restoredAt,
    );

    expect(result).toMatchObject({ id: courseA.id, status: 'draft', deletedAt: null });
    expect(capture).toMatchObject({
      values: {
        status: 'draft',
        deletedAt: null,
        updatedAt: restoredAt,
      },
    });
  });

  it('adds blueprint, category, and term predicates to catalog course listing when filters are provided', async () => {
    const capture = { condition: null as unknown };

    await listCatalogCoursesForTenant(createWhereOrderCaptureDb(capture), {
      tenantId,
      isBlueprint: true,
      catalogCategory: 'Writing',
      academicTerm: '2026 Fall',
    });

    const names = collectSqlChunkColumnNames(capture.condition);
    const values = collectSqlChunkParamValues(capture.condition);

    expect(names).toEqual(
      expect.arrayContaining([
        'tenant_id',
        'status',
        'catalog_visibility',
        'is_blueprint',
        'catalog_category',
        'academic_term',
      ]),
    );
    expect(values).toEqual(
      expect.arrayContaining([tenantId, 'active', 'listed', true, 'Writing', '2026 Fall']),
    );
  });

  it('stores and lists versioned modules, units, and resources for a course', async () => {
    const modules: (typeof courseModule)[] = [];
    const units: (typeof courseUnit)[] = [];
    const resources: (typeof courseResource)[] = [];

    await expect(saveCourseModule(createInsertOnlyDb(modules), courseModule)).resolves.toEqual(
      courseModule,
    );
    await expect(saveCourseUnit(createInsertOnlyDb(units), courseUnit)).resolves.toEqual(
      courseUnit,
    );
    await expect(
      saveCourseResource(createInsertOnlyDb(resources), courseResource),
    ).resolves.toEqual(courseResource);

    await expect(
      listCourseModules(createSelectOnlyDb([courseModule]), { tenantId, courseId }),
    ).resolves.toEqual([courseModule]);
    await expect(
      listCourseUnits(createSelectOnlyDb([courseUnit]), { tenantId, courseId, moduleId }),
    ).resolves.toEqual([courseUnit]);
    await expect(
      listCourseResources(createSelectOnlyDb([courseResource]), {
        tenantId,
        courseId,
        moduleId,
        unitId,
      }),
    ).resolves.toEqual([courseResource]);
  });

  it('lists course resources in author-defined position order', async () => {
    const laterResource = CourseResource.parse({
      ...courseResource,
      id: '01J9QW7B6N5W2YH3D3A1V0KE37',
      title: 'A first title but later position',
      position: 2,
    });
    const earlierResource = CourseResource.parse({
      ...courseResource,
      id: '01J9QW7B6N5W2YH3D3A1V0KE38',
      title: 'Z last title but first position',
      position: 1,
    });

    await expect(
      listCourseResources(createCourseResourceListDb([laterResource, earlierResource]), {
        tenantId,
        courseId,
        moduleId,
        unitId,
      }),
    ).resolves.toEqual([earlierResource, laterResource]);
  });

  it('orders broad course resource lists by parent sequence before resource position', async () => {
    const capture = { condition: null as unknown, orderExpressions: [] as unknown[] };

    await listCourseResources(createWhereOrderCaptureDb(capture), {
      tenantId,
      courseId,
    });

    const orderColumnNames = collectSqlChunkColumnNames(capture.orderExpressions);

    expect(capture.orderExpressions).toHaveLength(5);
    expect(orderColumnNames).toEqual(
      expect.arrayContaining(['position', 'position', 'position', 'title', 'id']),
    );
  });

  it('includes wiki pages in learning objective coverage', async () => {
    await expect(
      getLearningObjectiveCoverage(
        createLearningObjectiveCoverageDb(),
        tenantId,
        courseId,
        learningObjectiveId,
      ),
    ).resolves.toEqual({
      learningObjectiveId: LearningObjectiveId.parse(learningObjectiveId),
      moduleIds: [CourseModuleId.parse(moduleId)],
      unitIds: [CourseUnitId.parse(unitId)],
      pageIds: [CoursePageId.parse(pageId)],
      wikiPageIds: [WikiPageId.parse(wikiPageId)],
    });
  });

  it('stores and retrieves course-scoped learning objectives', async () => {
    const savedRows: (typeof objective)[] = [];
    const saved = await saveLearningObjective(createInsertOnlyDb(savedRows), objective);
    const found = await getLearningObjectiveById(
      createSelectOnlyDb([objective]),
      tenantId,
      learningObjectiveId,
    );

    expect(saved).toEqual(objective);
    expect(savedRows).toEqual([objective]);
    expect(found).toEqual(objective);
  });

  it('lists objectives for a tenant course and rejects cross-tenant reads', async () => {
    const listed = await listLearningObjectivesForCourse(createSelectOnlyDb([objective]), {
      tenantId,
      courseId,
    });
    const crossTenant = await getLearningObjectiveById(
      createSelectOnlyDb([objective]),
      otherTenantId,
      learningObjectiveId,
    );

    expect(listed).toEqual([objective]);
    expect(crossTenant).toBeNull();
  });

  it('lists learning objective mastery records for a course', async () => {
    await expect(
      listLearningObjectiveMasteryForCourse(createSelectOnlyDb([objectiveMastery]), {
        tenantId,
        courseId,
      }),
    ).resolves.toEqual([objectiveMastery]);
  });

  it('upserts learning objective mastery snapshots', async () => {
    await expect(
      upsertLearningObjectiveMastery(createUpsertOnlyDb(objectiveMastery), objectiveMastery),
    ).resolves.toEqual(objectiveMastery);
  });

  it('can scope learning objective mastery records to one student', async () => {
    const otherMastery = LearningObjectiveMastery.parse({
      ...objectiveMastery,
      id: '01J9QW7B6N5W2YH3D3A1V0KE37',
      studentId: otherStudentId,
    });
    const capture = { condition: null as unknown };

    await listLearningObjectiveMasteryForCourse(createWhereOrderCaptureDb(capture), {
      tenantId,
      courseId,
      studentId,
    });

    const names = collectSqlChunkColumnNames(capture.condition);
    const values = collectSqlChunkParamValues(capture.condition);

    expect([objectiveMastery, otherMastery].filter((row) => row.studentId === studentId)).toEqual([
      objectiveMastery,
    ]);
    expect(names).toContain('tenant_id');
    expect(names).toContain('course_id');
    expect(names).toContain('student_id');
    expect(values).toContain(tenantId);
    expect(values).toContain(courseId);
    expect(values).toContain(studentId);
  });

  it('stores and lists versioned pages for a course', async () => {
    const pages: (typeof coursePage)[] = [];

    await expect(saveCoursePage(createInsertOnlyDb(pages), coursePage)).resolves.toEqual(
      coursePage,
    );
    await expect(
      listCoursePagesForCourse(createSelectOnlyDb([coursePage]), { tenantId, courseId }),
    ).resolves.toEqual([coursePage]);
  });

  it('stores and reads the canonical syllabus for a course', async () => {
    const syllabi: (typeof courseSyllabus)[] = [];

    await expect(saveCourseSyllabus(createInsertOnlyDb(syllabi), courseSyllabus)).resolves.toEqual(
      courseSyllabus,
    );
    await expect(
      getCourseSyllabusForCourse(createSelectOnlyDb([courseSyllabus]), {
        tenantId,
        courseId,
      }),
    ).resolves.toEqual(courseSyllabus);
    await expect(
      getCourseSyllabusForCourse(createSelectOnlyDb([courseSyllabus]), {
        tenantId,
        courseId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      }),
    ).resolves.toBeNull();
  });

  it('reads pages only from the requested tenant course', async () => {
    const found = await getCoursePageForCourse(createSelectOnlyDb([coursePage]), {
      tenantId,
      courseId,
      coursePageId: pageId,
    });
    const crossCourse = await getCoursePageForCourse(createSelectOnlyDb([coursePage]), {
      tenantId,
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      coursePageId: pageId,
    });

    expect(found).toEqual(coursePage);
    expect(crossCourse).toBeNull();
  });
});
