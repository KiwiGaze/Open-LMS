import {
  CourseId,
  CourseModule,
  CourseModuleId,
  CoursePage,
  CoursePageId,
  CourseResource,
  CourseResourceId,
  CourseUnit,
  CourseUnitId,
  GlossaryEntry,
  GlossaryEntryId,
  LearningObjectiveId,
  TenantId,
  WikiPage,
  WikiPageId,
} from '@openlms/contracts';
import { and, asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import {
  courseModule,
  coursePage,
  courseResource,
  courseUnit,
  learningObjective,
} from '../db/schema/course.ts';
import { glossaryEntry } from '../db/schema/glossary.ts';
import { wikiPage } from '../db/schema/wiki.ts';

export type CopyCourseTemplateInput = {
  tenantId: string;
  sourceCourseId: string;
  targetCourseId: string;
};

export type CopyCourseTemplateResult = {
  learningObjectivesCopied: number;
  modulesCopied: number;
  unitsCopied: number;
  pagesCopied: number;
  resourcesCopied: number;
  wikiPagesCopied: number;
  glossaryEntriesCopied: number;
};

export class CourseCopySameCourseError extends Error {
  override readonly name = 'CourseCopySameCourseError';
}

type TxLike = Parameters<Parameters<Database['transaction']>[0]>[0];

const maxPosition = async <T extends { position: number }>(rows: T[]): Promise<number | null> => {
  let max: number | null = null;
  for (const row of rows) {
    if (max === null || row.position > max) {
      max = row.position;
    }
  }
  return max;
};

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

// Copies learning objectives, modules, units, pages, resources, wiki pages, and
// glossary entries from source course to target course (same tenant only). All
// cross-references (module/page/wiki -> LOs, unit -> module, resource -> module/unit) are remapped.
// Existing target content is preserved; copies append at the end of position order.
export const copyCourseTemplate = async (
  db: Database,
  input: CopyCourseTemplateInput,
  now = new Date(),
): Promise<CopyCourseTemplateResult> => {
  if (input.sourceCourseId === input.targetCourseId) {
    throw new CourseCopySameCourseError('Course copy source and target must be different courses.');
  }

  return db.transaction(async (tx) => {
    const loIdMap = await copyLearningObjectives(tx, input, now);
    const { moduleIdMap, modulesCopied } = await copyModules(tx, input, loIdMap, now);
    const { unitIdMap, unitsCopied } = await copyUnits(tx, input, moduleIdMap, loIdMap, now);
    const pagesCopied = await copyPages(tx, input, loIdMap, now);
    const resourcesCopied = await copyResources(tx, input, moduleIdMap, unitIdMap, loIdMap, now);
    const wikiPagesCopied = await copyWikiPages(tx, input, loIdMap, now);
    const glossaryEntriesCopied = await copyGlossaryEntries(tx, input, now);

    return {
      learningObjectivesCopied: loIdMap.size,
      modulesCopied,
      unitsCopied,
      pagesCopied,
      resourcesCopied,
      wikiPagesCopied,
      glossaryEntriesCopied,
    };
  });
};

const uniqueSlugForCopy = (slug: string, existingSlugs: Set<string>): string => {
  if (!existingSlugs.has(slug)) {
    existingSlugs.add(slug);
    return slug;
  }

  let suffixNumber = 1;
  while (true) {
    const suffix = suffixNumber === 1 ? '-copy' : `-copy-${suffixNumber}`;
    const base = slug.slice(0, 120 - suffix.length).replace(/-+$/, '') || 'page';
    const candidate = `${base}${suffix}`;
    if (!existingSlugs.has(candidate)) {
      existingSlugs.add(candidate);
      return candidate;
    }
    suffixNumber += 1;
  }
};

const uniqueTermForCopy = (term: string, existingTerms: Set<string>): string => {
  if (!existingTerms.has(term)) {
    existingTerms.add(term);
    return term;
  }

  let suffixNumber = 1;
  while (true) {
    const suffix = suffixNumber === 1 ? ' (copy)' : ` (copy ${suffixNumber})`;
    const candidate = `${term.slice(0, 160 - suffix.length).trimEnd()}${suffix}`;
    if (!existingTerms.has(candidate)) {
      existingTerms.add(candidate);
      return candidate;
    }
    suffixNumber += 1;
  }
};

const copyLearningObjectives = async (
  tx: TxLike,
  input: CopyCourseTemplateInput,
  now: Date,
): Promise<Map<string, string>> => {
  const sourceLOs = await tx
    .select()
    .from(learningObjective)
    .where(
      and(
        eq(learningObjective.tenantId, input.tenantId),
        eq(learningObjective.courseId, input.sourceCourseId),
      ),
    )
    .orderBy(asc(learningObjective.position));

  const targetLoPositions = await tx
    .select({ position: learningObjective.position })
    .from(learningObjective)
    .where(
      and(
        eq(learningObjective.tenantId, input.tenantId),
        eq(learningObjective.courseId, input.targetCourseId),
      ),
    );
  const start = ((await maxPosition(targetLoPositions)) ?? -1) + 1;

  const loIdMap = new Map<string, string>();
  for (const [i, lo] of sourceLOs.entries()) {
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
      position: start + i,
      createdAt: now,
      updatedAt: now,
    });
  }

  return loIdMap;
};

const copyModules = async (
  tx: TxLike,
  input: CopyCourseTemplateInput,
  loIdMap: Map<string, string>,
  now: Date,
): Promise<{ moduleIdMap: Map<string, string>; modulesCopied: number }> => {
  const sourceModules = await tx
    .select()
    .from(courseModule)
    .where(
      and(
        eq(courseModule.tenantId, input.tenantId),
        eq(courseModule.courseId, input.sourceCourseId),
      ),
    )
    .orderBy(asc(courseModule.position));

  const targetPositions = await tx
    .select({ position: courseModule.position })
    .from(courseModule)
    .where(
      and(
        eq(courseModule.tenantId, input.tenantId),
        eq(courseModule.courseId, input.targetCourseId),
      ),
    );
  const start = ((await maxPosition(targetPositions)) ?? -1) + 1;

  const moduleIdMap = new Map<string, string>();
  for (const [i, mod] of sourceModules.entries()) {
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
      position: start + i,
      learningObjectiveIds: remapIds(mod.learningObjectiveIds, loIdMap),
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(courseModule).values(parsed);
  }

  return { moduleIdMap, modulesCopied: sourceModules.length };
};

const copyUnits = async (
  tx: TxLike,
  input: CopyCourseTemplateInput,
  moduleIdMap: Map<string, string>,
  loIdMap: Map<string, string>,
  now: Date,
): Promise<{ unitIdMap: Map<string, string>; unitsCopied: number }> => {
  const sourceUnits = await tx
    .select()
    .from(courseUnit)
    .where(
      and(eq(courseUnit.tenantId, input.tenantId), eq(courseUnit.courseId, input.sourceCourseId)),
    )
    .orderBy(asc(courseUnit.position));

  const unitIdMap = new Map<string, string>();
  let unitsCopied = 0;
  for (const unit of sourceUnits) {
    const newModuleId = moduleIdMap.get(unit.moduleId);
    if (!newModuleId) {
      // Module wasn't copied (shouldn't happen because we copy all modules).
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
    unitsCopied += 1;
  }

  return { unitIdMap, unitsCopied };
};

const copyPages = async (
  tx: TxLike,
  input: CopyCourseTemplateInput,
  loIdMap: Map<string, string>,
  now: Date,
): Promise<number> => {
  const sourcePages = await tx
    .select()
    .from(coursePage)
    .where(
      and(eq(coursePage.tenantId, input.tenantId), eq(coursePage.courseId, input.sourceCourseId)),
    );

  for (const page of sourcePages) {
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

  return sourcePages.length;
};

const copyResources = async (
  tx: TxLike,
  input: CopyCourseTemplateInput,
  moduleIdMap: Map<string, string>,
  unitIdMap: Map<string, string>,
  loIdMap: Map<string, string>,
  now: Date,
): Promise<number> => {
  const sourceResources = await tx
    .select()
    .from(courseResource)
    .where(
      and(
        eq(courseResource.tenantId, input.tenantId),
        eq(courseResource.courseId, input.sourceCourseId),
      ),
    )
    .orderBy(asc(courseResource.position));

  let resourcesCopied = 0;
  for (const resource of sourceResources) {
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
    resourcesCopied += 1;
  }

  return resourcesCopied;
};

const copyWikiPages = async (
  tx: TxLike,
  input: CopyCourseTemplateInput,
  loIdMap: Map<string, string>,
  now: Date,
): Promise<number> => {
  const sourcePages = await tx
    .select()
    .from(wikiPage)
    .where(
      and(
        eq(wikiPage.tenantId, input.tenantId),
        eq(wikiPage.courseId, input.sourceCourseId),
      ),
    )
    .orderBy(asc(wikiPage.title), asc(wikiPage.id));

  const targetPages = await tx
    .select({ slug: wikiPage.slug })
    .from(wikiPage)
    .where(
      and(
        eq(wikiPage.tenantId, input.tenantId),
        eq(wikiPage.courseId, input.targetCourseId),
      ),
    );
  const existingSlugs = new Set(targetPages.map((page) => page.slug));

  for (const page of sourcePages) {
    const parsed = WikiPage.parse({
      id: WikiPageId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      courseId: CourseId.parse(input.targetCourseId),
      slug: uniqueSlugForCopy(page.slug, existingSlugs),
      title: page.title,
      content: page.content,
      status: page.status,
      learningObjectiveIds: remapIds(page.learningObjectiveIds, loIdMap),
      createdById: page.createdById,
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(wikiPage).values(parsed);
  }

  return sourcePages.length;
};

const copyGlossaryEntries = async (
  tx: TxLike,
  input: CopyCourseTemplateInput,
  now: Date,
): Promise<number> => {
  const sourceEntries = await tx
    .select()
    .from(glossaryEntry)
    .where(
      and(
        eq(glossaryEntry.tenantId, input.tenantId),
        eq(glossaryEntry.courseId, input.sourceCourseId),
      ),
    )
    .orderBy(asc(glossaryEntry.term), asc(glossaryEntry.id));

  const targetEntries = await tx
    .select({ term: glossaryEntry.term })
    .from(glossaryEntry)
    .where(
      and(
        eq(glossaryEntry.tenantId, input.tenantId),
        eq(glossaryEntry.courseId, input.targetCourseId),
      ),
    );
  const existingTerms = new Set(targetEntries.map((entry) => entry.term));

  for (const entry of sourceEntries) {
    const parsed = GlossaryEntry.parse({
      id: GlossaryEntryId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      courseId: CourseId.parse(input.targetCourseId),
      term: uniqueTermForCopy(entry.term, existingTerms),
      definition: entry.definition,
      status: entry.status,
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(glossaryEntry).values(parsed);
  }

  return sourceEntries.length;
};
