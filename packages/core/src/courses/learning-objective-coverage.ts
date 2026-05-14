import {
  CourseModuleId,
  CoursePageId,
  CourseUnitId,
  LearningObjectiveCoverage,
  type LearningObjectiveCoverage as LearningObjectiveCoverageContract,
  LearningObjectiveId,
  WikiPageId,
} from '@openlms/contracts';
import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { coursePage } from '../db/schema/course.ts';
import { courseModule, courseUnit } from '../db/schema/course.ts';
import { wikiPage } from '../db/schema/wiki.ts';

// Returns the modules, units, and pages in a course whose learningObjectiveIds
// array contains the supplied LO id. Useful for surfacing what will be affected
// before archiving or renaming a learning objective.
export const getLearningObjectiveCoverage = async (
  db: Database,
  tenantId: string,
  courseId: string,
  learningObjectiveId: string,
): Promise<LearningObjectiveCoverageContract> => {
  const objectiveArrayLiteral = JSON.stringify([learningObjectiveId]);

  const [moduleRows, unitRows, pageRows, wikiPageRows] = await Promise.all([
    db
      .select({ id: courseModule.id })
      .from(courseModule)
      .where(
        and(
          eq(courseModule.tenantId, tenantId),
          eq(courseModule.courseId, courseId),
          sql`${courseModule.learningObjectiveIds} @> ${objectiveArrayLiteral}::jsonb`,
        ),
      ),
    db
      .select({ id: courseUnit.id })
      .from(courseUnit)
      .where(
        and(
          eq(courseUnit.tenantId, tenantId),
          eq(courseUnit.courseId, courseId),
          sql`${courseUnit.learningObjectiveIds} @> ${objectiveArrayLiteral}::jsonb`,
        ),
      ),
    db
      .select({ id: coursePage.id })
      .from(coursePage)
      .where(
        and(
          eq(coursePage.tenantId, tenantId),
          eq(coursePage.courseId, courseId),
          sql`${coursePage.learningObjectiveIds} @> ${objectiveArrayLiteral}::jsonb`,
        ),
      ),
    db
      .select({ id: wikiPage.id })
      .from(wikiPage)
      .where(
        and(
          eq(wikiPage.tenantId, tenantId),
          eq(wikiPage.courseId, courseId),
          sql`${wikiPage.learningObjectiveIds} @> ${objectiveArrayLiteral}::jsonb`,
        ),
      ),
  ]);

  return LearningObjectiveCoverage.parse({
    learningObjectiveId: LearningObjectiveId.parse(learningObjectiveId),
    moduleIds: moduleRows.map((row) => CourseModuleId.parse(row.id)),
    unitIds: unitRows.map((row) => CourseUnitId.parse(row.id)),
    pageIds: pageRows.map((row) => CoursePageId.parse(row.id)),
    wikiPageIds: wikiPageRows.map((row) => WikiPageId.parse(row.id)),
  });
};
