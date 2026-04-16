# AI Handoff Template

```text
Goal
- What needs to be changed or investigated.

Scope
- In scope:
- Out of scope:

Read First
- project-memory/project-overview.md
- project-memory/[frontend-memory.md or backend-memory.md]
- project-memory/[storefront-editor-memory.md if relevant]

Files To Inspect First
- exact file 1
- exact file 2
- exact file 3

Feature Area
- frontend / backend / storefront editor / auth / deployment / etc.

Invariants / Must Not Regress
- rule 1
- rule 2
- rule 3

Old References
- editor model reference if useful
- schema notes if useful

Backend / API Notes
- endpoint assumptions
- related service/controller if known
- write `Needs verification` if unsure

Verification
- command 1
- command 2
- manual flow 1

Notes / Assumptions
- assumption 1
- assumption 2
```

## Recommended Use

- keep the goal short
- name the exact files to inspect first
- include only the invariants that really matter
- include verification expectations up front
- if the task touches the editor, always include `storefront-editor-memory.md`
