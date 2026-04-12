# Backend Memory

## Architecture Overview

Backend path:
- `Backend`

Backend root is a Maven aggregator:
- `Backend/pom.xml`

Service folders:
- `service-utilisateurs`
- `service-projets`
- `service-commerce`
- `service-analytics`
- `service-billing`

Important architectural quirk:
- the services share a very similar Java source layout and package base
- service boundaries are enforced largely through each service `pom.xml` compiler exclude list
- changing shared source can affect multiple service builds

## Service Responsibilities

- `service-utilisateurs`
  Auth, users, profile, account security/activity, Google auth/linking.
- `service-projets`
  Project CRUD, template access, project asset/media-related project operations.
- `service-commerce`
  Storefront, public storefront, checkout, catalog, customers, sales, portfolio pages, inquiries.
- `service-analytics`
  Analytics endpoints and dashboard insights.
- `service-billing`
  Billing overview and subscription/billing-related endpoints.

## Main Backend Areas Visible in Code

Common controller package:
- `tn.forma.users.controller`

Confirmed controller mappings inspected:
- `AuthController` -> `/api/auth`
- `UserController` -> `/api/users`
- `ProjectController` -> `/api/projects`
- `TemplateController` -> `/api/templates`
- `ProjectStorefrontController` -> `/api/projects/{projectId}/storefront`
- `PublicStorefrontController` -> `/api/public/projects/{projectId}`
- `ProjectCatalogController` -> `/api/projects/{projectId}/catalog`
- `ProjectCustomerController` -> `/api/projects/{projectId}/customers`
- `ProjectSalesController` -> `/api/projects/{projectId}/sales`
- `PortfolioPageController` -> `/api/projects/{projectId}/pages`
- `PortfolioInquiryController` -> `/api/projects/{projectId}/inquiries`
- `ProjectAnalyticsController` -> `/api/projects/{projectId}/analytics`
- `BillingController` -> `/api/billing`

Observed oddity:
- `service-analytics/.../ProjectHomeController.java` currently exists but is empty.

## Integrations, Storage, Security

Visible dependencies and patterns:
- Spring Security
- JWT auth
- Spring Data JPA
- PostgreSQL
- WebSocket support
- Google API client / Google linking
- Cloudinary
- Java mail

Runtime/config notes:
- root compose file is `Backend/docker-compose.yml`
- root README says services run on ports `8081` to `8085`
- local Docker uses an `uploads_data` volume
- local service Dockerfiles build with Maven image, then run on Temurin JRE

Sensitive config:
- `Backend/service-utilisateurs/.env` exists and contains real environment secrets
- do not echo, summarize, or copy those values into docs, logs, or commits
- compose appears to reuse that env file for multiple services

## How Frontend Likely Talks to Backend

Confirmed patterns:
- auth/session endpoints are directly on `http://localhost:8081/api/...` in `AuthService`
- many other frontend services build URLs from `environment.apiUrl`, currently `http://localhost:8081/api`
- backend README and compose expose five services on different ports

Implication:
- either `8081` is acting like an API entrypoint/gateway
- or the frontend config is temporary/incomplete during the service split

Status:
- Needs verification

## Backend-Specific Invariants

- Always inspect the correct service `pom.xml` before concluding an endpoint is "missing"; the source tree is shared but build excludes differ per service.
- If you add or move controllers/services, inspect compile excludes in all five service poms.
- If you change a REST path, inspect the matching frontend service immediately.
- Treat `.env` and any local credentials as sensitive, even in internal docs.
- Docker/runtime behavior is compose/env driven more than code-config driven in the tracked files.

## Common Traps

- Looking only at one service source folder can be misleading because the class may exist in several services but only compile into one.
- The frontend may call endpoints that are only partially wired in the currently inspected service.
- `ProjectHomeController` being empty means any `/projects/{id}/home` assumptions need verification.
- Deployment/design/theme/media/export endpoints are referenced from the frontend but were not fully verified controller-by-controller in this pass.

## Verification Commands

Backend build:
- `mvn clean package` from `Backend`

Docker startup:
- `.\start-backend.ps1`

Local per-service startup:
- `.\start-backend-local.ps1`

Local stop:
- `.\stop-backend-local.ps1`

## Needs Verification

- Actual gateway/proxy story between frontend `8081` API base and the five backend services.
- Production deployment topology and reverse proxy setup.
- Tracked Spring `application.properties` / `application.yml` files were not visible in this pass.
- Full implementation status of deployment/design/theme/media/export endpoints.
