import { describe, expect, it } from 'vitest';
import {
  AiFeedbackDraft,
  Assignment,
  AssignmentOverride,
  AssignmentPeerReview,
  CalendarItem,
  CourseCalendarEvent,
  CourseGradingScheme,
  Draft,
  FeedbackDialogue,
  FeedbackDialogueMessage,
  FeedbackDraftResult,
  Grade,
  GradebookCategory,
  GradebookEntry,
  GradebookManualGrade,
  GradebookManualItem,
  Rubric,
  RubricTemplate,
  Submission,
  SubmissionAttachment,
  SubmissionComment,
  SubmissionPrecheckResult,
} from '../src/index.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

describe('assignment feedback contracts', () => {
  it('models an assignment with an active rubric and AI settings', () => {
    const assignment = Assignment.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      title: 'Evidence essay',
      instructions: 'Write an essay using textual evidence.',
      status: 'published',
      dueAt: now,
      allowResubmission: true,
      activeRubricId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      aiSettings: {
        precheckEnabled: true,
        feedbackDraftEnabled: true,
        scoreSuggestionEnabled: false,
      },
      createdAt: now,
      updatedAt: now,
    });

    expect(assignment.aiSettings.feedbackDraftEnabled).toBe(true);
    expect(assignment.allowedFileExtensions).toEqual([]);
    expect(assignment.maxFileSizeBytes).toBeNull();
  });

  it('models assignment submission file constraints', () => {
    const assignment = Assignment.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      title: 'Evidence essay',
      instructions: 'Submit a PDF appendix.',
      status: 'published',
      dueAt: now,
      allowResubmission: true,
      activeRubricId: null,
      aiSettings: {
        precheckEnabled: true,
        feedbackDraftEnabled: true,
        scoreSuggestionEnabled: false,
      },
      allowedFileExtensions: ['pdf', 'docx'],
      maxFileSizeBytes: 2_000_000,
      createdAt: now,
      updatedAt: now,
    });

    expect(assignment.allowedFileExtensions).toEqual(['pdf', 'docx']);
    expect(assignment.maxFileSizeBytes).toBe(2_000_000);

    expect(() =>
      Assignment.parse({
        ...assignment,
        allowedFileExtensions: ['pdf', '.zip'],
      }),
    ).toThrow();
  });

  it('models assignment placement inside course modules', () => {
    const assignment = Assignment.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      moduleId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      unitId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      position: 2,
      title: 'Evidence essay',
      instructions: 'Write an essay using textual evidence.',
      status: 'published',
      dueAt: now,
      allowResubmission: true,
      activeRubricId: null,
      aiSettings: {
        precheckEnabled: true,
        feedbackDraftEnabled: true,
        scoreSuggestionEnabled: false,
      },
      createdAt: now,
      updatedAt: now,
    });

    expect(assignment).toMatchObject({
      moduleId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      unitId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      position: 2,
    });
  });

  it('models assignment availability overrides for individual users or groups', () => {
    const override = AssignmentOverride.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE3D',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      targetType: 'user',
      targetId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      opensAt: now,
      dueAt: new Date('2026-05-12T00:00:00.000Z'),
      closesAt: null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    expect(override).toMatchObject({
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      targetType: 'user',
      status: 'active',
    });
  });

  it('models course calendar events for LMS schedules', () => {
    const event = CourseCalendarEvent.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE3E',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      title: 'Essay workshop',
      description: 'Bring a printed draft for peer review.',
      location: 'Room 204',
      startsAt: now,
      endsAt: new Date('2026-05-10T01:00:00.000Z'),
      visibility: 'published',
      recurrenceRule: null,
      createdAt: now,
      updatedAt: now,
    });

    expect(event).toMatchObject({
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      title: 'Essay workshop',
      visibility: 'published',
    });
  });

  it('rejects course calendar events whose end is not after the start', () => {
    expect(() =>
      CourseCalendarEvent.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE3E',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
        title: 'Essay workshop',
        description: null,
        location: null,
        startsAt: now,
        endsAt: now,
        visibility: 'published',
        recurrenceRule: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('models assignment due dates and course events as calendar items', () => {
    const calendarItem = CalendarItem.parse({
      id: 'assignment_due:01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      courseCode: 'ENG101',
      courseTitle: 'Writing Studio',
      itemType: 'assignment_due',
      title: 'Evidence essay due',
      startsAt: now,
      endsAt: null,
      sourceType: 'assignment',
      sourceId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
    });
    const eventCalendarItem = CalendarItem.parse({
      id: 'course_event:01J9QW7B6N5W2YH3D3A1V0KE3E',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      courseCode: 'ENG101',
      courseTitle: 'Writing Studio',
      itemType: 'course_event',
      title: 'Essay workshop',
      startsAt: now,
      endsAt: new Date('2026-05-10T01:00:00.000Z'),
      sourceType: 'course_calendar_event',
      sourceId: '01J9QW7B6N5W2YH3D3A1V0KE3E',
    });

    expect(calendarItem.itemType).toBe('assignment_due');
    expect(eventCalendarItem.itemType).toBe('course_event');
  });

  it('models rubric templates adopted into tenant rubrics', () => {
    const template = RubricTemplate.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      version: 1,
      owner: 'editorial',
      title: 'Evidence explanation',
      disciplineTags: ['english'],
      assignmentTypeTags: ['essay'],
      localeTags: ['en-US'],
      criteria: [
        {
          id: 'criterion-evidence',
          label: 'Evidence',
          description: 'Uses evidence and explains its relevance.',
          evidenceRequired: true,
          learningObjectiveIds: ['01J9QW7B6N5W2YH3D3A1V0KE5F'],
          levels: [{ id: 'strong', label: 'Strong', description: 'Clear evidence', points: 4 }],
        },
      ],
      qualityScore: 0.9,
      exampleFeedbackFragments: ['Explain how this quotation supports the claim.'],
      createdAt: now,
      updatedAt: now,
    });

    const rubric = Rubric.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      title: template.title,
      version: 1,
      sourceTemplateId: template.id,
      criteria: template.criteria,
      createdAt: now,
      updatedAt: now,
    });

    expect(rubric.sourceTemplateId).toBe(template.id);
    expect(rubric.criteria[0]?.learningObjectiveIds).toEqual(['01J9QW7B6N5W2YH3D3A1V0KE5F']);
  });

  it('models feedback dialogue anchored to published feedback', () => {
    const dialogue = FeedbackDialogue.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE5A',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      publishedFeedbackId: '01J9QW7B6N5W2YH3D3A1V0KE5B',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE5C',
      status: 'open',
      openedById: '01J9QW7B6N5W2YH3D3A1V0KE5D',
      createdAt: now,
      updatedAt: now,
    });
    const message = FeedbackDialogueMessage.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE5E',
      tenantId: dialogue.tenantId,
      dialogueId: dialogue.id,
      authorRole: 'student',
      authorId: dialogue.openedById,
      criterionId: 'criterion-evidence',
      body: 'What does unclear evidence mean here?',
      contextPackageId: null,
      aiGenerationLogId: null,
      createdAt: now,
    });

    expect(message.dialogueId).toBe(dialogue.id);
    expect(message.criterionId).toBe('criterion-evidence');
  });

  it('separates mutable drafts from immutable submission snapshots', () => {
    const draft = Draft.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      blocks: [{ blockId: 'intro', text: 'Evidence appears here.' }],
      createdAt: now,
      updatedAt: now,
    });

    const submission = Submission.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      tenantId: draft.tenantId,
      assignmentId: draft.assignmentId,
      studentId: draft.studentId,
      sourceDraftId: draft.id,
      version: 1,
      status: 'submitted',
      contentSnapshot: draft.blocks,
      submittedAt: now,
      createdAt: now,
    });

    expect(submission.contentSnapshot).toEqual(draft.blocks);
  });

  it('models files attached to a submitted attempt', () => {
    const attachment = SubmissionAttachment.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE38',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      fileResourceId: '01J9QW7B6N5W2YH3D3A1V0KE39',
      displayName: 'evidence-appendix.pdf',
      position: 0,
      createdAt: now,
    });

    expect(attachment.displayName).toBe('evidence-appendix.pdf');
  });

  it('models student-visible, staff-only, and peer-reviewer submission comments', () => {
    const comment = SubmissionComment.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE3A',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      authorId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      body: 'Please expand the evidence explanation.',
      visibility: 'peer_reviewer_visible',
      createdAt: now,
      updatedAt: now,
    });

    expect(comment.visibility).toBe('peer_reviewer_visible');
  });

  it('keeps AI feedback drafts separate from published feedback', () => {
    const output = FeedbackDraftResult.parse({
      criterionFeedback: [
        {
          criterionId: 'criterion-evidence',
          studentFacingComment: 'The quote is relevant, but explain why it supports the claim.',
          teacherNote: 'Student is close.',
          evidence: ['Evidence appears here.'],
          suggestedLevelId: 'developing',
          suggestedScore: null,
        },
      ],
      overallComment: 'Promising draft.',
    });

    const draft = AiFeedbackDraft.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE30',
      promptIdentifier: 'feedback_draft.default',
      promptVersion: '2026-05-10.1',
      providerType: 'openai_compatible',
      model: 'feedback-model',
      idempotencyKey: 'feedback_draft:01J9QW7B6N5W2YH3D3A1V0KE2X:01J9QW7B6N5W2YH3D3A1V0KE2Y',
      status: 'generated',
      criterionFeedback: output.criterionFeedback,
      overallComment: output.overallComment,
      createdAt: now,
    });

    expect(draft.status).toBe('generated');
  });

  it('rejects grades whose score exceeds max score', () => {
    expect(() =>
      Grade.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE31',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
        submissionId: '01J9QW7B6N5W2YH3D3A1V0KE33',
        score: 11,
        maxScore: 10,
        status: 'draft',
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(/score cannot exceed max score/i);
  });

  it('models a course gradebook row from an official grade', () => {
    const entry = GradebookEntry.parse({
      id: 'gradebook_entry:01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE34',
      assignmentTitle: 'Evidence essay',
      assignmentDueAt: now,
      gradebookCategoryId: '01J9QW7B6N5W2YH3D3A1V0KE3Y',
      gradebookCategoryName: 'Essays',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE36',
      submittedAt: now,
      gradeId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      score: 9,
      maxScore: 10,
      gradeStatus: 'published',
      gradeSource: 'manual',
      gradedAt: now,
    });

    expect(entry.score / entry.maxScore).toBe(0.9);
    expect(entry.gradebookCategoryName).toBe('Essays');
  });

  it('models uncategorized course gradebook rows explicitly', () => {
    const entry = GradebookEntry.parse({
      id: 'gradebook_entry:01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE34',
      assignmentTitle: 'Evidence essay',
      assignmentDueAt: null,
      gradebookCategoryId: null,
      gradebookCategoryName: null,
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE36',
      submittedAt: now,
      gradeId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      score: 9,
      maxScore: 10,
      gradeStatus: 'published',
      gradeSource: 'manual',
      gradedAt: now,
    });

    expect(entry.gradebookCategoryId).toBeNull();
    expect(entry.gradebookCategoryName).toBeNull();
  });

  it('rejects gradebook entries with partial category metadata', () => {
    const entry = {
      id: 'gradebook_entry:01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE34',
      assignmentTitle: 'Evidence essay',
      assignmentDueAt: null,
      gradebookCategoryId: '01J9QW7B6N5W2YH3D3A1V0KE3Y',
      gradebookCategoryName: 'Essays',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE36',
      submittedAt: now,
      gradeId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      score: 9,
      maxScore: 10,
      gradeStatus: 'published',
      gradeSource: 'manual',
      gradedAt: now,
    };

    expect(() => GradebookEntry.parse({ ...entry, gradebookCategoryId: null })).toThrow(
      /category id and name/i,
    );
    expect(() => GradebookEntry.parse({ ...entry, gradebookCategoryName: null })).toThrow(
      /category id and name/i,
    );
  });

  it('models weighted gradebook categories for a course', () => {
    const category = GradebookCategory.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE3B',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      name: 'Essays',
      position: 0,
      weightPercent: 40,
      dropLowest: 1,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    expect(category).toMatchObject({
      name: 'Essays',
      weightPercent: 40,
      dropLowest: 1,
      status: 'active',
    });
  });

  it('models manual gradebook items for offline or custom grade columns', () => {
    const item = GradebookManualItem.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE41',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      gradebookCategoryId: '01J9QW7B6N5W2YH3D3A1V0KE3B',
      title: 'In-class participation',
      description: 'Participation points recorded outside a submission workflow.',
      maxScore: 10,
      dueAt: null,
      position: 2,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    expect(item).toMatchObject({
      title: 'In-class participation',
      gradebookCategoryId: '01J9QW7B6N5W2YH3D3A1V0KE3B',
      status: 'active',
    });
  });

  it('models per-student manual gradebook grades', () => {
    const gradebookGrade = GradebookManualGrade.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE42',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      gradebookManualItemId: '01J9QW7B6N5W2YH3D3A1V0KE41',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      score: 9,
      maxScore: 10,
      status: 'published',
      source: 'manual',
      gradedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    expect(gradebookGrade).toMatchObject({
      gradebookManualItemId: '01J9QW7B6N5W2YH3D3A1V0KE41',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      score: 9,
    });
  });

  it('rejects manual gradebook grades whose score exceeds max score', () => {
    expect(() =>
      GradebookManualGrade.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE42',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
        gradebookManualItemId: '01J9QW7B6N5W2YH3D3A1V0KE41',
        studentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
        score: 11,
        maxScore: 10,
        status: 'published',
        source: 'manual',
        gradedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(/score cannot exceed max score/i);
  });

  it('models a course grading scheme with ordered percentage thresholds', () => {
    const scheme = CourseGradingScheme.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE3C',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      name: 'Letter grades',
      status: 'active',
      entries: [
        { label: 'A', minPercent: 90 },
        { label: 'B', minPercent: 80 },
        { label: 'C', minPercent: 70 },
        { label: 'D', minPercent: 60 },
        { label: 'F', minPercent: 0 },
      ],
      createdAt: now,
      updatedAt: now,
    });

    expect(scheme.entries.at(-1)).toEqual({ label: 'F', minPercent: 0 });
  });

  it('models an assignment peer review allocation', () => {
    const peerReview = AssignmentPeerReview.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE40',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE34',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE36',
      reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      status: 'assigned',
      dueAt: now,
      submittedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    expect(peerReview).toMatchObject({
      reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      status: 'assigned',
      submittedAt: null,
    });
  });

  it('rejects grading schemes that do not cover zero percent', () => {
    expect(() =>
      CourseGradingScheme.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE3D',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
        courseId: '01J9QW7B6N5W2YH3D3A1V0KE33',
        name: 'Incomplete letters',
        status: 'active',
        entries: [
          { label: 'A', minPercent: 90 },
          { label: 'B', minPercent: 80 },
        ],
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(/include a 0 percent threshold/i);
  });

  it('rejects grading schemes with duplicate labels', () => {
    expect(() =>
      CourseGradingScheme.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE3E',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
        courseId: '01J9QW7B6N5W2YH3D3A1V0KE33',
        name: 'Repeated letters',
        status: 'active',
        entries: [
          { label: 'A', minPercent: 90 },
          { label: 'A', minPercent: 80 },
          { label: 'F', minPercent: 0 },
        ],
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(/labels must be unique/i);
  });

  it('rejects grading schemes with non-descending thresholds', () => {
    expect(() =>
      CourseGradingScheme.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE3F',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE32',
        courseId: '01J9QW7B6N5W2YH3D3A1V0KE33',
        name: 'Unordered letters',
        status: 'active',
        entries: [
          { label: 'A', minPercent: 90 },
          { label: 'B', minPercent: 90 },
          { label: 'F', minPercent: 0 },
        ],
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(/ordered from highest to lowest/i);
  });

  it('requires submission precheck issues to include evidence', () => {
    expect(() =>
      SubmissionPrecheckResult.parse({
        summary: 'The draft needs stronger evidence support.',
        issues: [
          {
            criterionId: 'criterion-evidence',
            severity: 'medium',
            message: 'The essay quotes evidence without explaining relevance.',
            evidence: [],
            suggestion: 'Explain how the quote supports the claim.',
          },
        ],
      }),
    ).toThrow();
  });
});
