import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
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
import { ToastService } from '../../../../../../core/services/toast.service';
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

type SectionInsertMode = 'append' | 'after-selected';
type EditorSidebarMode = 'structure' | 'page' | 'theme' | 'assets';
type PagesPanelLayoutMode = 'grid' | 'rows';
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
  imports: [CommonModule, FormsModule, AppIcon],
  templateUrl: './project-storefront-editor.html',
  styleUrl: './project-storefront-editor.css',
})
export class ProjectStorefrontEditor {
  private static readonly HISTORY_LIMIT = 20;
  private static readonly AUTOSAVE_DELAY_MS = 900;
  private static readonly ADD_ELEMENTS_PANEL_CLOSE_MS = 220;
  private static readonly SECTION_LIBRARY_CLOSE_MS = 200;
  private static readonly SECTION_COMPONENTS_PROP_KEY = 'editorComponents';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly projectCatalogService = inject(ProjectCatalogService);
  private readonly projectStorefrontService = inject(ProjectStorefrontService);
  private readonly projectWorkspaceContextService = inject(ProjectWorkspaceContextService);
  private readonly toastService = inject(ToastService);

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
  private activeComponentDrag:
    | {
        sectionId: string;
        componentId: string;
        pointerOffsetX: number;
        pointerOffsetY: number;
      }
    | null = null;

  readonly project = signal<Project | null>(null);
  readonly storefront = signal<ProjectStorefront | null>(null);
  readonly workingStorefront = signal<ProjectStorefront | null>(null);
  readonly products = signal<ProjectCatalogProduct[]>([]);
  readonly selectedSectionId = signal<string | null>(null);
  readonly selectedComponentId = signal<string | null>(null);
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
  readonly isPagesPanelOpen = signal(false);
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
  readonly hoveredSectionId = signal<string | null>(null);
  readonly hoveredSectionRailTop = signal(0);
  readonly hasPreviewStageScrollbar = signal(false);
  readonly previewStageScrollbarWidth = signal(0);
  readonly sectionClipboard = signal<StorefrontHomepageSection | null>(null);
  readonly zoomPercent = signal(120);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isAutosaving = signal(false);
  readonly isPublishing = signal(false);
  readonly isUnpublishing = signal(false);
  readonly errorMessage = signal('');

  readonly isEcommerceProject = computed(() => this.project()?.type === 'ECOMMERCE');
  readonly sections = computed(() => this.workingStorefront()?.draftHomepage.sections ?? []);
  readonly pageSettingsSelected = computed(() => this.selectedSectionId() === null);
  readonly selectedSection = computed<StorefrontHomepageSection | null>(
    () => this.sections().find((section) => section.id === this.selectedSectionId()) ?? null
  );
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
      this.sectionOptionsMenuId() !== null
  );
  readonly hasBlockingOverlay = computed(
    () =>
      this.isAddElementsPanelVisible() ||
      this.isPagesPanelOpen() ||
      this.isSectionLibraryVisible()
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
    setTimeout(() => this.updatePreviewStageScrollbarState(), 0);
  }

  @HostListener('window:keydown', ['$event'])
  handleZoomShortcuts(event: KeyboardEvent): void {
    if (!event.ctrlKey || event.altKey) {
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
  }

  @HostListener('document:mousemove', ['$event'])
  handleComponentPointerMove(event: MouseEvent): void {
    if (!this.activeComponentDrag) {
      return;
    }

    event.preventDefault();

    const container = document.querySelector(
      `.storefront-editor__preview-section-content[data-section-content-id="${this.activeComponentDrag.sectionId}"]`
    );

    if (!(container instanceof HTMLElement)) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const nextX = event.clientX - rect.left - this.activeComponentDrag.pointerOffsetX;
    const nextY = event.clientY - rect.top - this.activeComponentDrag.pointerOffsetY;

    this.updateSectionComponentFrame(
      this.activeComponentDrag.sectionId,
      this.activeComponentDrag.componentId,
      nextX,
      nextY,
      rect.width,
      rect.height
    );
  }

  @HostListener('document:mouseup')
  handleComponentPointerUp(): void {
    this.activeComponentDrag = null;
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
            return of({ storefront: null, catalogProducts: [] as ProjectCatalogProduct[] });
          }

          return forkJoin({
            storefront: this.projectStorefrontService.getStorefront(projectId),
            catalogProducts: this.projectCatalogService.getCatalogPage(projectId, {}).pipe(
              switchMap((catalogPage) => of(catalogPage.products))
            ),
          });
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ storefront, catalogProducts }) => {
          this.products.set(catalogProducts);

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
            this.products.set([]);
            this.errorMessage.set('Unable to load the storefront editor right now.');
        },
      });
  }

  selectPageSettings(): void {
    this.sidebarMode.set('page');
    this.selectedSectionId.set(null);
    this.selectedComponentId.set(null);
    this.syncEditorSessionState({ selectedSectionId: null });
  }

  selectSection(sectionId: string): void {
    this.sidebarMode.set('structure');
    this.selectedSectionId.set(sectionId);
    this.selectedComponentId.set(null);
    this.sectionOptionsMenuId.set(null);
    this.syncEditorSessionState({ selectedSectionId: sectionId });
    setTimeout(() => this.syncSelectedSectionRailPosition(), 0);
  }

  clearSectionSelection(): void {
    this.selectedSectionId.set(null);
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

    const nextComponent = createStorefrontEditorComponentNode(item.componentType);
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) => {
          if (section.id !== selectedSection.id) {
            return section;
          }

          const components = this.readSectionComponents(section);
          return this.writeSectionComponents(section, [...components, nextComponent]);
        }),
      },
    }), { syncRail: true });

    this.selectedComponentId.set(nextComponent.id);
    this.closeAddElementsPanel();
  }

  selectComponent(sectionId: string, componentId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.selectedSectionId.set(sectionId);
    this.selectedComponentId.set(componentId);
    this.syncEditorSessionState({ selectedSectionId: sectionId }, false);
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

    const rect = target.getBoundingClientRect();
    this.activeComponentDrag = {
      sectionId,
      componentId,
      pointerOffsetX: event.clientX - rect.left,
      pointerOffsetY: event.clientY - rect.top,
    };

    this.selectComponent(sectionId, componentId);
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
    const section = this.selectedSection();
    const componentId = this.selectedComponentId();
    if (!section || !componentId) {
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

          return this.writeSectionComponents(
            item,
            this.readSectionComponents(item).filter((component) => component.id !== componentId)
          );
        }),
      },
    }), { syncRail: false });

    this.selectedComponentId.set(null);
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
    this.pageCardMenuId.set(null);
    this.closeSectionLibrary();
    this.sectionOptionsMenuId.set(null);
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

  toggleSectionOptions(sectionId: string): void {
    this.sectionOptionsMenuId.update((current) => (current === sectionId ? null : sectionId));
  }

  syncSelectedSectionRailPosition(sectionElement?: HTMLElement | null): void {
    this.updatePreviewStageScrollbarState();

    const selectedSectionId = this.selectedSectionId();
    if (!selectedSectionId && !sectionElement) {
      return;
    }

    const shell =
      sectionElement ??
      (document.querySelector(
        `.storefront-editor__preview-section-shell[data-section-id="${selectedSectionId}"]`
      ) as HTMLElement | null);
    if (!shell) {
      return;
    }

    const previewShell = shell.closest('.storefront-editor__preview-shell') as HTMLElement | null;
    if (!previewShell) {
      return;
    }

    const shellRect = shell.getBoundingClientRect();
    const previewShellRect = previewShell.getBoundingClientRect();
    this.hoveredSectionRailTop.set(shellRect.top - previewShellRect.top + shellRect.height / 2);
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
    if (!projectId) {
      return;
    }

    window.open(`/store/${projectId}`, '_blank', 'noopener');
  }

  triggerPublishFromMenu(): void {
    this.closeFloatingUi();
    this.publishStorefront();
  }

  openAccountSettings(): void {
    this.closeFloatingUi();
    void this.router.navigate(['/app/settings/profile']);
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
    let nextSelected: string | null = this.selectedSectionId();
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
      nextSelected =
        nextSections[index]?.id ?? nextSections[index - 1]?.id ?? null;

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
    containerHeight: number
  ): void {
    this.applyStorefrontMutation((storefront) => ({
      ...storefront,
      draftHomepage: {
        ...storefront.draftHomepage,
        sections: storefront.draftHomepage.sections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          const components = this.readSectionComponents(section).map((component) => {
            if (component.id !== componentId) {
              return component;
            }

            const maxX = Math.max(0, containerWidth - component.frame.width);
            const maxY = Math.max(0, containerHeight - component.frame.height);
            return {
              ...component,
              frame: {
                ...component.frame,
                x: Math.max(0, Math.min(nextX, maxX)),
                y: Math.max(0, Math.min(nextY, maxY)),
              },
            };
          });

          return this.writeSectionComponents(section, components);
        }),
      },
    }), { syncRail: false });
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
