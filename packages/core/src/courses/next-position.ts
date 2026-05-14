import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { courseModule, courseSection, courseUnit } from '../db/schema/course.ts';
import { gradebookCategory } from '../db/schema/feedback.ts';

export type NextPositionScope =
  | { kind: 'course_module'; tenantId: string; courseId: string }
  | { kind: 'course_section'; tenantId: string; courseId: string }
  | { kind: 'course_unit'; tenantId: string; courseId: string; moduleId: string }
  | { kind: 'gradebook_category'; tenantId: string; courseId: string };

export const getNextPositionForScope = async (
  db: Database,
  scope: NextPositionScope,
): Promise<number> => {
  switch (scope.kind) {
    case 'course_module': {
      const [row] = await db
        .select({ position: courseModule.position })
        .from(courseModule)
        .where(
          and(eq(courseModule.tenantId, scope.tenantId), eq(courseModule.courseId, scope.courseId)),
        )
        .orderBy(desc(courseModule.position))
        .limit(1);
      return row ? row.position + 1 : 0;
    }
    case 'course_section': {
      const [row] = await db
        .select({ position: courseSection.position })
        .from(courseSection)
        .where(
          and(
            eq(courseSection.tenantId, scope.tenantId),
            eq(courseSection.courseId, scope.courseId),
          ),
        )
        .orderBy(desc(courseSection.position))
        .limit(1);
      return row ? row.position + 1 : 0;
    }
    case 'course_unit': {
      const [row] = await db
        .select({ position: courseUnit.position })
        .from(courseUnit)
        .where(
          and(
            eq(courseUnit.tenantId, scope.tenantId),
            eq(courseUnit.courseId, scope.courseId),
            eq(courseUnit.moduleId, scope.moduleId),
          ),
        )
        .orderBy(desc(courseUnit.position))
        .limit(1);
      return row ? row.position + 1 : 0;
    }
    case 'gradebook_category': {
      const [row] = await db
        .select({ position: gradebookCategory.position })
        .from(gradebookCategory)
        .where(
          and(
            eq(gradebookCategory.tenantId, scope.tenantId),
            eq(gradebookCategory.courseId, scope.courseId),
          ),
        )
        .orderBy(desc(gradebookCategory.position))
        .limit(1);
      return row ? row.position + 1 : 0;
    }
  }
};
