# Feature Map

## Compact Map

| Feature | Frontend main area | Backend main area | Dependencies / notes |
|---|---|---|---|
| Auth and session | `Frontend/src/app/features/auth`, `Frontend/src/app/core/services/auth.service.ts` | `Backend/service-utilisateurs` via `AuthController`, `UserController` | JWT interceptor, user/session storage, Google auth/linking |
| User profile and security | dashboard settings flows, `auth.service.ts`, user-related models/services | `Backend/service-utilisateurs` via `UserController` | Activity sessions, login history, password/email/security flows |
| Project dashboard and CRUD | `features/app/dashboard/pages/projects`, `project.service.ts` | `Backend/service-projets` via `ProjectController` | Project workspace is route-driven by `projectId` |
| Templates | `features/template-gallery`, `features/templates-pages`, `project.service.ts` | `Backend/service-projets` via `TemplateController` | Public and authenticated template listing both exist |
| Storefront editor | `features/app/dashboard/pages/projects/project-storefront-editor` | `Backend/service-commerce` via `ProjectStorefrontController` | Most state lives in editor TS/HTML/CSS plus editor domain files |
| Public storefront and checkout | `features/public-storefront`, `public-storefront.service.ts` | `Backend/service-commerce` via `PublicStorefrontController` | Editor preview can bypass backend with local snapshot |
| Catalog | `project-catalog-route`, `project-catalog.service.ts` | `Backend/service-commerce` via `ProjectCatalogController` | Storefront and product feed depend on catalog data |
| Customers | `project-customers-route`, `project-customers.service.ts` | `Backend/service-commerce` via `ProjectCustomerController` | Sales/orders reference customers |
| Sales / orders | `project-sales-route`, `project-sales.service.ts` | `Backend/service-commerce` via `ProjectSalesController` | CSV export exists in controller; pagination/filtering in FE service |
| Portfolio pages | `project-pages-route`, `portfolio-pages.service.ts` | `Backend/service-commerce` via `PortfolioPageController` | Name suggests non-ecommerce content pages |
| Portfolio inquiries | `project-inquiries-route`, `portfolio-inquiries.service.ts` | `Backend/service-commerce` via `PortfolioInquiryController` | Status update path exists |
| Analytics | `project-analytics-route`, `project-analytics.service.ts` | `Backend/service-analytics` via `ProjectAnalyticsController` | Range preset query parameter |
| Project home dashboard | `project-home-route`, `project-home.service.ts` | `Backend/service-analytics` likely `ProjectHomeController` | Needs verification; inspected controller is currently empty |
| Billing | billing-related UI needs verification in FE; backend service exists | `Backend/service-billing` via `BillingController` | Overview endpoint confirmed |
| Media / uploads | editor media manager, `project.service.ts`, `upload.service.ts` | `service-projets` likely `ProjectMediaController` / `UploadController` | Endpoints referenced, full mapping needs verification |
| Themes / design / deployment / export | `project.service.ts` | likely `service-projets` | Referenced by FE, but full controller verification is incomplete |

## Storefront Editor Sub-Map

Main frontend files:
- `Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor/project-storefront-editor.ts`
- `Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor/project-storefront-editor.html`
- `Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor/project-storefront-editor.css`
- `Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component-library.ts`
- `Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component.model.ts`
- `Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor/domains/storefront-editor-pages.domain.ts`
- `Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor/domains/storefront-editor-storefront.domain.ts`

Main backend link:
- `Backend/service-commerce/src/main/java/tn/forma/users/controller/ProjectStorefrontController.java`

Related frontend areas:
- `Frontend/src/app/core/services/project-storefront.service.ts`
- `Frontend/src/app/core/services/public-storefront.service.ts`
- `Frontend/src/app/core/services/project-catalog.service.ts`

Important dependency:
- product-feed/editor preview depends on catalog products
- `Manage Products` from the Grid Gallery editor links directly to the catalog workspace route

Current editor-specific notes:
- Add Elements now has a mode-swapping category/subcategory menu
- new text insertion uses the unified `text` block
- the first Forma Store block is `product-feed`, currently surfaced as Grid Gallery

## Existing Reference Sources

- Legacy editor memory:
  - `editor model/# Website Builder Project - Memory.txt`
- Current MVP schema notes:
  - `database/mvp-current-pages-schema.md`
  - `database/mvp-current-pages.sql`
