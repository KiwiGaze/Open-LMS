import {
  CourseId,
  LearningEvidence,
  type LearningEvidence as LearningEvidenceContract,
  LearningEvidenceId,
  LearningObjectiveId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { learningEvidence } from '../db/schema/learning-evidence.ts';

export type RecordLearningEvidenceInput = {
  tenantId: string;
  courseId: string;
  studentId: string;
  objectiveId: string;
  source: LearningEvidenceContract['source'];
  signal: LearningEvidenceContract['signal'];
  score: number | null;
  maxScore: number | null;
  confidence: number;
  misconceptionIds: string[];
  evidenceText: string;
  provenance: LearningEvidenceContract['provenance'];
  context: LearningEvidenceContract['context'];
};

const toLearningEvidenceContract = (
  row: typeof learningEvidence.$inferSelect,
): LearningEvidenceContract =>
  LearningEvidence.parse({
    id: row.id,
    tenantId: row.tenantId,
    courseId: row.courseId,
    studentId: row.studentId,
    objectiveId: row.objectiveId,
    source: {
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      attempt: row.sourceAttempt,
      observedAt: row.sourceObservedAt,
    },
    signal: row.signal,
    score: row.score,
    maxScore: row.maxScore,
    confidence: row.confidence,
    misconceptionIds: row.misconceptionIds,
    evidenceText: row.evidenceText,
    provenance: row.provenance,
    context: row.context,
    createdAt: row.createdAt,
  });

export const recordLearningEvidence = async (
  db: Database,
  input: RecordLearningEvidenceInput,
  now = new Date(),
): Promise<LearningEvidenceContract> => {
  const parsed = LearningEvidence.parse({
    id: LearningEvidenceId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    studentId: UserId.parse(input.studentId),
    objectiveId: LearningObjectiveId.parse(input.objectiveId),
    source: input.source,
    signal: input.signal,
    score: input.score,
    maxScore: input.maxScore,
    confidence: input.confidence,
    misconceptionIds: input.misconceptionIds,
    evidenceText: input.evidenceText,
    provenance: input.provenance,
    context: input.context,
    createdAt: now,
  });

  const [row] = await db
    .insert(learningEvidence)
    .values({
      id: parsed.id,
      tenantId: parsed.tenantId,
      courseId: parsed.courseId,
      studentId: parsed.studentId,
      objectiveId: parsed.objectiveId,
      sourceType: parsed.source.sourceType,
      sourceId: parsed.source.sourceId,
      sourceAttempt: parsed.source.attempt,
      sourceObservedAt: parsed.source.observedAt,
      signal: parsed.signal,
      score: parsed.score,
      maxScore: parsed.maxScore,
      confidence: parsed.confidence,
      misconceptionIds: parsed.misconceptionIds,
      evidenceText: parsed.evidenceText,
      provenance: parsed.provenance,
      context: parsed.context,
      createdAt: parsed.createdAt,
    })
    .returning();

  if (!row) {
    throw new Error(
      'Learning evidence could not be recorded because the database returned no row.',
    );
  }

  return toLearningEvidenceContract(row);
};

export type ListLearningEvidenceForStudentInput = {
  tenantId: string;
  courseId: string;
  studentId: string;
};

export const listLearningEvidenceForStudent = async (
  db: Database,
  input: ListLearningEvidenceForStudentInput,
): Promise<LearningEvidenceContract[]> => {
  const rows = await db
    .select()
    .from(learningEvidence)
    .where(
      and(
        eq(learningEvidence.tenantId, input.tenantId),
        eq(learningEvidence.courseId, input.courseId),
        eq(learningEvidence.studentId, input.studentId),
      ),
    )
    .orderBy(asc(learningEvidence.sourceObservedAt), asc(learningEvidence.createdAt));

  return rows.map(toLearningEvidenceContract);
};
