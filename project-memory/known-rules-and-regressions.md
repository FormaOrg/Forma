# Known Rules and Regressions

## Project-Wide Rules

- Inspect real code before writing or changing project memory.
- Do not leak `.env` contents or any local secret values into docs, chats, logs, or commits.
- When something is unclear, write `Needs verification` instead of guessing.
- Prefer concise maps, invariants, and cross-file coordination notes over long narrative summaries.

## Frontend Rules

- Angular uses standalone components; avoid module-based assumptions.
- If you change API base behavior, inspect all of:
  - `environment.ts`
  - `jwt.interceptor.ts`
  - `auth.service.ts`
  - affected core services
- Public storefront preview may come from editor snapshot in local storage, so preview bugs are not always backend bugs.

## Backend Rules

- The five backend services are separated partly through Maven compile excludes.
- If you move or add backend classes, inspect the service `pom.xml` files, not just source code.
- If a frontend route/service calls an API that seems absent, verify whether:
  - the controller exists in another service
  - the controller is excluded in the current build
  - the feature is still incomplete

## Storefront Editor Rules

- Treat the storefront editor as a fragile, high-regression area.
- If you change editor behavior, inspect all of:
  - `project-storefront-editor.ts`
  - `project-storefront-editor.html`
  - `project-storefront-editor.css`
  - component model/domain helpers
- Keep selection borders square.
- Section content should remain the low visual layer.
- Popups and menus must stay above preview content.
- Only one popup/menu should effectively win at a time.
- Page selector left sidebar and centered manage-pages popup are distinct UI surfaces.
- Button text should not rely on inline double-click editing.
- New storefront editor components should stay transparent by default unless explicitly requested otherwise.
- The Add Elements category strip now swaps into a subcategory strip in the same slot; do not reintroduce a stacked submenu under it.
- The selected-section left rail depends on preview overflow staying visible; clipping rules can make it disappear without breaking the TS logic.
- The old selected-section top-right `Edit` button is intentionally removed.
- If changing page/content persistence, inspect the managed-pages layer before assuming backend-native multi-page support exists.

## Cross-File Coordination Notes

- If you change section editor prop keys, also inspect:
  - `project-storefront-editor.ts`
  - `storefront-editor-storefront.domain.ts`
  - `project-storefront.model.ts`
- If you change managed page behavior, also inspect:
  - `project-storefront.model.ts`
  - `storefront-editor-pages.domain.ts`
  - `project-storefront-editor.ts`
- If you change storefront preview/public storefront behavior, also inspect:
  - `project-storefront.service.ts`
  - `public-storefront.service.ts`
  - public storefront feature files
- If you change project APIs, inspect the matching backend controller and the matching frontend service together.

## Sensitive / Likely Regression Areas

- Storefront editor page switching and content persistence
- Popup layering and outside-click closing in the editor
- Section/component stacking and overflow behavior in the editor
- Selected-section rail visibility and positioning in the editor
- Add Elements category/subcategory alignment and width behavior
- API base URL handling across frontend services and interceptor/auth code
- Any backend refactor that forgets the multi-service compile-exclude setup

## Recommended Verification Habit

- Run targeted build verification after each meaningful change
- Prefer manual scenario checks in fragile UI areas, especially the storefront editor
- When in doubt, compare against:
  - `editor model/# Website Builder Project - Memory.txt`
  - current live storefront editor code
