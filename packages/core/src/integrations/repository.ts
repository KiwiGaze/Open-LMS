import {
  AssignmentId,
  CourseExternalTool,
  type CourseExternalTool as CourseExternalToolContract,
  CourseExternalToolId,
  CourseExternalToolOutcome,
  type CourseExternalToolOutcome as CourseExternalToolOutcomeContract,
  CourseExternalToolOutcomeId,
  type CourseExternalToolOutcomeStatus,
  type CourseExternalToolPlacement,
  type CourseExternalToolStatus,
  CourseId,
  IntegrationConnection,
  type IntegrationConnection as IntegrationConnectionContract,
  IntegrationConnectionId,
  type Lti1p3DeepLinkingContentItem,
  Lti1p3DeepLinkingSession,
  type Lti1p3DeepLinkingSession as Lti1p3DeepLinkingSessionContract,
  Lti1p3DeepLinkingSessionId,
  Lti1p3PlatformKey,
  type Lti1p3PlatformKey as Lti1p3PlatformKeyContract,
  Lti1p3PlatformKeyId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, desc, eq, gt, inArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import {
  courseExternalTool,
  courseExternalToolOutcome,
  integrationConnection,
  lti1p3DeepLinkingSession,
  lti1p3PlatformKey,
} from '../db/schema/integration.ts';

export const saveLti1p3PlatformKey = async (
  db: Database,
  value: Lti1p3PlatformKeyContract,
): Promise<Lti1p3PlatformKeyContract> => {
  const parsed = Lti1p3PlatformKey.parse(value);
  const [row] = await db
    .insert(lti1p3PlatformKey)
    .values({
      id: Lti1p3PlatformKeyId.parse(parsed.id),
      tenantId: TenantId.parse(parsed.tenantId),
      keyId: parsed.keyId,
      status: parsed.status,
      publicJwk: parsed.publicJwk,
      encryptedPrivateJwk: parsed.encryptedPrivateJwk,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    })
    .returning();

  if (!row) {
    throw new Error('LTI platform key could not be saved because the database returned no row.');
  }

  return Lti1p3PlatformKey.parse(row);
};

export const listActiveLti1p3PlatformKeys = async (
  db: Database,
  tenantId: string,
): Promise<Lti1p3PlatformKeyContract[]> => {
  const rows = await db
    .select()
    .from(lti1p3PlatformKey)
    .where(and(eq(lti1p3PlatformKey.tenantId, tenantId), eq(lti1p3PlatformKey.status, 'active')))
    .orderBy(asc(lti1p3PlatformKey.createdAt), asc(lti1p3PlatformKey.keyId));

  return rows.map((row) => Lti1p3PlatformKey.parse(row));
};

export const getActiveLti1p3PlatformSigningKey = async (
  db: Database,
  tenantId: string,
): Promise<Lti1p3PlatformKeyContract | null> => {
  const [row] = await db
    .select()
    .from(lti1p3PlatformKey)
    .where(and(eq(lti1p3PlatformKey.tenantId, tenantId), eq(lti1p3PlatformKey.status, 'active')))
    .orderBy(desc(lti1p3PlatformKey.createdAt), desc(lti1p3PlatformKey.keyId))
    .limit(1);

  return row ? Lti1p3PlatformKey.parse(row) : null;
};

export const saveIntegrationConnection = async (
  db: Database,
  value: IntegrationConnectionContract,
): Promise<IntegrationConnectionContract> => {
  const parsed = IntegrationConnection.parse(value);
  const [row] = await db.insert(integrationConnection).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Integration connection could not be saved because the database returned no row.',
    );
  }

  return IntegrationConnection.parse(row);
};

export const getIntegrationConnectionById = async (
  db: Database,
  tenantId: string,
  integrationConnectionId: string,
): Promise<IntegrationConnectionContract | null> => {
  const [row] = await db
    .select()
    .from(integrationConnection)
    .where(
      and(
        eq(integrationConnection.tenantId, tenantId),
        eq(integrationConnection.id, integrationConnectionId),
      ),
    )
    .limit(1);

  return row ? IntegrationConnection.parse(row) : null;
};

export const getLti1p3IntegrationConnectionByClientId = async (
  db: Database,
  tenantId: string,
  clientId: string,
): Promise<IntegrationConnectionContract | null> => {
  const [row] = await db
    .select()
    .from(integrationConnection)
    .where(
      and(
        eq(integrationConnection.tenantId, tenantId),
        eq(integrationConnection.providerType, 'lti_1p3'),
        eq(integrationConnection.status, 'enabled'),
        sql`${integrationConnection.config}->>'clientId' = ${clientId}`,
      ),
    )
    .limit(1);

  return row ? IntegrationConnection.parse(row) : null;
};

export const listIntegrationConnections = async (
  db: Database,
  tenantId: string,
): Promise<IntegrationConnectionContract[]> => {
  const rows = await db
    .select()
    .from(integrationConnection)
    .where(eq(integrationConnection.tenantId, tenantId))
    .orderBy(integrationConnection.createdAt);

  return rows.map((row) => IntegrationConnection.parse(row));
};

export type CreateCourseExternalToolInput = {
  tenantId: string;
  courseId: string;
  integrationConnectionId: string;
  name: string;
  description: string | null;
  launchUrl: string;
  placement: CourseExternalToolPlacement;
  status: CourseExternalToolStatus;
};

export const createCourseExternalTool = async (
  db: Database,
  input: CreateCourseExternalToolInput,
  now = new Date(),
): Promise<CourseExternalToolContract> => {
  const parsed = CourseExternalTool.parse({
    id: CourseExternalToolId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    integrationConnectionId: IntegrationConnectionId.parse(input.integrationConnectionId),
    name: input.name,
    description: input.description,
    launchUrl: input.launchUrl,
    placement: input.placement,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseExternalTool).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Course external tool could not be created because the database returned no row.',
    );
  }

  return CourseExternalTool.parse(row);
};

export type ListCourseExternalToolsInput = {
  tenantId: string;
  courseId: string;
  statuses: CourseExternalToolStatus[];
};

export const listCourseExternalToolsForCourse = async (
  db: Database,
  input: ListCourseExternalToolsInput,
): Promise<CourseExternalToolContract[]> => {
  const rows = await db
    .select({
      id: courseExternalTool.id,
      tenantId: courseExternalTool.tenantId,
      courseId: courseExternalTool.courseId,
      integrationConnectionId: courseExternalTool.integrationConnectionId,
      name: courseExternalTool.name,
      description: courseExternalTool.description,
      launchUrl: courseExternalTool.launchUrl,
      placement: courseExternalTool.placement,
      status: courseExternalTool.status,
      createdAt: courseExternalTool.createdAt,
      updatedAt: courseExternalTool.updatedAt,
    })
    .from(courseExternalTool)
    .innerJoin(
      integrationConnection,
      and(
        eq(integrationConnection.tenantId, courseExternalTool.tenantId),
        eq(integrationConnection.id, courseExternalTool.integrationConnectionId),
      ),
    )
    .where(
      and(
        eq(courseExternalTool.tenantId, input.tenantId),
        eq(courseExternalTool.courseId, input.courseId),
        inArray(courseExternalTool.status, input.statuses),
        eq(integrationConnection.status, 'enabled'),
      ),
    )
    .orderBy(asc(courseExternalTool.name), asc(courseExternalTool.id));

  return rows.map((row) => CourseExternalTool.parse(row));
};

export const getCourseExternalToolForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  toolId: string,
): Promise<CourseExternalToolContract | null> => {
  const [row] = await db
    .select()
    .from(courseExternalTool)
    .where(
      and(
        eq(courseExternalTool.tenantId, tenantId),
        eq(courseExternalTool.courseId, courseId),
        eq(courseExternalTool.id, toolId),
      ),
    )
    .limit(1);

  return row ? CourseExternalTool.parse(row) : null;
};

export type UpdateCourseExternalToolInput = {
  tenantId: string;
  courseId: string;
  toolId: string;
  integrationConnectionId: string;
  name: string;
  description: string | null;
  launchUrl: string;
  placement: CourseExternalToolPlacement;
  status: CourseExternalToolStatus;
};

export const updateCourseExternalTool = async (
  db: Database,
  input: UpdateCourseExternalToolInput,
  now = new Date(),
): Promise<CourseExternalToolContract | null> => {
  const [row] = await db
    .update(courseExternalTool)
    .set({
      integrationConnectionId: input.integrationConnectionId,
      name: input.name,
      description: input.description,
      launchUrl: input.launchUrl,
      placement: input.placement,
      status: input.status,
      updatedAt: now,
    })
    .where(
      and(
        eq(courseExternalTool.tenantId, input.tenantId),
        eq(courseExternalTool.courseId, input.courseId),
        eq(courseExternalTool.id, input.toolId),
      ),
    )
    .returning();

  return row ? CourseExternalTool.parse(row) : null;
};

export type DeleteCourseExternalToolInput = {
  tenantId: string;
  courseId: string;
  toolId: string;
};

export const deleteCourseExternalTool = async (
  db: Database,
  input: DeleteCourseExternalToolInput,
): Promise<boolean> => {
  const result = await db
    .delete(courseExternalTool)
    .where(
      and(
        eq(courseExternalTool.tenantId, input.tenantId),
        eq(courseExternalTool.courseId, input.courseId),
        eq(courseExternalTool.id, input.toolId),
      ),
    )
    .returning({ id: courseExternalTool.id });

  return result.length > 0;
};

export type CreateLti1p3DeepLinkingSessionInput = {
  tenantId: string;
  courseId: string;
  toolId: string;
  actorUserId: string;
  expiresAt: Date;
};

export const createLti1p3DeepLinkingSession = async (
  db: Database,
  input: CreateLti1p3DeepLinkingSessionInput,
  now = new Date(),
): Promise<Lti1p3DeepLinkingSessionContract> => {
  const parsed = Lti1p3DeepLinkingSession.parse({
    id: Lti1p3DeepLinkingSessionId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    toolId: CourseExternalToolId.parse(input.toolId),
    actorUserId: UserId.parse(input.actorUserId),
    status: 'pending',
    createdAt: now,
    expiresAt: input.expiresAt,
    completedAt: null,
    updatedAt: now,
  });
  const [row] = await db.insert(lti1p3DeepLinkingSession).values(parsed).returning();

  if (!row) {
    throw new Error(
      'LTI deep linking session could not be created because the database returned no row.',
    );
  }

  return Lti1p3DeepLinkingSession.parse(row);
};

export const getLti1p3DeepLinkingSessionById = async (
  db: Database,
  sessionId: string,
): Promise<Lti1p3DeepLinkingSessionContract | null> => {
  const [row] = await db
    .select()
    .from(lti1p3DeepLinkingSession)
    .where(eq(lti1p3DeepLinkingSession.id, Lti1p3DeepLinkingSessionId.parse(sessionId)))
    .limit(1);

  return row ? Lti1p3DeepLinkingSession.parse(row) : null;
};

export type CompleteLti1p3DeepLinkingSessionWithExternalToolsInput = {
  tenantId: string;
  courseId: string;
  sessionId: string;
  integrationConnectionId: string;
  sourceLaunchUrl: string;
  contentItems: Lti1p3DeepLinkingContentItem[];
};

export type CompleteLti1p3DeepLinkingSessionWithExternalToolsResult = {
  session: Lti1p3DeepLinkingSessionContract;
  externalTools: CourseExternalToolContract[];
};

export const completeLti1p3DeepLinkingSessionWithExternalTools = async (
  db: Database,
  input: CompleteLti1p3DeepLinkingSessionWithExternalToolsInput,
  now = new Date(),
): Promise<CompleteLti1p3DeepLinkingSessionWithExternalToolsResult | null> =>
  db.transaction(async (tx) => {
    const [sessionRow] = await tx
      .update(lti1p3DeepLinkingSession)
      .set({
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(lti1p3DeepLinkingSession.tenantId, TenantId.parse(input.tenantId)),
          eq(lti1p3DeepLinkingSession.id, Lti1p3DeepLinkingSessionId.parse(input.sessionId)),
          eq(lti1p3DeepLinkingSession.status, 'pending'),
          gt(lti1p3DeepLinkingSession.expiresAt, now),
        ),
      )
      .returning();

    if (!sessionRow) {
      return null;
    }

    const externalTools: CourseExternalToolContract[] = [];

    for (const item of input.contentItems) {
      const parsedTool = CourseExternalTool.parse({
        id: CourseExternalToolId.parse(ulid()),
        tenantId: TenantId.parse(input.tenantId),
        courseId: CourseId.parse(input.courseId),
        integrationConnectionId: IntegrationConnectionId.parse(input.integrationConnectionId),
        name: item.title,
        description: item.text ?? null,
        launchUrl: item.url ?? input.sourceLaunchUrl,
        placement: 'module_item',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
      const [toolRow] = await tx.insert(courseExternalTool).values(parsedTool).returning();

      if (!toolRow) {
        throw new Error(
          'LTI deep linking external tool could not be created because the database returned no row.',
        );
      }

      externalTools.push(CourseExternalTool.parse(toolRow));
    }

    return {
      session: Lti1p3DeepLinkingSession.parse(sessionRow),
      externalTools,
    };
  });

export type RecordCourseExternalToolOutcomeInput = {
  tenantId: string;
  courseId: string;
  assignmentId: string;
  studentId: string;
  externalToolId: string;
  score: number;
  maxScore: number;
  status: CourseExternalToolOutcomeStatus;
  reportedAt: Date;
};

// Records an LTI outcome. If a record already exists for the (tenant, assignment,
// student, external tool) tuple, it is updated; otherwise a new one is inserted.
export const recordCourseExternalToolOutcome = async (
  db: Database,
  input: RecordCourseExternalToolOutcomeInput,
  now = new Date(),
): Promise<CourseExternalToolOutcomeContract> => {
  const newId = CourseExternalToolOutcomeId.parse(ulid());
  const [row] = await db
    .insert(courseExternalToolOutcome)
    .values({
      id: newId,
      tenantId: TenantId.parse(input.tenantId),
      courseId: CourseId.parse(input.courseId),
      assignmentId: AssignmentId.parse(input.assignmentId),
      studentId: UserId.parse(input.studentId),
      externalToolId: CourseExternalToolId.parse(input.externalToolId),
      score: input.score,
      maxScore: input.maxScore,
      status: input.status,
      reportedAt: input.reportedAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        courseExternalToolOutcome.tenantId,
        courseExternalToolOutcome.assignmentId,
        courseExternalToolOutcome.studentId,
        courseExternalToolOutcome.externalToolId,
      ],
      set: {
        score: input.score,
        maxScore: input.maxScore,
        status: input.status,
        reportedAt: input.reportedAt,
        updatedAt: now,
      },
    })
    .returning();

  if (!row) {
    throw new Error('LTI outcome could not be recorded because the database returned no row.');
  }

  return CourseExternalToolOutcome.parse(row);
};

export type ListCourseExternalToolOutcomesInput = {
  tenantId: string;
  courseId: string;
  assignmentId: string;
};

export const listCourseExternalToolOutcomesForAssignment = async (
  db: Database,
  input: ListCourseExternalToolOutcomesInput,
): Promise<CourseExternalToolOutcomeContract[]> => {
  const rows = await db
    .select()
    .from(courseExternalToolOutcome)
    .where(
      and(
        eq(courseExternalToolOutcome.tenantId, input.tenantId),
        eq(courseExternalToolOutcome.courseId, input.courseId),
        eq(courseExternalToolOutcome.assignmentId, input.assignmentId),
      ),
    )
    .orderBy(asc(courseExternalToolOutcome.reportedAt), asc(courseExternalToolOutcome.id));

  return rows.map((row) => CourseExternalToolOutcome.parse(row));
};
