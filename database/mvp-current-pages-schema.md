# FORMA MVP Database Schema

This is the database scope for the pages and flows already present in the current frontend.

It intentionally does not include the full future editor/deployment/e-commerce model yet.

## Current scope

The current frontend needs data for:

- authentication
- user profile and settings
- premium/free subscription state
- dashboard project listing
- template gallery
- activity log
- email verification
- password reset

## Recommended MVP tables

### User domain

- `users`
- `subscriptions`
- `audit_logs`
- `password_reset_tokens`
- `email_verification_tokens`

### Project domain

- `templates`
- `projects`

## Why this MVP is enough for now

This covers the pages already built without over-designing the future backend.

It supports:

- register / login / logout
- forgot password / reset password
- verify email
- profile page fields
- security activity page
- preference gating for premium users
- dashboard project list
- template selection for project creation

## Table summary

### `users`

Main account table.

Recommended columns:

- `id`
- `first_name`
- `last_name`
- `username`
- `email`
- `password_hash`
- `phone`
- `country`
- `website`
- `role`
- `is_active`
- `email_verified`
- `last_login_at`
- `created_at`
- `updated_at`

Notes:

- `email` must be unique
- `username` should also be unique if you want public profiles later
- `password_hash` stores the BCrypt hash, never the raw password

### `subscriptions`

Tracks whether a user is free or premium.

Recommended columns:

- `id`
- `user_id`
- `plan_type`
- `status`
- `start_date`
- `end_date`
- `price_tnd`
- `auto_renew`
- `created_at`
- `updated_at`

Notes:

- one user can have multiple subscription records over time
- only one should be active at a time

### `audit_logs`

Supports the Settings > Activity page.

Recommended columns:

- `id`
- `user_id`
- `action_type`
- `description`
- `ip_address`
- `user_agent`
- `resource_type`
- `resource_id`
- `success`
- `error_message`
- `created_at`

Examples:

- `LOGIN_SUCCESS`
- `LOGIN_FAILURE`
- `PASSWORD_CHANGED`
- `EMAIL_CHANGED`
- `PROJECT_CREATED`

### `password_reset_tokens`

Supports forgot/reset password without overloading the `users` table.

Recommended columns:

- `id`
- `user_id`
- `token`
- `expires_at`
- `used`
- `created_at`

Notes:

- `token` must be unique
- mark tokens as `used = true` after successful reset

### `email_verification_tokens`

Supports email verification and resend verification.

Recommended columns:

- `id`
- `user_id`
- `token`
- `expires_at`
- `used`
- `created_at`

Notes:

- keep this separate from password reset tokens
- easier to audit and maintain

### `templates`

Supports current template gallery/showcase pages and project bootstrapping.

Recommended columns:

- `id`
- `name`
- `category`
- `description`
- `preview_image_url`
- `is_premium`
- `created_at`
- `updated_at`

Possible categories:

- `BUSINESS`
- `PORTFOLIO`
- `ECOMMERCE`
- `BLOG`
- `LANDING_PAGE`

### `projects`

Supports dashboard listing and project creation.

Recommended columns:

- `id`
- `user_id`
- `template_id`
- `name`
- `description`
- `type`
- `creation_method`
- `status`
- `is_published`
- `created_at`
- `updated_at`

Possible `type` values:

- `BUSINESS`
- `PORTFOLIO`
- `ECOMMERCE`
- `BLOG`
- `LANDING_PAGE`

Possible `creation_method` values:

- `DRAG_DROP`
- `VISUAL_DESIGNER`
- `AI_PROMPT`
- `HYBRID`

Possible `status` values:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

## Recommended implementation order

1. `users`
2. `email_verification_tokens`
3. `password_reset_tokens`
4. `subscriptions`
5. `audit_logs`
6. `templates`
7. `projects`

## Service split recommendation

If you keep the microservice structure from the report:

- User service:
  - `users`
  - `subscriptions`
  - `audit_logs`
  - `password_reset_tokens`
  - `email_verification_tokens`
- Project service:
  - `templates`
  - `projects`

## Important design note

Your current `service-utilisateurs` backend already stores verification token fields directly in `users`.

That works for a first draft, but the cleaner MVP schema is to move them into:

- `email_verification_tokens`
- `password_reset_tokens`

This avoids mixing different token types in the same user columns.
