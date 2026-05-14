import { describe, expect, it } from 'vitest';
import {
  CourseModule,
  CoursePage,
  CourseResource,
  CourseUnit,
  LearningObjective,
  PageExplanationResult,
  StoredPageExplanation,
} from '../src/index.ts';
import { WikiPage, WikiPageRevision, WikiPageRevisionDiff } from '../src/wiki.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE30';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const unitId = '01J9QW7B6N5W2YH3D3A1V0KE32';

describe('page explanation contracts', () => {
  it('models versioned modules, units, and resources for AI-indexable content', () => {
    const module = CourseModule.parse({
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
    const unit = CourseUnit.parse({
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
    const resource = CourseResource.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
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

    expect(module.learningObjectiveIds).toEqual([learningObjectiveId]);
    expect(unit.moduleId).toBe(moduleId);
    expect(resource.resourceType).toBe('reading_material');
    expect(resource.position).toBe(0);
  });

  it('requires unit resources to carry their parent module', () => {
    expect(() =>
      CourseResource.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE33',
        tenantId,
        courseId,
        moduleId: null,
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
      }),
    ).toThrow('Unit resources must include their parent module.');
  });

  it('models course-scoped learning objectives for content alignment', () => {
    const objective = LearningObjective.parse({
      id: learningObjectiveId,
      tenantId,
      courseId,
      code: 'LO-1',
      title: 'Explain how evidence supports a claim',
      description: 'Students can connect quoted evidence to the argument it supports.',
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    });

    expect(objective.status).toBe('active');
  });

  it('models versioned course pages for page-aware AI context', () => {
    const page = CoursePage.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId,
      courseId,
      title: 'Evidence in argument',
      body: 'Evidence must be introduced, cited, and explained.',
      visibility: 'published',
      version: 1,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    });

    expect(page.visibility).toBe('published');
  });

  it('models wiki pages with learning objective alignment for AI-indexable content', () => {
    const wikiPage = WikiPage.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE34',
      tenantId,
      courseId,
      slug: 'evidence-faq',
      title: 'Evidence FAQ',
      content: 'Shared answers about introducing and explaining evidence.',
      status: 'published',
      learningObjectiveIds: [learningObjectiveId],
      createdById: '01J9QW7B6N5W2YH3D3A1V0KE35',
      createdAt: now,
      updatedAt: now,
    });

    expect(wikiPage.learningObjectiveIds).toEqual([learningObjectiveId]);
  });

  it('models wiki page revisions with the objective alignment for that revision', () => {
    const wikiRevision = WikiPageRevision.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE36',
      tenantId,
      wikiPageId: '01J9QW7B6N5W2YH3D3A1V0KE34',
      revision: 1,
      authorId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      title: 'Evidence FAQ',
      content: 'Shared answers about introducing and explaining evidence.',
      learningObjectiveIds: [learningObjectiveId],
      summary: null,
      createdAt: now,
    });

    expect(wikiRevision.learningObjectiveIds).toEqual([learningObjectiveId]);
  });

  it('models wiki revision diffs with title, content, and objective changes', () => {
    const diff = WikiPageRevisionDiff.parse({
      wikiPageId: '01J9QW7B6N5W2YH3D3A1V0KE34',
      baseRevision: 1,
      targetRevision: 2,
      title: {
        changed: true,
        base: 'Evidence FAQ',
        target: 'Evidence FAQ v2',
      },
      learningObjectiveIds: {
        added: ['01J9QW7B6N5W2YH3D3A1V0KE45'],
        removed: [learningObjectiveId],
      },
      content: [
        {
          kind: 'removed',
          oldLineNumber: 1,
          newLineNumber: null,
          text: 'Shared answers about evidence.',
        },
        {
          kind: 'added',
          oldLineNumber: null,
          newLineNumber: 1,
          text: 'Shared answers about evidence with examples.',
        },
      ],
    });

    expect(diff.title.changed).toBe(true);
    expect(diff.content).toHaveLength(2);
    expect(diff.learningObjectiveIds.added).toEqual(['01J9QW7B6N5W2YH3D3A1V0KE45']);
  });

  it('models stored page explanations with cited resources', () => {
    const result = PageExplanationResult.parse({
      answer: 'Evidence supports a claim when you explain the connection.',
      keyPoints: ['Introduce the quote.', 'Explain relevance.'],
      citedResourceIds: ['page-1'],
      followUpQuestions: ['How do I choose the strongest quote?'],
    });

    const stored = StoredPageExplanation.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      coursePageId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      idempotencyKey: 'page-explanation-job-1',
      result,
      createdAt: now,
    });

    expect(stored.result.citedResourceIds).toEqual(['page-1']);
  });

  it('requires page explanations to cite at least one source resource', () => {
    expect(() =>
      PageExplanationResult.parse({
        answer: 'Evidence supports a claim when you explain the connection.',
        keyPoints: ['Introduce the quote.', 'Explain relevance.'],
        citedResourceIds: [],
        followUpQuestions: ['How do I choose the strongest quote?'],
      }),
    ).toThrow();
  });

  it('requires page explanations to include learning scaffolds', () => {
    expect(() =>
      PageExplanationResult.parse({
        answer: 'Evidence supports a claim when you explain the connection.',
        keyPoints: [],
        citedResourceIds: ['page-1'],
        followUpQuestions: ['How do I choose the strongest quote?'],
      }),
    ).toThrow();

    expect(() =>
      PageExplanationResult.parse({
        answer: 'Evidence supports a claim when you explain the connection.',
        keyPoints: ['Introduce the quote.', 'Explain relevance.'],
        citedResourceIds: ['page-1'],
        followUpQuestions: [],
      }),
    ).toThrow();
  });
});
