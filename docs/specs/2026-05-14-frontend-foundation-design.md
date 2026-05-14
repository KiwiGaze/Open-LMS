# Frontend Foundation – Design

Date: 2026-05-14
Branch: `kiwi/frontend-foundation`

## Goals

1. Stand up a new `@openlms/web` workspace package containing the Open-LMS frontend.
2. Define the design system foundation (tokens, typography, component primitives, layout shell, reusable patterns).
3. Implement frontend features end-to-end against the existing backend (`packages/api`), feature by feature, until the core LMS surface is usable.

This is intentionally a *frontend* lane only — no backend changes unless a route is unusable from the client (e.g. CORS).

## Stack

| Concern | Choice | Reason |
| --- | --- | --- |
| Framework | **Next.js 15 + App Router + React 19** | Established, server components, route groups, type-safe layouts. Works for SSR of catalog and CSR-heavy app shell. |
| Styling | **Tailwind v4** + CSS custom-property tokens | Token-first design, dark mode via `data-theme`, zero runtime cost. |
| Components | Hand-rolled primitives + Radix UI for dialogs/menus/popovers/tooltips | Full control over visual language; Radix only where keyboard / focus management is non-trivial. |
| Icons | **Lucide React** | Comprehensive, tree-shakeable. |
| Server state | **TanStack Query v5** | Caching, retries, invalidation, devtools. |
| Forms | **React Hook Form + Zod** | Reuse contracts schemas from `@openlms/contracts`. |
| API types | **openapi-typescript + openapi-fetch** | Generated from `openapi/openapi.json` for path/method/response type safety. |
| Tests | Vitest | Match the rest of the monorepo. Component tests with Testing Library. |
| Lint/format | Biome | Match repo convention. |

## Workspace integration

- New package: `packages/web` named `@openlms/web`.
- TypeScript extends `tsconfig.base.json` but overrides `jsx: preserve`, adds DOM libs, and configures Next plugin.
- Biome is configured to lint `src/`. The pre-commit hook (`pnpm typecheck && pnpm lint`) already covers it via `pnpm -r`.
- The package can typecheck without Postgres; running `dev` requires the API server at `http://localhost:3000` (configurable via `NEXT_PUBLIC_API_BASE_URL`).

## Routing surface

```
app/
  (auth)/login, register, forgot-password
  (app)/
    dashboard
    courses
      [courseId]/        ← layout with course tabs
        modules
        assignments      ← list + [assignmentId] detail
        discussions      ← list + [topicId] detail
        quizzes          ← list + [quizId]/take + [quizId]/results
        gradebook        ← role-aware view
        people
        pages
        files
        announcements
        calendar
        settings
    calendar              ← cross-course
    inbox                 ← cross-course threads
    announcements         ← tenant-wide feed
    notifications
    account
    admin/
      tenant
      providers
      ai-usage
      audit-logs
      feature-flags
      retention
```

## Color system

A warm-academic palette grounded in deep indigo with neutral slate and a single warm accent.

- **Brand**: indigo 50–950 scale (CSS custom properties).
- **Neutral**: slate scale.
- **Semantic**: emerald (success), amber (warning), rose (danger), sky (info).
- **Surfaces**: `surface-base`, `surface-elevated`, `surface-sunken`, `surface-overlay`.
- **Text**: `text-default`, `text-muted`, `text-subtle`, `text-inverted`.
- **Borders**: `border-default`, `border-subtle`, `border-strong`.
- Dark mode: tokens flip via `[data-theme="dark"]`.

## Component layering

1. **Tokens** (`styles/globals.css`) — single source of truth for color/space/radius/shadow.
2. **Primitives** (`components/ui/*`) — Button, Input, Card, Dialog, etc. Use tokens; expose intent variants (primary/ghost/destructive…).
3. **Patterns** (`components/patterns/*`) — DataTable, EmptyState, ErrorState, LoadingSkeleton, FormField, FilterBar, PageHeader, KpiCard.
4. **Shell** (`components/shell/*`) — AppSidebar, AppTopbar, CourseSidebar, MobileDrawer.
5. **Features** (`app/(app)/.../components/*`) — feature-local compositions.

## Data flow

```
component → TanStack Query hook (in lib/queries/) → openapi-fetch client → API
                                                ↑
                                            session store (auth context)
```

- Auth token persists in an httpOnly cookie set by a Next Route Handler (`/_session`) so client never holds the token raw. The browser sends the cookie; the route handler attaches `Authorization: Bearer …` server-side. For client components that fetch directly during dev, we fall back to a localStorage strategy controlled by env (configurable, not the default).
- Tenant context (`activeTenantId`) lives in a small Zustand store hydrated from `/me`.
- Query keys: `[domain, tenantId, ...scope]`. Tenant switch invalidates everything under `[domain, tenantId]`.

## Loading / error / empty conventions

Every list page must render:

- **Loading**: skeleton matching final shape (no spinners-on-empty-page).
- **Error**: `ErrorState` with code + message from the API's `{ error: { code, message } }` envelope. CTA to retry.
- **Empty**: `EmptyState` with role-aware copy + primary action (e.g. "Create course" for staff, "Browse catalog" for student).

Mutations show inline toasts on success; field-level errors map back to the form by code.

## Iteration order

1. Foundation: scaffold, tokens, primitives, shell, API client.
2. Auth.
3. Dashboard + courses index.
4. Course shell + course home.
5. Modules.
6. Assignments (list + detail + submit).
7. Gradebook (student view first, then instructor grid).
8. Discussions.
9. Quizzes.
10. People + sections.
11. Calendar + announcements + inbox.
12. Account settings.
13. Tenant admin.

## Out of scope (this branch)

- Mobile-native apps.
- Real-time presence / WebSocket plumbing.
- E2E tests (Playwright). Component tests only.
- Internationalization beyond locale display.
