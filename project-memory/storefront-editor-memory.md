# Storefront Editor Memory

## Purpose

The storefront editor is the ecommerce visual editor used inside the project workspace.

Main route area:
- `Frontend/src/app/features/app/dashboard/pages/projects/project-storefront-editor`

It edits storefront draft content, supports page/section/component manipulation, and feeds preview/public storefront flows.

Important scope rule:
- the editor is only intended for ecommerce projects

## Architecture Summary

Primary files:
- `project-storefront-editor.ts`
- `project-storefront-editor.html`
- `project-storefront-editor.css`

Supporting files:
- `components/storefront-editor-component-library.ts`
- `components/storefront-editor-component.model.ts`
- `components/storefront-editor-component-host.component.ts`
- `components/blocks/*`
- `components/media-manager/*`
- `domains/storefront-editor-pages.domain.ts`
- `domains/storefront-editor-storefront.domain.ts`
- `domains/storefront-editor-media.domain.ts`
- `config/storefront-editor-feature-domains.ts`
- `utils/storefront-editor-shared.utils.ts`

Backend-facing model:
- `Frontend/src/app/core/models/project-storefront.model.ts`

Service links:
- `Frontend/src/app/core/services/project-storefront.service.ts`
- `Frontend/src/app/core/services/public-storefront.service.ts`

## Page / Section / Component Model

## Persisted storefront layer

`ProjectStorefront` contains:
- `draftHomepage`
- `publishedHomepage`
- `editorSession`

Current typed page key:
- `StorefrontPageKey = 'home'`

Current section types:
- `announcement-bar`
- `hero`
- `featured-products`
- `footer`

## Managed pages layer

The editor adds its own multi-page layer through:
- `StorefrontEditorManagedPage`
- `StorefrontEditorSession.managedPages`
- `StorefrontEditorSession.selectedManagedPageId`

Important nuance:
- extra pages are editor-managed draft documents
- they still reuse `StorefrontHomepageDocument`
- they are not modeled as a first-class backend page entity yet

This is a high-risk area:
- page switching
- snapshot/undo
- save/load
- duplication
- rename/homepage behavior

If page content starts disappearing or becoming stale, inspect:
- `project-storefront.model.ts`
- `domains/storefront-editor-pages.domain.ts`
- `project-storefront-editor.ts`

## Section editor-only props

Section editor metadata is stored inside section `props` using keys from the main editor:
- `editorComponents`
- `editorHeight`
- `editorLabel`

This means:
- component composition is currently section-prop-backed, not its own backend entity
- changing these keys without updating read/write/normalize code will orphan editor state

## Component model

Main type:
- `StorefrontEditorComponentNode`

Current component types:
- `text`
- `heading`
- `paragraph`
- `image`
- `button`
- `container`
- `graphic`
- `product-feed`
- `blog-feed`

Important current usage:
- new text insertion should use the unified `text` component
- `heading` and `paragraph` still exist as legacy compatibility/editor paths and should not be removed casually
- `product-feed` is currently the Grid Gallery storefront block

Core component fields:
- `id`
- `type`
- `name`
- `frame`
- `rotation`
- `zIndex`
- `groupId`
- `isLocked`
- `isVisible`
- `props`
- `children`

## Popup / Menu Layering Rules

There are many floating UI states in the main editor component:
- topbar menus
- Add Elements
- pages panel
- manage pages
- page design picker
- section library
- media manager
- component context menu
- section options menu
- text/button/product-feed toolbar menus

Important code hooks:
- `hasFloatingUi`
- `hasBlockingOverlay`
- `closeFloatingUi()`
- `getClampedFloatingPanelPosition(...)`

Current intent:
- only one popup/menu should be effectively active at a time
- blocking centered panels get the full overlay
- floating menus should close on outside click
- popups must appear above content

Sensitivity:
- popup state is still spread across many booleans/signals
- if you add a new popup, wire it into:
  - visibility computed state
  - outside-click handling
  - `closeFloatingUi()`
  - z-index rules

## Selection / Drag / Resize / Rotate Invariants

Selection:
- section selection and visible component selection should not compete
- when a component is selected, section-only UI should clear visually
- `selectedSectionId` still remains important because components live inside a section

Multi-selection:
- uses `selectedComponentIds`
- Ctrl/Cmd click is the active multi-select modifier
- marquee selection starts from empty section content
- marquee selection box is rendered in the preview

Grouping:
- components use `groupId`
- selected grouped components can show a separate group frame
- double-click on a grouped component can isolate one component without destroying the group

Movement:
- component dragging, selection box drag, resize, rotation, and section resize are all stateful in the main editor TS
- section resize is from the bottom handle
- component movement/resizing is sensitive around overflow and reattachment logic

Rotation / resize UI:
- resize handles and rotation handles are separate overlays
- rotation label and size indicator can flip when rotation crosses the upside-down range
- custom rotation cursors are used

Visual invariant:
- selection borders are intentionally square, not rounded

Keyboard behavior visible in code:
- `Delete` / `Backspace` delete selected components
- `Delete` / `Backspace` delete selected section when no component is selected
- arrow keys nudge selected components
- copy/paste/duplicate/group/ungroup shortcuts exist in TS

## Toolbars / Panels Already Implemented

Paragraph/text toolbar:
- unified text editing flow
- style preset
- font family
- font search in the font popup
- link
- alignment popup
- alignment
- color
- bold / italic / underline active state

Button toolbar:
- explore designs
- edit text
- link
- customize icon
- display elements
- settings
- colors
- text
- borders
- corners
- shadow
- spacing

Button-specific behavior:
- button text should not be inline-edited by double-click
- button icon can come from built-in icons or the media manager
- choosing a built-in icon clears the media-backed icon source

Product-feed toolbar:
- explore designs
- settings
- color
- manage products

Current product-feed specifics:
- it is presented as `Grid gallery`
- default dropped size is intentionally larger than before
- `Manage Products` opens the catalog route in a new tab
- internal preview controls should remain non-interactive so component selection still works

Other editor UI already present:
- Add Elements left panel
- Add Elements category/subcategory switcher
- page selector left panel
- manage pages centered popup
- page design centered popup
- section library centered popup
- media manager
- component context menu
- section options/context menu

## Sensitive CSS / Interaction Rules

- Section content should remain the low visual layer.
- Section chrome can sit above content, but it must not incorrectly cover components.
- Popups and toolbar menus must sit above preview content.
- Add Elements drag/drop is sensitive because the panel and overlay can block the preview hit area.
- Add Elements category navigation now uses one slot that swaps between:
  - top-level categories when `All` is active
  - selected-category pill + subcategories for specific categories
  Do not stack the submenu under the main menu again.
- Preview components often use:
  - outer wrapper with `overflow: visible`
  - inner content with `overflow: hidden`
  This is easy to break.
- Component content should stay clipped inside its own frame even when editor chrome stays outside.
- New editor components should default to transparent component backgrounds unless explicitly requested otherwise.
- Selection overlays, group frame, resize handles, rotation handles, name labels, and size indicators are heavily CSS-driven.
- The selected-section left rail lives outside the section edge, so preview overflow/clipping rules can hide it if changed carelessly.
- Page selector left sidebar and centered manage-pages popup are separate UX surfaces and should stay separate.
- The selected section no longer shows the old top-right `Edit` button.

## Old Reference

Legacy prototype and notes:
- `C:\My Folders\IGL3\S2\Nouvelles Tech°\Forma\editor model`
- `C:\My Folders\IGL3\S2\Nouvelles Tech°\Forma\editor model\# Website Builder Project - Memory.txt`

Use the old model as a behavior reference when possible, but prefer current code for truth.

## Known Risks / Regressions To Avoid

- Managed page content can regress if page switch/save/snapshot logic falls out of sync.
- Editor-only page documents are layered on top of a backend model still centered on `home`.
- Popup overlap bugs are easy to reintroduce because multiple booleans govern floating UI.
- Section/component stacking and overflow bugs are easy to reintroduce with small CSS changes.
- The selected-section left rail can disappear if preview shell/body overflow is clipped again.
- Add Elements category/subcategory swap can regress with small layout or height changes.
- If you rename or move component/section prop keys, inspect normalizers and serialization immediately.
- Public preview can read from local editor snapshot instead of backend data, which can confuse debugging.

## Verification Commands

- `npx tsc -p Frontend/tsconfig.app.json --noEmit`
- `npx ng build --configuration development`

## High-Value Manual Checks

- open an ecommerce project
- switch pages and confirm each page keeps its own content
- add/remove/reorder sections
- add components from Add Elements
- switch from `All` to `Text/Image/Button/...` in Add Elements and confirm the same menu slot becomes the subcategory menu
- select, multi-select, group, ungroup
- drag, resize, rotate, and rename components
- select a section and confirm the left rail buttons are visible
- open component and section context menus near viewport edges
- open/close centered popups and confirm they layer above content
- open preview/public preview and confirm editor snapshot behavior makes sense

## Needs Verification

- Exact backend persistence behavior for extra managed pages beyond `home`
- Any future plan to replace section-prop-backed editor component storage with a first-class page/component backend model
