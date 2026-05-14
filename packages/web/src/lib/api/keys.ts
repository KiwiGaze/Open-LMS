/**
 * Centralized TanStack Query keys. All keys start with a domain string and
 * include `tenantId` when applicable so a tenant switch can invalidate one
 * scope cleanly.
 */
export const queryKeys = {
  session: ['session'] as const,

  me: ['me'] as const,

  tenants: () => ['tenants'] as const,
  tenantMembers: (tenantId: string) => ['tenants', tenantId, 'members'] as const,
  tenantFeatureFlags: (tenantId: string) => ['tenants', tenantId, 'feature-flags'] as const,

  courses: (tenantId: string) => ['courses', tenantId, 'list'] as const,
  course: (tenantId: string, courseId: string) => ['courses', tenantId, courseId] as const,
  catalogCourses: (tenantId: string) => ['catalog', tenantId, 'courses'] as const,
  courseFavorites: (tenantId: string) => ['catalog', tenantId, 'favorites'] as const,

  courseAnnouncements: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'announcements'] as const,
  courseModules: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'modules'] as const,
  courseAssignments: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'assignments'] as const,
  assignment: (tenantId: string, courseId: string, assignmentId: string) =>
    ['courses', tenantId, courseId, 'assignments', assignmentId] as const,
  assignmentSubmissions: (tenantId: string, courseId: string, assignmentId: string) =>
    ['courses', tenantId, courseId, 'assignments', assignmentId, 'submissions'] as const,
  courseDiscussions: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'discussion-topics'] as const,
  discussionPosts: (tenantId: string, courseId: string, topicId: string) =>
    ['courses', tenantId, courseId, 'discussion-topics', topicId, 'posts'] as const,
  courseQuizzes: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'quizzes'] as const,
  quiz: (tenantId: string, courseId: string, quizId: string) =>
    ['courses', tenantId, courseId, 'quizzes', quizId] as const,
  gradebook: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'gradebook'] as const,
  gradebookCategories: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'gradebook', 'categories'] as const,
  coursePeople: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'memberships'] as const,
  courseSections: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'sections'] as const,
  coursePages: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'pages'] as const,
  courseFiles: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'files'] as const,
  courseCalendar: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'calendar'] as const,
  courseAnalytics: (tenantId: string, courseId: string) =>
    ['courses', tenantId, courseId, 'analytics'] as const,

  notifications: () => ['notifications'] as const,
  inboxThreads: (tenantId: string) => ['tenants', tenantId, 'inbox'] as const,
  calendarItems: (tenantId: string) => ['tenants', tenantId, 'calendar-items'] as const,

  aiUsageSummary: (tenantId: string) => ['tenants', tenantId, 'ai-usage', 'summary'] as const,
  aiUsageByAction: (tenantId: string) => ['tenants', tenantId, 'ai-usage', 'by-action'] as const,
  providerConfig: (tenantId: string) => ['tenants', tenantId, 'provider-config'] as const,
  auditLogs: (tenantId: string) => ['tenants', tenantId, 'audit-logs'] as const,
} as const;
