# Frontend Memory

## Architecture Overview

Frontend path:
- `Frontend`

Core structure:
- `src/app/core`
- `src/app/features`
- `src/app/shared`

Pattern:
- Angular standalone components
- route-driven feature folders
- shared services in `core/services`
- many feature pages keep local UI state with Angular `signal`, `computed`, and `effect`

Bootstrap and global wiring:
- `src/app/app.config.ts`
- `src/app/app.routes.ts`
- `src/app/core/interceptors/jwt.interceptor.ts`

Important global setup in `app.config.ts`:
- router with in-memory scrolling
- `HttpClient` with DI interceptors
- JWT interceptor
- `APP_INITIALIZER` usage for bootstrap/i18n/theme/settings/google auth flows
- custom `SettingsRouteReuseStrategy`

## Routing and Workspace Shape

Main route file:
- `Frontend/src/app/app.routes.ts`

Top-level route areas:
- public marketing/support/template pages
- auth pages
- public storefront pages under `/store/:projectId`
- authenticated dashboard under `/app`

Project workspace lives under:
- `/app/projects/:projectId/...`

Notable project workspace areas:
- home
- sales
- catalog
- customers
- editor
- pages
- inquiries
- posts
- categories
- subscribers
- analytics
- settings

Storefront editor route:
- `Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor`

## Service and State Patterns

Main pattern:
- feature screens call `core/services/*`
- services call REST endpoints with `HttpClient`
- view state is usually local to the feature component

Important services:
- `project.service.ts`
- `project-storefront.service.ts`
- `public-storefront.service.ts`
- `project-catalog.service.ts`
- `project-customers.service.ts`
- `project-sales.service.ts`
- `project-analytics.service.ts`
- `project-home.service.ts`
- `portfolio-pages.service.ts`
- `portfolio-inquiries.service.ts`
- `auth.service.ts`
- `project-workspace-context.service.ts`

Notable local/browser persistence:
- auth tokens and user session in local/session storage
- workspace type cache in `ProjectWorkspaceContextService`
- storefront editor preview snapshot in `PublicStorefrontService`
- storefront editor color/history/session state inside the editor flow

## Important App Areas

- `features/auth`
  Login/register/recovery/google auth UI.
- `features/app/dashboard`
  Authenticated workspace and project management.
- `features/public-storefront`
  Public storefront rendering and preview mode.
- `features/template-gallery`, `features/templates-pages`
  Template browsing/showcase.
- `features/landing-page`, `features/pricing`, `features/support`
  Public marketing/support content.

## Frontend-Specific Invariants

- Standalone component architecture is the norm. Do not introduce module-based assumptions.
- Most backend calls are built from `environment.apiUrl`, but `AuthService` hardcodes `http://localhost:8081/api/auth` and session validation calls `http://localhost:8081/api/users/...`.
- `JwtInterceptor` only auto-attaches tokens for requests under `environment.apiUrl` or `/api/*`.
- Public storefront preview mode can be served from a local editor snapshot in `localStorage`, not the backend.
- The storefront editor is large and stateful. Changes usually require coordinated updates across:
  - `project-storefront-editor.ts`
  - `project-storefront-editor.html`
  - `project-storefront-editor.css`
  - editor domain/model helpers
- Storefront editor component files are partitioned under:
  - `components/`
  - `components/blocks/`
  - `components/media-manager/`

## Common Traps

- If you change API base handling, inspect:
  - `environment.ts`
  - `jwt.interceptor.ts`
  - `auth.service.ts`
  - every affected `core/service`
- If a route seems present but data feels incomplete, verify whether the backend controller actually exists; some frontend areas are further along than some backend endpoints.
- If preview/public storefront behavior looks inconsistent, check whether a saved editor preview snapshot is masking backend data.
- If project type behavior is wrong, inspect `ProjectWorkspaceContextService` because it caches project types in local storage.
- In the storefront editor, overflow/clipping CSS can hide section rail controls and other editor chrome even when the logic is correct.
- In the storefront editor, the Add Elements menu now swaps between category mode and subcategory mode in the same slot; avoid assuming two stacked rows.

## Verification Commands

Primary frontend verification:
- `npx tsc -p Frontend/tsconfig.app.json --noEmit`
- `npx ng build --configuration development`

Additional local commands:
- `npm install` in `Frontend`
- `ng serve` or `npm start`
- `npm test` or `ng test` if needed

## Needs Verification

- Whether `environment.apiUrl` on `8081` is a gateway/proxy entrypoint for all backend services.
- Which routed workspace areas are complete vs placeholder-only on the backend side.
