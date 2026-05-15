/**
 * Centralized TanStack Query keys. All keys start with a domain string and
 * include `tenantId` when applicable so a tenant switch can invalidate one
 * scope cleanly.
 */
export const queryKeys = {
  session: ['session'] as const,

  me: ['me'] as const,
  myTenantMemberships: ['me', 'tenant-memberships'] as const,
  myCourseMemberships: ['me', 'course-memberships'] as const,

  tenants: () => ['tenants'] as const,
  tenantMembers: (tenantId: string) => ['tenants', tenantId, 'members'] as const,
  tenantFeatureFlags: (tenantId: string) => ['tenants', tenantId, 'feature-flags'] as const,
  webhookSubscriptions: (tenantId: string) =>
    ['tenants', tenantId, 'webhook-subscriptions'] as const,
  retentionPolicies: (tenantId: string) => ['tenants', tenantId, 'retention-policies'] as const,

  courses: (tenantId: string) => ['courses', tenantId, 'list'] as const,
  course: (tenantId: string, courseId: string) => ['courses', tenantId, courseId] as const,
  catalogCourses: (tenantId: string) => ['catalog', tenantId, 'courses'] as const,
  courseFavorites: (tenantId: string) => ['catalog', tenantId, 'favorites'] as const,

  courseAnnouncements: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'announcements'] as const,
  courseModules: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'modules'] as const,
  moduleReleaseRules: (tenantId: string, courseId: string, moduleId: string) =>
    ['courses', tenantId, courseId, 'modules', moduleId, 'release-rules'] as const,
  moduleReleasePolicy: (tenantId: string, courseId: string, moduleId: string) =>
    ['courses', tenantId, courseId, 'modules', moduleId, 'release-policy'] as const,
  moduleReleaseStatus: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'release-status'] as const,
  courseUnits: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'units'] as const,
  courseResources: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'resources'] as const,
  courseAssignments: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'assignments'] as const,
  assignment: (tenantId: string, courseId: string, assignmentId: string) =>
    ['courses', tenantId, courseId, 'assignments', assignmentId] as const,
  assignmentOverrides: (tenantId: string, courseId: string, assignmentId: string) =>
    ['courses', tenantId, courseId, 'assignments', assignmentId, 'overrides'] as const,
  assignmentSubmissions: (tenantId: string, courseId: string, assignmentId: string) =>
    ['courses', tenantId, courseId, 'assignments', assignmentId, 'submissions'] as const,
  submissionAttachments: (
    tenantId: string,
    courseId: string,
    assignmentId: string,
    submissionId: string,
  ) =>
    [
      'courses',
      tenantId,
      courseId,
      'assignments',
      assignmentId,
      'submissions',
      submissionId,
      'attachments',
    ] as const,
  submissionComments: (
    tenantId: string,
    courseId: string,
    assignmentId: string,
    submissionId: string,
  ) =>
    [
      'courses',
      tenantId,
      courseId,
      'assignments',
      assignmentId,
      'submissions',
      submissionId,
      'comments',
    ] as const,
  submissionPlagiarismReports: (tenantId: string, submissionId: string) =>
    ['tenants', tenantId, 'submissions', submissionId, 'plagiarism-reports'] as const,
  coursePlagiarismReports: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'plagiarism-reports', 'latest'] as const,
  myConsents: (tenantId: string) => ['tenants', tenantId, 'me', 'consents'] as const,
  myCredentialAwards: (tenantId: string) => ['tenants', tenantId, 'me', 'credentials'] as const,
  courseDiscussions: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'discussion-topics'] as const,
  discussionPosts: (tenantId: string, courseId: string, topicId: string) =>
    ['courses', tenantId, courseId, 'discussion-topics', topicId, 'posts'] as const,
  discussionGrades: (tenantId: string, courseId: string, topicId: string) =>
    ['courses', tenantId, courseId, 'discussion-topics', topicId, 'grades'] as const,
  courseQuizzes: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'quizzes'] as const,
  quiz: (tenantId: string, courseId: string, quizId: string) =>
    ['courses', tenantId, courseId, 'quizzes', quizId] as const,
  quizQuestions: (tenantId: string, courseId: string, quizId: string) =>
    ['courses', tenantId, courseId, 'quizzes', quizId, 'questions'] as const,
  quizSettings: (tenantId: string, courseId: string, quizId: string) =>
    ['courses', tenantId, courseId, 'quizzes', quizId, 'effective-settings'] as const,
  quizAttempts: (tenantId: string, courseId: string, quizId: string) =>
    ['courses', tenantId, courseId, 'quizzes', quizId, 'attempts'] as const,
  quizAttemptResponses: (tenantId: string, courseId: string, quizId: string, attemptId: string) =>
    ['courses', tenantId, courseId, 'quizzes', quizId, 'attempts', attemptId, 'responses'] as const,
  gradebook: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'gradebook'] as const,
  gradebookCategories: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'gradebook', 'categories'] as const,
  coursePeople: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'memberships'] as const,
  messageableUsers: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'messageable-users'] as const,
  tenantMessageableUsers: (tenantId: string) => ['tenants', tenantId, 'messageable-users'] as const,
  courseSections: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'sections'] as const,
  sectionMembers: (tenantId: string, courseId: string, sectionId: string) =>
    ['courses', tenantId, courseId, 'sections', sectionId, 'members'] as const,
  courseGroupSets: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'group-sets'] as const,
  courseGroups: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'groups'] as const,
  courseGroupMembers: (tenantId: string, courseId: string, groupId: string) =>
    ['courses', tenantId, courseId, 'groups', groupId, 'members'] as const,
  coursePages: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'pages'] as const,
  coursePage: (tenantId: string, courseId: string, pageId: string) =>
    ['courses', tenantId, courseId, 'pages', pageId] as const,
  courseFiles: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'files'] as const,
  scormPackages: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'scorm-packages'] as const,
  externalTools: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'external-tools'] as const,
  assignmentPeerReviews: (tenantId: string, courseId: string, assignmentId: string) =>
    ['courses', tenantId, courseId, 'assignments', assignmentId, 'peer-reviews'] as const,
  peerReviewResponses: (
    tenantId: string,
    courseId: string,
    assignmentId: string,
    peerReviewId: string,
  ) =>
    [
      'courses',
      tenantId,
      courseId,
      'assignments',
      assignmentId,
      'peer-reviews',
      peerReviewId,
      'responses',
    ] as const,
  courseCalendar: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'calendar'] as const,
  courseAnalytics: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'analytics'] as const,
  glossaryEntries: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'glossary'] as const,
  courseMeetings: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'meetings'] as const,
  attendanceSessions: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'attendance-sessions'] as const,
  attendanceRecords: (tenantId: string, courseId: string, sessionId: string) =>
    ['courses', tenantId, courseId, 'attendance-sessions', sessionId, 'records'] as const,

  notifications: (tenantId: string) => ['tenants', tenantId, 'notifications'] as const,
  notificationPreferences: (tenantId: string) =>
    ['tenants', tenantId, 'notifications', 'preferences'] as const,
  inboxThreads: (tenantId: string) => ['tenants', tenantId, 'inbox'] as const,
  conversationMessages: (tenantId: string, threadId: string) =>
    ['tenants', tenantId, 'inbox', threadId, 'messages'] as const,
  calendarItems: (tenantId: string) => ['tenants', tenantId, 'calendar-items'] as const,

  aiUsageSummary: (tenantId: string) => ['tenants', tenantId, 'ai-usage', 'summary'] as const,
  aiUsageByAction: (tenantId: string) => ['tenants', tenantId, 'ai-usage', 'by-action'] as const,
  aiUsageByActor: (tenantId: string) => ['tenants', tenantId, 'ai-usage', 'by-actor'] as const,
  providerConfig: (tenantId: string) => ['tenants', tenantId, 'provider-config'] as const,
  auditLogs: (tenantId: string) => ['tenants', tenantId, 'audit-logs'] as const,
} as const;
