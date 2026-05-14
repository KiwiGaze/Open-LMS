# Missing Traditional LMS Features — Backend Audit

**Date:** 2026-05-12
**Branch:** `kiwi/backend-ai-foundation`
**Scope:** Backend + AI foundation only. Frontend logic is intentionally out of this lane.
**Reference platforms:** Moodle, Canvas, Blackboard, Brightspace, Sakai.

This document is a point-in-time audit; line numbers and migration numbers reflect the state of the repo at the date above. Use `git grep` / migration order if anything looks stale.

## Method

1. **Batch 1 — Exploration.** Six parallel agents surveyed the backend, each scoped to one LMS domain (auth, courses, content, assessments, engagement, admin/integrations). Each agent compared the codebase against the traditional-LMS feature surface and produced a list of claims.
2. **Batch 2 — Verification.** Six parallel agents re-checked every claim against the actual code, rejected claims that turned out to be already-implemented or out of scope for a traditional LMS, and re-graded priority.

### Filtered as already implemented

- Course categories — `catalogCategory` column exists on `course` and is filterable in the catalog query.
- Catalog search filters — `catalogCategory` and `academicTerm` filters are present alongside `blueprint`.
- LTI 1.1 outcomes — fully shipped in `packages/api/src/routes/lti-outcomes.ts` with a backing `course_external_tool_outcome` table.
- AI runtime quota enforcement — implemented at `packages/ai/src/gateway.ts:280-341`, where `hardCapTokensPerPeriod` blocks and `softWarnTokensPerPeriod` warns.

### Filtered as not part of a traditional LMS

Prometheus / OpenTelemetry metrics export, OTEL request tracing, deep health-check endpoint, tamper-evident audit chain, CalDAV two-way sync, SMS notifications, in-app snooze, email-in (reply via email), learning streaks, QR / kiosk attendance, IRT / adaptive quizzing, personal access tokens, account merge, generic service-account provisioning, bulk CSV user import (covered by SSO / SIS sync).

---

## Findings index

| Priority | Count |
| --- | --- |
| P0 (critical blockers) | 12 |
| P1 (standard expectation) | 60 |
| P2 (real gap, lower urgency) | omitted from this doc — see Batch results |

The 12 P0 items are listed up front. The remaining P1 items are grouped by domain.

---

## P0 — critical blockers

These are gaps where a mature institutional LMS deployment would fail outright.

### 1. File upload route is missing

`packages/api/src/routes/files.ts` exposes only `listFilesRoute` and `getFileRoute`; both `GET`. There is no `POST /files`, no multipart handler, and no presigned-URL endpoint. `FileStorageProvider` enumerates `local_fs` and `s3_compatible` but there is no upload handler in `packages/core/src/files/repository.ts`. Without this, `file_resource` rows are unreachable through any normal flow.

### 2. LTI 1.3 launches

`lti_1p3` is an enum value in `packages/contracts/src/integration.ts:12` with `config: jsonb` opaque. There is no OIDC login initiation route, no `id_token` validation, no JWKS endpoint, no deep-linking handler, no Names & Roles, no Assignment & Grade Services. LTI 1.3 is the industry standard for external-tool integration in modern institutional LMS deployments.

### 3. Group assignment / group submission

`submission.studentId` is `.notNull()` in `packages/core/src/db/schema/submission.ts:59`. There is no `groupId` column on `submission`, no `groupSubmissionEnabled` on `assignment`. A shared submission for a project team — baseline functionality in every major LMS — is unrepresentable.

### 4. Late-penalty auto-application is broken

`applyLatePenalty` and `computeLatePenaltyPercent` exist as utility functions in `packages/core/src/submissions/late-penalty.ts`, but are never called in the grade-upsert path (`submission-grades.ts`, `dependencies.ts:6087+`). Migration `0074` configures penalties that the system silently ignores when grades are saved.

### 5. Anonymous grading runtime redaction is broken

`listAssignmentSubmissions` applies `anonymousLabel` but still returns `studentId` in every row of the response. Migration `0081` added the flag; the actual redaction was never implemented. Already on the deferred-follow-up list from iteration 14.

### 6. Grade-history / grade-change audit log

The `grade` table has a unique `(tenantId, submissionId)` index — one row per submission, no versioning. The generic `auditLog` exists at `packages/core/src/db/schema/audit.ts:6` but is not enforced for grade mutations. Academic-integrity disputes have no record to point at.

### 7. Final grade calculation + SIS submission

No `finalGrade` column on any course / membership / submission row. No SIS-push workflow. `sis_csv` is an unused enum value. Without this, grades cannot reach institutional records systems.

### 8. Account self-deletion (GDPR Article 17)

`packages/api/src/routes/me.ts:7-74` defines only `GET /me` and `PATCH /me`. There is no `DELETE /me`. `deleteAuthUserById` in `packages/core/src/auth/admin.ts` is an internal compensation path for failed tenant bootstrap, not an end-user flow. Blocks EU deployment.

### 9. Rate limiting

`packages/api/src/app.ts` registers no rate-limit middleware. `packages/ai/src/rate-limit.ts` implements a token-bucket utility, but it is a stateless library function and is not wired to the HTTP layer. One tenant or user can exhaust resources for everyone.

### 10. SIS sync (OneRoster 1.2, PowerSchool, Banner, Workday)

`sis_csv` is an enum value in `packages/contracts/src/integration.ts:12` with no parser, no sync worker, no roster schema, no import pipeline anywhere. Enterprise deployments cannot ingest institutional rosters at term start.

### 11. GDPR right-to-deletion with retention + anonymization

Only hard deletes exist. `audit_log.metadata` is plaintext JSONB and is not anonymized on user deletion. No `legal_hold` check before deletion. GDPR Article 17 requires erasure of all PII, including derivative records.

### 12. Data retention policies / legal hold / auto-purge

No `retention_policy` table, no `legal_hold` table, no `retainUntil` column on any record, no scheduled purge job. FERPA (multi-year retention) and GDPR (storage limitation) both mandate lifecycle policies.

---

## P1 — standard traditional-LMS expectations

Grouped by domain.

### Auth & Identity

- **SSO / federated identity (SAML 2.0, OIDC, CAS, LDAP).** `buildAuthOptions` in `packages/core/src/auth/better-auth.ts:14-44` configures only `emailAndPassword`. No federated-IdP plugin. Every institutional deployment uses Shibboleth, Azure AD, or Google Workspace.
- **MFA (TOTP + recovery codes).** No `twoFactor` plugin and no totp / recovery-code tables in migrations 0000–0091. SOC 2 and most institutional policies require MFA for staff/admin accounts.
- **Password reset flow.** The `verification` table at `auth.ts:48-55` exists, but `buildAuthOptions` configures no `sendResetPassword` hook and no `/auth/reset-password` route is exposed. Users lock themselves out permanently.
- **Email-verification enforcement.** Schema column exists; `better-auth.ts:29` sets `requireEmailVerification: false`. Anyone can sign up with any email.
- **Account lockout / login rate limiting.** No `failed_attempts` / `lockout_until` columns; no rate-limit middleware on the login endpoint.
- **User suspension / deactivation lifecycle.** `user` table at `packages/core/src/db/schema/auth.ts:4-14` has no `status` / `suspendedAt` / `deactivatedAt` columns. Admins can only hard-delete, which destroys academic records.
- **Soft-delete + restore for users.** No `deletedAt` on user; accidental deletes are unrecoverable.
- **Tenant-level user invitations.** No `tenant_invitation` table; the `tenants` route has no invite endpoint. Course enrollment codes (migration 0059) do not cover institutional onboarding.
- **Role-change audit trail.** `saveAuditLog` exists at `packages/core/src/events/repository.ts`, but `updateTenantMembership` at `dependencies.ts:3733-3769` never calls it. Compliance gap for privilege escalation.

### Courses & Enrollment

- **Enrollment gated by course dates.** `selfEnrollInCourse` at `dependencies.ts:4494` checks `status === 'active'` and the enrollment code, but never compares against `startsAt` / `endsAt`. Past- and future-dated courses are immediately enrollable.
- **Waitlists + enrollment capacity.** No capacity, max_enrollment, or waitlist tables. Standard for any capped section.
- **Enrollment request / approval state.** `course_membership` has no `pending` status; all self-enrollments are immediate. Blocks instructor-approved courses.
- **Section-level instructors + meeting times.** `course_section_member` (migration 0090) stores only `studentId`; no instructor FK on sections; no `meetingTime` / `location` / `dayOfWeek` on `course_section`. Multi-section universities cannot represent reality.
- **Course soft-delete at record level.** `course-restore.ts` restores backup content into an existing course; there is no `deletedAt` on `course`. Accidental course deletion is unrecoverable.
- **Blueprint copy completeness.** Migration 0082 added the flag, but `CreateCourseBody` at `routes/courses.ts:54-95` does not accept `isBlueprint`, and there is no push-sync from blueprint to child courses (Canvas Blueprint's defining feature).

### Content, Files & Standards

- **SCORM 1.2 runtime API.** Only a REST upsert exists at `scorm.ts:101`. No `LMSInitialize` / `LMSGetValue` / `LMSSetValue` / `LMSCommit` / `LMSFinish` JavaScript bridge. SCORM packages cannot communicate with the LMS in-session — the migration 0088 data model is unused without this.
- **SCORM 2004 sequencing and navigation.** `scormVersion = '2004'` is accepted but no ADL sequencing logic exists; behaves identically to 1.2.
- **xAPI ingestion endpoint.** Only the outbound `xapi.statement_emitted` event exists at `audit-outbox.ts:418-419`. No inbound `POST /xapi/statements`, no statement store.
- **xAPI LRS forwarding worker.** Outbox builds events; no worker process delivers them. Events sit dead in the outbox.
- **H5P content packages.** Zero references. H5P is the dominant interactive-content format in open LMSes.
- **File quotas per tenant and per user.** No `byteLimit` on tenant or user. One user can exhaust all storage.
- **File metadata for accessibility and rights.** `FileMetadata` at `contracts/src/file.ts:27` has only filename / mediaType / byteSize / checksum / visibility. No alt-text, transcript, license, or copyright. ADA / Section 508 / WCAG 2.1 compliance gap.
- **Item-level conditional release.** `course_module_release_rule` at `module-release.ts:27` is keyed only by `moduleId`. No rule type for individual pages / resources / assignments. Canvas-style per-item drip is unrepresentable.
- **Module-scoped completion + min-score threshold.** `completion_requirement` is keyed by `courseId` with no `moduleId` FK; `CompletionRequirementType` has no score threshold (`pass_quiz` has no `minScore` qualifier). Cannot express "unlock next module when quiz score ≥ 70%."
- **Resource view → completion linkage.** `courseResourceViewEvent` is recorded (migration 0089) and `view_resource` is a valid completion type, but no code in `packages/core/src/completion/` consumes view events. Tracking exists; nothing advances completion.
- **Wiki diff and restore.** Revisions exist (migration 0067); `listWikiPageRevisions` route exists; no `GET .../diff` or `POST .../restore` route. Revision history without rollback is half a feature.
- **Course copy excludes graded items, SCORM, wiki.** `copyCourseTemplate` at `courses/copy.ts:80-84` copies objectives, modules, units, pages, resources only. Assignments, quizzes, SCORM packages, discussions, wiki pages, glossary entries are not copied, which makes blueprint copies unusable.

### Assessments & Grading

- **Random question pools (draw N from bank per attempt).** No `poolSize` field, no draw-from-bank join. Every student gets the same item set; question banks are static libraries only.
- **QTI 2.x / QTI 3 import / export.** Zero QTI references; institutions with existing item banks must rebuild every question.
- **Advanced question types.** `QuizQuestionType` at `contracts/src/quiz.ts:19-26` has six types. Missing: ordering, fill-in-multiple-blanks, cloze, drag-and-drop, hot-spot, file upload, calculated / formula. Ordering and fill-blank are standard in Moodle / Canvas.
- **Quiz access controls: password, IP range.** No `password` or `allowedIpRanges` columns on `quiz`. Proctored sit-down exams require both.
- **Proctoring provider runtime.** Migration 0084 adds a `proctoringRequired` boolean only; no provider handshake, session token, or callback. Flag without integration is non-functional.
- **Lockdown browser integration.** No Respondus LDB / Honorlock references. Mainstream institutional requirement for high-stakes remote assessment.
- **Multi-grader / moderated grading.** `grade` is one-row-per-submission; no second-grader FK, no reconciliation state. Required by many accrediting bodies for blind double-marking.
- **Peer review workflow runtime.** `assignmentPeerReview` schema exists; no phase state machine (setup → submission → assessment → grading → closed), no automated allocation, no calibration. Schema without runtime is inert.
- **Plagiarism active outbound integration.** Only inbound `POST /plagiarism-reports` exists at `plagiarism.ts:66`. No outbound submission-to-provider call.
- **Assignment file-type whitelist + max size.** No `allowedFileExtensions` or `maxFileSizeBytes` on assignment. Cannot restrict to PDF-only or cap upload size.
- **Gradebook posting policy.** No `postingPolicy` / `autoPost` / `hiddenFromStudents` field. Canvas-style "grade all before posting" is unrepresentable.
- **Gradebook curve / scale.** No curve column or route. Standard post-exam instructor workflow.
- **Missing-submission policy (auto-zero / excused).** No `excused` or `missingPolicy` field on grade or submission. Unsubmitted work is simply absent from the gradebook.
- **Grade import from CSV.** `gradebook.ts` has an export route at line 342 but no import; instructors grading offline cannot re-upload results.
- **Incomplete grade status.** `GradeStatus` at `contracts/src/feedback.ts:84` lacks `incomplete`. Higher-education legal requirement.
- **Peer-reviewer comment visibility.** `SubmissionCommentVisibility` is `student_visible | staff_only`; no `peer_reviewer_visible` variant. Cannot scope reviewer notes.

### Engagement & Communication

- **Discussion reply subscriptions.** No subscription table; `NotificationCategory` at `contracts/src/notification.ts:4-10` has no `discussion_reply`. Async conversation collapses without notifications.
- **Discussion drafts.** `DiscussionPostStatus` is `published | hidden | deleted`; no `draft`.
- **Group discussions.** `discussionTopic` has no `groupId`. Group-mode is a core Canvas / Moodle feature.
- **Announcement targeting (role / section / group).** No `targetRole` / `targetSectionId` / `targetGroupId` on `courseAnnouncement`. Cannot send section-specific announcements.
- **Announcement email-distribution control.** No `sendEmail` / `emailDistribution` column.
- **Email digest dispatcher.** `NotificationFrequency` supports `daily_digest` / `weekly_digest`; no worker or scheduler aggregates and sends them. Preferences are stored but never acted on.
- **Push notification dispatch pipeline.** Tokens are stored in `userPushToken` (migration 0071); no FCM / APNs delivery code exists. Stub feature.
- **Calendar reminders (1-day / 1-hour before).** No scheduled reminder job; no reminder table.
- **Calendar conflict detection.** No overlap query for student / room scheduling.
- **Meeting recording links + playback.** `CourseMeeting` has no `recordingUrl` / `playbackUrl`. #1 use case for synchronous-session catch-up.
- **Attendance as a gradebook component.** No `weight` on attendance, no linkage to gradebook. "Attendance is 10% of final grade" is unrepresentable.
- **Certificate verification URL / Open Badges.** `CredentialAward` has no `verificationUrl` / `assertionUrl`. Badges are not shareable on LinkedIn or résumés without it; Moodle uses Open Badges natively.

### Admin, Compliance & Integrations

- **Outbox dispatcher worker.** `listPendingOutboxEvents` / `markOutboxEventProcessed` exist at `events/repository.ts:56-93`; no worker polls and delivers. Webhooks, xAPI, audit events all sit dead.
- **Outbound webhook subscriptions per tenant.** `generic_webhook` enum exists; no `webhook_subscription` table or registration routes.
- **Webhook signature verification / replay protection.** No HMAC of outbound payloads, no nonce / replay guard.
- **SCIM 2.0 user provisioning.** Required for IdP-driven user lifecycle management (Okta, Azure AD).
- **Audit log search / filter / export API.** `listAuditLogsForTenant` at `events/repository.ts:27` accepts only tenantId + limit. No API route exposes audit logs at all.
- **Tenant-level analytics dashboard.** `getCourseAnalyticsSummary` is per-course; no tenant aggregate (active users, course count, AI rollups).
- **Cross-course / program-level gradebook.** All gradebook routes are course-scoped; degree / program coordinators cannot aggregate.
- **Per-tenant branding.** `tenant` table is `id / slug / displayName / createdAt / updatedAt` only — no logo, primary color, or custom domain.
- **Per-tenant feature flags.** No `feature_flag` table; cannot stage rollouts per institution.
- **FERPA directory-information opt-out + parent access.** `ferpa_k12` exists only as a jurisdiction string; no opt-out table, no parent-proxy schema. Legally required for US K-12.
- **API key management for external integrations.** `provider_config.encryptedApiKey` only stores outbound LLM credentials; no per-tenant scoped inbound API keys for external callers.
- **OAuth 2.0 app registration.** No `oauth_client` table; required for LTI 1.3 dynamic registration and third-party SSO.
- **License key / seat counting.** No `maxSeats` / `tier` / `licenseKey` on tenant; cannot enforce entitlements in a paid multi-tenant deployment.
- **Bulk operations queue (CSV import pipeline).** No `bulk_import_job` table or worker; cannot onboard hundreds of students at term start.
- **Encryption at rest beyond API keys.** `audit_log.metadata`, `consent.evidence`, `integrationConnection.config` are plaintext JSONB. SOC 2 / GDPR PII-at-rest gap.

---

## Recommended next iterations

These are the highest-leverage P0 items that fit the existing migration → schema → contract → repository → API pattern from the `/goal` loop.

| Rank | Feature | Rationale |
| --- | --- | --- |
| 1 | File upload route (P0 #1) | The entire file domain is dead without it. |
| 2 | Late-penalty auto-application (P0 #4) | `applyLatePenalty` already exists; just needs to be called in `upsertSubmissionGrade`. Closes a "data-model lie" the same way it-6 closed it-3. |
| 3 | Anonymous grading redaction (P0 #5) | Already on the deferred follow-up list from it-14; the flag still leaks `studentId` in submission listings. |
| 4 | Outbox dispatcher worker (P1 admin) | Unlocks webhooks, xAPI forwarding, and async notification. Many downstream features depend on it. |
| 5 | Group assignment / submission (P0 #3) | Baseline LMS feature; many real courses cannot be modelled without it. |
| 6 | Grade audit log enforcement (P0 #6) | One-call addition at the grade-upsert site; high compliance value. |
| 7 | LTI 1.3 launches (P0 #2) | Industry standard; LTI 1.1 already shipped, so this is the natural follow-on. |
| 8 | Push notification dispatch (P1 engagement) | Tokens are stored already; the loop is open at the dispatch step. |
| 9 | Rate limiting middleware (P0 #9) | Security baseline; thin Hono middleware. |
| 10 | Calendar reminders + meeting recording fields (P1 engagement) | Two small, visible additions. |

Doing the cross-cutting infrastructure pieces — outbox worker, rate limiter, encryption-at-rest helper — early reduces rework on later iterations.
