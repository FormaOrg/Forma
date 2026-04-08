import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { ProjectCatalogProduct } from '../../../../../../core/models/project-catalog.model';
import {
  ProjectStorefront,
  StorefrontEditorSession,
  StorefrontEditorSnapshot,
  StorefrontEditorViewport,
  StorefrontHomepageSection,
} from '../../../../../../core/models/project-storefront.model';
import { Project } from '../../../../../../core/models/project.model';
import { ProjectCatalogService } from '../../../../../../core/services/project-catalog.service';
import { ProjectStorefrontService } from '../../../../../../core/services/project-storefront.service';
import { ProjectService } from '../../../../../../core/services/project.service';
import { ProjectWorkspaceContextService } from '../../../../../../core/services/project-workspace-context.service';
import { PublicStorefrontService } from '../../../../../../core/services/public-storefront.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { UploadService } from '../../../../../../core/services/upload.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { AppIcon } from '../../../../../../shared/app/icons/app-icon';
import { StorefrontSectionType } from '../../../../../../core/models/project-storefront.model';
import {
  STOREFRONT_EDITOR_ADD_ELEMENTS_CATEGORIES,
  STOREFRONT_EDITOR_ADD_ELEMENTS_FEATURED_SHORTCUTS,
  STOREFRONT_EDITOR_ADD_ELEMENTS_LIBRARY_ITEMS,
  StorefrontEditorAddElementsCategory,
  StorefrontEditorAddElementsLibraryItem,
  filterStorefrontEditorAddElementsLibraryItems,
} from './storefront-editor-component-library';
import {
  StorefrontEditorComponentNode,
  StorefrontEditorComponentType,
  createStorefrontEditorComponentNode,
} from './storefront-editor-component.model';
import {
  ProjectStorefrontMediaManager,
  StorefrontMediaManagerAsset,
} from './project-storefront-media-manager';
import { StorefrontEditorComponentHostComponent } from './storefront-editor-component-host.component';

type SectionInsertMode = 'append' | 'after-selected';
type EditorSidebarMode = 'structure' | 'page' | 'theme' | 'assets';
type PagesPanelLayoutMode = 'grid' | 'rows';
type ComponentSelectionBox = { x: number; y: number; width: number; height: number };
type SectionLibraryCategory =
  | 'Welcome'
  | 'About'
  | 'Portfolio'
  | 'Services'
  | 'Products'
  | 'Promote & Engage';
type SectionLibraryTemplate = {
  id: string;
  title: string;
  category: SectionLibraryCategory;
  type: StorefrontSectionType;
  layout: 'wide' | 'standard' | 'tall';
  accent: 'cobalt' | 'linen' | 'ink' | 'sand' | 'sky' | 'charcoal';
};

@Component({
  selector: 'app-project-storefront-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIcon, ProjectStorefrontMediaManager, StorefrontEditorComponentHostComponent],
  templateUrl: './project-storefront-editor.html',
  styleUrl: './project-storefront-editor.css',
})
export class ProjectStorefrontEditor {
  private static readonly HISTORY_LIMIT = 20;
  private static readonly AUTOSAVE_DELAY_MS = 900;
  private static readonly ADD_ELEMENTS_PANEL_CLOSE_MS = 220;
  private static readonly SECTION_LIBRARY_CLOSE_MS = 200;
  private static readonly SECTION_COMPONENTS_PROP_KEY = 'editorComponents';
  private static readonly SECTION_HEIGHT_PROP_KEY = 'editorHeight';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly projectCatalogService = inject(ProjectCatalogService);
  private readonly projectStorefrontService = inject(ProjectStorefrontService);
  private readonly projectWorkspaceContextService = inject(ProjectWorkspaceContextService);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly toastService = inject(ToastService);
  private readonly uploadService = inject(UploadService);

  readonly projectParamMap = toSignal(this.route.parent!.paramMap, {
    initialValue: this.route.parent!.snapshot.paramMap,
  });
  readonly projectId = computed(() => {
    const projectId = Number(this.projectParamMap()?.get('projectId') ?? '0');
    return Number.isFinite(projectId) && projectId > 0 ? projectId : 0;
  });

  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private addElementsPanelCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private sectionLibraryCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private suppressNextComponentClickSelectionId: string | null = null;
  private justFinishedComponentSelectionBox = false;
  private activeComponentDrag:
    | {
        sectionId: string;
        pointerOffsetX: number;
        pointerOffsetY: number;
        components: Array<{
          componentId: string;
          startX: number;
          startY: number;
          width: number;
          height: number;
        }>;
      }
    | null = null;
  private activeSelectionDrag:
    | {
        sectionId: string;
        startX: number;
        startY: number;
      }
    | null = null;
  private activeResize:
    | {
        sectionId: string;
        componentId: string;
        handle: string;
        startX: number;
        startY: number;
        startFrame: StorefrontEditorComponentNode['frame'];
        startRotation: number;
      }
    | null = null;
  private activeRotation:
    | {
        sectionId: string;
        componentId: string;
        centerX: number;
        centerY: number;
        startAngle: number;
        startRotation: number;
        previousAngle: number;
        accumulatedAngle: number;
      }
    | null = null;
  private activeSectionResize:
      | {
          sectionId: string;
          startY: number;
          startHeight: number;
        }
      | null = null;
  private activeAddElementsComponentDrag:
    | {
        itemId: string;
        pointerOffsetX: number;
        pointerOffsetY: number;
        width: number;
        height: number;
      }
    | null = null;

  readonly project = signal<Project | null>(null);
  readonly storefront = signal<ProjectStorefront | null>(null);
  readonly workingStorefront = signal<ProjectStorefront | null>(null);
  readonly products = signal<ProjectCatalogProduct[]>([]);
  readonly selectedSectionId = signal<string | null>(null);
  readonly selectedComponentId = signal<string | null>(null);
  readonly selectedComponentIds = signal<string[]>([]);
  readonly isolatedGroupComponentId = signal<string | null>(null);
  readonly editorSession = signal<StorefrontEditorSession>(this.createDefaultEditorSession());
  readonly undoStack = signal<StorefrontEditorSnapshot[]>([]);
  readonly redoStack = signal<StorefrontEditorSnapshot[]>([]);
  readonly viewport = signal<StorefrontEditorViewport>('desktop');
  readonly sidebarCollapsed = signal(false);
  readonly sidebarMode = signal<EditorSidebarMode>('structure');
  readonly isFormaMenuOpen = signal(false);
  readonly isAccountMenuOpen = signal(false);
  readonly isZoomMenuOpen = signal(false);
  readonly isAddElementsPanelOpen = signal(false);
  readonly isAddElementsPanelClosing = signal(false);
  readonly activeAddElementsCategory = signal<StorefrontEditorAddElementsCategory>('All');
  readonly addElementsSearch = signal('');
  readonly draggedAddElementsItemId = signal<string | null>(null);
  readonly draggedAddElementsPreviewPosition = signal<{ left: number; top: number; width: number; height: number } | null>(
    null
  );
  readonly componentAttachSectionId = signal<string | null>(null);
  readonly isPagesPanelOpen = signal(false);
  readonly isMediaManagerOpen = signal(false);
  readonly pagesPanelLayout = signal<PagesPanelLayoutMode>('grid');
  readonly pageCardMenuId = signal<string | null>(null);
  readonly pageCardMenuTop = signal(0);
  readonly pageCardMenuLeft = signal(0);
  readonly sectionLibraryTargetId = signal<string | null>(null);
  readonly isSectionLibraryClosing = signal(false);
  readonly activeSectionLibraryCategory = signal<SectionLibraryCategory>('Welcome');
  readonly canScrollAddElementsTabsLeft = signal(false);
  readonly canScrollAddElementsTabsRight = signal(false);
  readonly canScrollSectionLibraryTabsLeft = signal(false);
  readonly canScrollSectionLibraryTabsRight = signal(false);
  readonly sectionOptionsMenuId = signal<string | null>(null);
  readonly draggedSectionId = signal<string | null>(null);
  readonly draggedComponentId = signal<string | null>(null);
  readonly componentReorderTargetId = signal<string | null>(null);
  readonly isSelectingComponents = signal(false);
  readonly isResizingComponent = signal(false);
  readonly isRotatingComponent = signal(false);
  readonly isResizingSection = signal(false);
  readonly selectionBoxSectionId = signal<string | null>(null);
  readonly selectionBox = signal<ComponentSelectionBox>({ x: 0, y: 0, width: 0, height: 0 });
  readonly isComponentContextMenuOpen = signal(false);
  readonly componentContextMenuPosition = signal({ x: 0, y: 0 });
  readonly componentContextMenuSectionId = signal<string | null>(null);
  readonly componentContextMenuComponentId = signal<string | null>(null);
  readonly sectionContextMenuPosition = signal({ x: 0, y: 0 });
  readonly componentClipboard = signal<StorefrontEditorComponentNode | null>(null);
  readonly isEditingComponentName = signal(false);
  readonly editingComponentNameId = signal<string | null>(null);
  readonly editingComponentNameValue = signal('');
  readonly isEditingComponentText = signal(false);
  readonly editingComponentTextId = signal<string | null>(null);
  readonly editingComponentTextValue = signal('');
readonly hoveredSectionId = signal<string | null>(null);
readonly hoveredSectionRailTop = signal(0);
readonly isSelectedSectionRailVisible = signal(false);
readonly hasPreviewStageScrollbar = signal(false);
  readonly previewStageScrollbarWidth = signal(0);
  readonly sectionClipboard = signal<StorefrontHomepageSection | null>(null);
  readonly zoomPercent = signal(120);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isAutosaving = signal(false);
  readonly isPublishing = signal(false);
  readonly isUnpublishing = signal(false);
  readonly isMediaUploading = signal(false);
  readonly errorMessage = signal('');
  readonly mediaAssets = signal<StorefrontMediaManagerAsset[]>([]);

  readonly isEcommerceProject = computed(() => this.project()?.type === 'ECOMMERCE');
  readonly sections = computed(() => this.workingStorefront()?.draftHomepage.sections ?? []);
  readonly pageSettingsSelected = computed(() => this.selectedSectionId() === null);
readonly selectedSection = computed<StorefrontHomepageSection | null>(
  () => this.sections().find((section) => section.id === this.selectedSectionId()) ?? null
);
readonly hasComponentSelection = computed(() => this.selectedComponentIds().length > 0);
  readonly selectedComponent = computed<StorefrontEditorComponentNode | null>(() => {
    const section = this.selectedSection();
    const componentId = this.selectedComponentId();
    if (!section || !componentId) {
      return null;
    }

    return this.readSectionComponents(section).find((component) => component.id === componentId) ?? null;
  });
  readonly selectedSectionComponents = computed(() => {
    const section = this.selectedSection();
    return section ? this.readSectionComponents(section) : [];
  });
  readonly selectedComponents = computed(() => {
    const section = this.selectedSection();
    if (!section) {
      return [];
    }

    const selectedIds = new Set(this.selectedComponentIds());
    return this.readSectionComponents(section).filter((component) => selectedIds.has(component.id));
  });
  readonly selectedComponentGroupId = computed(() => {
      const selected = this.selectedComponent();
      return selected?.groupId ?? null;
    });
  readonly selectedComponentGroupComponents = computed(() => {
    const section = this.selectedSection();
    const groupId = this.selectedComponentGroupId();
    if (!section || !groupId) {
      return [] as StorefrontEditorComponentNode[];
    }

    return this.readSectionComponents(section).filter((component) => component.groupId === groupId);
  });
  readonly selectedComponentGroupBounds = computed(() => {
    const components = this.selectedComponentGroupComponents();
    if (!components.length) {
      return null as { x: number; y: number; width: number; height: number } | null;
    }

    const left = Math.min(...components.map((component) => component.frame.x));
    const top = Math.min(...components.map((component) => component.frame.y));
    const right = Math.max(...components.map((component) => component.frame.x + component.frame.width));
    const bottom = Math.max(...components.map((component) => component.frame.y + component.frame.height));

    return { x: left, y: top, width: right - left, height: bottom - top };
  });
  readonly storeName = computed(
    () => this.workingStorefront()?.storeName ?? this.project()?.storeTitle ?? this.project()?.name ?? 'Storefront'
  );
  readonly projectDisplayName = computed(
    () => this.project()?.name?.trim() || this.storeName() || 'Project'
  );
  readonly previewDomain = computed(
    () => this.project()?.defaultDomain?.trim() || 'domain.forma.tn'
  );
  readonly hasUnsavedChanges = computed(() => {
    const original = this.storefront();
    const working = this.workingStorefront();
    if (!original || !working) {
      return false;
    }

    return this.serializePersistedState(original, this.normalizeEditorSession(original.editorSession)) !==
      this.serializePersistedState(working, this.buildPersistedEditorSession());
  });
  readonly canUndo = computed(() => this.undoStack().length > 0);
  readonly canRedo = computed(() => this.redoStack().length > 0);
  readonly featuredProductsPreview = computed(() => {
    const section = this.sections().find((item) => item.type === 'featured-products');
    if (!section) {
      return [];
    }

    const productIds = this.readNumberArrayProp(section, 'productIds');
    const maxItems = this.readNumberProp(section, 'maxItems', 4);

    return productIds
      .map((productId) => this.products().find((product) => product.id === productId))
      .filter((product): product is ProjectCatalogProduct => Boolean(product))
      .slice(0, maxItems);
  });
  readonly previewTitle = computed(() => this.workingStorefront()?.draftHomepage.seo.title || this.storeName());
  readonly selectedPageLabel = computed(() => 'Home');
  readonly hasFloatingUi = computed(
    () =>
      this.isFormaMenuOpen() ||
      this.isAccountMenuOpen() ||
      this.isZoomMenuOpen() ||
      this.isAddElementsPanelVisible() ||
      this.isPagesPanelOpen() ||
      this.isSectionLibraryVisible() ||
      this.isMediaManagerOpen() ||
      this.isSectionLibraryOpen() ||
      this.sectionOptionsMenuId() !== null
  );
  readonly hasBlockingOverlay = computed(
    () =>
      this.isPagesPanelOpen() ||
      this.isSectionLibraryVisible() ||
      this.isMediaManagerOpen() ||
      this.isSectionLibraryOpen()
  );
  readonly isAddElementsPanelVisible = computed(
    () => this.isAddElementsPanelOpen() || this.isAddElementsPanelClosing()
  );
  readonly isSectionLibraryOpen = computed(() => this.sectionLibraryTargetId() !== null);
  readonly isSectionLibraryVisible = computed(
    () => this.isSectionLibraryOpen() || this.isSectionLibraryClosing()
  );
  readonly currentUser = computed(() => this.authService.currentUser);
  readonly currentUserName = computed(() => {
    const user = this.currentUser();
    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return fullName || 'Forma user';
  });
  readonly currentUserEmail = computed(() => this.currentUser()?.email || '');
  readonly currentUserAvatar = computed(() => this.currentUser()?.avatarUrl || null);
  readonly currentUserInitial = computed(() => {
    const source = this.currentUser()?.firstName?.trim() || this.currentUserName();
    return source.charAt(0).toUpperCase() || 'F';
  });
  readonly autosaveTooltip = computed(() => {
    const updatedAt = this.storefront()?.updatedAt;
    if (this.isAutosaving()) {
      return 'Autosave is on. Saving changes...';
    }
    const relative = this.formatRelativeTime(updatedAt);

    if (relative) {
      return `Autosave is on. Last saved ${relative}.`;
    }

    return 'Autosave is on. Changes are saved automatically.';
  });
  readonly previewFrameWidth = computed(() => {
    const baseWidth = this.viewport() === 'mobile' ? 390 : 1200;
    return Math.round(baseWidth * (this.zoomPercent() / 100));
  });
  readonly previewStageWidth = computed(() => this.previewFrameWidth() + 4 + this.previewStageScrollbarWidth());
  readonly isCompactPreviewChrome = computed(() => this.previewFrameWidth() <= 780);
  readonly isNarrowPreviewChrome = computed(() => this.previewFrameWidth() <= 620);
  readonly isUltraNarrowPreviewChrome = computed(() => this.previewFrameWidth() <= 460);
  readonly availableSectionTypes: StorefrontSectionType[] = [
    'announcement-bar',
    'hero',
    'featured-products',
    'footer',
  ];
  readonly sectionLibraryCategories: SectionLibraryCategory[] = [
    'Welcome',
    'About',
    'Portfolio',
    'Services',
    'Products',
    'Promote & Engage',
  ];
  readonly sectionLibraryTemplates: SectionLibraryTemplate[] = [
    { id: 'hero-cobalt', title: 'Shop Our Latest Collection', category: 'Welcome', type: 'hero', layout: 'wide', accent: 'cobalt' },
    { id: 'hero-editorial', title: 'Explore My Latest Work', category: 'Portfolio', type: 'hero', layout: 'standard', accent: 'linen' },
    { id: 'hero-services', title: 'Efficient Services & Solutions', category: 'Services', type: 'hero', layout: 'tall', accent: 'ink' },
    { id: 'hero-business', title: 'Reach Your Business Potential', category: 'Promote & Engage', type: 'hero', layout: 'tall', accent: 'sky' },
    { id: 'products-fashion', title: 'Shop Our Unique Products', category: 'Products', type: 'featured-products', layout: 'standard', accent: 'sand' },
    { id: 'footer-minimal', title: 'Elegant Footer Details', category: 'About', type: 'footer', layout: 'standard', accent: 'charcoal' },
    { id: 'announcement-editorial', title: 'Highlight a Quick Announcement', category: 'Welcome', type: 'announcement-bar', layout: 'wide', accent: 'linen' },
    { id: 'products-beauty', title: 'Discover Modern Products', category: 'Products', type: 'featured-products', layout: 'wide', accent: 'charcoal' },
  ];
  readonly visibleSectionLibraryTemplates = computed(() =>
    this.sectionLibraryTemplates.filter((template) => template.category === this.activeSectionLibraryCategory())
  );
  readonly addElementsCategories = STOREFRONT_EDITOR_ADD_ELEMENTS_CATEGORIES;
  readonly addElementsFeaturedShortcuts = STOREFRONT_EDITOR_ADD_ELEMENTS_FEATURED_SHORTCUTS;
  readonly addElementsLibraryItems = STOREFRONT_EDITOR_ADD_ELEMENTS_LIBRARY_ITEMS;
  readonly visibleAddElementsLibraryItems = computed(() => {
    return filterStorefrontEditorAddElementsLibraryItems(
      this.addElementsLibraryItems,
      this.activeAddElementsCategory(),
      this.addElementsSearch()
    );
  });

  constructor() {
    effect(() => {
      const selectedSectionId = this.selectedSectionId();
      if (!selectedSectionId) {
        this.isSelectedSectionRailVisible.set(false);
        return;
      }

      setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
    });

    this.destroyRef.onDestroy(() => {
      if (this.autosaveTimer) {
        clearTimeout(this.autosaveTimer);
      }
      if (this.addElementsPanelCloseTimer) {
        clearTimeout(this.addElementsPanelCloseTimer);
      }
      if (this.sectionLibraryCloseTimer) {
        clearTimeout(this.sectionLibraryCloseTimer);
      }
    });
    this.loadEditor();
  }

  @HostListener('window:resize')
  handleWindowResize(): void {
    this.updateAddElementsTabScrollState();
    this.updateSectionLibraryTabScrollState();
    setTimeout(() => {
      this.updatePreviewStageScrollbarState();
      this.syncSelectedSectionRailPosition();
    }, 0);
  }

  @HostListener('window:keydown', ['$event'])
  handleZoomShortcuts(event: KeyboardEvent): void {
    if (this.isEditingComponentName() || this.isEditingComponentText()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.cancelComponentNameEditing();
        this.cancelComponentTextEditing();
      }
      return;
    }

    if (event.key === 'Escape' && this.isComponentContextMenuOpen()) {
      event.preventDefault();
      this.closeComponentContextMenu();
      return;
    }

    if (event.key === 'Escape' && this.isMediaManagerOpen()) {
      event.preventDefault();
      this.closeMediaManager();
      return;
    }

    if (event.key === 'Escape' && this.isPagesPanelOpen()) {
      event.preventDefault();
      this.isPagesPanelOpen.set(false);
      return;
    }

    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedComponentIds().length) {
      event.preventDefault();
      this.deleteSelectedComponents();
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) && this.selectedComponentIds().length) {
      event.preventDefault();
      const distance = event.shiftKey ? 10 : 1;
      switch (event.key) {
        case 'ArrowUp':
          this.nudgeSelectedComponents(0, -distance);
          break;
        case 'ArrowDown':
          this.nudgeSelectedComponents(0, distance);
          break;
        case 'ArrowLeft':
          this.nudgeSelectedComponents(-distance, 0);
          break;
        case 'ArrowRight':
          this.nudgeSelectedComponents(distance, 0);
          break;
      }
      return;
    }

    const ctrl = event.ctrlKey || event.metaKey;
    if (!ctrl || event.altKey) {
      return;
    }

    if (!event.shiftKey && (event.key === 'z' || event.key === 'Z')) {
      event.preventDefault();
      this.undo();
      return;
    }

    if ((event.shiftKey && (event.key === 'z' || event.key === 'Z')) || event.key === 'y' || event.key === 'Y') {
      event.preventDefault();
      this.redo();
      return;
    }

    if (event.key === 'c' || event.key === 'C') {
      if (this.selectedComponentIds().length) {
        event.preventDefault();
        this.copySelectedComponents();
      }
      return;
    }

    if (event.key === 'v' || event.key === 'V') {
      if (this.componentClipboard()) {
        event.preventDefault();
        this.pasteComponentFromClipboard();
      }
      return;
    }

    if (event.key === 'd' || event.key === 'D') {
      if (this.selectedComponentIds().length) {
        event.preventDefault();
        this.duplicateSelectedComponents();
      }
      return;
    }

    if ((event.key === 'g' || event.key === 'G') && event.shiftKey) {
      event.preventDefault();
      this.ungroupSelectedComponents();
      return;
    }

    if (event.key === 'g' || event.key === 'G') {
      event.preventDefault();
      this.groupSelectedComponents();
      return;
    }

    if (event.key === '+' || event.key === '=' || event.key === 'Add') {
      event.preventDefault();
      this.setZoom(this.zoomPercent() + 10);
      return;
    }

    if (event.key === '-' || event.key === '_' || event.key === 'Subtract') {
      event.preventDefault();
      this.setZoom(this.zoomPercent() - 10);
    }
  }

  @HostListener('document:mousedown', ['$event'])
  handleDocumentMouseDown(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      this.sectionOptionsMenuId.set(null);
      this.pageCardMenuId.set(null);
      this.closeComponentContextMenu();
      return;
    }

    if (this.sectionOptionsMenuId()) {
      if (!target.closest('.storefront-editor__preview-section-menu, .storefront-editor__preview-section-rail-more')) {
        this.sectionOptionsMenuId.set(null);
      }
    }

    if (this.pageCardMenuId()) {
      if (!target.closest('.storefront-editor__page-card-menu, .storefront-editor__page-card-more')) {
        this.pageCardMenuId.set(null);
      }
    }

    if (this.isComponentContextMenuOpen()) {
      if (!target.closest('.storefront-editor__component-context-menu')) {
        this.closeComponentContextMenu();
      }
    }
  }

  @HostListener('document:mousemove', ['$event'])
  handleComponentPointerMove(event: MouseEvent): void {
    if (this.activeAddElementsComponentDrag) {
      event.preventDefault();
      this.updateAddElementsComponentDrag(event);
      return;
    }

    if (this.activeSectionResize) {
      event.preventDefault();
      this.updateResizingSection(event);
      return;
    }

    if (this.activeSelectionDrag) {
      event.preventDefault();
      this.updateComponentSelectionBox(event);
      return;
    }

    if (this.activeResize) {
      event.preventDefault();
      this.updateResizingComponent(event);
      return;
    }

    if (this.activeRotation) {
      event.preventDefault();
      this.updateRotatingComponent(event);
      return;
    }

    if (!this.activeComponentDrag) {
      return;
    }

    event.preventDefault();

    const bounds = this.getDraggedComponentsBounds(this.activeComponentDrag.components);
    const draggedRect = {
      left: event.clientX - this.activeComponentDrag.pointerOffsetX,
      top: event.clientY - this.activeComponentDrag.pointerOffsetY,
      width: bounds.width,
      height: bounds.height,
    };
    const targetContainer = this.getSectionContentElementForDraggedBounds(
      draggedRect,
      this.activeComponentDrag.sectionId
    );
    if (targetContainer) {
      const targetSectionId = targetContainer.dataset['sectionContentId'] ?? null;
      if (targetSectionId && targetSectionId !== this.activeComponentDrag.sectionId) {
        this.moveDraggedComponentsToSection(this.activeComponentDrag.sectionId, targetSectionId);
        this.activeComponentDrag.sectionId = targetSectionId;
      }
    }

    const container =
      targetContainer ??
      document.querySelector(
        `.storefront-editor__preview-section-content[data-section-content-id="${this.activeComponentDrag.sectionId}"]`
      );

    if (!(container instanceof HTMLElement)) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const anchorX = event.clientX - rect.left - this.activeComponentDrag.pointerOffsetX;
    const anchorY = event.clientY - rect.top - this.activeComponentDrag.pointerOffsetY;
    const previewVisibleHeight = this.getPreviewVisibleHeightForSection(container);
    const minAnchorX = -bounds.width + 20;
    const maxAnchorX = rect.width - 20;
    const minAnchorY = -bounds.height + 20;
    const maxAnchorY = previewVisibleHeight - bounds.height - 20;
    const clampedAnchorX = Math.max(minAnchorX, Math.min(anchorX, maxAnchorX));
    const clampedAnchorY = Math.max(minAnchorY, Math.min(anchorY, maxAnchorY));

    this.updateSectionComponentFrames(
      this.activeComponentDrag.sectionId,
      this.activeComponentDrag.components.map((component) => ({
        componentId: component.componentId,
        x: clampedAnchorX + (component.startX - bounds.x),
        y: clampedAnchorY + (component.startY - bounds.y),
      })),
      rect.width,
      rect.height,
      previewVisibleHeight
    );
  }

  @HostListener('document:mouseup', ['$event'])
  handleComponentPointerUp(event: MouseEvent): void {
    if (this.activeAddElementsComponentDrag) {
      this.finishAddElementsComponentDrag(event);
      return;
    }

    this.activeComponentDrag = null;
    this.activeResize = null;
    this.activeRotation = null;
    this.activeSectionResize = null;
    this.isResizingComponent.set(false);
    this.isRotatingComponent.set(false);
    this.isResizingSection.set(false);
    this.componentAttachSectionId.set(null);
    this.finishComponentSelectionBox();
  }

  loadEditor(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Project not found.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectService
      .getProjectById(projectId)
      .pipe(
        switchMap((project) => {
          this.project.set(project);
          this.projectWorkspaceContextService.setProjectType(projectId, project.type);

          if (project.type !== 'ECOMMERCE') {
            return of({
              storefront: null,
              catalogProducts: [] as ProjectCatalogProduct[],
              projectMedia: [],
            });
          }

          return forkJoin({
            storefront: this.projectStorefrontService.getStorefront(projectId),
            catalogProducts: this.projectCatalogService.getCatalogPage(projectId, {}).pipe(
              switchMap((catalogPage) => of(catalogPage.products))
            ),
            projectMedia: this.projectService.getProjectMedia(projectId).pipe(catchError(() => of([]))),
          });
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ storefront, catalogProducts, projectMedia }) => {
          this.products.set(catalogProducts);
          this.mediaAssets.set(this.buildMediaManagerAssets(projectMedia, catalogProducts));

          if (!storefront) {
            this.storefront.set(null);
            this.workingStorefront.set(null);
            this.editorSession.set(this.createDefaultEditorSession());
            this.undoStack.set([]);
            this.redoStack.set([]);
            this.selectedSectionId.set(null);
            return;
          }

          const snapshot = this.normalizeStorefront(storefront);
          this.storefront.set(snapshot);
          this.workingStorefront.set(this.cloneStorefront(snapshot));
          const editorSession = this.normalizeEditorSession(snapshot.editorSession);
          this.editorSession.set(editorSession);
          this.undoStack.set([]);
          this.redoStack.set([]);
          this.selectedSectionId.set(editorSession.selectedSectionId);
          this.viewport.set(editorSession.viewport);
          this.zoomPercent.set(editorSession.zoomPercent);
          setTimeout(() => this.updatePreviewStageScrollbarState(), 0);
        },
        error: () => {
          this.project.set(null);
          this.storefront.set(null);
          this.workingStorefront.set(null);
            this.editorSession.set(this.createDefaultEditorSession());
            this.undoStack.set([]);
              this.redoStack.set([]);
              this.selectedComponentId.set(null);
              this.selectedComponentIds.set([]);
              this.isolatedGroupComponentId.set(null);
              this.products.set([]);
            this.errorMessage.set('Unable to load the storefront editor right now.');
        },
      });
  }

  selectPageSettings(): void {
    this.sidebarMode.set('page');
    this.selectedSectionId.set(null);
    this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
    this.syncEditorSessionState({ selectedSectionId: null });
  }

  selectSection(sectionId: string): void {
    this.sidebarMode.set('structure');
    this.selectedSectionId.set(sectionId);
    this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
    this.sectionOptionsMenuId.set(null);
    this.syncEditorSessionState({ selectedSectionId: sectionId });
    setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
  }

  clearSectionSelection(): void {
    this.selectedSectionId.set(null);
    this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
    this.sectionOptionsMenuId.set(null);
    this.syncEditorSessionState({ selectedSectionId: null });
  }

  setViewport(viewport: StorefrontEditorViewport): void {
    this.viewport.set(viewport);
    this.syncEditorSessionState({ viewport });
    setTimeout(() => this.updatePreviewStageScrollbarState(), 0);
  }

  toggleFormaMenu(): void {
    const next = !this.isFormaMenuOpen();
    this.closeFloatingUi();
    this.isFormaMenuOpen.set(next);
  }

  toggleAccountMenu(): void {
    const next = !this.isAccountMenuOpen();
    this.closeFloatingUi();
    this.isAccountMenuOpen.set(next);
  }

  toggleZoomMenu(): void {
    const next = !this.isZoomMenuOpen();
    this.closeFloatingUi();
    this.isZoomMenuOpen.set(next);
  }

  toggleAddElementsPanel(): void {
    if (this.isAddElementsPanelOpen() || this.isAddElementsPanelClosing()) {
      this.closeAddElementsPanel();
      return;
    }

    if (this.addElementsPanelCloseTimer) {
      clearTimeout(this.addElementsPanelCloseTimer);
      this.addElementsPanelCloseTimer = null;
    }

    this.closeFloatingUi();
    this.isAddElementsPanelClosing.set(false);
    this.isAddElementsPanelOpen.set(true);
    setTimeout(() => this.updateAddElementsTabScrollState(), 0);
  }

  closeAddElementsPanel(): void {
    if (!this.isAddElementsPanelOpen() && !this.isAddElementsPanelClosing()) {
      return;
    }

    if (this.addElementsPanelCloseTimer) {
      clearTimeout(this.addElementsPanelCloseTimer);
    }

    this.isAddElementsPanelOpen.set(false);
    this.isAddElementsPanelClosing.set(true);
    this.addElementsPanelCloseTimer = setTimeout(() => {
      this.isAddElementsPanelClosing.set(false);
      this.canScrollAddElementsTabsLeft.set(false);
      this.canScrollAddElementsTabsRight.set(false);
      this.addElementsPanelCloseTimer = null;
    }, ProjectStorefrontEditor.ADD_ELEMENTS_PANEL_CLOSE_MS);
  }

  closeAddElementsPanelImmediately(): void {
    if (this.addElementsPanelCloseTimer) {
      clearTimeout(this.addElementsPanelCloseTimer);
      this.addElementsPanelCloseTimer = null;
    }

    this.isAddElementsPanelOpen.set(false);
    this.isAddElementsPanelClosing.set(false);
    this.canScrollAddElementsTabsLeft.set(false);
    this.canScrollAddElementsTabsRight.set(false);
  }

  scrollAddElementsTabs(direction: 'left' | 'right'): void {
    const tabs = this.getAddElementsTabsElement();
    if (!tabs) {
      return;
    }

    const delta = Math.max(180, Math.round(tabs.clientWidth * 0.55));
    tabs.scrollBy({
      left: direction === 'right' ? delta : -delta,
      behavior: 'smooth',
    });

    setTimeout(() => this.updateAddElementsTabScrollState(), 220);
  }

  updateAddElementsTabScrollState(): void {
    const tabs = this.getAddElementsTabsElement();
    if (!tabs) {
      this.canScrollAddElementsTabsLeft.set(false);
      this.canScrollAddElementsTabsRight.set(false);
      return;
    }

    const maxScrollLeft = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
    this.canScrollAddElementsTabsLeft.set(tabs.scrollLeft > 4);
    this.canScrollAddElementsTabsRight.set(tabs.scrollLeft < maxScrollLeft - 4);
  }

  insertComponentFromLibrary(item: StorefrontEditorAddElementsLibraryItem): void {
    const selectedSection = this.selectedSection();
    if (!selectedSection) {
      this.toastService.info('Select a section first to add a component inside it.');
      return;
    }

    const nextComponent = this.buildLibraryComponentForSection(item, selectedSection.id);
    this.insertComponentIntoSection(selectedSection.id, nextComponent, { syncRail: true });
    this.closeAddElementsPanel();
  }

  startAddElementsComponentDrag(item: StorefrontEditorAddElementsLibraryItem, event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const rect = target.getBoundingClientRect();
    this.closeAddElementsPanelImmediately();
    this.activeAddElementsComponentDrag = {
      itemId: item.id,
      pointerOffsetX: event.clientX - rect.left,
      pointerOffsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    this.draggedAddElementsItemId.set(item.id);
    this.draggedAddElementsPreviewPosition.set({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
    event.preventDefault();
  }

  endAddElementsComponentDrag(): void {
    this.activeAddElementsComponentDrag = null;
    this.draggedAddElementsItemId.set(null);
    this.draggedAddElementsPreviewPosition.set(null);
    this.componentAttachSectionId.set(null);
  }

  isLibraryComponentDragging(): boolean {
    return this.draggedAddElementsItemId() !== null;
  }

  enterLibraryComponentAttach(event: DragEvent, sectionId: string): void {
    this.allowLibraryComponentAttach(event, sectionId);
  }

  allowLibraryComponentAttach(event: DragEvent, sectionId: string): void {
    if (!this.draggedAddElementsItemId()) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.componentAttachSectionId.set(sectionId);
  }

  leaveLibraryComponentAttach(sectionId: string): void {
    if (this.componentAttachSectionId() === sectionId) {
      this.componentAttachSectionId.set(null);
    }
  }

  dropLibraryComponentIntoSection(event: DragEvent, sectionId: string): void {
    const itemId =
      this.draggedAddElementsItemId() ||
      event.dataTransfer?.getData('text/storefront-editor-component-library-item') ||
      null;
    if (!itemId) {
      return;
    }

    event.preventDefault();
    const item = this.addElementsLibraryItems.find((candidate) => candidate.id === itemId);
    if (!item) {
      this.endAddElementsComponentDrag();
      return;
    }

    const nextComponent = this.buildLibraryComponentForSection(
      item,
      sectionId,
      this.getDropFrameFromEvent(sectionId, item.componentType, event)
    );
    this.insertComponentIntoSection(sectionId, nextComponent, { selectedSectionId: sectionId, syncRail: true });
    this.endAddElementsComponentDrag();
  }

  selectComponent(sectionId: string, componentId: string, event?: MouseEvent): void {
    if (event?.type === 'click' && this.suppressNextComponentClickSelectionId === componentId) {
      this.suppressNextComponentClickSelectionId = null;
      event.stopPropagation();
      return;
    }

    event?.stopPropagation();
    this.selectedSectionId.set(sectionId);
    const isToggleSelection = Boolean(event?.ctrlKey || event?.metaKey);
    const currentIds = this.selectedComponentIds();
    if (isToggleSelection) {
      const alreadySelected = currentIds.includes(componentId);
      const nextIds = alreadySelected
        ? currentIds.filter((id) => id !== componentId)
        : [...currentIds, componentId];
      this.selectedComponentIds.set(nextIds);
      this.selectedComponentId.set(nextIds[nextIds.length - 1] ?? null);
    } else if (
      currentIds.length > 1 &&
      currentIds.includes(componentId)
    ) {
      this.selectedComponentId.set(componentId);
    } else {
      this.selectedComponentId.set(componentId);
      this.selectedComponentIds.set([componentId]);
    }

    if (!isToggleSelection) {
      this.isolatedGroupComponentId.set(null);
    }

    this.closeComponentContextMenu();
    this.sectionOptionsMenuId.set(null);
    this.syncEditorSessionState({ selectedSectionId: sectionId }, false);
  }

  isSectionActivelySelected(sectionId: string): boolean {
    return this.selectedSectionId() === sectionId && !this.hasComponentSelection();
  }

  beginComponentMove(sectionId: string, componentId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const section = this.sections().find((item) => item.id === sectionId);
    const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
    if (!component) {
      return;
    }

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const sectionComponents = section ? this.readSectionComponents(section) : [];
    const selectedIds = new Set(this.selectedComponentIds());
    const dragComponents = sectionComponents.filter((item) => {
      if (component.groupId && this.isolatedGroupComponentId() !== component.id) {
        return item.groupId === component.groupId;
      }

      return selectedIds.has(item.id)
        ? selectedIds.has(componentId)
        : item.id === componentId;
    });
    const effectiveComponents = dragComponents.length ? dragComponents : [component];
    const orderedComponents = [...effectiveComponents].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const dragBounds = this.getDraggedComponentsBounds(
      orderedComponents.map((item) => ({
        startX: item.frame.x,
        startY: item.frame.y,
        width: item.frame.width,
        height: item.frame.height,
      }))
    );
    const container = target.closest('.storefront-editor__preview-section-content');
    const containerRect = container instanceof HTMLElement ? container.getBoundingClientRect() : target.getBoundingClientRect();
    this.activeComponentDrag = {
      sectionId,
      pointerOffsetX: event.clientX - (containerRect.left + dragBounds.x),
      pointerOffsetY: event.clientY - (containerRect.top + dragBounds.y),
      components: orderedComponents.map((item) => ({
        componentId: item.id,
        startX: item.frame.x,
        startY: item.frame.y,
        width: item.frame.width,
        height: item.frame.height,
      })),
      };

    this.suppressNextComponentClickSelectionId = componentId;
    this.selectComponent(sectionId, componentId, event);
  }

  isolateGroupedComponent(sectionId: string, componentId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectComponent(sectionId, componentId, event);
    this.isolatedGroupComponentId.set(componentId);
  }

  startComponentReorder(componentId: string, event: DragEvent): void {
    this.draggedComponentId.set(componentId);
    event.dataTransfer?.setData('text/plain', componentId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  allowComponentDrop(event: DragEvent, targetComponentId: string): void {
    event.preventDefault();
    this.componentReorderTargetId.set(targetComponentId);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  clearComponentDropTarget(): void {
    this.componentReorderTargetId.set(null);
  }

  dropComponentReorder(event: DragEvent, targetComponentId: string): void {
    event.preventDefault();
    const draggedComponentId =
      this.draggedComponentId() || event.dataTransfer?.getData('text/plain') || null;
    const section = this.selectedSection();

    this.draggedComponentId.set(null);
    this.componentReorderTargetId.set(null);

    if (!section || !draggedComponentId || draggedComponentId === targetComponentId) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          const components = [...this.readSectionComponents(item)];
          const draggedIndex = components.findIndex((component) => component.id === draggedComponentId);
          const targetIndex = components.findIndex((component) => component.id === targetComponentId);
          if (draggedIndex < 0 || targetIndex < 0) {
            return item;
          }

          const [draggedComponent] = components.splice(draggedIndex, 1);
          const nextTargetIndex = components.findIndex((component) => component.id === targetComponentId);
          components.splice(nextTargetIndex, 0, draggedComponent);
          return this.writeSectionComponents(item, components);
        }),
      },
    }), { syncRail: false });
  }

  endComponentReorder(): void {
    this.draggedComponentId.set(null);
    this.componentReorderTargetId.set(null);
  }

  removeSelectedComponent(): void {
    this.deleteSelectedComponents();
  }

  deleteSelectedComponents(): void {
    const section = this.selectedSection();
    const componentIds = this.selectedComponentIds();
    if (!section || !componentIds.length) {
      return;
    }

    const selectedGroupId = this.selectedComponentGroupId();
    const selectedIds = selectedGroupId
      ? new Set(this.selectedComponentGroupComponents().map((component) => component.id))
      : new Set(componentIds);
    this.applyStorefrontMutation((storefront) => ({
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          return this.writeSectionComponents(
            item,
            this.readSectionComponents(item).filter((component) => !selectedIds.has(component.id))
          );
        }),
      },
    }), { syncRail: false });

      this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
      this.closeComponentContextMenu();
  }

  copySelectedComponents(): void {
    const section = this.selectedSection();
    const selectedIds = new Set(this.selectedComponentIds());
    if (!section || !selectedIds.size) {
      return;
    }

    const component =
      this.readSectionComponents(section).find((item) => selectedIds.has(item.id)) ?? null;
    if (!component) {
      return;
    }

    this.componentClipboard.set(JSON.parse(JSON.stringify(component)) as StorefrontEditorComponentNode);
    this.closeComponentContextMenu();
  }

  pasteComponentFromClipboard(sectionId = this.componentContextMenuSectionId() ?? this.selectedSectionId()): void {
    const clipboard = this.componentClipboard();
    if (!clipboard || !sectionId) {
      return;
    }

    const targetSection = this.sections().find((item) => item.id === sectionId);
    if (!targetSection) {
      return;
    }

    const maxZIndex = this.readSectionComponents(targetSection).reduce(
      (max, component) => Math.max(max, component.zIndex || 0),
      0
    );
    const nextComponent = JSON.parse(JSON.stringify(clipboard)) as StorefrontEditorComponentNode;
    nextComponent.id = `${clipboard.type}-${Date.now()}`;
    nextComponent.frame = {
      ...nextComponent.frame,
      x: Math.max(0, nextComponent.frame.x + 20),
      y: Math.max(0, nextComponent.frame.y + 20),
    };
    nextComponent.zIndex = maxZIndex + 1;
    nextComponent.groupId = undefined;

    this.updateSectionComponents(sectionId, (components) => [...components, nextComponent], {
      selectedSectionId: sectionId,
      syncRail: true,
    });
      this.selectedComponentId.set(nextComponent.id);
      this.selectedComponentIds.set([nextComponent.id]);
      this.isolatedGroupComponentId.set(null);
      this.closeComponentContextMenu();
  }

  componentKindLabel(type: StorefrontEditorComponentType): string {
    switch (type) {
      case 'heading':
        return 'Heading';
      case 'paragraph':
        return 'Paragraph';
      case 'image':
        return 'Image';
      case 'button':
        return 'Button';
      case 'container':
        return 'Container';
      case 'graphic':
        return 'Graphic';
      case 'product-feed':
        return 'Product feed';
      case 'blog-feed':
        return 'Blog feed';
    }
  }

  findAddElementsLibraryItem(itemId: string): StorefrontEditorAddElementsLibraryItem | null {
    return this.addElementsLibraryItems.find((item) => item.id === itemId) ?? null;
  }

  isComponentSelected(componentId: string): boolean {
    return this.selectedComponentIds().includes(componentId);
  }

  isComponentMultiSelected(componentId: string): boolean {
    const selectedIds = this.selectedComponentIds();
    return selectedIds.length > 1 && selectedIds.includes(componentId);
  }

  clearComponentSelection(sectionId?: string, event?: MouseEvent): void {
    event?.stopPropagation();
    if (this.justFinishedComponentSelectionBox) {
      this.justFinishedComponentSelectionBox = false;
      return;
    }

    if (sectionId) {
      this.selectedSectionId.set(sectionId);
      this.syncEditorSessionState({ selectedSectionId: sectionId }, false);
    }
    this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
    this.closeComponentContextMenu();
  }

  startComponentSelectionBox(sectionId: string, event: MouseEvent): void {
      const target = event.target;
      const currentTarget = event.currentTarget;
      if (!(currentTarget instanceof HTMLElement) || !(target instanceof HTMLElement)) {
        return;
      }

      if (
        target.closest('.storefront-editor__preview-component') ||
        target.closest('.storefront-editor__preview-section-chrome') ||
        target.closest('.storefront-editor__preview-section-attach-indicator')
      ) {
        return;
      }

    event.preventDefault();
    this.selectedSectionId.set(sectionId);
    this.selectedComponentId.set(null);
    this.selectedComponentIds.set([]);
    this.isolatedGroupComponentId.set(null);
    this.closeComponentContextMenu();

    const rect = currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.activeSelectionDrag = {
      sectionId,
      startX: x,
      startY: y,
    };
    this.selectionBoxSectionId.set(sectionId);
    this.selectionBox.set({ x, y, width: 0, height: 0 });
    this.isSelectingComponents.set(true);
  }

  openComponentContextMenu(sectionId: string, componentId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectComponent(sectionId, componentId, event);
    this.componentContextMenuSectionId.set(sectionId);
    this.componentContextMenuComponentId.set(componentId);
    this.componentContextMenuPosition.set(
      this.getClampedFloatingPanelPosition(event.clientX, event.clientY, 220, 460)
    );
    this.isComponentContextMenuOpen.set(true);
    this.sectionOptionsMenuId.set(null);
  }

  openSectionCanvasContextMenu(sectionId: string, event: MouseEvent): void {
    const target = event.target;
    const currentTarget = event.currentTarget;
    if (!(currentTarget instanceof HTMLElement)) {
      return;
    }

    if (target instanceof HTMLElement && target.closest('.storefront-editor__preview-component')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
      this.selectedSectionId.set(sectionId);
      this.selectedComponentId.set(null);
      this.selectedComponentIds.set([]);
      this.isolatedGroupComponentId.set(null);
      this.closeComponentContextMenu();
      this.openSectionOptionsAt(sectionId, event.clientX, event.clientY);
  }

  closeComponentContextMenu(): void {
    this.isComponentContextMenuOpen.set(false);
    this.componentContextMenuSectionId.set(null);
    this.componentContextMenuComponentId.set(null);
  }

  closeSectionOptionsMenu(): void {
    this.sectionOptionsMenuId.set(null);
  }

  groupSelectedComponents(): void {
    const section = this.selectedSection();
    const selectedIds = this.selectedComponentIds();
    if (!section || selectedIds.length < 2) {
      return;
    }

    const groupId = `component-group-${Date.now()}`;
    const selectedIdSet = new Set(selectedIds);
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          const nextComponents = this.readSectionComponents(item).map((component) =>
            selectedIdSet.has(component.id) ? { ...component, groupId } : component
          );
          return this.writeSectionComponents(item, nextComponents);
        }),
      },
    }), { syncRail: false });

    this.closeComponentContextMenu();
  }

  ungroupSelectedComponents(): void {
    const section = this.selectedSection();
    const selectedIds = this.selectedComponentIds();
    if (!section || !selectedIds.length) {
      return;
    }

    const sectionComponents = this.readSectionComponents(section);
    const groupIds = new Set(
      sectionComponents
        .filter((component) => selectedIds.includes(component.id))
        .map((component) => component.groupId)
        .filter((groupId): groupId is string => Boolean(groupId))
    );
    if (!groupIds.size) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          const nextComponents = this.readSectionComponents(item).map((component) =>
            component.groupId && groupIds.has(component.groupId)
              ? { ...component, groupId: undefined }
              : component
          );
          return this.writeSectionComponents(item, nextComponents);
        }),
      },
    }), { syncRail: false });

    this.closeComponentContextMenu();
  }

  duplicateSelectedComponents(): void {
    const section = this.selectedSection();
    const selectedIds = this.selectedComponentIds();
    if (!section || !selectedIds.length) {
      return;
    }

    const nextIds: string[] = [];
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          const components = this.readSectionComponents(item);
          let nextZIndex = components.reduce((max, component) => Math.max(max, component.zIndex ?? 1), 0) + 1;
          const duplicates = components
            .filter((component) => selectedIds.includes(component.id))
            .map((component) => {
              const clone = JSON.parse(JSON.stringify(component)) as StorefrontEditorComponentNode;
              clone.id = createStorefrontEditorComponentNode(component.type).id;
              clone.frame = {
                ...clone.frame,
                x: clone.frame.x + 24,
                y: clone.frame.y + 24,
              };
              clone.zIndex = nextZIndex++;
              nextIds.push(clone.id);
              return clone;
            });

          return this.writeSectionComponents(item, [...components, ...duplicates]);
        }),
      },
    }), { syncRail: false });

    this.selectedComponentIds.set(nextIds);
    this.selectedComponentId.set(nextIds[nextIds.length - 1] ?? null);
    this.closeComponentContextMenu();
  }

  bringSelectedComponentsToFront(): void {
    this.reorderSelectedComponentDepth('front');
  }

  sendSelectedComponentsToBack(): void {
    this.reorderSelectedComponentDepth('back');
  }

  bringSelectedComponentsForward(): void {
    this.stepSelectedComponentDepth('forward');
  }

  sendSelectedComponentsBackward(): void {
    this.stepSelectedComponentDepth('backward');
  }

  beginComponentResize(sectionId: string, componentId: string, handle: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const section = this.sections().find((item) => item.id === sectionId);
    const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
    if (!component) {
      return;
    }

    this.selectComponent(sectionId, componentId, event);
    this.activeResize = {
      sectionId,
      componentId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startFrame: { ...component.frame },
      startRotation: component.rotation ?? 0,
    };
    this.isResizingComponent.set(true);
    this.closeComponentContextMenu();
  }

  beginComponentRotate(sectionId: string, componentId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const section = this.sections().find((item) => item.id === sectionId);
    const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${sectionId}"]`
    );
    if (!component || !(container instanceof HTMLElement)) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + component.frame.x + component.frame.width / 2;
    const centerY = rect.top + component.frame.y + component.frame.height / 2;
    this.selectComponent(sectionId, componentId);
    this.activeRotation = {
      sectionId,
      componentId,
      centerX,
      centerY,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI),
      startRotation: component.rotation ?? 0,
      previousAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI),
      accumulatedAngle: 0,
    };
    this.isRotatingComponent.set(true);
    this.closeComponentContextMenu();
  }

  startEditingComponentName(sectionId: string, componentId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const section = this.sections().find((item) => item.id === sectionId);
    const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
    if (!component) {
      return;
    }

    this.selectComponent(sectionId, componentId);
    this.isEditingComponentName.set(true);
    this.editingComponentNameId.set(componentId);
    this.editingComponentNameValue.set(component.name || 'Untitled');
  }

  finishEditingComponentName(): void {
    const sectionId = this.selectedSectionId();
    const componentId = this.editingComponentNameId();
    if (!sectionId || !componentId) {
      this.cancelComponentNameEditing();
      return;
    }

    const nextName = this.editingComponentNameValue().trim() || 'Untitled';
    this.updateComponentNode(sectionId, componentId, (component) => ({ ...component, name: nextName }));
    this.cancelComponentNameEditing();
  }

  cancelComponentNameEditing(): void {
    this.isEditingComponentName.set(false);
    this.editingComponentNameId.set(null);
    this.editingComponentNameValue.set('');
  }

  onComponentNameInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.finishEditingComponentName();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelComponentNameEditing();
    }
  }

  startEditingComponentText(sectionId: string, componentId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const section = this.sections().find((item) => item.id === sectionId);
    const component = section ? this.readSectionComponents(section).find((item) => item.id === componentId) : null;
    if (!component || !this.canEditComponentText(component)) {
      return;
    }

    this.selectComponent(sectionId, componentId);
    this.isEditingComponentText.set(true);
    this.editingComponentTextId.set(componentId);
    this.editingComponentTextValue.set(this.readEditableComponentText(component));
  }

  finishEditingComponentText(): void {
    const sectionId = this.selectedSectionId();
    const componentId = this.editingComponentTextId();
    if (!sectionId || !componentId) {
      this.cancelComponentTextEditing();
      return;
    }

    const nextValue = this.editingComponentTextValue();
    this.updateComponentNode(sectionId, componentId, (component) => this.writeEditableComponentText(component, nextValue));
    this.cancelComponentTextEditing();
  }

  cancelComponentTextEditing(): void {
    this.isEditingComponentText.set(false);
    this.editingComponentTextId.set(null);
    this.editingComponentTextValue.set('');
  }

  onComponentTextInputKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.finishEditingComponentText();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelComponentTextEditing();
    }
  }

  beginSectionResize(sectionId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const content = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${sectionId}"]`
    );
    if (!(content instanceof HTMLElement)) {
      return;
    }

    this.selectSection(sectionId);
    this.activeSectionResize = {
      sectionId,
      startY: event.clientY,
      startHeight: content.getBoundingClientRect().height,
    };
    this.isResizingSection.set(true);
    this.closeComponentContextMenu();
  }

  togglePagesPanel(): void {
    const next = !this.isPagesPanelOpen();
    this.closeFloatingUi();
    this.isPagesPanelOpen.set(next);
  }

  openSectionLibrary(sectionId: string): void {
    if (this.sectionLibraryCloseTimer) {
      clearTimeout(this.sectionLibraryCloseTimer);
      this.sectionLibraryCloseTimer = null;
    }
    this.isPagesPanelOpen.set(false);
    this.sectionOptionsMenuId.set(null);
    this.activeSectionLibraryCategory.set('Welcome');
    this.isSectionLibraryClosing.set(false);
    this.sectionLibraryTargetId.set(sectionId);
    setTimeout(() => this.updateSectionLibraryTabScrollState(), 0);
  }

  closeSectionLibrary(): void {
    if (!this.isSectionLibraryOpen() && !this.isSectionLibraryClosing()) {
      return;
    }

    if (this.sectionLibraryCloseTimer) {
      clearTimeout(this.sectionLibraryCloseTimer);
    }

    this.isSectionLibraryClosing.set(true);
    this.sectionLibraryCloseTimer = setTimeout(() => {
      this.sectionLibraryTargetId.set(null);
      this.isSectionLibraryClosing.set(false);
      this.canScrollSectionLibraryTabsLeft.set(false);
      this.canScrollSectionLibraryTabsRight.set(false);
      this.sectionLibraryCloseTimer = null;
    }, ProjectStorefrontEditor.SECTION_LIBRARY_CLOSE_MS);
  }

  setSectionLibraryCategory(category: SectionLibraryCategory): void {
    this.activeSectionLibraryCategory.set(category);
    setTimeout(() => this.updateSectionLibraryTabScrollState(), 0);
  }

  scrollSectionLibraryTabs(direction: 'left' | 'right'): void {
    const tabs = this.getSectionLibraryTabsElement();
    if (!tabs) {
      return;
    }

    const delta = Math.max(180, Math.round(tabs.clientWidth * 0.45));
    tabs.scrollBy({
      left: direction === 'right' ? delta : -delta,
      behavior: 'smooth',
    });

    setTimeout(() => this.updateSectionLibraryTabScrollState(), 220);
  }

  updateSectionLibraryTabScrollState(): void {
    const tabs = this.getSectionLibraryTabsElement();
    if (!tabs) {
      this.canScrollSectionLibraryTabsLeft.set(false);
      this.canScrollSectionLibraryTabsRight.set(false);
      return;
    }

    const maxScrollLeft = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
    this.canScrollSectionLibraryTabsLeft.set(tabs.scrollLeft > 4);
    this.canScrollSectionLibraryTabsRight.set(tabs.scrollLeft < maxScrollLeft - 4);
  }

  closeFloatingUi(): void {
    this.isFormaMenuOpen.set(false);
    this.isAccountMenuOpen.set(false);
    this.isZoomMenuOpen.set(false);
    this.closeAddElementsPanel();
    this.isPagesPanelOpen.set(false);
    this.isMediaManagerOpen.set(false);
    this.pageCardMenuId.set(null);
    this.closeSectionLibrary();
    this.closeSectionOptionsMenu();
  }

  togglePageCardMenu(pageId: string, event?: MouseEvent): void {
    if (this.pageCardMenuId() === pageId) {
      this.pageCardMenuId.set(null);
      return;
    }

    const target = event?.currentTarget;
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect();
      this.pageCardMenuTop.set(rect.top);
      this.pageCardMenuLeft.set(rect.right + 8);
    }

    this.pageCardMenuId.set(pageId);
  }

  toggleSectionOptions(sectionId: string, event?: MouseEvent): void {
    if (this.sectionOptionsMenuId() === sectionId) {
      this.closeSectionOptionsMenu();
      return;
    }

    const target = event?.currentTarget;
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect();
      this.openSectionOptionsAt(sectionId, rect.right + 8, rect.top);
      return;
    }

    this.openSectionOptionsAt(sectionId, window.innerWidth / 2, window.innerHeight / 2);
  }

  private openSectionOptionsAt(sectionId: string, x: number, y: number): void {
    this.sectionContextMenuPosition.set(this.getClampedFloatingPanelPosition(x, y, 232, 340));
    this.sectionOptionsMenuId.set(sectionId);
  }

  private getClampedFloatingPanelPosition(x: number, y: number, width: number, height: number): { x: number; y: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 12;

    return {
      x: Math.max(margin, Math.min(x, viewportWidth - width - margin)),
      y: Math.max(margin, Math.min(y, viewportHeight - height - margin)),
    };
  }

syncSelectedSectionRailPosition(sectionElement?: HTMLElement | null): void {
  this.updatePreviewStageScrollbarState();

  const selectedSectionId = this.selectedSectionId();
  if (!selectedSectionId && !sectionElement) {
    this.isSelectedSectionRailVisible.set(false);
    return;
  }

  const shell =
    sectionElement ??
    (document.querySelector(
      `.storefront-editor__preview-section-shell[data-section-id="${selectedSectionId}"]`
    ) as HTMLElement | null);
  if (!shell) {
    this.isSelectedSectionRailVisible.set(false);
    return;
  }

  const previewStage = shell.closest('.storefront-editor__preview-stage') as HTMLElement | null;
  if (!previewStage) {
    this.isSelectedSectionRailVisible.set(false);
    return;
  }

  const shellRect = shell.getBoundingClientRect();
  const previewStageRect = previewStage.getBoundingClientRect();
  const isVisible = shellRect.bottom > previewStageRect.top && shellRect.top < previewStageRect.bottom;
  this.isSelectedSectionRailVisible.set(isVisible);
  if (!isVisible) {
    return;
  }

  const unclampedTop = shellRect.top - previewStageRect.top + shellRect.height / 2;
  const clampedTop = Math.min(
    Math.max(28, unclampedTop),
    Math.max(28, previewStageRect.height - 28)
  );
  this.hoveredSectionRailTop.set(clampedTop);
}

  setZoom(percent: number): void {
    const clamped = Math.min(200, Math.max(50, Math.round(percent)));
    this.zoomPercent.set(clamped);
    this.isZoomMenuOpen.set(false);
    this.syncEditorSessionState({ zoomPercent: clamped });
    setTimeout(() => this.updatePreviewStageScrollbarState(), 0);
  }

  nudgeZoom(direction: 'in' | 'out'): void {
    const delta = direction === 'in' ? 10 : -10;
    this.setZoom(this.zoomPercent() + delta);
    this.isZoomMenuOpen.set(true);
  }

  fitPreviewToScreen(): void {
    this.zoomPercent.set(120);
    this.isZoomMenuOpen.set(false);
    this.syncEditorSessionState({ zoomPercent: 120 });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
  }

  setSidebarMode(mode: EditorSidebarMode): void {
    this.sidebarMode.set(mode);
      if (mode === 'page') {
        this.selectedSectionId.set(null);
        this.selectedComponentId.set(null);
        this.selectedComponentIds.set([]);
        this.isolatedGroupComponentId.set(null);
      }
  }

  navigateBackToProject(): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    void this.router.navigate(['/app/projects', projectId, 'home']);
  }

  openPublicPreview(): void {
  const projectId = this.projectId();
  const workingStorefront = this.workingStorefront();
  const project = this.project();
  if (!projectId) {
    return;
  }

  if (workingStorefront && workingStorefront.draftHomepage) {
    const previewProducts = this.products()
      .filter(
        (product) =>
          product.status !== 'ARCHIVED' &&
          !!product.name?.trim() &&
          product.price != null &&
          Number(product.price) > 0
      )
      .map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description ?? null,
        sku: product.sku ?? null,
        category: product.category ?? null,
        productType: product.productType ?? null,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        inventoryQuantity: product.inventoryQuantity ?? 0,
        imageUrl: product.imageUrl ?? null,
        tags: Array.isArray(product.tags) ? product.tags : [],
        createdAt: product.createdAt ?? null,
        updatedAt: product.updatedAt ?? null,
      }));

    this.publicStorefrontService.saveEditorPreviewSnapshot(projectId, {
      savedAt: new Date().toISOString(),
      storefront: {
        projectId,
        storeName:
          workingStorefront.storeName?.trim() ||
          project?.storeTitle?.trim() ||
          project?.name?.trim() ||
          'Storefront',
        themeKey: workingStorefront.themeKey ?? null,
        homepage: structuredClone(workingStorefront.draftHomepage),
        featuredProducts: this.featuredProductsPreview().map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description ?? null,
          sku: product.sku ?? null,
          category: product.category ?? null,
          productType: product.productType ?? null,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? null,
          inventoryQuantity: product.inventoryQuantity ?? 0,
          imageUrl: product.imageUrl ?? null,
          tags: Array.isArray(product.tags) ? product.tags : [],
          createdAt: product.createdAt ?? null,
          updatedAt: product.updatedAt ?? null,
        })),
      },
      products: previewProducts,
    });
  }

  window.open(`/store/${projectId}?preview=editor`, '_blank', 'noopener');
}

  triggerPublishFromMenu(): void {
    this.closeFloatingUi();
    this.publishStorefront();
  }

  openAccountSettings(): void {
    this.closeFloatingUi();
    void this.router.navigate(['/app/settings/profile']);
  }

  openMediaManager(): void {
    this.closeFloatingUi();
    this.isMediaManagerOpen.set(true);
  }

  closeMediaManager(): void {
    this.isMediaManagerOpen.set(false);
  }

  uploadMediaFromManager(files: FileList): void {
    const projectId = this.projectId();
    if (!projectId || !files.length || this.isMediaUploading()) {
      return;
    }

    const uploads = Array.from(files)
      .map((file) => ({ file, validation: this.uploadService.validateMedia(file) }))
      .filter(({ validation }) => validation.valid);

    const invalidUploads = Array.from(files).length - uploads.length;
    if (invalidUploads) {
      this.toastService.error('Some files were skipped because they are not supported image uploads.');
    }

    if (!uploads.length) {
      return;
    }

    this.isMediaUploading.set(true);
    forkJoin(uploads.map(({ file }) => this.uploadService.uploadProjectMedia(file, projectId)))
      .pipe(
        switchMap(() => this.projectService.getProjectMedia(projectId).pipe(catchError(() => of([])))),
        finalize(() => this.isMediaUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (projectMedia) => {
          this.mediaAssets.set(this.buildMediaManagerAssets(projectMedia, this.products()));
          this.toastService.success(`${uploads.length} media file${uploads.length === 1 ? '' : 's'} uploaded.`);
        },
        error: () => this.toastService.error('Unable to upload media right now.'),
      });
  }

  confirmMediaSelection(asset: StorefrontMediaManagerAsset): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    if (asset.origin === 'PEXELS') {
      this.isMediaUploading.set(true);
      this.uploadService
        .importProjectMedia(projectId, {
          sourceUrl: asset.url,
          fileName: asset.name,
        })
        .pipe(
          switchMap(() => this.projectService.getProjectMedia(projectId).pipe(catchError(() => of([])))),
          finalize(() => this.isMediaUploading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (projectMedia) => {
            this.mediaAssets.set(this.buildMediaManagerAssets(projectMedia, this.products()));
            this.toastService.success(`${asset.name} imported to Site files.`);
          },
          error: () => this.toastService.error('Unable to import this Pexels photo right now.'),
        });
      return;
    }

    this.toastService.success(`${asset.name} selected.`);
    this.closeMediaManager();
  }

  deleteMediaFromManager(asset: StorefrontMediaManagerAsset): void {
    const projectId = this.projectId();
    if (!projectId || asset.origin !== 'PROJECT') {
      return;
    }

    this.isMediaUploading.set(true);
    this.projectService
      .deleteMedia(projectId, asset.id)
      .pipe(
        switchMap(() => this.projectService.getProjectMedia(projectId).pipe(catchError(() => of([])))),
        finalize(() => this.isMediaUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (projectMedia) => {
          this.mediaAssets.set(this.buildMediaManagerAssets(projectMedia, this.products()));
          this.toastService.success(`${asset.name} removed from Site files.`);
        },
        error: () => this.toastService.error('Unable to remove this media asset right now.'),
      });
  }

  logout(): void {
    this.closeFloatingUi();
    this.authService.logout();
  }

  selectHomePage(): void {
    this.pageCardMenuId.set(null);
    this.isPagesPanelOpen.set(false);
  }

  updateStoreName(value: string): void {
    this.applyStorefrontMutation(
      (storefront) => ({ ...storefront, storeName: value }),
      { syncRail: false }
    );
  }

  updateSeoField(field: 'title' | 'description', value: string): void {
    this.applyStorefrontMutation(
      (storefront) => ({
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          seo: {
            ...storefront.draftHomepage.seo,
            [field]: value,
          },
        },
      }),
      { syncRail: false }
    );
  }

  toggleSelectedSectionEnabled(enabled: boolean): void {
    this.updateSelectedSection((section) => ({ ...section, enabled }));
  }

  moveSelectedSection(direction: 'up' | 'down'): void {
    const selectedSectionId = this.selectedSectionId();
    if (!selectedSectionId) {
      return;
    }

    this.applyStorefrontMutation((storefront) => {
      const sections = [...storefront.draftHomepage.sections];
      const currentIndex = sections.findIndex((section) => section.id === selectedSectionId);
      if (currentIndex < 0) {
        return storefront;
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= sections.length) {
        return storefront;
      }

      const [section] = sections.splice(currentIndex, 1);
      sections.splice(targetIndex, 0, section);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    }, { syncRail: true });
  }

  moveSection(sectionId: string, direction: 'up' | 'down'): void {
    this.selectedSectionId.set(sectionId);
    this.moveSelectedSection(direction);
    setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
  }

  startSectionDrag(event: DragEvent, sectionId: string): void {
    this.draggedSectionId.set(sectionId);
    this.selectedSectionId.set(sectionId);
    event.dataTransfer?.setData('text/plain', sectionId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  allowSectionDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  addSection(type: StorefrontSectionType, mode: SectionInsertMode = 'after-selected'): void {
    let insertedId: string | null = null;
    this.applyStorefrontMutation((storefront) => {
      const section = this.createSection(type);
      insertedId = section.id;
      const sections = [...storefront.draftHomepage.sections];
      const selectedSectionId = this.selectedSectionId();
      const selectedIndex = selectedSectionId
        ? sections.findIndex((item) => item.id === selectedSectionId)
        : -1;
      const insertAt =
        mode === 'after-selected' && selectedIndex >= 0 ? selectedIndex + 1 : sections.length;

      sections.splice(insertAt, 0, section);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    }, { selectedSectionId: insertedId, syncRail: true });
  }

  addSectionFromLibrary(type: StorefrontSectionType): void {
    const targetSectionId = this.sectionLibraryTargetId();
    if (targetSectionId) {
      this.selectedSectionId.set(targetSectionId);
    }

    this.addSection(type, 'after-selected');
    this.closeSectionLibrary();
  }

  dropSection(event: DragEvent, targetSectionId: string): void {
    event.preventDefault();
    const draggedSectionId =
      this.draggedSectionId() || event.dataTransfer?.getData('text/plain') || null;
    this.draggedSectionId.set(null);

    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      return;
    }

    this.applyStorefrontMutation((storefront) => {
      const sections = [...storefront.draftHomepage.sections];
      const draggedIndex = sections.findIndex((section) => section.id === draggedSectionId);
      const targetIndex = sections.findIndex((section) => section.id === targetSectionId);
      if (draggedIndex < 0 || targetIndex < 0) {
        return storefront;
      }

      const [draggedSection] = sections.splice(draggedIndex, 1);
      const nextTargetIndex = sections.findIndex((section) => section.id === targetSectionId);
      sections.splice(nextTargetIndex, 0, draggedSection);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    }, { selectedSectionId: draggedSectionId, syncRail: true });
  }

  duplicateSection(sectionId: string): void {
    let duplicateId: string | null = null;
    this.applyStorefrontMutation((storefront) => {
      const sections = [...storefront.draftHomepage.sections];
      const index = sections.findIndex((section) => section.id === sectionId);
      if (index < 0) {
        return storefront;
      }

      const duplicate = {
        ...JSON.parse(JSON.stringify(sections[index])),
        id: this.createSectionId(sections[index].type),
      } as StorefrontHomepageSection;
      duplicateId = duplicate.id;

      sections.splice(index + 1, 0, duplicate);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    }, { selectedSectionId: duplicateId, syncRail: true });
  }

  copySection(sectionId: string): void {
    const section = this.sections().find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    this.sectionClipboard.set(this.cloneSection(section));
  }

  cutSection(sectionId: string): void {
    const section = this.sections().find((item) => item.id === sectionId);
    if (!section || this.sections().length <= 1) {
      return;
    }

    this.sectionClipboard.set(this.cloneSection(section));
    this.removeSection(sectionId);
  }

  canPasteSection(): boolean {
    return this.sectionClipboard() !== null;
  }

  pasteSection(sectionId: string): void {
    const clipboardSection = this.sectionClipboard();
    if (!clipboardSection) {
      return;
    }

    let pastedId: string | null = null;
    this.applyStorefrontMutation((storefront) => {
      const sections = [...storefront.draftHomepage.sections];
      const targetIndex = sections.findIndex((section) => section.id === sectionId);
      if (targetIndex < 0) {
        return storefront;
      }

      const pastedSection = this.cloneSection(clipboardSection);
      pastedSection.id = this.createSectionId(pastedSection.type);
      pastedId = pastedSection.id;
      sections.splice(targetIndex + 1, 0, pastedSection);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    }, { selectedSectionId: pastedId, syncRail: true });
  }

  removeSection(sectionId: string): void {
    const nextSelected: string | null = null;
    this.applyStorefrontMutation((storefront) => {
      const sections = storefront.draftHomepage.sections;
      if (sections.length <= 1) {
        return storefront;
      }

      const index = sections.findIndex((section) => section.id === sectionId);
      if (index < 0) {
        return storefront;
      }

      const nextSections = sections.filter((section) => section.id !== sectionId);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: nextSections,
        },
      };
    }, { selectedSectionId: nextSelected, syncRail: true });
  }

  toggleSectionEnabled(sectionId: string): void {
    this.applyStorefrontMutation((storefront) => ({
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: storefront.draftHomepage.sections.map((section) =>
            section.id === sectionId ? { ...section, enabled: !section.enabled } : section
          ),
        },
      }),
      { syncRail: true }
    );
  }

  canMoveSection(sectionId: string, direction: 'up' | 'down'): boolean {
    const index = this.sections().findIndex((section) => section.id === sectionId);
    if (index < 0) {
      return false;
    }

    return direction === 'up' ? index > 0 : index < this.sections().length - 1;
  }

  canRemoveSection(): boolean {
    return this.sections().length > 1;
  }

  updateSelectedStringProp(key: string, value: string): void {
    this.updateSelectedSection((section) => ({
      ...section,
      props: {
        ...section.props,
        [key]: value,
      },
    }));
  }

  updateSelectedNumberProp(key: string, value: string): void {
    const parsed = Number(value);
    this.updateSelectedSection((section) => ({
      ...section,
      props: {
        ...section.props,
        [key]: Number.isFinite(parsed) ? parsed : 0,
      },
    }));
  }

  toggleFeaturedProduct(productId: number, selected: boolean): void {
    this.updateSelectedSection((section) => {
      const currentProductIds = this.readNumberArrayProp(section, 'productIds');
      const nextProductIds = selected
        ? Array.from(new Set([...currentProductIds, productId]))
        : currentProductIds.filter((id) => id !== productId);

      return {
        ...section,
        props: {
          ...section.props,
          productIds: nextProductIds,
        },
      };
    });
  }

  isFeaturedProductSelected(productId: number): boolean {
    const section = this.selectedSection();
    return section ? this.readNumberArrayProp(section, 'productIds').includes(productId) : false;
  }

  undo(): void {
    const history = this.undoStack();
    const storefront = this.workingStorefront();
    if (!history.length || !storefront) {
      return;
    }

    const previous = history[history.length - 1];
    const current = this.createEditorSnapshot(storefront, this.selectedSectionId());
    this.undoStack.set(history.slice(0, -1));
    this.redoStack.update((stack) => [...stack, current].slice(-ProjectStorefrontEditor.HISTORY_LIMIT));
    this.applyEditorSnapshot(previous);
    this.scheduleAutosave();
  }

  redo(): void {
    const history = this.redoStack();
    const storefront = this.workingStorefront();
    if (!history.length || !storefront) {
      return;
    }

    const next = history[history.length - 1];
    const current = this.createEditorSnapshot(storefront, this.selectedSectionId());
    this.redoStack.set(history.slice(0, -1));
    this.undoStack.update((stack) => [...stack, current].slice(-ProjectStorefrontEditor.HISTORY_LIMIT));
    this.applyEditorSnapshot(next);
    this.scheduleAutosave();
  }

  saveDraft(): void {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.persistCurrentState({ reconcileEditor: false })
      .pipe(finalize(() => this.isSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Storefront draft saved.');
        },
        error: () => this.toastService.error('Unable to save the storefront draft right now.'),
      });
  }

  publishStorefront(): void {
    const projectId = this.projectId();
    if (!projectId || this.isPublishing()) {
      return;
    }

    this.isPublishing.set(true);
    this.persistCurrentState({ reconcileEditor: false })
      .pipe(
        switchMap(() => this.projectStorefrontService.publishStorefront(projectId)),
        finalize(() => this.isPublishing.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          const snapshot = this.normalizeStorefront(response.storefront);
          this.applyPersistedStorefront(snapshot, { resetHistory: true });
          this.toastService.success(`Storefront published on ${this.previewDomain()}.`);
        },
        error: () => this.toastService.error('Unable to publish the storefront right now.'),
      });
  }

  unpublishStorefront(): void {
    const projectId = this.projectId();
    if (!projectId || this.isUnpublishing()) {
      return;
    }

    this.isUnpublishing.set(true);
    this.projectStorefrontService
      .unpublishStorefront(projectId)
      .pipe(finalize(() => this.isUnpublishing.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (storefront) => {
          const snapshot = this.normalizeStorefront(storefront);
          this.applyPersistedStorefront(snapshot, { resetHistory: false });
          this.toastService.success('Storefront unpublished.');
        },
        error: () => this.toastService.error('Unable to unpublish the storefront right now.'),
      });
  }

  sectionLabel(section: StorefrontHomepageSection): string {
    switch (section.type) {
      case 'announcement-bar':
        return 'Announcement Bar';
      case 'featured-products':
        return 'Featured Products';
      case 'footer':
        return 'Footer';
      default:
        return 'Hero';
    }
  }

  sectionDescription(section: StorefrontHomepageSection): string {
    switch (section.type) {
      case 'announcement-bar':
        return this.readStringProp(section, 'text');
      case 'featured-products': {
        const count = this.readNumberArrayProp(section, 'productIds').length;
        return `${count} selected product${count === 1 ? '' : 's'}`;
      }
      case 'footer':
        return this.readStringProp(section, 'brandText');
      default:
        return this.readStringProp(section, 'title');
    }
  }

  readSectionComponents(section: StorefrontHomepageSection | null): StorefrontEditorComponentNode[] {
    const value = (section?.props as Record<string, unknown> | undefined)?.[
      ProjectStorefrontEditor.SECTION_COMPONENTS_PROP_KEY
    ];

    return Array.isArray(value)
      ? (JSON.parse(JSON.stringify(value)) as StorefrontEditorComponentNode[])
      : [];
  }

  readStringProp(section: StorefrontHomepageSection | null, key: string): string {
    const value = (section?.props as Record<string, unknown> | undefined)?.[key];
    return typeof value === 'string' ? value : '';
  }

  readNumberProp(section: StorefrontHomepageSection | null, key: string, fallback = 0): number {
    const value = (section?.props as Record<string, unknown> | undefined)?.[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  readNumberArrayProp(section: StorefrontHomepageSection | null, key: string): number[] {
    const value = (section?.props as Record<string, unknown> | undefined)?.[key];
    return Array.isArray(value)
      ? value.filter((item: unknown): item is number => typeof item === 'number')
      : [];
  }

  componentPreviewStyle(component: StorefrontEditorComponentNode): Record<string, string> {
    return {
      left: `${component.frame.x}px`,
      top: `${component.frame.y}px`,
      width: `${component.frame.width}px`,
      height: `${component.frame.height}px`,
    };
  }

  trackSection = (_: number, section: StorefrontHomepageSection): string => section.id;
  trackProduct = (_: number, product: ProjectCatalogProduct): number => product.id;

  sectionPreviewHeight(section: StorefrontHomepageSection): number | null {
    const height = this.readNumberProp(section, ProjectStorefrontEditor.SECTION_HEIGHT_PROP_KEY, 0);
    return height > 0 ? height : null;
  }

  componentTypeLabel(component: StorefrontEditorComponentNode): string {
    switch (component.type) {
      case 'heading':
        return 'Heading';
      case 'paragraph':
        return 'Text';
      case 'image':
        return 'Image';
      case 'button':
        return 'Button';
      case 'container':
        return 'Container';
      case 'graphic':
        return 'Graphic';
      case 'product-feed':
        return 'Product Feed';
      case 'blog-feed':
        return 'Blog Feed';
      default:
        return 'Component';
    }
  }

  componentDisplayName(component: StorefrontEditorComponentNode): string {
    return component.name || 'Untitled';
  }

  roundedComponentWidth(component: StorefrontEditorComponentNode): number {
    return Math.max(0, Math.round(component.frame.width));
  }

  roundedComponentHeight(component: StorefrontEditorComponentNode): number {
    return Math.max(0, Math.round(component.frame.height));
  }

  isComponentRotationFlipped(rotation: number): boolean {
    const normalized = ((rotation % 360) + 360) % 360;
    return normalized > 110 && normalized < 290;
  }

  sectionTypeIcon(type: StorefrontSectionType): 'layout-grid' | 'package' | 'settings' {
    switch (type) {
      case 'featured-products':
        return 'package';
      case 'footer':
        return 'settings';
      default:
        return 'layout-grid';
    }
  }

  sectionLibraryDescription(type: StorefrontSectionType): string {
    switch (type) {
      case 'announcement-bar':
        return 'Highlight a quick message, notice, or promo banner.';
      case 'hero':
        return 'Lead with a headline, supporting copy, and primary actions.';
      case 'featured-products':
        return 'Feature selected catalog products in a curated section.';
      case 'footer':
        return 'Add brand details and contact information at the bottom.';
    }
  }

  sectionLibraryTypeLabel(type: StorefrontSectionType): string {
    switch (type) {
      case 'announcement-bar':
        return 'Announcement';
      case 'featured-products':
        return 'Products';
      case 'footer':
        return 'Footer';
      default:
        return 'Welcome';
    }
  }

  private updateSelectedSection(
    updater: (section: StorefrontHomepageSection) => StorefrontHomepageSection
  ): void {
    const selectedSectionId = this.selectedSectionId();
    if (!selectedSectionId) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: storefront.draftHomepage.sections.map((section) =>
            section.id === selectedSectionId ? updater(section) : section
          ),
        },
      }),
      { syncRail: true }
    );
  }

  private cloneStorefront(storefront: ProjectStorefront): ProjectStorefront {
    return JSON.parse(JSON.stringify(storefront)) as ProjectStorefront;
  }

  private cloneSection(section: StorefrontHomepageSection): StorefrontHomepageSection {
    return JSON.parse(JSON.stringify(section)) as StorefrontHomepageSection;
  }

  private writeSectionComponents(
    section: StorefrontHomepageSection,
    components: StorefrontEditorComponentNode[]
  ): StorefrontHomepageSection {
    return {
      ...section,
      props: {
        ...section.props,
        [ProjectStorefrontEditor.SECTION_COMPONENTS_PROP_KEY]: components,
      },
    };
  }

  private updateSectionComponentFrame(
    sectionId: string,
    componentId: string,
    nextX: number,
    nextY: number,
    containerWidth: number,
    containerHeight: number,
    maxVisibleHeight = containerHeight
  ): void {
    this.updateSectionComponentFrames(
      sectionId,
      [{ componentId, x: nextX, y: nextY }],
      containerWidth,
      containerHeight,
      maxVisibleHeight
    );
  }

  private updateSectionComponentFrames(
    sectionId: string,
    positions: Array<{ componentId: string; x: number; y: number }>,
    containerWidth: number,
    containerHeight: number,
    maxVisibleHeight = containerHeight
  ): void {
    const positionsById = new Map(positions.map((position) => [position.componentId, position]));
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          const components = this.readSectionComponents(section).map((component) => {
            const nextPosition = positionsById.get(component.id);
            if (!nextPosition) {
              return component;
            }

            const minX = -component.frame.width + 20;
            const minY = -component.frame.height + 20;
            const maxX = containerWidth - 20;
            const maxY = maxVisibleHeight - 20;
            return {
              ...component,
              frame: {
                ...component.frame,
                x: Math.max(minX, Math.min(nextPosition.x, maxX)),
                y: Math.max(minY, Math.min(nextPosition.y, maxY)),
              },
            };
          });

          return this.writeSectionComponents(section, components);
        }),
      },
    }), { syncRail: false });
  }

  private updateComponentSelectionBox(event: MouseEvent): void {
    if (!this.activeSelectionDrag) {
      return;
    }

    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${this.activeSelectionDrag.sectionId}"]`
    );
    if (!(container instanceof HTMLElement)) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
    const width = currentX - this.activeSelectionDrag.startX;
    const height = currentY - this.activeSelectionDrag.startY;
    const nextBox = {
      x: width < 0 ? currentX : this.activeSelectionDrag.startX,
      y: height < 0 ? currentY : this.activeSelectionDrag.startY,
      width: Math.abs(width),
      height: Math.abs(height),
    };

    this.selectionBox.set(nextBox);
    const section = this.sections().find((item) => item.id === this.activeSelectionDrag?.sectionId) ?? null;
    const selectedIds = section
      ? this.readSectionComponents(section)
          .filter((component) => this.isComponentInsideSelectionBox(component, nextBox))
          .map((component) => component.id)
      : [];

    this.selectedComponentIds.set(selectedIds);
    this.selectedComponentId.set(selectedIds[selectedIds.length - 1] ?? null);
  }

  private finishComponentSelectionBox(): void {
      if (!this.activeSelectionDrag) {
        return;
      }

      const finishedBox = this.selectionBox();
      const wasDragging = finishedBox.width > 5 || finishedBox.height > 5;
      const hasSelection = this.selectedComponentIds().length > 0;
      this.activeSelectionDrag = null;
      this.isSelectingComponents.set(false);
      this.selectionBoxSectionId.set(null);
      this.selectionBox.set({ x: 0, y: 0, width: 0, height: 0 });
      this.justFinishedComponentSelectionBox = wasDragging && hasSelection;
    }

  private isComponentInsideSelectionBox(
    component: StorefrontEditorComponentNode,
    box: ComponentSelectionBox
  ): boolean {
    const componentRight = component.frame.x + component.frame.width;
    const componentBottom = component.frame.y + component.frame.height;
    const boxRight = box.x + box.width;
    const boxBottom = box.y + box.height;

    return !(
      componentRight < box.x ||
      component.frame.x > boxRight ||
      componentBottom < box.y ||
      component.frame.y > boxBottom
    );
  }

  private getDraggedComponentsBounds(
    components: Array<{ startX: number; startY: number; width: number; height: number }>
  ): { x: number; y: number; width: number; height: number } {
    const left = Math.min(...components.map((component) => component.startX));
    const top = Math.min(...components.map((component) => component.startY));
    const right = Math.max(...components.map((component) => component.startX + component.width));
    const bottom = Math.max(...components.map((component) => component.startY + component.height));

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    };
  }

  private reorderSelectedComponentDepth(direction: 'front' | 'back'): void {
    const section = this.selectedSection();
    const selectedIds = new Set(this.selectedComponentIds());
    if (!section || !selectedIds.size) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          const components = this.readSectionComponents(item);
          const selected = components.filter((component) => selectedIds.has(component.id));
          const rest = components.filter((component) => !selectedIds.has(component.id));
          const ordered = direction === 'front' ? [...rest, ...selected] : [...selected, ...rest];
          return this.writeSectionComponents(
            item,
            ordered.map((component, index) => ({
              ...component,
              zIndex: index + 1,
            }))
          );
        }),
      },
    }), { syncRail: false });

    this.closeComponentContextMenu();
  }

  private stepSelectedComponentDepth(direction: 'forward' | 'backward'): void {
    const section = this.selectedSection();
    const selectedIds = new Set(this.selectedComponentIds());
    if (!section || !selectedIds.size) {
      return;
    }

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((item) => {
          if (item.id !== section.id) {
            return item;
          }

          const components = [...this.readSectionComponents(item)].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
          if (direction === 'forward') {
            for (let index = components.length - 2; index >= 0; index -= 1) {
              const current = components[index];
              const next = components[index + 1];
              if (selectedIds.has(current.id) && !selectedIds.has(next.id)) {
                components[index] = next;
                components[index + 1] = current;
              }
            }
          } else {
            for (let index = 1; index < components.length; index += 1) {
              const current = components[index];
              const previous = components[index - 1];
              if (selectedIds.has(current.id) && !selectedIds.has(previous.id)) {
                components[index] = previous;
                components[index - 1] = current;
              }
            }
          }

          return this.writeSectionComponents(
            item,
            components.map((component, index) => ({ ...component, zIndex: index + 1 }))
          );
        }),
      },
    }), { syncRail: false });

    this.closeComponentContextMenu();
  }

  private updateResizingComponent(event: MouseEvent): void {
    if (!this.activeResize) {
      return;
    }

    const deltaX = event.clientX - this.activeResize.startX;
    const deltaY = event.clientY - this.activeResize.startY;
    const startFrame = this.activeResize.startFrame;
    const localDelta = this.rotateVectorToLocal(deltaX, deltaY, this.activeResize.startRotation);
    const halfWidth = startFrame.width / 2;
    const halfHeight = startFrame.height / 2;
    let left = -halfWidth;
    let right = halfWidth;
    let top = -halfHeight;
    let bottom = halfHeight;

    if (this.activeResize.handle.includes('e')) {
      right += localDelta.x;
    }
    if (this.activeResize.handle.includes('w')) {
      left += localDelta.x;
    }
    if (this.activeResize.handle.includes('s')) {
      bottom += localDelta.y;
    }
    if (this.activeResize.handle.includes('n')) {
      top += localDelta.y;
    }

    const minSize = 50;
    if (right - left < minSize) {
      if (this.activeResize.handle.includes('w') && !this.activeResize.handle.includes('e')) {
        left = right - minSize;
      } else {
        right = left + minSize;
      }
    }
    if (bottom - top < minSize) {
      if (this.activeResize.handle.includes('n') && !this.activeResize.handle.includes('s')) {
        top = bottom - minSize;
      } else {
        bottom = top + minSize;
      }
    }

    const localCenterOffset = {
      x: (left + right) / 2,
      y: (top + bottom) / 2,
    };
    const worldCenterOffset = this.rotateVectorToWorld(
      localCenterOffset.x,
      localCenterOffset.y,
      this.activeResize.startRotation
    );
    const startCenterX = startFrame.x + startFrame.width / 2;
    const startCenterY = startFrame.y + startFrame.height / 2;
    const nextWidth = right - left;
    const nextHeight = bottom - top;
    const nextCenterX = startCenterX + worldCenterOffset.x;
    const nextCenterY = startCenterY + worldCenterOffset.y;
    const nextFrame = {
      x: nextCenterX - nextWidth / 2,
      y: nextCenterY - nextHeight / 2,
      width: nextWidth,
      height: nextHeight,
    };

    this.updateSectionComponentTransform(this.activeResize.sectionId, this.activeResize.componentId, {
      frame: nextFrame,
    });
  }

  private updateRotatingComponent(event: MouseEvent): void {
    if (!this.activeRotation) {
      return;
    }

    const currentAngle = Math.atan2(
      event.clientY - this.activeRotation.centerY,
      event.clientX - this.activeRotation.centerX
    ) * (180 / Math.PI);

    let frameDelta = currentAngle - this.activeRotation.previousAngle;
    if (frameDelta > 180) {
      frameDelta -= 360;
    }
    if (frameDelta < -180) {
      frameDelta += 360;
    }

    this.activeRotation.accumulatedAngle += frameDelta;
    this.activeRotation.previousAngle = currentAngle;
    const nextRotation = this.normalizeComponentRotation(
      this.activeRotation.startRotation + this.activeRotation.accumulatedAngle
    );

    this.updateSectionComponentTransform(this.activeRotation.sectionId, this.activeRotation.componentId, {
      rotation: nextRotation,
    });
  }

  private updateSectionComponentTransform(
    sectionId: string,
    componentId: string,
    patch: Partial<Pick<StorefrontEditorComponentNode, 'rotation' | 'frame'>>
  ): void {
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          return this.writeSectionComponents(
            section,
            this.readSectionComponents(section).map((component) =>
              component.id === componentId
                ? {
                    ...component,
                    ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
                    ...(patch.frame ? { frame: patch.frame } : {}),
                  }
                : component
            )
          );
        }),
      },
    }), { syncRail: false });
  }

  private normalizeComponentRotation(angle: number): number {
    let next = angle % 360;
    if (next === 360 || next === -360) {
      next = 0;
    }
    return next;
  }

  private rotateVectorToLocal(deltaX: number, deltaY: number, rotation: number): { x: number; y: number } {
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
      x: deltaX * cos + deltaY * sin,
      y: -deltaX * sin + deltaY * cos,
    };
  }

  private rotateVectorToWorld(deltaX: number, deltaY: number, rotation: number): { x: number; y: number } {
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
      x: deltaX * cos - deltaY * sin,
      y: deltaX * sin + deltaY * cos,
    };
  }

  private nudgeSelectedComponents(deltaX: number, deltaY: number): void {
    const section = this.selectedSection();
    const selectedIds = new Set(this.selectedComponentIds());
    if (!section || !selectedIds.size) {
      return;
    }

    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${section.id}"]`
    );
    const containerWidth = container instanceof HTMLElement ? container.clientWidth : 99999;
    const containerHeight = container instanceof HTMLElement ? container.clientHeight : 99999;

    this.updateSectionComponents(section.id, (components) =>
      components.map((component) => {
        if (!selectedIds.has(component.id)) {
          return component;
        }

        const maxX = Math.max(0, containerWidth - component.frame.width);
        const maxY = Math.max(0, containerHeight - component.frame.height);
        return {
          ...component,
          frame: {
            ...component.frame,
            x: Math.max(0, Math.min(component.frame.x + deltaX, maxX)),
            y: Math.max(0, Math.min(component.frame.y + deltaY, maxY)),
          },
        };
      })
    );
  }

  private canEditComponentText(component: StorefrontEditorComponentNode): boolean {
    return component.type === 'heading' || component.type === 'paragraph' || component.type === 'button';
  }

  private readEditableComponentText(component: StorefrontEditorComponentNode): string {
    switch (component.type) {
      case 'heading':
        return component.props.text;
      case 'paragraph':
        return component.props.text;
      case 'button':
        return component.props.label;
      default:
        return '';
    }
  }

  private writeEditableComponentText(
    component: StorefrontEditorComponentNode,
    value: string
  ): StorefrontEditorComponentNode {
    switch (component.type) {
      case 'heading':
        return { ...component, props: { ...component.props, text: value } };
      case 'paragraph':
        return { ...component, props: { ...component.props, text: value } };
      case 'button':
        return { ...component, props: { ...component.props, label: value } };
      default:
        return component;
    }
  }

  private updateComponentNode(
    sectionId: string,
    componentId: string,
    updater: (component: StorefrontEditorComponentNode) => StorefrontEditorComponentNode
  ): void {
    this.updateSectionComponents(sectionId, (components) =>
      components.map((component) => (component.id === componentId ? updater(component) : component))
    );
  }

  private updateSectionComponents(
    sectionId: string,
    updater: (components: StorefrontEditorComponentNode[]) => StorefrontEditorComponentNode[],
    options: { selectedSectionId?: string | null; syncRail?: boolean } = {}
  ): void {
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) =>
          section.id === sectionId ? this.writeSectionComponents(section, updater(this.readSectionComponents(section))) : section
        ),
      },
    }), options);
  }

  private insertComponentIntoSection(
    sectionId: string,
    component: StorefrontEditorComponentNode,
    options: { selectedSectionId?: string | null; syncRail?: boolean } = {}
  ): void {
    this.updateSectionComponents(sectionId, (components) => [...components, component], options);
    this.selectedComponentId.set(component.id);
    this.selectedComponentIds.set([component.id]);
    this.isolatedGroupComponentId.set(null);
  }

  private buildLibraryComponentForSection(
    item: StorefrontEditorAddElementsLibraryItem,
    sectionId: string,
    frameOverride?: StorefrontEditorComponentNode['frame']
  ): StorefrontEditorComponentNode {
    const section = this.sections().find((candidate) => candidate.id === sectionId) ?? null;
    const nextComponent = createStorefrontEditorComponentNode(item.componentType);
    const maxZIndex = section
      ? this.readSectionComponents(section).reduce((max, component) => Math.max(max, component.zIndex ?? 1), 0)
      : 0;
    nextComponent.zIndex = maxZIndex + 1;
    if (frameOverride) {
      nextComponent.frame = frameOverride;
    }
    return nextComponent;
  }

  private getDropFrameFromEvent(
    sectionId: string,
    componentType: StorefrontEditorAddElementsLibraryItem['componentType'],
    event: DragEvent
  ): StorefrontEditorComponentNode['frame'] | undefined {
    return this.getDropFrameFromClientPoint(sectionId, componentType, event.clientX, event.clientY);
  }

  private getDropFrameFromClientPoint(
    sectionId: string,
    componentType: StorefrontEditorAddElementsLibraryItem['componentType'],
    clientX: number,
    clientY: number
  ): StorefrontEditorComponentNode['frame'] | undefined {
    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${sectionId}"]`
    );
    if (!(container instanceof HTMLElement)) {
      return undefined;
    }

      const next = createStorefrontEditorComponentNode(componentType);
      const rect = container.getBoundingClientRect();
      const previewVisibleHeight = this.getPreviewVisibleHeightForSection(container);
      const x = clientX - rect.left - next.frame.width / 2;
      const y = clientY - rect.top - next.frame.height / 2;
      return {
        ...next.frame,
        x: Math.max(-next.frame.width + 20, Math.min(x, rect.width - 20)),
        y: Math.max(-next.frame.height + 20, Math.min(y, previewVisibleHeight - 20)),
      };
  }

  private getPreviewVisibleHeightForSection(container: HTMLElement): number {
    const previewCanvas = container.closest('.storefront-editor__preview-canvas');
    if (!(previewCanvas instanceof HTMLElement)) {
      return container.getBoundingClientRect().height;
    }

    const previewRect = previewCanvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const containerTopWithinPreview = containerRect.top - previewRect.top;
    return Math.max(containerRect.height, previewCanvas.scrollHeight - containerTopWithinPreview);
  }

  private updateAddElementsComponentDrag(event: MouseEvent): void {
    if (!this.activeAddElementsComponentDrag) {
      return;
    }

    const nextLeft = event.clientX - this.activeAddElementsComponentDrag.pointerOffsetX;
    const nextTop = event.clientY - this.activeAddElementsComponentDrag.pointerOffsetY;
    this.draggedAddElementsPreviewPosition.set({
      left: nextLeft,
      top: nextTop,
      width: this.activeAddElementsComponentDrag.width,
      height: this.activeAddElementsComponentDrag.height,
    });

    const hoveredSection = this.getSectionContentElementAtPoint(event.clientX, event.clientY);
    this.componentAttachSectionId.set(hoveredSection?.dataset['sectionContentId'] ?? null);
  }

  private finishAddElementsComponentDrag(event: MouseEvent): void {
    const activeDrag = this.activeAddElementsComponentDrag;
    if (!activeDrag) {
      return;
    }

    const targetSection =
      this.componentAttachSectionId() ??
      this.getSectionContentElementAtPoint(event.clientX, event.clientY)?.dataset['sectionContentId'] ??
      null;
    const item = this.addElementsLibraryItems.find((candidate) => candidate.id === activeDrag.itemId) ?? null;

    if (targetSection && item) {
      const nextComponent = this.buildLibraryComponentForSection(
        item,
        targetSection,
        this.getDropFrameFromClientPoint(targetSection, item.componentType, event.clientX, event.clientY)
      );
      this.insertComponentIntoSection(targetSection, nextComponent, { selectedSectionId: targetSection, syncRail: true });
    }

    this.endAddElementsComponentDrag();
  }

  private getSectionContentElementAtPoint(clientX: number, clientY: number): HTMLElement | null {
    const target = document.elementFromPoint(clientX, clientY);
    return target instanceof HTMLElement
      ? (target.closest('.storefront-editor__preview-section-content') as HTMLElement | null)
      : null;
  }

  private getSectionContentElementForDraggedBounds(
    draggedRect: { left: number; top: number; width: number; height: number },
    fallbackSectionId: string
  ): HTMLElement | null {
    const containers = Array.from(
      document.querySelectorAll('.storefront-editor__preview-section-content[data-section-content-id]')
    ).filter((element): element is HTMLElement => element instanceof HTMLElement);

    if (!containers.length) {
      return null;
    }

    const draggedRight = draggedRect.left + draggedRect.width;
    const draggedBottom = draggedRect.top + draggedRect.height;
    const draggedArea = Math.max(1, draggedRect.width * draggedRect.height);
    const draggedCenterX = draggedRect.left + draggedRect.width / 2;
    const draggedCenterY = draggedRect.top + draggedRect.height / 2;

    const bestMatch = containers
      .map((container) => {
        const rect = container.getBoundingClientRect();
        const overlapWidth = Math.max(0, Math.min(draggedRight, rect.right) - Math.max(draggedRect.left, rect.left));
        const overlapHeight = Math.max(0, Math.min(draggedBottom, rect.bottom) - Math.max(draggedRect.top, rect.top));
        const overlapArea = overlapWidth * overlapHeight;
        const overlapRatio = overlapArea / draggedArea;
        const centerInside =
          draggedCenterX >= rect.left &&
          draggedCenterX <= rect.right &&
          draggedCenterY >= rect.top &&
          draggedCenterY <= rect.bottom;

        return { container, centerInside, overlapRatio };
      })
      .filter((candidate) => candidate.centerInside || candidate.overlapRatio >= 0.5)
      .sort((left, right) => {
        if (left.centerInside !== right.centerInside) {
          return left.centerInside ? -1 : 1;
        }
        return right.overlapRatio - left.overlapRatio;
      })[0];

    if (bestMatch) {
      return bestMatch.container;
    }

    return (
      containers.find((container) => container.dataset['sectionContentId'] === fallbackSectionId) ??
      null
    );
  }

  private moveDraggedComponentsToSection(sourceSectionId: string, targetSectionId: string): void {
    if (!this.activeComponentDrag || sourceSectionId === targetSectionId) {
      return;
    }

    const draggedIds = new Set(this.activeComponentDrag.components.map((component) => component.componentId));

    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: (() => {
          const sourceSection = storefront.draftHomepage.sections.find((section) => section.id === sourceSectionId);
          const targetSection = storefront.draftHomepage.sections.find((section) => section.id === targetSectionId);
          if (!sourceSection || !targetSection) {
            return storefront.draftHomepage.sections;
          }

          const sourceComponents = this.readSectionComponents(sourceSection);
          const movedComponents = sourceComponents.filter((component) => draggedIds.has(component.id));
          const targetComponents = this.readSectionComponents(targetSection);
          const baseZIndex = targetComponents.reduce((max, component) => Math.max(max, component.zIndex ?? 1), 0);
          const movedWithZ = movedComponents.map((component, index) => ({
            ...component,
            zIndex: baseZIndex + index + 1,
          }));

          return storefront.draftHomepage.sections.map((section) => {
          if (section.id === sourceSectionId) {
            return this.writeSectionComponents(
              section,
              sourceComponents.filter((component) => !draggedIds.has(component.id))
            );
          }

          if (section.id === targetSectionId) {
            return this.writeSectionComponents(section, [...targetComponents, ...movedWithZ]);
          }

          return section;
          });
        })(),
      },
  }), { selectedSectionId: targetSectionId, syncRail: true });

    this.selectedSectionId.set(targetSectionId);
    setTimeout(() => {
      const targetShell = document.querySelector(
        `.storefront-editor__preview-section-shell[data-section-id="${targetSectionId}"]`
      ) as HTMLElement | null;
      this.syncSelectedSectionRailPosition(targetShell);
    }, 0);
  }

  private updateResizingSection(event: MouseEvent): void {
    if (!this.activeSectionResize) {
      return;
    }

    const nextHeight = Math.max(24, Math.round(this.activeSectionResize.startHeight + (event.clientY - this.activeSectionResize.startY)));
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) =>
          section.id === this.activeSectionResize!.sectionId
            ? {
                ...section,
                props: {
                  ...section.props,
                  [ProjectStorefrontEditor.SECTION_HEIGHT_PROP_KEY]: nextHeight,
                },
              }
            : section
        ),
      },
    }), { selectedSectionId: this.activeSectionResize.sectionId, syncRail: true });
  }

  private createDefaultEditorSession(): StorefrontEditorSession {
    return {
      selectedSectionId: null,
      viewport: 'desktop',
      zoomPercent: 120,
      undoStack: [],
      redoStack: [],
    };
  }

  private normalizeEditorSession(session: StorefrontEditorSession | null | undefined): StorefrontEditorSession {
    return {
      selectedSectionId: null,
      viewport: session?.viewport === 'mobile' ? 'mobile' : 'desktop',
      zoomPercent: this.clampZoom(session?.zoomPercent),
      undoStack: [],
      redoStack: [],
    };
  }

  private buildPersistedEditorSession(): StorefrontEditorSession {
    return {
      selectedSectionId: null,
      viewport: this.viewport(),
      zoomPercent: this.clampZoom(this.zoomPercent()),
      undoStack: [],
      redoStack: [],
    };
  }

  private createEditorSnapshot(
    storefront: ProjectStorefront,
    selectedSectionId: string | null
  ): StorefrontEditorSnapshot {
    return {
      storeName: storefront.storeName,
      themeKey: storefront.themeKey,
      activePageKey: storefront.activePageKey,
      draftHomepage: JSON.parse(JSON.stringify(storefront.draftHomepage)) as ProjectStorefront['draftHomepage'],
      selectedSectionId,
    };
  }

  private applyEditorSnapshot(snapshot: StorefrontEditorSnapshot): void {
    const storefront = this.workingStorefront();
    if (!storefront) {
      return;
    }

    this.workingStorefront.set({
      ...storefront,
      storeName: snapshot.storeName,
      themeKey: snapshot.themeKey,
      activePageKey: snapshot.activePageKey,
      draftHomepage: JSON.parse(JSON.stringify(snapshot.draftHomepage)) as ProjectStorefront['draftHomepage'],
    });
      this.selectedSectionId.set(snapshot.selectedSectionId);
      this.selectedComponentId.set(null);
      this.selectedComponentIds.set([]);
      this.isolatedGroupComponentId.set(null);
      this.syncEditorSessionState({ selectedSectionId: snapshot.selectedSectionId }, false);
    setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
  }

  private pushUndoSnapshot(snapshot: StorefrontEditorSnapshot): void {
    this.undoStack.update((stack) => [...stack, snapshot].slice(-ProjectStorefrontEditor.HISTORY_LIMIT));
    this.redoStack.set([]);
  }

  private applyStorefrontMutation(
    mutator: (storefront: ProjectStorefront) => ProjectStorefront,
    options: { selectedSectionId?: string | null; syncRail?: boolean } = {}
  ): void {
    const current = this.workingStorefront();
    if (!current) {
      return;
    }

    const beforeSnapshot = this.createEditorSnapshot(current, this.selectedSectionId());
    const next = mutator(this.cloneStorefront(current));
    const nextSelectedSectionId =
      options.selectedSectionId !== undefined ? options.selectedSectionId : this.selectedSectionId();

    if (
      JSON.stringify(this.createEditorSnapshot(next, nextSelectedSectionId)) ===
      JSON.stringify(beforeSnapshot)
    ) {
      return;
    }

    this.pushUndoSnapshot(beforeSnapshot);
    this.workingStorefront.set(next);
    if (options.selectedSectionId !== undefined) {
      this.selectedSectionId.set(options.selectedSectionId);
    }
    this.syncEditorSessionState({ selectedSectionId: this.selectedSectionId() }, false);
    this.scheduleAutosave();

    if (options.syncRail) {
      setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
    }
  }

  private syncEditorSessionState(
    patch: Partial<Pick<StorefrontEditorSession, 'selectedSectionId' | 'viewport' | 'zoomPercent'>>,
    scheduleAutosave = true
  ): void {
    this.editorSession.update((session) => ({
      ...session,
      ...patch,
    }));

    if (scheduleAutosave) {
      this.scheduleAutosave();
    }
  }

  private scheduleAutosave(): void {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }

    this.autosaveTimer = setTimeout(() => {
      this.persistCurrentState({ reconcileEditor: false }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        error: () => this.toastService.error('Autosave failed.'),
      });
    }, ProjectStorefrontEditor.AUTOSAVE_DELAY_MS);
  }

  private persistCurrentState(options: { reconcileEditor: boolean }) {
    const storefront = this.workingStorefront();
    const projectId = this.projectId();
    if (!storefront || !projectId) {
      return of(null);
    }

    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = null;
    }

    this.isAutosaving.set(true);
    return this.projectStorefrontService
      .updateStorefront(projectId, {
        storeName: storefront.storeName,
        themeKey: storefront.themeKey,
        activePageKey: storefront.activePageKey,
        draftHomepage: storefront.draftHomepage,
        editorSession: this.buildPersistedEditorSession(),
      })
      .pipe(
        finalize(() => this.isAutosaving.set(false)),
        switchMap((savedStorefront) => {
          if (!savedStorefront) {
            return of(savedStorefront);
          }

          const snapshot = this.normalizeStorefront(savedStorefront);
          if (options.reconcileEditor) {
            this.applyPersistedStorefront(snapshot, { resetHistory: false });
          } else {
            this.storefront.set(snapshot);
          }
          return of(snapshot);
        })
      );
  }

  private applyPersistedStorefront(
    snapshot: ProjectStorefront,
    options: { resetHistory: boolean }
  ): void {
    this.storefront.set(snapshot);
    this.workingStorefront.set(this.cloneStorefront(snapshot));
    const editorSession = this.normalizeEditorSession(snapshot.editorSession);
    this.editorSession.set(editorSession);
      this.selectedSectionId.set(editorSession.selectedSectionId);
      this.selectedComponentId.set(null);
      this.selectedComponentIds.set([]);
      this.isolatedGroupComponentId.set(null);
      this.viewport.set(editorSession.viewport);
    this.zoomPercent.set(editorSession.zoomPercent);
    if (options.resetHistory) {
      this.undoStack.set([]);
      this.redoStack.set([]);
    }
    setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
  }

  private serializePersistedState(
    storefront: ProjectStorefront,
    editorSession: StorefrontEditorSession
  ): string {
    return JSON.stringify({
      storeName: storefront.storeName,
      themeKey: storefront.themeKey,
      activePageKey: storefront.activePageKey,
      draftHomepage: storefront.draftHomepage,
      editorSession: {
        selectedSectionId: editorSession.selectedSectionId,
        viewport: editorSession.viewport,
        zoomPercent: this.clampZoom(editorSession.zoomPercent),
      },
    });
  }

  private clampZoom(zoomPercent: number | null | undefined): number {
    const parsed = Number(zoomPercent);
    if (!Number.isFinite(parsed)) {
      return 120;
    }

    return Math.min(200, Math.max(50, Math.round(parsed)));
  }

  private updatePreviewStageScrollbarState(): void {
    const stage = document.querySelector('.storefront-editor__preview-stage') as HTMLElement | null;
    if (!stage) {
      this.hasPreviewStageScrollbar.set(false);
      this.previewStageScrollbarWidth.set(0);
      return;
    }

    const hasScrollbar = stage.scrollHeight > stage.clientHeight + 1;
    this.hasPreviewStageScrollbar.set(hasScrollbar);
    this.previewStageScrollbarWidth.set(hasScrollbar ? Math.max(0, stage.offsetWidth - stage.clientWidth) : 0);
  }

  private buildMediaManagerAssets(
    projectMedia: Array<{
      id: number;
      fileName: string;
      fileUrl: string;
      type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
      fileSize: number;
      uploadedAt: string;
    }>,
    catalogProducts: ProjectCatalogProduct[]
  ): StorefrontMediaManagerAsset[] {
    const assets = new Map<string, StorefrontMediaManagerAsset>();

    for (const media of projectMedia) {
      assets.set(media.fileUrl, {
        id: media.id,
        name: media.fileName,
        url: media.fileUrl,
        type: media.type,
        fileSize: media.fileSize,
        uploadedAt: media.uploadedAt,
        sourceLabel: 'Site files',
        description: this.describeMediaAsset(media.type, media.fileSize),
        origin: 'PROJECT',
      });
    }

    for (const product of catalogProducts) {
      if (!product.imageUrl || assets.has(product.imageUrl)) {
        continue;
      }

      assets.set(product.imageUrl, {
        id: product.id * 1000,
        name: product.name,
        url: product.imageUrl,
        type: 'IMAGE',
        fileSize: 0,
        uploadedAt: product.updatedAt || product.createdAt,
        sourceLabel: 'Catalog',
        description: product.category || 'Product image',
        origin: 'CATALOG',
      });
    }

    return Array.from(assets.values());
  }

  private describeMediaAsset(type: 'IMAGE' | 'VIDEO' | 'DOCUMENT', fileSize: number): string {
    const label = type === 'IMAGE' ? 'Image' : type === 'VIDEO' ? 'Video' : 'Document';
    if (!fileSize) {
      return label;
    }

    return `${label} - ${this.uploadService.formatFileSize(fileSize)}`;
  }

  private normalizeStorefront(storefront: ProjectStorefront): ProjectStorefront {
    const snapshot = this.cloneStorefront(storefront);
    const fallbackStoreName =
      snapshot.storeName?.trim() ||
      this.project()?.storeTitle?.trim() ||
      this.project()?.name?.trim() ||
      'Storefront';

    snapshot.storeName = fallbackStoreName;
    snapshot.themeKey = snapshot.themeKey?.trim() || 'commerce-minimal';
    snapshot.activePageKey = 'home';

    const draftHomepage = snapshot.draftHomepage;
    const normalizedHomepage =
      draftHomepage &&
      typeof draftHomepage === 'object' &&
      Array.isArray(draftHomepage.sections) &&
      draftHomepage.sections.length
        ? {
            version:
              typeof draftHomepage.version === 'number' && Number.isFinite(draftHomepage.version)
                ? draftHomepage.version
                : 1,
            pageKey: 'home' as const,
            seo: {
              title:
                typeof draftHomepage.seo?.title === 'string' && draftHomepage.seo.title.trim()
                  ? draftHomepage.seo.title
                  : fallbackStoreName,
              description:
                typeof draftHomepage.seo?.description === 'string'
                  ? draftHomepage.seo.description
                  : '',
            },
            sections: draftHomepage.sections.map((section) =>
              this.normalizeSection(section, fallbackStoreName)
            ),
          }
        : this.buildDefaultHomepageDocument(fallbackStoreName);

    snapshot.draftHomepage = normalizedHomepage;
    snapshot.editorSession = this.normalizeEditorSession(snapshot.editorSession);
    snapshot.publishedHomepage = snapshot.publishedHomepage
      ? {
          ...snapshot.publishedHomepage,
          pageKey: 'home',
          seo: {
            title:
              typeof snapshot.publishedHomepage.seo?.title === 'string' &&
              snapshot.publishedHomepage.seo.title.trim()
                ? snapshot.publishedHomepage.seo.title
                : normalizedHomepage.seo.title,
            description:
              typeof snapshot.publishedHomepage.seo?.description === 'string'
                ? snapshot.publishedHomepage.seo.description
                : '',
          },
          sections: Array.isArray(snapshot.publishedHomepage.sections)
            ? snapshot.publishedHomepage.sections.map((section) =>
                this.normalizeSection(section, fallbackStoreName)
              )
            : normalizedHomepage.sections,
        }
      : null;

    return snapshot;
  }

  private buildDefaultHomepageDocument(storeName: string): ProjectStorefront['draftHomepage'] {
    return {
      version: 1,
      pageKey: 'home',
      seo: {
        title: storeName,
        description: '',
      },
      sections: [
        this.buildSection('announcement-bar', storeName),
        this.buildSection('hero', storeName),
        this.buildSection('featured-products', storeName),
        this.buildSection('footer', storeName),
      ],
    };
  }

  private normalizeSection(
    section: Partial<StorefrontHomepageSection> | null | undefined,
    storeName: string
  ): StorefrontHomepageSection {
    const safeType = this.normalizeSectionType(section?.type);
    const baseSection = this.buildSection(safeType, storeName);
    const props =
      section?.props && typeof section.props === 'object' && !Array.isArray(section.props)
        ? { ...baseSection.props, ...section.props }
        : baseSection.props;

    return {
      ...baseSection,
      id:
        typeof section?.id === 'string' && section.id.trim()
          ? section.id
          : this.createSectionId(safeType),
      enabled: typeof section?.enabled === 'boolean' ? section.enabled : true,
      props,
    };
  }

  private normalizeSectionType(type: unknown): StorefrontSectionType {
    switch (type) {
      case 'announcement-bar':
      case 'hero':
      case 'featured-products':
      case 'footer':
        return type;
      default:
        return 'hero';
    }
  }

  private buildSection(type: StorefrontSectionType, storeName: string): StorefrontHomepageSection {
    switch (type) {
      case 'announcement-bar':
        return {
          id: this.createSectionId(type),
          type,
          enabled: true,
          props: {
            text: 'Welcome to your storefront',
            linkLabel: 'Browse products',
            linkHref: '/products',
          },
        };
      case 'featured-products':
        return {
          id: this.createSectionId(type),
          type,
          enabled: true,
          props: {
            title: 'Featured products',
            productIds: [],
            maxItems: 4,
          },
        };
      case 'footer':
        return {
          id: this.createSectionId(type),
          type,
          enabled: true,
          props: {
            brandText: storeName,
            contactEmail: 'store@example.com',
            contactPhone: '+216 00 000 000',
          },
        };
      default:
        return {
          id: this.createSectionId(type),
          type,
          enabled: true,
          props: {
            eyebrow: 'New store',
            title: storeName,
            description:
              'Introduce your brand, highlight what makes the catalog special, and guide visitors toward your products.',
            primaryCtaLabel: 'Browse products',
            primaryCtaHref: '/products',
            secondaryCtaLabel: 'Featured picks',
            secondaryCtaHref: '#featured',
          },
        };
    }
  }

  private createSection(type: StorefrontSectionType): StorefrontHomepageSection {
    return this.buildSection(type, this.storeName());
  }

  private createSectionId(type: StorefrontSectionType): string {
    return `${type}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private formatRelativeTime(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) {
      return null;
    }

    const diffMs = Date.now() - timestamp;
    if (!Number.isFinite(diffMs) || diffMs < 0) {
      return 'just now';
    }

    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) {
      return 'just now';
    }

    if (diffMs < hour) {
      const minutes = Math.max(1, Math.round(diffMs / minute));
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }

    if (diffMs < day) {
      const hours = Math.max(1, Math.round(diffMs / hour));
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }

    const days = Math.max(1, Math.round(diffMs / day));
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  private getSectionLibraryTabsElement(): HTMLElement | null {
    return document.querySelector('.storefront-editor__section-library-tabs');
  }

  private getAddElementsTabsElement(): HTMLElement | null {
    return document.querySelector('.storefront-editor__add-elements-tabs-scroll');
  }
}
