import {
  AiPolicyRule,
  type AuditLog,
  type ContextPackage,
  CoursePage,
  InstitutionConsentPolicy,
  LearningObjective,
  type OutboxEvent,
  PageExplanationResult,
  StoredPageExplanation,
  type StoredPageExplanation as StoredPageExplanationContract,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  type PageExplanationRequestPorts,
  requestPageExplanation,
} from '../src/content/page-explanation-service.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const actorId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE30';

const learningObjective = LearningObjective.parse({
  id: learningObjectiveId,
  tenantId,
  courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  code: 'BIO-PS-1',
  title: 'Explain photosynthesis inputs and outputs',
  description: 'Students can explain how plants transform light, carbon dioxide, and water.',
  status: 'active',
  position: 0,
  masteryThresholdPercent: 85,
  createdAt: now,
  updatedAt: now,
});

const page = CoursePage.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  tenantId,
  courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  title: 'Photosynthesis overview',
  body: 'Plants convert light, carbon dioxide, and water into glucose and oxygen.',
  visibility: 'published',
  version: 3,
  learningObjectiveIds: [learningObjectiveId],
  createdAt: now,
  updatedAt: now,
});

const output = PageExplanationResult.parse({
  answer: 'Photosynthesis converts light energy into chemical energy stored in glucose.',
  keyPoints: ['Light is captured by chlorophyll.', 'Glucose stores chemical energy.'],
  citedResourceIds: [page.id],
  followUpQuestions: ['Where does oxygen come from in photosynthesis?'],
});

const generationMetadata = {
  aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE31',
  promptIdentifier: 'page_explanation.default',
  promptVersion: '2026-05-10.1',
  providerType: 'openai_compatible',
  model: 'page-model',
};

const consentPolicy = InstitutionConsentPolicy.parse({
  tenantId,
  defaultPosture: 'opt_out',
  jurisdictionProfile: 'us_college',
  ageGateEnabled: false,
  reconsentTriggers: ['provider_change'],
  minNForDisclosure: 5,
  createdAt: now,
  updatedAt: now,
});

const createPorts = () => {
  const contexts: ContextPackage[] = [];
  const saved: StoredPageExplanationContract[] = [];
  const audits: AuditLog[] = [];
  const events: OutboxEvent[] = [];
  const ports = {
    getCoursePageById: async () => page,
    getPageExplanationPolicyRule: async () =>
      AiPolicyRule.parse({
        tenantId,
        actionIdentifier: 'page_explanation',
        version: 1,
        enabled: true,
        riskLevel: 'low',
        scope: 'single',
        requiresHumanReview: false,
        requiresExplicitConsent: false,
        minCohortSizeForDisclosure: 5,
      }),
    getInstitutionConsentPolicy: async () => consentPolicy,
    listConsentsForSubject: async () => [],
    listLearningObjectivesByIds: async () => [learningObjective],
    findExistingPageExplanation: async () => null,
    saveContextPackage: async (contextPackage) => {
      contexts.push(contextPackage);
    },
    generatePageExplanation: async () => ({
      output,
      metadata: generationMetadata,
    }),
    savePageExplanation: async (pageExplanation) => {
      saved.push(pageExplanation);
      return pageExplanation;
    },
    saveAuditLog: async (auditLog) => {
      audits.push(auditLog);
    },
    saveOutboxEvent: async (event) => {
      events.push(event);
    },
  } satisfies PageExplanationRequestPorts;

  return { ports, contexts, saved, audits, events };
};

describe('page explanation orchestration', () => {
  it('generates and stores a page explanation with audit and outbox evidence', async () => {
    const { ports, contexts, saved, audits, events } = createPorts();

    const result = await requestPageExplanation(
      {
        tenantId,
        actorId,
        coursePageId: page.id,
        idempotencyKey: 'page-explanation-1',
        now,
      },
      ports,
    );

    expect(result.created).toBe(true);
    expect(result.pageExplanation.result.answer).toContain('chemical energy');
    expect(contexts).toHaveLength(1);
    expect(contexts[0]?.resources).toEqual([
      {
        resourceType: 'course_page',
        resourceId: page.id,
        title: page.title,
        body: page.body,
        metadata: {
          courseId: page.courseId,
          version: page.version,
          learningObjectiveIds: page.learningObjectiveIds,
          learningObjectives: [
            {
              id: learningObjective.id,
              code: learningObjective.code,
              title: learningObjective.title,
              description: learningObjective.description,
              masteryThresholdPercent: learningObjective.masteryThresholdPercent,
            },
          ],
        },
      },
    ]);
    expect(saved).toHaveLength(1);
    expect(audits.map((audit) => audit.action)).toEqual([
      'request_page_explanation',
      'generate_page_explanation',
    ]);
    expect(audits[0]?.metadata).toEqual(
      expect.objectContaining({
        actionIdentifier: 'page_explanation',
        policyVersion: 1,
        policyAllowed: true,
        policyRequiresHumanReview: false,
      }),
    );
    expect(audits[1]?.metadata).toEqual(
      expect.objectContaining({
        contextPackageId: contexts[0]?.id,
        policyVersion: 1,
        policyAllowed: true,
        aiGenerationLogId: generationMetadata.aiGenerationLogId,
        promptIdentifier: generationMetadata.promptIdentifier,
        promptVersion: generationMetadata.promptVersion,
        providerType: generationMetadata.providerType,
        model: generationMetadata.model,
      }),
    );
    expect(events.map((event) => event.eventType)).toEqual(['ai.page_explanation.generated']);
  });

  it('returns an existing page explanation for duplicate idempotency keys', async () => {
    const baseline = createPorts();
    const existing = StoredPageExplanation.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      tenantId,
      coursePageId: page.id,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      idempotencyKey: 'page-explanation-1',
      result: output,
      createdAt: now,
    });
    const ports = {
      ...baseline.ports,
      findExistingPageExplanation: async () => existing,
    } satisfies PageExplanationRequestPorts;

    const result = await requestPageExplanation(
      {
        tenantId,
        actorId,
        coursePageId: page.id,
        idempotencyKey: 'page-explanation-1',
        now,
      },
      ports,
    );

    expect(result.created).toBe(false);
    expect(result.contextPackage).toBeNull();
    expect(baseline.saved).toHaveLength(0);
  });

  it('validates page visibility before replaying an existing page explanation idempotency key', async () => {
    const baseline = createPorts();
    const existing = StoredPageExplanation.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      tenantId,
      coursePageId: page.id,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      idempotencyKey: 'page-explanation-1',
      result: output,
      createdAt: now,
    });
    const ports = {
      ...baseline.ports,
      getCoursePageById: async () => ({ ...page, visibility: 'draft' as const }),
      findExistingPageExplanation: async () => existing,
    } satisfies PageExplanationRequestPorts;

    await expect(
      requestPageExplanation(
        {
          tenantId,
          actorId,
          coursePageId: page.id,
          idempotencyKey: 'page-explanation-1',
          now,
        },
        ports,
      ),
    ).rejects.toThrow(/published/i);
  });

  it('rejects explanations for non-published pages', async () => {
    const baseline = createPorts();
    const ports = {
      ...baseline.ports,
      getCoursePageById: async () => ({ ...page, visibility: 'draft' as const }),
    } satisfies PageExplanationRequestPorts;

    await expect(
      requestPageExplanation(
        {
          tenantId,
          actorId,
          coursePageId: page.id,
          idempotencyKey: 'page-explanation-1',
          now,
        },
        ports,
      ),
    ).rejects.toThrow(/published/);
  });
});
