import { z } from 'zod';
import {
  AssignmentId,
  CourseExternalToolId,
  CourseExternalToolOutcomeId,
  CourseId,
  IntegrationConnectionId,
  Lti1p3DeepLinkingSessionId,
  Lti1p3PlatformKeyId,
  TenantId,
  UserId,
  WebhookSubscriptionId,
} from './ids.ts';
import { Email } from './user.ts';

export const IntegrationProviderType = z.enum(['lti_1p3', 'xapi', 'sis_csv', 'generic_webhook']);
export type IntegrationProviderType = z.infer<typeof IntegrationProviderType>;

export const IntegrationConnectionStatus = z.enum(['enabled', 'disabled']);
export type IntegrationConnectionStatus = z.infer<typeof IntegrationConnectionStatus>;

export const IntegrationConnection = z
  .object({
    id: IntegrationConnectionId,
    tenantId: TenantId,
    providerType: IntegrationProviderType,
    displayName: z.string().min(1).max(120),
    status: IntegrationConnectionStatus,
    config: z.record(z.unknown()),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type IntegrationConnection = z.infer<typeof IntegrationConnection>;

export const WebhookSubscriptionStatus = z.enum(['enabled', 'disabled']);
export type WebhookSubscriptionStatus = z.infer<typeof WebhookSubscriptionStatus>;

export const WebhookEventTopic = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z][a-z0-9_.:-]*$/, {
    message: 'Webhook event topic must be lowercase alphanumeric with punctuation separators.',
  });
export type WebhookEventTopic = z.infer<typeof WebhookEventTopic>;

export const WebhookSubscription = z
  .object({
    id: WebhookSubscriptionId,
    tenantId: TenantId,
    name: z.string().min(1).max(120),
    endpointUrl: z
      .string()
      .regex(/^https:\/\//, { message: 'Webhook endpoint URL must use HTTPS.' })
      .url()
      .max(2048),
    topics: WebhookEventTopic.array().min(1).max(50),
    status: WebhookSubscriptionStatus,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type WebhookSubscription = z.infer<typeof WebhookSubscription>;

export const CourseExternalToolPlacement = z.enum([
  'course_navigation',
  'module_item',
  'assignment_selection',
  'editor_button',
]);
export type CourseExternalToolPlacement = z.infer<typeof CourseExternalToolPlacement>;

export const CourseExternalToolStatus = z.enum(['active', 'archived']);
export type CourseExternalToolStatus = z.infer<typeof CourseExternalToolStatus>;

const HttpsUrl = z
  .string()
  .regex(/^https:\/\//, {
    message: 'URL must use HTTPS.',
  })
  .url()
  .max(2048);

const HttpsLaunchUrl = HttpsUrl.refine((value) => value.length > 0, {
  message: 'Course external tool launch URL must use HTTPS.',
});

const Base64UrlValue = z.string().regex(/^[A-Za-z0-9_-]+$/, {
  message: 'Value must be base64url encoded.',
});

export const CourseExternalTool = z
  .object({
    id: CourseExternalToolId,
    tenantId: TenantId,
    courseId: CourseId,
    integrationConnectionId: IntegrationConnectionId,
    name: z.string().min(1).max(180),
    description: z.string().min(1).max(500).nullable(),
    launchUrl: HttpsLaunchUrl,
    placement: CourseExternalToolPlacement,
    status: CourseExternalToolStatus,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type CourseExternalTool = z.infer<typeof CourseExternalTool>;

export const CourseExternalToolOutcomeStatus = z.enum(['pending', 'published', 'rejected']);
export type CourseExternalToolOutcomeStatus = z.infer<typeof CourseExternalToolOutcomeStatus>;

export const CourseExternalToolOutcome = z
  .object({
    id: CourseExternalToolOutcomeId,
    tenantId: TenantId,
    courseId: CourseId,
    assignmentId: AssignmentId,
    studentId: UserId,
    externalToolId: CourseExternalToolId,
    score: z.number().nonnegative().finite(),
    maxScore: z.number().positive().finite(),
    status: CourseExternalToolOutcomeStatus,
    reportedAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((outcome, context) => {
    if (outcome.score > outcome.maxScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'score cannot exceed maxScore.',
        path: ['score'],
      });
    }
  });
export type CourseExternalToolOutcome = z.infer<typeof CourseExternalToolOutcome>;

export const Lti1p3PublicJwk = z
  .object({
    kty: z.literal('RSA'),
    kid: z.string().min(1).max(255),
    use: z.literal('sig'),
    alg: z.literal('RS256'),
    n: Base64UrlValue,
    e: Base64UrlValue,
  })
  .strict();
export type Lti1p3PublicJwk = z.infer<typeof Lti1p3PublicJwk>;

export const Lti1p3JsonWebKeySet = z
  .object({
    keys: Lti1p3PublicJwk.array(),
  })
  .strict();
export type Lti1p3JsonWebKeySet = z.infer<typeof Lti1p3JsonWebKeySet>;

export const Lti1p3ConnectionConfig = z
  .object({
    issuer: HttpsUrl,
    clientId: z.string().min(1).max(255),
    deploymentId: z.string().min(1).max(255),
    oidcLoginUrl: HttpsUrl,
    redirectUris: HttpsUrl.array().min(1).max(20),
    toolJwks: Lti1p3JsonWebKeySet.optional(),
  })
  .strict();
export type Lti1p3ConnectionConfig = z.infer<typeof Lti1p3ConnectionConfig>;

export const Lti1p3OidcLoginInitiation = z
  .object({
    method: z.literal('redirect'),
    url: HttpsUrl,
  })
  .strict();
export type Lti1p3OidcLoginInitiation = z.infer<typeof Lti1p3OidcLoginInitiation>;

export const Lti1p3LaunchType = z.enum(['resource_link', 'deep_linking']);
export type Lti1p3LaunchType = z.infer<typeof Lti1p3LaunchType>;

const Lti1p3Scope = z
  .string()
  .min(1)
  .max(1024)
  .refine(
    (scope) =>
      scope
        .split(/\s+/)
        .filter((value) => value.length > 0)
        .includes('openid'),
    { message: 'LTI OIDC authorization scope must include openid.' },
  );

export const Lti1p3OidcAuthorizationRequest = z
  .object({
    scope: Lti1p3Scope,
    response_type: z.literal('id_token'),
    response_mode: z.literal('form_post'),
    prompt: z.literal('none'),
    client_id: z.string().min(1).max(255),
    redirect_uri: HttpsUrl,
    login_hint: z.string().min(1).max(255),
    lti_message_hint: Base64UrlValue.max(4096),
    nonce: z.string().min(1).max(1024),
    state: z.string().min(1).max(1024),
  })
  .strict();
export type Lti1p3OidcAuthorizationRequest = z.infer<typeof Lti1p3OidcAuthorizationRequest>;

export const Lti1p3LaunchAuthorizationRequest = z
  .object({
    redirectUri: HttpsUrl,
    state: z.string().min(1).max(1024),
    nonce: z.string().min(1).max(1024),
  })
  .strict();
export type Lti1p3LaunchAuthorizationRequest = z.infer<typeof Lti1p3LaunchAuthorizationRequest>;

export const Lti1p3DeepLinkingPresentationDocumentTarget = z.enum(['iframe', 'window']);
export type Lti1p3DeepLinkingPresentationDocumentTarget = z.infer<
  typeof Lti1p3DeepLinkingPresentationDocumentTarget
>;

export const Lti1p3DeepLinkingContentItemType = z.enum(['ltiResourceLink']);
export type Lti1p3DeepLinkingContentItemType = z.infer<typeof Lti1p3DeepLinkingContentItemType>;

export const Lti1p3DeepLinkingSettings = z
  .object({
    deep_link_return_url: HttpsUrl,
    accept_types: Lti1p3DeepLinkingContentItemType.array().min(1).max(10),
    accept_presentation_document_targets: Lti1p3DeepLinkingPresentationDocumentTarget.array()
      .min(1)
      .max(5),
    accept_multiple: z.boolean(),
    data: Base64UrlValue.max(4096),
  })
  .strict();
export type Lti1p3DeepLinkingSettings = z.infer<typeof Lti1p3DeepLinkingSettings>;

export const Lti1p3DeepLinkingLaunchRequest = Lti1p3LaunchAuthorizationRequest.extend({
  deepLinkReturnUrl: HttpsUrl,
}).strict();
export type Lti1p3DeepLinkingLaunchRequest = z.infer<typeof Lti1p3DeepLinkingLaunchRequest>;

export const Lti1p3LaunchAuthorizationResponse = z
  .object({
    method: z.literal('form_post'),
    url: HttpsUrl,
    fields: z
      .object({
        id_token: z.string().min(1),
        state: z.string().min(1).max(1024),
      })
      .strict(),
  })
  .strict();
export type Lti1p3LaunchAuthorizationResponse = z.infer<typeof Lti1p3LaunchAuthorizationResponse>;

export const lti1p3InstructorRole =
  'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor' as const;
export const lti1p3LearnerRole =
  'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner' as const;
export const lti1p3TeachingAssistantRole =
  'http://purl.imsglobal.org/vocab/lis/v2/membership/Instructor#TeachingAssistant' as const;
export const lti1p3NamesRolesContextMembershipReadonlyScope =
  'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly' as const;
export const lti1p3AgsLineItemScope =
  'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem' as const;
export const lti1p3AgsLineItemReadonlyScope =
  'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly' as const;
export const lti1p3AgsResultReadonlyScope =
  'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly' as const;
export const lti1p3AgsScoreScope = 'https://purl.imsglobal.org/spec/lti-ags/scope/score' as const;

export const Lti1p3ServiceScope = z.enum([
  lti1p3NamesRolesContextMembershipReadonlyScope,
  lti1p3AgsLineItemScope,
  lti1p3AgsLineItemReadonlyScope,
  lti1p3AgsResultReadonlyScope,
  lti1p3AgsScoreScope,
]);
export type Lti1p3ServiceScope = z.infer<typeof Lti1p3ServiceScope>;

export const Lti1p3ServiceTokenRequest = z
  .object({
    grant_type: z.literal('client_credentials'),
    client_assertion_type: z.literal('urn:ietf:params:oauth:client-assertion-type:jwt-bearer'),
    client_assertion: z.string().min(1).max(65536),
    scope: z.string().min(1).max(4096),
  })
  .strict();
export type Lti1p3ServiceTokenRequest = z.infer<typeof Lti1p3ServiceTokenRequest>;

export const Lti1p3ServiceAccessToken = z
  .object({
    access_token: z.string().min(15).max(65536),
    token_type: z.literal('bearer'),
    expires_in: z.number().int().positive(),
    scope: z.string().min(1).max(4096),
  })
  .strict();
export type Lti1p3ServiceAccessToken = z.infer<typeof Lti1p3ServiceAccessToken>;

export const Lti1p3AgsActivityProgress = z.enum([
  'Initialized',
  'Started',
  'InProgress',
  'Submitted',
  'Completed',
]);
export type Lti1p3AgsActivityProgress = z.infer<typeof Lti1p3AgsActivityProgress>;

export const Lti1p3AgsGradingProgress = z.enum([
  'FullyGraded',
  'Pending',
  'PendingManual',
  'Failed',
  'NotReady',
]);
export type Lti1p3AgsGradingProgress = z.infer<typeof Lti1p3AgsGradingProgress>;

export const Lti1p3AgsScore = z
  .object({
    timestamp: z.union([
      z.date(),
      z
        .string()
        .datetime({ offset: true })
        .transform((value) => new Date(value)),
    ]),
    scoreGiven: z.number().nonnegative().finite().nullable().optional(),
    scoreMaximum: z.number().positive().finite().optional(),
    activityProgress: Lti1p3AgsActivityProgress,
    gradingProgress: Lti1p3AgsGradingProgress,
    userId: UserId,
    scoringUserId: UserId.optional(),
    comment: z.string().min(1).max(4096).nullable().optional(),
  })
  .strict()
  .superRefine((score, context) => {
    if (
      score.scoreGiven !== undefined &&
      score.scoreGiven !== null &&
      score.scoreMaximum === undefined
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'scoreMaximum is required when scoreGiven is present.',
        path: ['scoreMaximum'],
      });
    }
  });
export type Lti1p3AgsScore = z.infer<typeof Lti1p3AgsScore>;

export const Lti1p3AgsResult = z
  .object({
    id: HttpsUrl,
    scoreOf: HttpsUrl,
    userId: UserId,
    resultScore: z.number().nonnegative().finite().nullable().optional(),
    resultMaximum: z.number().positive().finite(),
    scoringUserId: UserId.optional(),
    comment: z.string().min(1).max(4096).nullable().optional(),
  })
  .strict();
export type Lti1p3AgsResult = z.infer<typeof Lti1p3AgsResult>;

export const Lti1p3AgsResultContainer = Lti1p3AgsResult.array();
export type Lti1p3AgsResultContainer = z.infer<typeof Lti1p3AgsResultContainer>;

export const Lti1p3DeepLinkingSessionStatus = z.enum(['pending', 'completed']);
export type Lti1p3DeepLinkingSessionStatus = z.infer<typeof Lti1p3DeepLinkingSessionStatus>;

export const Lti1p3DeepLinkingSession = z
  .object({
    id: Lti1p3DeepLinkingSessionId,
    tenantId: TenantId,
    courseId: CourseId,
    toolId: CourseExternalToolId,
    actorUserId: UserId,
    status: Lti1p3DeepLinkingSessionStatus,
    createdAt: z.date(),
    expiresAt: z.date(),
    completedAt: z.date().nullable(),
    updatedAt: z.date(),
  })
  .strict();
export type Lti1p3DeepLinkingSession = z.infer<typeof Lti1p3DeepLinkingSession>;

export const Lti1p3DeepLinkingSessionData = z
  .object({
    sessionId: Lti1p3DeepLinkingSessionId,
  })
  .strict();
export type Lti1p3DeepLinkingSessionData = z.infer<typeof Lti1p3DeepLinkingSessionData>;

export const Lti1p3DeepLinkingContentItem = z
  .object({
    type: z.literal('ltiResourceLink'),
    title: z.string().min(1).max(180),
    text: z.string().min(1).max(500).optional(),
    url: HttpsUrl.optional(),
  })
  .passthrough();
export type Lti1p3DeepLinkingContentItem = z.infer<typeof Lti1p3DeepLinkingContentItem>;

export const Lti1p3DeepLinkingReturnBody = z
  .object({
    JWT: z.string().min(1).max(65536),
  })
  .strict();
export type Lti1p3DeepLinkingReturnBody = z.infer<typeof Lti1p3DeepLinkingReturnBody>;

export const Lti1p3DeepLinkingReturnResult = z
  .object({
    createdExternalTools: CourseExternalTool.array(),
    ignoredContentItemCount: z.number().int().nonnegative(),
  })
  .strict();
export type Lti1p3DeepLinkingReturnResult = z.infer<typeof Lti1p3DeepLinkingReturnResult>;

export const Lti1p3NamesRolesContext = z
  .object({
    id: CourseId,
    label: z.string().min(1).max(32),
    title: z.string().min(1).max(160),
  })
  .strict();
export type Lti1p3NamesRolesContext = z.infer<typeof Lti1p3NamesRolesContext>;

export const Lti1p3NamesRolesMemberStatus = z.enum(['Active', 'Inactive']);
export type Lti1p3NamesRolesMemberStatus = z.infer<typeof Lti1p3NamesRolesMemberStatus>;

export const Lti1p3NamesRolesRole = z.enum([
  lti1p3InstructorRole,
  lti1p3LearnerRole,
  lti1p3TeachingAssistantRole,
]);
export type Lti1p3NamesRolesRole = z.infer<typeof Lti1p3NamesRolesRole>;

export const Lti1p3NamesRolesMember = z
  .object({
    status: Lti1p3NamesRolesMemberStatus,
    name: z.string().min(1).max(120).optional(),
    email: Email.optional(),
    user_id: UserId,
    roles: Lti1p3NamesRolesRole.array().min(1).max(10),
  })
  .strict();
export type Lti1p3NamesRolesMember = z.infer<typeof Lti1p3NamesRolesMember>;

export const Lti1p3NamesRolesMembershipContainer = z
  .object({
    id: HttpsUrl,
    context: Lti1p3NamesRolesContext,
    members: Lti1p3NamesRolesMember.array(),
  })
  .strict();
export type Lti1p3NamesRolesMembershipContainer = z.infer<
  typeof Lti1p3NamesRolesMembershipContainer
>;

export const Lti1p3PlatformKeyStatus = z.enum(['active', 'retired']);
export type Lti1p3PlatformKeyStatus = z.infer<typeof Lti1p3PlatformKeyStatus>;

export const Lti1p3PlatformKey = z
  .object({
    id: Lti1p3PlatformKeyId,
    tenantId: TenantId,
    keyId: z.string().min(1).max(255),
    status: Lti1p3PlatformKeyStatus,
    publicJwk: Lti1p3PublicJwk,
    encryptedPrivateJwk: z.string().min(1),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((key, context) => {
    if (key.keyId !== key.publicJwk.kid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'keyId must match publicJwk.kid.',
        path: ['publicJwk', 'kid'],
      });
    }
  });
export type Lti1p3PlatformKey = z.infer<typeof Lti1p3PlatformKey>;
