# Forma Project Overview

## What Forma Is

Forma is a website/storefront builder with:
- public marketing pages
- authentication and account management
- a dashboard for managing projects
- ecommerce workspace features like catalog, customers, sales, analytics, and a visual storefront editor
- a public storefront/checkout flow for published ecommerce projects

The repo currently centers on an Angular frontend plus a Spring Boot backend split into multiple services.

## Main Product Areas

- Public site
  Landing, pricing, support, templates, product/showcase pages.
- Auth and account
  Register, login, Google auth/linking, email/password recovery, profile/security/activity.
- Project workspace
  Per-project dashboard with home, editor, storefront, catalog, customers, sales, analytics, settings, and other content areas.
- Ecommerce storefront
  Draft/publish storefront content, public storefront rendering, checkout, and editor preview.
- Templates/design/themes/media
  Project creation and design-related bootstrapping.
- Analytics and billing
  Project analytics plus billing/subscription overview.

## Repo Split

## Frontend

Path:
- `Frontend`

Tech:
- Angular 20
- standalone components
- CSS files, not SCSS

Role:
- all UI, routing, workspace screens, public storefront rendering, and the visual storefront editor

## Backend

Path:
- `Backend`

Tech:
- Maven multi-module Spring Boot
- five service folders

Role:
- auth/users
- projects/templates/media
- commerce/storefront/catalog/customers/sales/portfolio
- analytics
- billing

## Important Project Goals Visible in Code

- support a multi-project dashboard
- support ecommerce projects end to end
- let users edit storefront content visually
- keep draft vs published storefront state
- expose a public storefront and checkout flow
- split backend responsibilities into service-oriented areas

## Major Domains Across the Repo

- Users, auth, and session/security activity
- Projects and templates
- Storefront draft/publish content
- Catalog products
- Customers
- Sales/orders
- Portfolio pages and inquiries
- Analytics
- Billing
- Media/uploads

## Useful Cross-Repo Reference Areas

- `editor model`
  Legacy prototype/editor memory; especially useful for storefront editor behavior.
- `database`
  MVP schema notes and SQL for current implemented flows.

## Current High-Level Uncertainty

- Frontend API configuration currently points to `http://localhost:8081/api`, while backend docs describe five services on ports `8081` to `8085`.
- Whether `8081` is acting as a gateway/proxy or the frontend is temporarily pointed at one service needs verification.
