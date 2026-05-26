# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Forma is a SaaS storefront/website builder platform. Users create and manage projects (storefronts, portfolios) via a visual editor, with features for catalog, sales, analytics, and billing.

## Commands

### Frontend (Angular 20)

```bash
cd Frontend
npm install
npm start          # dev server at http://localhost:4200
npm run build      # production build
npm run test       # Karma + Jasmine unit tests
```

### Backend (Spring Boot / Maven)

```bash
# Build all services
cd Backend
mvn clean package

# Docker (all services)
.\start-backend.ps1        # start
.\stop-backend.ps1         # stop

# Local JVM (no Docker)
.\start-backend-local.ps1
.\stop-backend-local.ps1

# Single service
cd Backend/service-utilisateurs
mvn spring-boot:run
```

### Service Ports

| Service | Port | Responsibility |
|---|---|---|
| service-utilisateurs | 8081 | Auth, users, profile, Google OAuth |
| service-projets | 8082 | Project CRUD, templates, assets |
| service-commerce | 8083 | Storefront, catalog, customers, sales, portfolio |
| service-analytics | 8084 | Analytics dashboards |
| service-billing | 8085 | Billing, subscriptions |

## Architecture

### Backend: Shared Source, Compiled Per-Service

The five Spring Boot services share a single Java source tree under a common package (`tn.forma.users`). **Service boundaries are enforced via Maven compiler exclude lists in each service's `pom.xml`.** A class may appear in multiple services' source folders but only compile into one.

Critical implications:
- Before concluding an endpoint is missing, check the correct service's `pom.xml` excludes.
- When adding or moving controllers/services, inspect compiler excludes in all five service poms.
- `Backend/pom.xml` is a Maven aggregator — individual service poms control what gets built into each JAR.

### Frontend: Standalone Angular Components

No NgModules. All components use `standalone: true`. The app is structured as:
- `core/` — guards, interceptors (`jwt.interceptor.ts`), models, and all backend-facing services
- `features/` — feature areas: `auth/`, `landing/`, `app/` (workspace dashboard, editor)
- `shared/` — reusable utilities and presentation components

All backend calls go through services in `core/services/`. Most services build URLs from `environment.apiUrl` (currently `http://localhost:8081/api`). **`AuthService` hardcodes `http://localhost:8081/api/auth` directly — check this if changing API routing.**

### API Gateway Status (Needs Verification)

The frontend targets a single base URL (`localhost:8081`) while the backend exposes 5 services on ports 8081–8085. Whether port 8081 acts as an API gateway/proxy, or whether this is temporary/incomplete config, has not been fully verified.

### Storefront Editor (High-Regression Area)

The visual editor is the most fragile part of the codebase. Key files:
- `Frontend/.../project-storefront-editor.ts` — main editor component
- `Frontend/.../project-storefront-editor.html` / `.css`
- `storefront-editor-storefront.domain.ts` — section/component domain logic
- `storefront-editor-pages.domain.ts` — managed pages abstraction
- `project-storefront.model.ts` — data model shared across editor and storefront

**Storefront preview in preview mode reads from `localStorage` (editor snapshot), not from the backend.** Preview bugs are not always backend bugs.

When changing section prop keys, inspect all three domain/model files together. Managed storefront pages are an editor-layer abstraction — backend is still centered on `home`.

### Key API → Service Mapping

| Route prefix | Backend controller | Service |
|---|---|---|
| `/api/auth` | `AuthController` | service-utilisateurs |
| `/api/users` | `UserController` | service-utilisateurs |
| `/api/projects` | `ProjectController` | service-projets |
| `/api/templates` | `TemplateController` | service-projets |
| `/api/projects/{id}/storefront` | `ProjectStorefrontController` | service-commerce |
| `/api/public/projects/{id}` | `PublicStorefrontController` | service-commerce |
| `/api/projects/{id}/catalog` | `ProjectCatalogController` | service-commerce |
| `/api/projects/{id}/customers` | `ProjectCustomerController` | service-commerce |
| `/api/projects/{id}/sales` | `ProjectSalesController` | service-commerce |
| `/api/projects/{id}/pages` | `PortfolioPageController` | service-commerce |
| `/api/projects/{id}/inquiries` | `PortfolioInquiryController` | service-commerce |
| `/api/projects/{id}/analytics` | `ProjectAnalyticsController` | service-analytics |
| `/api/billing` | `BillingController` | service-billing |

**Note:** `service-analytics/.../ProjectHomeController.java` currently exists but is empty.

## Sensitive Configuration

- `Backend/service-utilisateurs/.env` — contains live Supabase DB credentials, Cloudinary keys, Google OAuth secrets. **Never echo, summarize, or copy these values into docs, logs, or commits.**
- The root `docker-compose.yml` references this `.env` file for multiple services.
- `Frontend/src/environments/environment.ts` — API base URL config; changing this affects all frontend services.

## Cross-File Coordination

When changing API base URL behavior, inspect all of:
- `environment.ts`
- `jwt.interceptor.ts`
- `auth.service.ts`
- affected core services

When changing storefront section/component prop keys, inspect all of:
- `project-storefront-editor.ts`
- `storefront-editor-storefront.domain.ts`
- `project-storefront.model.ts`

When changing managed page behavior, inspect all of:
- `project-storefront.model.ts`
- `storefront-editor-pages.domain.ts`
- `project-storefront-editor.ts`

## Project Memory

The `/project-memory/` directory contains maintained architecture docs, API endpoint maps, editor behavior notes, and a regression list. Consult these before making changes in unfamiliar areas, especially the storefront editor. Key files:
- `backend-memory.md` — service layout, quirks, invariants
- `frontend-memory.md` — UI structure and routing
- `frontend-backend-links.md` — API endpoint mappings
- `known-rules-and-regressions.md` — known fragile areas and editor rules
- `storefront-editor-memory.md` — editor-specific behavior

## Storefront Editor Invariants

- Selection borders must remain square.
- Popups and menus must stay above preview content (z-index discipline).
- Only one popup/menu should be visible at a time.
- The Add Elements category strip swaps into a subcategory strip in the same slot — do not reintroduce a stacked submenu.
- New editor components default to transparent unless explicitly specified.
- The selected-section left rail depends on preview overflow being visible — clipping CSS can hide it without breaking TypeScript logic.
- Button text must not use inline double-click editing.
- The old selected-section top-right `Edit` button is intentionally removed.
