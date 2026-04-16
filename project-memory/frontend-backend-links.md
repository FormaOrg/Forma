# Frontend / Backend Links

## Main Relationship

The frontend is organized by feature services under `Frontend/src/app/core/services`.
Those services mostly target REST endpoints under `/api/...`.

Important caution:
- most frontend services build from `environment.apiUrl`
- `AuthService` hardcodes `http://localhost:8081/api/auth`
- backend README says there are five services on `8081` to `8085`
- whether `8081` is a gateway/proxy needs verification

## Confirmed Links

## Auth and user account

Frontend:
- `Frontend/src/app/core/services/auth.service.ts`

Backend:
- `Backend/service-utilisateurs/.../AuthController.java`
- `Backend/service-utilisateurs/.../UserController.java`

Relationship:
- login/register/google/refresh/password flows map to `/api/auth`
- session validation and account/security routes map to `/api/users/...`

## Projects and templates

Frontend:
- `Frontend/src/app/core/services/project.service.ts`

Backend:
- `Backend/service-projets/.../ProjectController.java`
- `Backend/service-projets/.../TemplateController.java`

Relationship:
- project CRUD, duplicate, publish map clearly
- template listing maps clearly
- design/theme/media/deployment/export endpoints are referenced by frontend but not all were verified controller-by-controller in this pass

## Storefront editor and publish/unpublish

Frontend:
- `Frontend/src/app/core/services/project-storefront.service.ts`
- `Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor/*`

Backend:
- `Backend/service-commerce/.../ProjectStorefrontController.java`

Relationship:
- `GET /api/projects/{projectId}/storefront`
- `PUT /api/projects/{projectId}/storefront`
- `POST /api/projects/{projectId}/storefront/publish`
- `POST /api/projects/{projectId}/storefront/unpublish`

## Public storefront and checkout

Frontend:
- `Frontend/src/app/core/services/public-storefront.service.ts`
- `Frontend/src/app/features/public-storefront/*`

Backend:
- `Backend/service-commerce/.../PublicStorefrontController.java`

Relationship:
- public storefront home
- public products list/detail
- checkout

Special case:
- preview mode can read a local editor snapshot from `localStorage` instead of hitting the backend

## Catalog

Frontend:
- `Frontend/src/app/core/services/project-catalog.service.ts`

Backend:
- `Backend/service-commerce/.../ProjectCatalogController.java`

Relationship:
- catalog page
- create/update/delete product

Cross-feature dependency:
- storefront product-feed/editor preview depends on catalog products

## Customers

Frontend:
- `Frontend/src/app/core/services/project-customers.service.ts`

Backend:
- `Backend/service-commerce/.../ProjectCustomerController.java`

Relationship:
- list/create/update/delete customers per project

## Sales

Frontend:
- `Frontend/src/app/core/services/project-sales.service.ts`

Backend:
- `Backend/service-commerce/.../ProjectSalesController.java`

Relationship:
- sales page
- order export
- order CRUD
- bulk delete orders

## Portfolio pages and inquiries

Frontend:
- `Frontend/src/app/core/services/portfolio-pages.service.ts`
- `Frontend/src/app/core/services/portfolio-inquiries.service.ts`

Backend:
- `Backend/service-commerce/.../PortfolioPageController.java`
- `Backend/service-commerce/.../PortfolioInquiryController.java`

Relationship:
- pages listing
- inquiries page
- inquiry status update

## Analytics

Frontend:
- `Frontend/src/app/core/services/project-analytics.service.ts`

Backend:
- `Backend/service-analytics/.../ProjectAnalyticsController.java`

Relationship:
- project analytics page via range query parameter

## Project home dashboard

Frontend:
- `Frontend/src/app/core/services/project-home.service.ts`

Backend:
- likely `Backend/service-analytics/.../ProjectHomeController.java`

Status:
- Needs verification
- inspected backend controller is currently empty

## Billing

Frontend:
- frontend billing area not fully inspected in this pass

Backend:
- `Backend/service-billing/.../BillingController.java`

Relationship:
- billing overview endpoint exists at `/api/billing/overview`

## Important Domain Relationships

- `projectId` is the backbone identifier across workspace features.
- Auth/session gates almost all project APIs.
- Catalog data feeds storefront preview and public storefront product views.
- Storefront editor uses draft/published storefront state plus editor session metadata.
- Managed storefront pages are currently an editor-layer abstraction over a backend model still centered on `home`.
