# Project Memory

This folder is a low-token, high-signal handoff layer for AI work on Forma.

Use it to:
- understand the repo shape quickly
- avoid re-discovering sensitive invariants
- start new AI threads without pasting long history

## Files

- `project-overview.md`
  Global product and repo shape.
- `feature-map.md`
  Compact feature-to-repo map across frontend and backend.
- `frontend-memory.md`
  Angular architecture, routing, services, traps, and verification.
- `backend-memory.md`
  Spring Boot service split, responsibilities, runtime notes, and traps.
- `frontend-backend-links.md`
  Practical map between frontend features/services and backend APIs/services.
- `storefront-editor-memory.md`
  High-priority memory for the ecommerce visual editor.
- `deployment-memory.md`
  Current local run/build/deploy understanding.
- `known-rules-and-regressions.md`
  Project-wide do/don't rules and fragile areas.
- `ai-handoff-template.md`
  Reusable template for starting a fresh AI task.

## Best Read Order

For a general new thread:
1. `project-overview.md`
2. `feature-map.md`
3. `frontend-memory.md` or `backend-memory.md`
4. `frontend-backend-links.md`
5. `known-rules-and-regressions.md`

For storefront editor work:
1. `project-overview.md`
2. `frontend-memory.md`
3. `storefront-editor-memory.md`
4. `known-rules-and-regressions.md`
5. `frontend-backend-links.md`

For deployment/runtime work:
1. `project-overview.md`
2. `backend-memory.md`
3. `deployment-memory.md`
4. `known-rules-and-regressions.md`

## Low-Token Handoff Pattern

When starting a new AI thread:
- paste the goal in one sentence
- name the memory files already read
- point at the exact feature folder or files
- include the invariants that must not regress
- include the verification commands expected at the end

Good example:

```text
Read:
- project-memory/project-overview.md
- project-memory/frontend-memory.md
- project-memory/storefront-editor-memory.md

Goal:
Adjust the button editing toolbar in the storefront editor.

Inspect first:
- Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor/project-storefront-editor.ts
- Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor/project-storefront-editor.html
- Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor/project-storefront-editor.css

Must not regress:
- one popup at a time
- popups always above content
- square selection borders
- page selector stays left sidebar, manage pages stays centered popup

Verify:
- npx tsc -p Frontend/tsconfig.app.json --noEmit
- npx ng build --configuration development
```

## Existing Legacy References

These are not part of `project-memory`, but they are useful:
- `editor model/# Website Builder Project - Memory.txt`
- `database/mvp-current-pages-schema.md`
- `database/mvp-current-pages.sql`
