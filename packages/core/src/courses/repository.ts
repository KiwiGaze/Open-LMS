import {
  CatalogCourse,
  type CatalogCourse as CatalogCourseContract,
  type CatalogVisibility,
  Course,
  CourseCatalogSettings,
  type CourseCatalogSettings as CourseCatalogSettingsContract,
  type Course as CourseContract,
  CourseId,
  CourseModule,
  type CourseModule as CourseModuleContract,
  CourseModuleId,
  CoursePage,
  type CoursePage as CoursePageContract,
  CoursePageId,
  CourseResource,
  type CourseResource as CourseResourceContract,
  CourseResourceId,
  CourseSection,
  type CourseSection as CourseSectionContract,
  CourseSectionId,
  type CourseSectionMeetingDay,
  type CourseSectionStatus,
  CourseSyllabus,
  type CourseSyllabus as CourseSyllabusContract,
  CourseSyllabusId,
  CourseUnit,
  type CourseUnit as CourseUnitContract,
  CourseUnitId,
  LearningObjective,
  type LearningObjective as LearningObjectiveContract,
  LearningObjectiveId,
  LearningObjectiveMastery,
  type LearningObjectiveMastery as LearningObjectiveMasteryContract,
  TenantId,
} from '@openlms/contracts';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database, DatabaseExecutor } from '../db/client.ts';
import {
  course,
  courseModule,
  coursePage,
  courseResource,
  courseSection,
  courseSyllabus,
  courseUnit,
  learningObjective,
  learningObjectiveMastery,
} from '../db/schema/course.ts';

export const saveCourse = async (db: Database, value: CourseContract): Promise<CourseContract> => {
  const parsed = Course.parse(value);
  const [row] = await db.insert(course).values(parsed).returning();

  if (!row) {
    throw new Error('Course could not be saved because the database returned no row.');
  }

  return Course.parse(row);
};

export type CreateCourseInput = {
  tenantId: string;
  code: string;
  title: string;
  status: CourseContract['status'];
  startsAt: Date | null;
  endsAt: Date | null;
  catalogCategory?: string | null;
  academicTerm?: string | null;
  maxEnrollments?: number | null;
  waitlistEnabled?: boolean;
  enrollmentApprovalRequired?: boolean;
  isBlueprint?: boolean;
};

export const createCourse = async (
  db: Database,
  input: CreateCourseInput,
  now = new Date(),
): Promise<CourseContract> => {
  const parsed = Course.parse({
    id: CourseId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    code: input.code,
    title: input.title,
    status: input.status,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    catalogCategory: input.catalogCategory ?? null,
    academicTerm: input.academicTerm ?? null,
    maxEnrollments: input.maxEnrollments ?? null,
    waitlistEnabled: input.waitlistEnabled ?? false,
    enrollmentApprovalRequired: input.enrollmentApprovalRequired ?? false,
    isBlueprint: input.isBlueprint ?? false,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(course).values(parsed).returning();

  if (!row) {
    throw new Error('Course could not be created because the database returned no row.');
  }

  return Course.parse(row);
};

export const getCourseById = async (
  db: Database,
  tenantId: string,
  courseId: string,
): Promise<CourseContract | null> => {
  const [row] = await db
    .select()
    .from(course)
    .where(and(eq(course.tenantId, tenantId), eq(course.id, courseId)))
    .limit(1);

  if (!row || row.tenantId !== tenantId) {
    return null;
  }

  return Course.parse(row);
};

export type CourseEnrollmentInfo = {
  status: CourseContract['status'];
  enrollmentCode: string | null;
  maxEnrollments: number | null;
  waitlistEnabled: boolean;
  enrollmentApprovalRequired: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

export const getCourseEnrollmentInfo = async (
  db: Database,
  tenantId: string,
  courseId: string,
): Promise<CourseEnrollmentInfo | null> => {
  const [row] = await db
    .select({
      status: course.status,
      enrollmentCode: course.enrollmentCode,
      maxEnrollments: course.maxEnrollments,
      waitlistEnabled: course.waitlistEnabled,
      enrollmentApprovalRequired: course.enrollmentApprovalRequired,
      startsAt: course.startsAt,
      endsAt: course.endsAt,
    })
    .from(course)
    .where(and(eq(course.tenantId, tenantId), eq(course.id, courseId)))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    status: row.status as CourseContract['status'],
    enrollmentCode: row.enrollmentCode,
    maxEnrollments: row.maxEnrollments,
    waitlistEnabled: row.waitlistEnabled,
    enrollmentApprovalRequired: row.enrollmentApprovalRequired,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
  };
};

export type UpdateCourseCatalogSettingsInput = {
  tenantId: string;
  courseId: string;
  catalogVisibility: CatalogVisibility;
  enrollmentCode: string | null;
  catalogCategory: string | null;
  academicTerm: string | null;
  maxEnrollments: number | null;
  waitlistEnabled: boolean;
  enrollmentApprovalRequired: boolean;
};

export const updateCourseCatalogSettings = async (
  db: Database,
  input: UpdateCourseCatalogSettingsInput,
  now = new Date(),
): Promise<CourseCatalogSettingsContract | null> => {
  const [row] = await db
    .update(course)
    .set({
      catalogVisibility: input.catalogVisibility,
      enrollmentCode: input.enrollmentCode,
      catalogCategory: input.catalogCategory,
      academicTerm: input.academicTerm,
      maxEnrollments: input.maxEnrollments,
      waitlistEnabled: input.waitlistEnabled,
      enrollmentApprovalRequired: input.enrollmentApprovalRequired,
      updatedAt: now,
    })
    .where(and(eq(course.tenantId, input.tenantId), eq(course.id, input.courseId)))
    .returning({
      tenantId: course.tenantId,
      courseId: course.id,
      catalogVisibility: course.catalogVisibility,
      enrollmentCode: course.enrollmentCode,
      catalogCategory: course.catalogCategory,
      academicTerm: course.academicTerm,
      maxEnrollments: course.maxEnrollments,
      waitlistEnabled: course.waitlistEnabled,
      enrollmentApprovalRequired: course.enrollmentApprovalRequired,
      updatedAt: course.updatedAt,
    });

  return row ? CourseCatalogSettings.parse(row) : null;
};

export const listCourses = async (db: Database, tenantId: string): Promise<CourseContract[]> => {
  const rows = await db
    .select()
    .from(course)
    .where(and(eq(course.tenantId, tenantId), sql`${course.deletedAt} IS NULL`))
    .orderBy(asc(course.code));

  return rows.map((row) => Course.parse(row));
};

export type CourseLifecycleInput = {
  tenantId: string;
  courseId: string;
};

export const softDeleteCourse = async (
  db: Database,
  input: CourseLifecycleInput,
  now = new Date(),
): Promise<CourseContract | null> => {
  const [row] = await db
    .update(course)
    .set({
      status: 'deleted',
      deletedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(course.tenantId, input.tenantId),
        eq(course.id, input.courseId),
        sql`${course.deletedAt} IS NULL`,
      ),
    )
    .returning();

  return row ? Course.parse(row) : null;
};

export const restoreDeletedCourse = async (
  db: Database,
  input: CourseLifecycleInput,
  now = new Date(),
): Promise<CourseContract | null> => {
  const [row] = await db
    .update(course)
    .set({
      status: 'draft',
      deletedAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(course.tenantId, input.tenantId),
        eq(course.id, input.courseId),
        eq(course.status, 'deleted'),
        sql`${course.deletedAt} IS NOT NULL`,
      ),
    )
    .returning();

  return row ? Course.parse(row) : null;
};

export type ListCatalogCoursesForTenantInput = {
  tenantId: string;
  isBlueprint?: boolean;
  catalogCategory?: string;
  academicTerm?: string;
};

export const listCatalogCoursesForTenant = async (
  db: Database,
  input: ListCatalogCoursesForTenantInput,
): Promise<CatalogCourseContract[]> => {
  const conditions = [
    eq(course.tenantId, input.tenantId),
    eq(course.status, 'active'),
    eq(course.catalogVisibility, 'listed'),
    sql`${course.deletedAt} IS NULL`,
  ];
  if (input.isBlueprint !== undefined) {
    conditions.push(eq(course.isBlueprint, input.isBlueprint));
  }
  if (input.catalogCategory !== undefined) {
    conditions.push(eq(course.catalogCategory, input.catalogCategory));
  }
  if (input.academicTerm !== undefined) {
    conditions.push(eq(course.academicTerm, input.academicTerm));
  }

  const rows = await db
    .select({
      id: course.id,
      tenantId: course.tenantId,
      code: course.code,
      title: course.title,
      catalogCategory: course.catalogCategory,
      academicTerm: course.academicTerm,
      startsAt: course.startsAt,
      endsAt: course.endsAt,
    })
    .from(course)
    .where(and(...conditions))
    .orderBy(asc(course.title), asc(course.id));

  return rows.map((row) => CatalogCourse.parse(row));
};

export type ListCourseSectionsForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: CourseSectionStatus[];
};

export type CreateCourseSectionInput = {
  tenantId: string;
  courseId: string;
  name: string;
  status: CourseSectionStatus;
  position: number;
  meetingDays: CourseSectionMeetingDay[];
  meetingStartTime: string | null;
  meetingEndTime: string | null;
  location: string | null;
};

export const listCourseSectionsForCourse = async (
  db: Database,
  input: ListCourseSectionsForCourseInput,
): Promise<CourseSectionContract[]> => {
  const conditions = [
    eq(courseSection.tenantId, input.tenantId),
    eq(courseSection.courseId, input.courseId),
  ];

  if (input.statuses.length > 0) {
    conditions.push(inArray(courseSection.status, input.statuses));
  }

  const rows = await db
    .select()
    .from(courseSection)
    .where(and(...conditions))
    .orderBy(asc(courseSection.position), asc(courseSection.name));

  return rows.map((row) => CourseSection.parse(row));
};

export const createCourseSection = async (
  db: Database,
  input: CreateCourseSectionInput,
  now = new Date(),
): Promise<CourseSectionContract> => {
  const parsed = CourseSection.parse({
    id: CourseSectionId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    name: input.name,
    status: input.status,
    position: input.position,
    meetingDays: input.meetingDays,
    meetingStartTime: input.meetingStartTime,
    meetingEndTime: input.meetingEndTime,
    location: input.location,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseSection).values(parsed).returning();

  if (!row) {
    throw new Error('Course section could not be created because the database returned no row.');
  }

  return CourseSection.parse(row);
};

export type UpdateCourseSectionInput = {
  tenantId: string;
  courseId: string;
  courseSectionId: string;
  name: string;
  status: CourseSectionStatus;
  position: number;
  meetingDays: CourseSectionMeetingDay[];
  meetingStartTime: string | null;
  meetingEndTime: string | null;
  location: string | null;
};

export const updateCourseSection = async (
  db: Database,
  input: UpdateCourseSectionInput,
  now = new Date(),
): Promise<CourseSectionContract | null> => {
  const [row] = await db
    .update(courseSection)
    .set({
      name: input.name,
      status: input.status,
      position: input.position,
      meetingDays: input.meetingDays,
      meetingStartTime: input.meetingStartTime,
      meetingEndTime: input.meetingEndTime,
      location: input.location,
      updatedAt: now,
    })
    .where(
      and(
        eq(courseSection.tenantId, input.tenantId),
        eq(courseSection.courseId, input.courseId),
        eq(courseSection.id, input.courseSectionId),
      ),
    )
    .returning();

  return row ? CourseSection.parse(row) : null;
};

export type DeleteCourseSectionInput = {
  tenantId: string;
  courseId: string;
  courseSectionId: string;
};

export const deleteCourseSection = async (
  db: Database,
  input: DeleteCourseSectionInput,
): Promise<boolean> => {
  const result = await db
    .delete(courseSection)
    .where(
      and(
        eq(courseSection.tenantId, input.tenantId),
        eq(courseSection.courseId, input.courseId),
        eq(courseSection.id, input.courseSectionId),
      ),
    )
    .returning({ id: courseSection.id });

  return result.length > 0;
};

export const saveCourseSyllabus = async (
  db: Database,
  value: CourseSyllabusContract,
): Promise<CourseSyllabusContract> => {
  const parsed = CourseSyllabus.parse(value);
  const [row] = await db.insert(courseSyllabus).values(parsed).returning();

  if (!row) {
    throw new Error('Course syllabus could not be saved because the database returned no row.');
  }

  return CourseSyllabus.parse(row);
};

export type UpsertCourseSyllabusInput = {
  tenantId: string;
  courseId: string;
  body: string;
  visibility: CourseSyllabusContract['visibility'];
};

export const upsertCourseSyllabus = async (
  db: Database,
  input: UpsertCourseSyllabusInput,
  now = new Date(),
): Promise<CourseSyllabusContract> => {
  const parsedInsert = CourseSyllabus.parse({
    id: CourseSyllabusId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    body: input.body,
    visibility: input.visibility,
    version: 1,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db
    .insert(courseSyllabus)
    .values(parsedInsert)
    .onConflictDoUpdate({
      target: [courseSyllabus.tenantId, courseSyllabus.courseId],
      set: {
        body: input.body,
        visibility: input.visibility,
        version: sql`${courseSyllabus.version} + 1`,
        updatedAt: now,
      },
    })
    .returning();

  if (!row) {
    throw new Error('Course syllabus could not be upserted because the database returned no row.');
  }

  return CourseSyllabus.parse(row);
};

export type GetCourseSyllabusForCourseInput = {
  tenantId: string;
  courseId: string;
};

export const getCourseSyllabusForCourse = async (
  db: Database,
  input: GetCourseSyllabusForCourseInput,
): Promise<CourseSyllabusContract | null> => {
  const [row] = await db
    .select()
    .from(courseSyllabus)
    .where(
      and(eq(courseSyllabus.tenantId, input.tenantId), eq(courseSyllabus.courseId, input.courseId)),
    )
    .limit(1);

  if (!row || row.courseId !== input.courseId) {
    return null;
  }

  return CourseSyllabus.parse(row);
};

export const saveCourseModule = async (
  db: Database,
  value: CourseModuleContract,
): Promise<CourseModuleContract> => {
  const parsed = CourseModule.parse(value);
  const [row] = await db.insert(courseModule).values(parsed).returning();

  if (!row) {
    throw new Error('Course module could not be saved because the database returned no row.');
  }

  return CourseModule.parse(row);
};

export type CreateCourseModuleInput = {
  tenantId: string;
  courseId: string;
  title: string;
  summary: string | null;
  visibility: CourseModuleContract['visibility'];
  accessPolicy: CourseModuleContract['accessPolicy'];
  position: number;
  learningObjectiveIds: string[];
};

export const createCourseModule = async (
  db: Database,
  input: CreateCourseModuleInput,
  now = new Date(),
): Promise<CourseModuleContract> => {
  const parsed = CourseModule.parse({
    id: CourseModuleId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    title: input.title,
    summary: input.summary,
    visibility: input.visibility,
    accessPolicy: input.accessPolicy,
    version: 1,
    position: input.position,
    learningObjectiveIds: input.learningObjectiveIds.map((id) => LearningObjectiveId.parse(id)),
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseModule).values(parsed).returning();

  if (!row) {
    throw new Error('Course module could not be created because the database returned no row.');
  }

  return CourseModule.parse(row);
};

export type ListCourseModulesInput = {
  tenantId: string;
  courseId: string;
};

export const listCourseModules = async (
  db: Database,
  input: ListCourseModulesInput,
): Promise<CourseModuleContract[]> => {
  const rows = await db
    .select()
    .from(courseModule)
    .where(
      and(eq(courseModule.tenantId, input.tenantId), eq(courseModule.courseId, input.courseId)),
    )
    .orderBy(asc(courseModule.position));

  return rows.map((row) => CourseModule.parse(row));
};

export const saveCourseUnit = async (
  db: Database,
  value: CourseUnitContract,
): Promise<CourseUnitContract> => {
  const parsed = CourseUnit.parse(value);
  const [row] = await db.insert(courseUnit).values(parsed).returning();

  if (!row) {
    throw new Error('Course unit could not be saved because the database returned no row.');
  }

  return CourseUnit.parse(row);
};

export type CreateCourseUnitInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  title: string;
  summary: string | null;
  visibility: CourseUnitContract['visibility'];
  accessPolicy: CourseUnitContract['accessPolicy'];
  position: number;
  learningObjectiveIds: string[];
};

export const createCourseUnit = async (
  db: Database,
  input: CreateCourseUnitInput,
  now = new Date(),
): Promise<CourseUnitContract> => {
  const parsed = CourseUnit.parse({
    id: CourseUnitId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: CourseModuleId.parse(input.moduleId),
    title: input.title,
    summary: input.summary,
    visibility: input.visibility,
    accessPolicy: input.accessPolicy,
    version: 1,
    position: input.position,
    learningObjectiveIds: input.learningObjectiveIds.map((id) => LearningObjectiveId.parse(id)),
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseUnit).values(parsed).returning();

  if (!row) {
    throw new Error('Course unit could not be created because the database returned no row.');
  }

  return CourseUnit.parse(row);
};

export type ListCourseUnitsInput = {
  tenantId: string;
  courseId: string;
  moduleId?: string;
};

export const listCourseUnits = async (
  db: Database,
  input: ListCourseUnitsInput,
): Promise<CourseUnitContract[]> => {
  const conditions = [
    eq(courseUnit.tenantId, input.tenantId),
    eq(courseUnit.courseId, input.courseId),
  ];

  if (input.moduleId) {
    conditions.push(eq(courseUnit.moduleId, input.moduleId));
  }

  const rows = await db
    .select()
    .from(courseUnit)
    .where(and(...conditions))
    .orderBy(asc(courseUnit.position));

  return rows.map((row) => CourseUnit.parse(row));
};

export const saveCourseResource = async (
  db: Database,
  value: CourseResourceContract,
): Promise<CourseResourceContract> => {
  const parsed = CourseResource.parse(value);
  const [row] = await db.insert(courseResource).values(parsed).returning();

  if (!row) {
    throw new Error('Course resource could not be saved because the database returned no row.');
  }

  return CourseResource.parse(row);
};

export type CreateCourseResourceInput = {
  tenantId: string;
  courseId: string;
  moduleId: string | null;
  unitId: string | null;
  resourceType: CourseResourceContract['resourceType'];
  title: string;
  body: string;
  sourceUri: string | null;
  visibility: CourseResourceContract['visibility'];
  accessPolicy: CourseResourceContract['accessPolicy'];
  position: number;
  learningObjectiveIds: string[];
};

export const createCourseResource = async (
  db: Database,
  input: CreateCourseResourceInput,
  now = new Date(),
): Promise<CourseResourceContract> => {
  const parsed = CourseResource.parse({
    id: CourseResourceId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: input.moduleId === null ? null : CourseModuleId.parse(input.moduleId),
    unitId: input.unitId === null ? null : CourseUnitId.parse(input.unitId),
    resourceType: input.resourceType,
    title: input.title,
    body: input.body,
    sourceUri: input.sourceUri,
    visibility: input.visibility,
    accessPolicy: input.accessPolicy,
    version: 1,
    position: input.position,
    learningObjectiveIds: input.learningObjectiveIds.map((id) => LearningObjectiveId.parse(id)),
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseResource).values(parsed).returning();

  if (!row) {
    throw new Error('Course resource could not be created because the database returned no row.');
  }

  return CourseResource.parse(row);
};

export type GetCourseResourceForCourseInput = {
  tenantId: string;
  courseId: string;
  courseResourceId: string;
};

export const getCourseResourceForCourse = async (
  db: DatabaseExecutor,
  input: GetCourseResourceForCourseInput,
): Promise<CourseResourceContract | null> => {
  const [row] = await db
    .select()
    .from(courseResource)
    .where(
      and(
        eq(courseResource.tenantId, input.tenantId),
        eq(courseResource.courseId, input.courseId),
        eq(courseResource.id, input.courseResourceId),
      ),
    )
    .limit(1);

  return row ? CourseResource.parse(row) : null;
};

export type UpdateCourseResourceInput = {
  tenantId: string;
  courseId: string;
  courseResourceId: string;
  moduleId: string | null;
  unitId: string | null;
  resourceType: CourseResourceContract['resourceType'];
  title: string;
  body: string;
  sourceUri: string | null;
  visibility: CourseResourceContract['visibility'];
  accessPolicy: CourseResourceContract['accessPolicy'];
  position: number;
  learningObjectiveIds: string[];
};

export const updateCourseResource = async (
  db: Database,
  input: UpdateCourseResourceInput,
  now = new Date(),
): Promise<CourseResourceContract | null> => {
  const [row] = await db
    .update(courseResource)
    .set({
      moduleId: input.moduleId === null ? null : CourseModuleId.parse(input.moduleId),
      unitId: input.unitId === null ? null : CourseUnitId.parse(input.unitId),
      resourceType: input.resourceType,
      title: input.title,
      body: input.body,
      sourceUri: input.sourceUri,
      visibility: input.visibility,
      accessPolicy: input.accessPolicy,
      position: input.position,
      learningObjectiveIds: input.learningObjectiveIds.map((id) => LearningObjectiveId.parse(id)),
      version: sql`${courseResource.version} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(courseResource.tenantId, input.tenantId),
        eq(courseResource.courseId, input.courseId),
        eq(courseResource.id, input.courseResourceId),
      ),
    )
    .returning();

  return row ? CourseResource.parse(row) : null;
};

export type DeleteCourseResourceInput = {
  tenantId: string;
  courseId: string;
  courseResourceId: string;
};

export const deleteCourseResource = async (
  db: Database,
  input: DeleteCourseResourceInput,
): Promise<boolean> => {
  const result = await db
    .delete(courseResource)
    .where(
      and(
        eq(courseResource.tenantId, input.tenantId),
        eq(courseResource.courseId, input.courseId),
        eq(courseResource.id, input.courseResourceId),
      ),
    )
    .returning({ id: courseResource.id });

  return result.length > 0;
};

export type ListCourseResourcesInput = {
  tenantId: string;
  courseId: string;
  moduleId?: string;
  unitId?: string;
};

export const listCourseResources = async (
  db: Database,
  input: ListCourseResourcesInput,
): Promise<CourseResourceContract[]> => {
  const modulePosition = sql<number>`(
    SELECT ${courseModule.position}
    FROM ${courseModule}
    WHERE ${courseModule.tenantId} = ${courseResource.tenantId}
      AND ${courseModule.id} = ${courseResource.moduleId}
  )`;
  const unitPosition = sql<number>`(
    SELECT ${courseUnit.position}
    FROM ${courseUnit}
    WHERE ${courseUnit.tenantId} = ${courseResource.tenantId}
      AND ${courseUnit.id} = ${courseResource.unitId}
  )`;
  const conditions = [
    eq(courseResource.tenantId, input.tenantId),
    eq(courseResource.courseId, input.courseId),
  ];

  if (input.moduleId) {
    conditions.push(eq(courseResource.moduleId, input.moduleId));
  }

  if (input.unitId) {
    conditions.push(eq(courseResource.unitId, input.unitId));
  }

  const rows = await db
    .select()
    .from(courseResource)
    .where(and(...conditions))
    .orderBy(
      asc(modulePosition),
      asc(unitPosition),
      asc(courseResource.position),
      asc(courseResource.title),
      asc(courseResource.id),
    );

  return rows.map((row) => CourseResource.parse(row));
};

export const saveLearningObjective = async (
  db: Database,
  value: LearningObjectiveContract,
): Promise<LearningObjectiveContract> => {
  const parsed = LearningObjective.parse(value);
  const [row] = await db.insert(learningObjective).values(parsed).returning();

  if (!row) {
    throw new Error('Learning objective could not be saved because the database returned no row.');
  }

  return LearningObjective.parse(row);
};

export type CreateLearningObjectiveInput = {
  tenantId: string;
  courseId: string;
  code: string;
  title: string;
  description: string | null;
  status: LearningObjectiveContract['status'];
  position: number;
};

export const createLearningObjective = async (
  db: Database,
  input: CreateLearningObjectiveInput,
  now = new Date(),
): Promise<LearningObjectiveContract> => {
  const parsed = LearningObjective.parse({
    id: LearningObjectiveId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    code: input.code,
    title: input.title,
    description: input.description,
    status: input.status,
    position: input.position,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(learningObjective).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Learning objective could not be created because the database returned no row.',
    );
  }

  return LearningObjective.parse(row);
};

export const getLearningObjectiveById = async (
  db: Database,
  tenantId: string,
  learningObjectiveId: string,
): Promise<LearningObjectiveContract | null> => {
  const [row] = await db
    .select()
    .from(learningObjective)
    .where(
      and(eq(learningObjective.tenantId, tenantId), eq(learningObjective.id, learningObjectiveId)),
    )
    .limit(1);

  if (!row || row.tenantId !== tenantId) {
    return null;
  }

  return LearningObjective.parse(row);
};

export type ListLearningObjectivesForCourseInput = {
  tenantId: string;
  courseId: string;
};

export const listLearningObjectivesForCourse = async (
  db: Database,
  input: ListLearningObjectivesForCourseInput,
): Promise<LearningObjectiveContract[]> => {
  const rows = await db
    .select()
    .from(learningObjective)
    .where(
      and(
        eq(learningObjective.tenantId, input.tenantId),
        eq(learningObjective.courseId, input.courseId),
      ),
    )
    .orderBy(asc(learningObjective.position));

  return rows.map((row) => LearningObjective.parse(row));
};

export type ListLearningObjectivesByIdsInput = {
  tenantId: string;
  courseId: string;
  learningObjectiveIds: string[];
};

export const listLearningObjectivesByIds = async (
  db: Database,
  input: ListLearningObjectivesByIdsInput,
): Promise<LearningObjectiveContract[]> => {
  if (input.learningObjectiveIds.length === 0) {
    return [];
  }

  const rows = await db
    .select()
    .from(learningObjective)
    .where(
      and(
        eq(learningObjective.tenantId, input.tenantId),
        eq(learningObjective.courseId, input.courseId),
        inArray(learningObjective.id, input.learningObjectiveIds),
      ),
    );

  return rows.map((row) => LearningObjective.parse(row));
};

export type ListLearningObjectiveMasteryForCourseInput = {
  tenantId: string;
  courseId: string;
  studentId?: string;
};

export const listLearningObjectiveMasteryForCourse = async (
  db: Database,
  input: ListLearningObjectiveMasteryForCourseInput,
): Promise<LearningObjectiveMasteryContract[]> => {
  const conditions = [
    eq(learningObjectiveMastery.tenantId, input.tenantId),
    eq(learningObjectiveMastery.courseId, input.courseId),
  ];

  if (input.studentId) {
    conditions.push(eq(learningObjectiveMastery.studentId, input.studentId));
  }

  const rows = await db
    .select()
    .from(learningObjectiveMastery)
    .where(and(...conditions))
    .orderBy(
      asc(learningObjectiveMastery.studentId),
      asc(learningObjectiveMastery.learningObjectiveId),
    );

  return rows.map((row) => LearningObjectiveMastery.parse(row));
};

export const upsertLearningObjectiveMastery = async (
  db: Database,
  value: LearningObjectiveMasteryContract,
): Promise<LearningObjectiveMasteryContract> => {
  const parsed = LearningObjectiveMastery.parse(value);
  const [row] = await db
    .insert(learningObjectiveMastery)
    .values(parsed)
    .onConflictDoUpdate({
      target: [
        learningObjectiveMastery.tenantId,
        learningObjectiveMastery.courseId,
        learningObjectiveMastery.learningObjectiveId,
        learningObjectiveMastery.studentId,
      ],
      set: {
        status: parsed.status,
        score: parsed.score,
        maxScore: parsed.maxScore,
        lastAssessedAt: parsed.lastAssessedAt,
        evidenceCount: parsed.evidenceCount,
        updatedAt: parsed.updatedAt,
      },
    })
    .returning();

  if (!row) {
    throw new Error(
      'Learning objective mastery could not be upserted because the database returned no row.',
    );
  }

  return LearningObjectiveMastery.parse(row);
};

export const saveCoursePage = async (
  db: Database,
  value: CoursePageContract,
): Promise<CoursePageContract> => {
  const parsed = CoursePage.parse(value);
  const [row] = await db.insert(coursePage).values(parsed).returning();

  if (!row) {
    throw new Error('Course page could not be saved because the database returned no row.');
  }

  return CoursePage.parse(row);
};

export type CreateCoursePageInput = {
  tenantId: string;
  courseId: string;
  title: string;
  body: string;
  visibility: CoursePageContract['visibility'];
  learningObjectiveIds: string[];
};

export const createCoursePage = async (
  db: Database,
  input: CreateCoursePageInput,
  now = new Date(),
): Promise<CoursePageContract> => {
  const parsed = CoursePage.parse({
    id: CoursePageId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    title: input.title,
    body: input.body,
    visibility: input.visibility,
    version: 1,
    learningObjectiveIds: input.learningObjectiveIds.map((id) => LearningObjectiveId.parse(id)),
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(coursePage).values(parsed).returning();

  if (!row) {
    throw new Error('Course page could not be created because the database returned no row.');
  }

  return CoursePage.parse(row);
};

export const getCoursePageById = async (
  db: Database,
  tenantId: string,
  coursePageId: string,
): Promise<CoursePageContract | null> => {
  const [row] = await db
    .select()
    .from(coursePage)
    .where(and(eq(coursePage.tenantId, tenantId), eq(coursePage.id, coursePageId)))
    .limit(1);

  return row ? CoursePage.parse(row) : null;
};

export type ListCoursePagesForCourseInput = {
  tenantId: string;
  courseId: string;
};

export const listCoursePagesForCourse = async (
  db: Database,
  input: ListCoursePagesForCourseInput,
): Promise<CoursePageContract[]> => {
  const rows = await db
    .select()
    .from(coursePage)
    .where(and(eq(coursePage.tenantId, input.tenantId), eq(coursePage.courseId, input.courseId)))
    .orderBy(asc(coursePage.title));

  return rows.map((row) => CoursePage.parse(row));
};

export type GetCoursePageForCourseInput = {
  tenantId: string;
  courseId: string;
  coursePageId: string;
};

export const getCoursePageForCourse = async (
  db: Database,
  input: GetCoursePageForCourseInput,
): Promise<CoursePageContract | null> => {
  const [row] = await db
    .select()
    .from(coursePage)
    .where(
      and(
        eq(coursePage.tenantId, input.tenantId),
        eq(coursePage.courseId, input.courseId),
        eq(coursePage.id, input.coursePageId),
      ),
    )
    .limit(1);

  if (!row || row.courseId !== input.courseId) {
    return null;
  }

  return CoursePage.parse(row);
};

export type UpdateCoursePageInput = {
  tenantId: string;
  courseId: string;
  coursePageId: string;
  title: string;
  body: string;
  visibility: CoursePageContract['visibility'];
  learningObjectiveIds: string[];
};

export const updateCoursePage = async (
  db: Database,
  input: UpdateCoursePageInput,
  now = new Date(),
): Promise<CoursePageContract | null> => {
  const [row] = await db
    .update(coursePage)
    .set({
      title: input.title,
      body: input.body,
      visibility: input.visibility,
      learningObjectiveIds: input.learningObjectiveIds.map((id) => LearningObjectiveId.parse(id)),
      version: sql`${coursePage.version} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(coursePage.tenantId, input.tenantId),
        eq(coursePage.courseId, input.courseId),
        eq(coursePage.id, input.coursePageId),
      ),
    )
    .returning();

  return row ? CoursePage.parse(row) : null;
};

export type DeleteCoursePageInput = {
  tenantId: string;
  courseId: string;
  coursePageId: string;
};

export const deleteCoursePage = async (
  db: Database,
  input: DeleteCoursePageInput,
): Promise<boolean> => {
  const result = await db
    .delete(coursePage)
    .where(
      and(
        eq(coursePage.tenantId, input.tenantId),
        eq(coursePage.courseId, input.courseId),
        eq(coursePage.id, input.coursePageId),
      ),
    )
    .returning({ id: coursePage.id });

  return result.length > 0;
};

export type UpdateCourseModuleInput = {
  tenantId: string;
  courseId: string;
  courseModuleId: string;
  title: string;
  summary: string | null;
  visibility: CourseModuleContract['visibility'];
  accessPolicy: CourseModuleContract['accessPolicy'];
  position: number;
  learningObjectiveIds: string[];
};

export const updateCourseModule = async (
  db: Database,
  input: UpdateCourseModuleInput,
  now = new Date(),
): Promise<CourseModuleContract | null> => {
  const [row] = await db
    .update(courseModule)
    .set({
      title: input.title,
      summary: input.summary,
      visibility: input.visibility,
      accessPolicy: input.accessPolicy,
      position: input.position,
      learningObjectiveIds: input.learningObjectiveIds.map((id) => LearningObjectiveId.parse(id)),
      version: sql`${courseModule.version} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(courseModule.tenantId, input.tenantId),
        eq(courseModule.courseId, input.courseId),
        eq(courseModule.id, input.courseModuleId),
      ),
    )
    .returning();

  return row ? CourseModule.parse(row) : null;
};

export type DeleteCourseModuleInput = {
  tenantId: string;
  courseId: string;
  courseModuleId: string;
};

export const deleteCourseModule = async (
  db: Database,
  input: DeleteCourseModuleInput,
): Promise<boolean> => {
  const result = await db
    .delete(courseModule)
    .where(
      and(
        eq(courseModule.tenantId, input.tenantId),
        eq(courseModule.courseId, input.courseId),
        eq(courseModule.id, input.courseModuleId),
      ),
    )
    .returning({ id: courseModule.id });

  return result.length > 0;
};

export type UpdateCourseUnitInput = {
  tenantId: string;
  courseId: string;
  courseUnitId: string;
  moduleId: string;
  title: string;
  summary: string | null;
  visibility: CourseUnitContract['visibility'];
  accessPolicy: CourseUnitContract['accessPolicy'];
  position: number;
  learningObjectiveIds: string[];
};

export const updateCourseUnit = async (
  db: Database,
  input: UpdateCourseUnitInput,
  now = new Date(),
): Promise<CourseUnitContract | null> => {
  const [row] = await db
    .update(courseUnit)
    .set({
      moduleId: CourseModuleId.parse(input.moduleId),
      title: input.title,
      summary: input.summary,
      visibility: input.visibility,
      accessPolicy: input.accessPolicy,
      position: input.position,
      learningObjectiveIds: input.learningObjectiveIds.map((id) => LearningObjectiveId.parse(id)),
      version: sql`${courseUnit.version} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(courseUnit.tenantId, input.tenantId),
        eq(courseUnit.courseId, input.courseId),
        eq(courseUnit.id, input.courseUnitId),
      ),
    )
    .returning();

  return row ? CourseUnit.parse(row) : null;
};

export type DeleteCourseUnitInput = {
  tenantId: string;
  courseId: string;
  courseUnitId: string;
};

export const deleteCourseUnit = async (
  db: Database,
  input: DeleteCourseUnitInput,
): Promise<boolean> => {
  const result = await db
    .delete(courseUnit)
    .where(
      and(
        eq(courseUnit.tenantId, input.tenantId),
        eq(courseUnit.courseId, input.courseId),
        eq(courseUnit.id, input.courseUnitId),
      ),
    )
    .returning({ id: courseUnit.id });

  return result.length > 0;
};

export type UpdateLearningObjectiveInput = {
  tenantId: string;
  courseId: string;
  learningObjectiveId: string;
  code: string;
  title: string;
  description: string | null;
  status: LearningObjectiveContract['status'];
  position: number;
};

export const updateLearningObjective = async (
  db: Database,
  input: UpdateLearningObjectiveInput,
  now = new Date(),
): Promise<LearningObjectiveContract | null> => {
  const [row] = await db
    .update(learningObjective)
    .set({
      code: input.code,
      title: input.title,
      description: input.description,
      status: input.status,
      position: input.position,
      updatedAt: now,
    })
    .where(
      and(
        eq(learningObjective.tenantId, input.tenantId),
        eq(learningObjective.courseId, input.courseId),
        eq(learningObjective.id, input.learningObjectiveId),
      ),
    )
    .returning();

  return row ? LearningObjective.parse(row) : null;
};

export type DeleteLearningObjectiveInput = {
  tenantId: string;
  courseId: string;
  learningObjectiveId: string;
};

export const deleteLearningObjective = async (
  db: Database,
  input: DeleteLearningObjectiveInput,
): Promise<boolean> => {
  const result = await db
    .delete(learningObjective)
    .where(
      and(
        eq(learningObjective.tenantId, input.tenantId),
        eq(learningObjective.courseId, input.courseId),
        eq(learningObjective.id, input.learningObjectiveId),
      ),
    )
    .returning({ id: learningObjective.id });

  return result.length > 0;
};
