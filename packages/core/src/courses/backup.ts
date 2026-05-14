import {
  Course,
  CourseBackup,
  type CourseBackup as CourseBackupContract,
  CourseId,
  CourseModule,
  CourseModuleId,
  CoursePage,
  CoursePageId,
  CourseResource,
  CourseResourceId,
  CourseUnit,
  CourseUnitId,
  LearningObjective,
  LearningObjectiveId,
  TenantId,
} from '@openlms/contracts';
import { and, asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import {
  course,
  courseModule,
  coursePage,
  courseResource,
  courseUnit,
  learningObjective,
} from '../db/schema/course.ts';

export type ExportCourseBackupInput = {
  tenantId: string;
  courseId: string;
};

// Returns null if the course doesn't exist in the tenant.
export const exportCourseBackup = async (
  db: Database,
  input: ExportCourseBackupInput,
  now = new Date(),
): Promise<CourseBackupContract | null> => {
  const [courseRow] = await db
    .select()
    .from(course)
    .where(and(eq(course.tenantId, input.tenantId), eq(course.id, input.courseId)))
    .limit(1);

  if (!courseRow) {
    return null;
  }

  const [loRows, moduleRows, unitRows, pageRows, resourceRows] = await Promise.all([
    db
      .select()
      .from(learningObjective)
      .where(
        and(
          eq(learningObjective.tenantId, input.tenantId),
          eq(learningObjective.courseId, input.courseId),
        ),
      )
      .orderBy(asc(learningObjective.position)),
    db
      .select()
      .from(courseModule)
      .where(
        and(eq(courseModule.tenantId, input.tenantId), eq(courseModule.courseId, input.courseId)),
      )
      .orderBy(asc(courseModule.position)),
    db
      .select()
      .from(courseUnit)
      .where(and(eq(courseUnit.tenantId, input.tenantId), eq(courseUnit.courseId, input.courseId)))
      .orderBy(asc(courseUnit.position)),
    db
      .select()
      .from(coursePage)
      .where(and(eq(coursePage.tenantId, input.tenantId), eq(coursePage.courseId, input.courseId))),
    db
      .select()
      .from(courseResource)
      .where(
        and(
          eq(courseResource.tenantId, input.tenantId),
          eq(courseResource.courseId, input.courseId),
        ),
      )
      .orderBy(asc(courseResource.position)),
  ]);

  return CourseBackup.parse({
    formatVersion: '1',
    exportedAt: now,
    course: Course.parse(courseRow),
    learningObjectives: loRows.map((row) => LearningObjective.parse(row)),
    modules: moduleRows.map((row) => CourseModule.parse(row)),
    units: unitRows.map((row) => CourseUnit.parse(row)),
    pages: pageRows.map((row) => CoursePage.parse(row)),
    resources: resourceRows.map((row) => CourseResource.parse(row)),
  });
};

export type RestoreCourseBackupInput = {
  tenantId: string;
  targetCourseId: string;
  backup: CourseBackupContract;
};

export type RestoreCourseBackupResult = {
  learningObjectivesRestored: number;
  modulesRestored: number;
  unitsRestored: number;
  pagesRestored: number;
  resourcesRestored: number;
};

export class CourseRestoreVersionError extends Error {
  override readonly name = 'CourseRestoreVersionError';
}

export class CourseRestoreTargetMissingError extends Error {
  override readonly name = 'CourseRestoreTargetMissingError';
}

const remapIds = (ids: string[], map: Map<string, string>): string[] => {
  const out: string[] = [];
  for (const id of ids) {
    const remapped = map.get(id);
    if (remapped) {
      out.push(remapped);
    }
  }
  return out;
};

// Restores a backup JSON into a target course (same tenant). All IDs are
// regenerated; cross-references are remapped via build-as-you-go maps.
// Existing target content is preserved; restored entities append at the end
// of position order.
export const restoreCourseBackup = async (
  db: Database,
  input: RestoreCourseBackupInput,
  now = new Date(),
): Promise<RestoreCourseBackupResult> => {
  if (input.backup.formatVersion !== '1') {
    throw new CourseRestoreVersionError(
      `Unsupported backup formatVersion: ${input.backup.formatVersion}`,
    );
  }

  return db.transaction(async (tx) => {
    const [targetCourse] = await tx
      .select({ id: course.id })
      .from(course)
      .where(and(eq(course.tenantId, input.tenantId), eq(course.id, input.targetCourseId)))
      .limit(1);

    if (!targetCourse) {
      throw new CourseRestoreTargetMissingError('Target course was not found in this tenant.');
    }

    // 1. Learning objectives.
    const targetLoPositions = await tx
      .select({ position: learningObjective.position })
      .from(learningObjective)
      .where(
        and(
          eq(learningObjective.tenantId, input.tenantId),
          eq(learningObjective.courseId, input.targetCourseId),
        ),
      );
    const loStart =
      targetLoPositions.length === 0
        ? 0
        : Math.max(...targetLoPositions.map((row) => row.position)) + 1;

    const loIdMap = new Map<string, string>();
    for (const [i, lo] of input.backup.learningObjectives.entries()) {
      const newId = LearningObjectiveId.parse(ulid());
      loIdMap.set(lo.id, newId);
      await tx.insert(learningObjective).values({
        id: newId,
        tenantId: TenantId.parse(input.tenantId),
        courseId: CourseId.parse(input.targetCourseId),
        code: lo.code,
        title: lo.title,
        description: lo.description,
        status: lo.status,
        position: loStart + i,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 2. Modules.
    const targetModulePositions = await tx
      .select({ position: courseModule.position })
      .from(courseModule)
      .where(
        and(
          eq(courseModule.tenantId, input.tenantId),
          eq(courseModule.courseId, input.targetCourseId),
        ),
      );
    const moduleStart =
      targetModulePositions.length === 0
        ? 0
        : Math.max(...targetModulePositions.map((row) => row.position)) + 1;

    const moduleIdMap = new Map<string, string>();
    for (const [i, mod] of input.backup.modules.entries()) {
      const newId = CourseModuleId.parse(ulid());
      moduleIdMap.set(mod.id, newId);
      const parsed = CourseModule.parse({
        id: newId,
        tenantId: TenantId.parse(input.tenantId),
        courseId: CourseId.parse(input.targetCourseId),
        title: mod.title,
        summary: mod.summary,
        visibility: mod.visibility,
        accessPolicy: mod.accessPolicy,
        version: 1,
        position: moduleStart + i,
        learningObjectiveIds: remapIds(mod.learningObjectiveIds, loIdMap),
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(courseModule).values(parsed);
    }

    // 3. Units.
    const unitIdMap = new Map<string, string>();
    let unitsRestored = 0;
    for (const unit of input.backup.units) {
      const newModuleId = moduleIdMap.get(unit.moduleId);
      if (!newModuleId) {
        continue;
      }
      const newId = CourseUnitId.parse(ulid());
      unitIdMap.set(unit.id, newId);
      const parsed = CourseUnit.parse({
        id: newId,
        tenantId: TenantId.parse(input.tenantId),
        courseId: CourseId.parse(input.targetCourseId),
        moduleId: newModuleId,
        title: unit.title,
        summary: unit.summary,
        visibility: unit.visibility,
        accessPolicy: unit.accessPolicy,
        version: 1,
        position: unit.position,
        learningObjectiveIds: remapIds(unit.learningObjectiveIds, loIdMap),
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(courseUnit).values(parsed);
      unitsRestored += 1;
    }

    // 4. Pages.
    for (const page of input.backup.pages) {
      const newId = CoursePageId.parse(ulid());
      const parsed = CoursePage.parse({
        id: newId,
        tenantId: TenantId.parse(input.tenantId),
        courseId: CourseId.parse(input.targetCourseId),
        title: page.title,
        body: page.body,
        visibility: page.visibility,
        version: 1,
        learningObjectiveIds: remapIds(page.learningObjectiveIds, loIdMap),
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(coursePage).values(parsed);
    }

    // 5. Resources.
    let resourcesRestored = 0;
    for (const resource of input.backup.resources) {
      const newId = CourseResourceId.parse(ulid());
      const remappedModuleId = resource.moduleId
        ? (moduleIdMap.get(resource.moduleId) ?? null)
        : null;
      const remappedUnitId = resource.unitId ? (unitIdMap.get(resource.unitId) ?? null) : null;
      const parsed = CourseResource.parse({
        id: newId,
        tenantId: TenantId.parse(input.tenantId),
        courseId: CourseId.parse(input.targetCourseId),
        moduleId: remappedModuleId,
        unitId: remappedUnitId,
        resourceType: resource.resourceType,
        title: resource.title,
        body: resource.body,
        sourceUri: resource.sourceUri,
        visibility: resource.visibility,
        accessPolicy: resource.accessPolicy,
        version: 1,
        position: resource.position,
        learningObjectiveIds: remapIds(resource.learningObjectiveIds, loIdMap),
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(courseResource).values(parsed);
      resourcesRestored += 1;
    }

    return {
      learningObjectivesRestored: input.backup.learningObjectives.length,
      modulesRestored: input.backup.modules.length,
      unitsRestored,
      pagesRestored: input.backup.pages.length,
      resourcesRestored,
    };
  });
};
