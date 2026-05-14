import {
  Rubric,
  type Rubric as RubricContract,
  RubricCriterion,
  type RubricCriterion as RubricCriterionContract,
  RubricId,
  RubricTemplate,
  type RubricTemplate as RubricTemplateContract,
  RubricTemplateId,
  TenantId,
} from '@openlms/contracts';
import { and, eq, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { rubric, rubricTemplate } from '../db/schema/rubric.ts';

export const saveRubricTemplate = async (
  db: Database,
  value: RubricTemplateContract,
): Promise<RubricTemplateContract> => {
  const parsed = RubricTemplate.parse(value);
  const [row] = await db.insert(rubricTemplate).values(parsed).returning();

  if (!row) {
    throw new Error('Rubric template could not be saved because the database returned no row.');
  }

  return RubricTemplate.parse(row);
};

export const saveRubric = async (db: Database, value: RubricContract): Promise<RubricContract> => {
  const parsed = Rubric.parse(value);
  const [row] = await db.insert(rubric).values(parsed).returning();

  if (!row) {
    throw new Error('Rubric could not be saved because the database returned no row.');
  }

  return Rubric.parse(row);
};

export type CreateRubricInput = {
  tenantId: string;
  title: string;
  sourceTemplateId: string | null;
  criteria: Array<
    Omit<RubricCriterionContract, 'learningObjectiveIds'> & {
      learningObjectiveIds?: RubricCriterionContract['learningObjectiveIds'];
    }
  >;
};

export const createRubric = async (
  db: Database,
  input: CreateRubricInput,
  now = new Date(),
): Promise<RubricContract> => {
  const parsed = Rubric.parse({
    id: RubricId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    title: input.title,
    version: 1,
    sourceTemplateId:
      input.sourceTemplateId === null ? null : RubricTemplateId.parse(input.sourceTemplateId),
    criteria: input.criteria,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(rubric).values(parsed).returning();

  if (!row) {
    throw new Error('Rubric could not be created because the database returned no row.');
  }

  return Rubric.parse(row);
};

export const getRubricById = async (
  db: Database,
  tenantId: string,
  rubricId: string,
): Promise<RubricContract | null> => {
  const [row] = await db
    .select()
    .from(rubric)
    .where(and(eq(rubric.tenantId, tenantId), eq(rubric.id, rubricId)))
    .limit(1);

  if (!row || row.tenantId !== tenantId) {
    return null;
  }

  return Rubric.parse(row);
};

export type UpdateRubricInput = {
  tenantId: string;
  rubricId: string;
  title: string;
  sourceTemplateId: string | null;
  criteria: CreateRubricInput['criteria'];
};

export const updateRubric = async (
  db: Database,
  input: UpdateRubricInput,
  now = new Date(),
): Promise<RubricContract | null> => {
  const criteria = input.criteria.map((criterion) => RubricCriterion.parse(criterion));
  const [row] = await db
    .update(rubric)
    .set({
      title: input.title,
      sourceTemplateId:
        input.sourceTemplateId === null ? null : RubricTemplateId.parse(input.sourceTemplateId),
      criteria,
      version: sql`${rubric.version} + 1`,
      updatedAt: now,
    })
    .where(and(eq(rubric.tenantId, input.tenantId), eq(rubric.id, input.rubricId)))
    .returning();

  return row ? Rubric.parse(row) : null;
};

export type DeleteRubricInput = {
  tenantId: string;
  rubricId: string;
};

export const deleteRubric = async (db: Database, input: DeleteRubricInput): Promise<boolean> => {
  const result = await db
    .delete(rubric)
    .where(and(eq(rubric.tenantId, input.tenantId), eq(rubric.id, input.rubricId)))
    .returning({ id: rubric.id });

  return result.length > 0;
};
