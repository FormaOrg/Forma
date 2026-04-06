import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { ProjectCatalogProduct } from '../../../../../../core/models/project-catalog.model';
import {
  ProjectStorefront,
  StorefrontHomepageDocument,
  StorefrontHomepageSection,
} from '../../../../../../core/models/project-storefront.model';
import { Project } from '../../../../../../core/models/project.model';
import { ProjectCatalogService } from '../../../../../../core/services/project-catalog.service';
import { ProjectStorefrontService } from '../../../../../../core/services/project-storefront.service';
import { ProjectService } from '../../../../../../core/services/project.service';
import { ProjectWorkspaceContextService } from '../../../../../../core/services/project-workspace-context.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { AppIcon } from '../../../../../../shared/app/icons/app-icon';
import { AppHeader } from '../../../../../../shared/app/app-header/app-header';
import { StorefrontSectionType } from '../../../../../../core/models/project-storefront.model';

type EditorViewport = 'desktop' | 'mobile';
type SectionInsertMode = 'append' | 'after-selected';
type EditorSidebarMode = 'structure' | 'page' | 'theme' | 'assets';
type EditorBlockKind = 'text' | 'button' | 'product-list' | 'contact';

interface EditorBlockDescriptor {
  id: string;
  sectionId: string;
  kind: EditorBlockKind;
  label: string;
  propKey?: string;
  multiline?: boolean;
  description?: string;
}

@Component({
  selector: 'app-project-storefront-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIcon, AppHeader],
  templateUrl: './project-storefront-editor.html',
  styleUrl: './project-storefront-editor.css',
})
export class ProjectStorefrontEditor {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
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

  readonly project = signal<Project | null>(null);
  readonly storefront = signal<ProjectStorefront | null>(null);
  readonly workingStorefront = signal<ProjectStorefront | null>(null);
  readonly products = signal<ProjectCatalogProduct[]>([]);
  readonly selectedSectionId = signal<string | null>(null);
  readonly selectedBlockId = signal<string | null>(null);
  readonly inlineEditingBlockId = signal<string | null>(null);
  readonly viewport = signal<EditorViewport>('desktop');
  readonly sidebarCollapsed = signal(false);
  readonly sidebarMode = signal<EditorSidebarMode>('structure');
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isPublishing = signal(false);
  readonly isUnpublishing = signal(false);
  readonly errorMessage = signal('');

  readonly isEcommerceProject = computed(() => this.project()?.type === 'ECOMMERCE');
  readonly sections = computed(() => this.workingStorefront()?.draftHomepage.sections ?? []);
  readonly pageSettingsSelected = computed(() => this.selectedSectionId() === null);
  readonly selectedSection = computed<StorefrontHomepageSection | null>(
    () => this.sections().find((section) => section.id === this.selectedSectionId()) ?? null
  );
  readonly editableBlocks = computed(() =>
    this.sections().flatMap((section) => this.describeSectionBlocks(section))
  );
  readonly selectedBlock = computed<EditorBlockDescriptor | null>(
    () => this.editableBlocks().find((block) => block.id === this.selectedBlockId()) ?? null
  );
  readonly storeName = computed(
    () => this.workingStorefront()?.storeName ?? this.project()?.storeTitle ?? this.project()?.name ?? 'Storefront'
  );
  readonly hasUnsavedChanges = computed(() => {
    const original = this.storefront();
    const working = this.workingStorefront();
    if (!original || !working) {
      return false;
    }

    return JSON.stringify(original) !== JSON.stringify(working);
  });
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
  readonly previewTitle = computed(
    () => this.workingStorefront()?.draftHomepage?.seo?.title || this.storeName()
  );
  readonly availableSectionTypes: StorefrontSectionType[] = [
    'announcement-bar',
    'hero',
    'featured-products',
    'footer',
  ];

  constructor() {
    this.loadEditor();
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
            this.selectedSectionId.set(null);
            return;
          }

          const snapshot = this.normalizeStorefront(storefront);
          this.storefront.set(snapshot);
          this.workingStorefront.set(this.cloneStorefront(snapshot));
          this.selectedSectionId.set(snapshot.draftHomepage.sections[0]?.id ?? null);
        },
        error: () => {
          this.project.set(null);
          this.storefront.set(null);
          this.workingStorefront.set(null);
          this.products.set([]);
          this.errorMessage.set('Unable to load the storefront editor right now.');
        },
      });
  }

  selectPageSettings(): void {
    this.sidebarMode.set('page');
    this.selectedSectionId.set(null);
    this.selectedBlockId.set(null);
    this.inlineEditingBlockId.set(null);
  }

  selectSection(sectionId: string): void {
    this.sidebarMode.set('structure');
    this.selectedSectionId.set(sectionId);
    this.selectedBlockId.set(null);
    this.inlineEditingBlockId.set(null);
  }

  selectBlock(sectionId: string, blockId: string): void {
    this.sidebarMode.set('structure');
    this.selectedSectionId.set(sectionId);
    this.selectedBlockId.set(blockId);
  }

  startInlineEditing(blockId: string): void {
    const block = this.editableBlocks().find((item) => item.id === blockId);
    if (!block || !block.propKey) {
      return;
    }

    this.selectBlock(block.sectionId, blockId);
    this.inlineEditingBlockId.set(blockId);
  }

  stopInlineEditing(): void {
    this.inlineEditingBlockId.set(null);
  }

  setViewport(viewport: EditorViewport): void {
    this.viewport.set(viewport);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
  }

  setSidebarMode(mode: EditorSidebarMode): void {
    this.sidebarMode.set(mode);
    if (mode === 'page') {
      this.selectedSectionId.set(null);
    } else if (mode === 'structure' && !this.selectedSectionId() && this.sections().length) {
      this.selectedSectionId.set(this.sections()[0].id);
    }
  }

  navigateBackToProject(): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    void this.router.navigate(['/app/projects', projectId, 'home']);
  }

  updateStoreName(value: string): void {
    this.workingStorefront.update((storefront) =>
      storefront ? { ...storefront, storeName: value } : storefront
    );
  }

  updateSeoField(field: 'title' | 'description', value: string): void {
    this.workingStorefront.update((storefront) => {
      if (!storefront) {
        return storefront;
      }

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          seo: {
            ...storefront.draftHomepage.seo,
            [field]: value,
          },
        },
      };
    });
  }

  toggleSelectedSectionEnabled(enabled: boolean): void {
    this.updateSelectedSection((section) => ({ ...section, enabled }));
  }

  moveSelectedSection(direction: 'up' | 'down'): void {
    const selectedSectionId = this.selectedSectionId();
    if (!selectedSectionId) {
      return;
    }

    this.workingStorefront.update((storefront) => {
      if (!storefront) {
        return storefront;
      }

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
    });
  }

  moveSection(sectionId: string, direction: 'up' | 'down'): void {
    this.selectedSectionId.set(sectionId);
    this.moveSelectedSection(direction);
  }

  addSection(type: StorefrontSectionType, mode: SectionInsertMode = 'after-selected'): void {
    this.workingStorefront.update((storefront) => {
      if (!storefront) {
        return storefront;
      }

      const section = this.createSection(type);
      const sections = [...storefront.draftHomepage.sections];
      const selectedSectionId = this.selectedSectionId();
      const selectedIndex = selectedSectionId
        ? sections.findIndex((item) => item.id === selectedSectionId)
        : -1;
      const insertAt =
        mode === 'after-selected' && selectedIndex >= 0 ? selectedIndex + 1 : sections.length;

      sections.splice(insertAt, 0, section);
      this.selectedSectionId.set(section.id);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    });
  }

  duplicateSection(sectionId: string): void {
    this.workingStorefront.update((storefront) => {
      if (!storefront) {
        return storefront;
      }

      const sections = [...storefront.draftHomepage.sections];
      const index = sections.findIndex((section) => section.id === sectionId);
      if (index < 0) {
        return storefront;
      }

      const duplicate = {
        ...JSON.parse(JSON.stringify(sections[index])),
        id: this.createSectionId(sections[index].type),
      } as StorefrontHomepageSection;

      sections.splice(index + 1, 0, duplicate);
      this.selectedSectionId.set(duplicate.id);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections,
        },
      };
    });
  }

  removeSection(sectionId: string): void {
    this.workingStorefront.update((storefront) => {
      if (!storefront) {
        return storefront;
      }

      const sections = storefront.draftHomepage.sections;
      if (sections.length <= 1) {
        return storefront;
      }

      const index = sections.findIndex((section) => section.id === sectionId);
      if (index < 0) {
        return storefront;
      }

      const nextSections = sections.filter((section) => section.id !== sectionId);
      const nextSelected =
        nextSections[index]?.id ?? nextSections[index - 1]?.id ?? null;
      this.selectedSectionId.set(nextSelected);

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: nextSections,
        },
      };
    });
  }

  toggleSectionEnabled(sectionId: string): void {
    this.workingStorefront.update((storefront) => {
      if (!storefront) {
        return storefront;
      }

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: storefront.draftHomepage.sections.map((section) =>
            section.id === sectionId ? { ...section, enabled: !section.enabled } : section
          ),
        },
      };
    });
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

  updateBlockStringProp(blockId: string, value: string): void {
    const block = this.editableBlocks().find((item) => item.id === blockId);
    if (!block?.propKey) {
      return;
    }

    this.updateSectionById(block.sectionId, (section) => ({
      ...section,
      props: {
        ...section.props,
        [block.propKey!]: value,
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

  blocksForSection(section: StorefrontHomepageSection): EditorBlockDescriptor[] {
    return this.describeSectionBlocks(section);
  }

  isSectionSelected(sectionId: string): boolean {
    return this.selectedSectionId() === sectionId && !this.selectedBlockId();
  }

  isBlockSelected(blockId: string): boolean {
    return this.selectedBlockId() === blockId;
  }

  isInlineEditing(blockId: string): boolean {
    return this.inlineEditingBlockId() === blockId;
  }

  blockValue(block: EditorBlockDescriptor | null): string {
    if (!block?.propKey) {
      return '';
    }

    const section = this.sections().find((item) => item.id === block.sectionId) ?? null;
    return this.readStringProp(section, block.propKey);
  }

  blockPlaceholder(block: EditorBlockDescriptor): string {
    switch (block.kind) {
      case 'button':
        return 'Button label';
      case 'contact':
        return 'Contact detail';
      default:
        return 'Enter text';
    }
  }

  saveDraft(): void {
    const storefront = this.workingStorefront();
    const projectId = this.projectId();
    if (!storefront || !projectId || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.projectStorefrontService
      .updateStorefront(projectId, {
        storeName: storefront.storeName,
        themeKey: storefront.themeKey,
        activePageKey: storefront.activePageKey,
        draftHomepage: storefront.draftHomepage,
      })
      .pipe(finalize(() => this.isSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (savedStorefront) => {
          const snapshot = this.normalizeStorefront(savedStorefront);
          this.storefront.set(snapshot);
          this.workingStorefront.set(this.cloneStorefront(snapshot));
          this.toastService.success('Storefront draft saved.');
        },
        error: () => this.toastService.error('Unable to save the storefront draft right now.'),
      });
  }

  publishStorefront(): void {
    const projectId = this.projectId();
    const storefront = this.workingStorefront();
    if (!projectId || !storefront || this.isPublishing()) {
      return;
    }

    this.isPublishing.set(true);
    const save$ = this.hasUnsavedChanges()
      ? this.projectStorefrontService.updateStorefront(projectId, {
          storeName: storefront.storeName,
          themeKey: storefront.themeKey,
          activePageKey: storefront.activePageKey,
          draftHomepage: storefront.draftHomepage,
        })
      : of(storefront);

    save$
      .pipe(
        switchMap(() => this.projectStorefrontService.publishStorefront(projectId)),
        finalize(() => this.isPublishing.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          const snapshot = this.normalizeStorefront(response.storefront);
          this.storefront.set(snapshot);
          this.workingStorefront.set(this.cloneStorefront(snapshot));
          this.toastService.success('Storefront published.');
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
          this.storefront.set(snapshot);
          this.workingStorefront.set(this.cloneStorefront(snapshot));
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

  blockKindLabel(kind: EditorBlockKind): string {
    switch (kind) {
      case 'button':
        return 'Button';
      case 'product-list':
        return 'Product list';
      case 'contact':
        return 'Contact';
      default:
        return 'Text';
    }
  }

  private updateSelectedSection(
    updater: (section: StorefrontHomepageSection) => StorefrontHomepageSection
  ): void {
    const selectedSectionId = this.selectedSectionId();
    if (!selectedSectionId) {
      return;
    }

    this.workingStorefront.update((storefront) => {
      if (!storefront) {
        return storefront;
      }

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: storefront.draftHomepage.sections.map((section) =>
            section.id === selectedSectionId ? updater(section) : section
          ),
        },
      };
    });
  }

  private updateSectionById(
    sectionId: string,
    updater: (section: StorefrontHomepageSection) => StorefrontHomepageSection
  ): void {
    this.workingStorefront.update((storefront) => {
      if (!storefront) {
        return storefront;
      }

      return {
        ...storefront,
        draftHomepage: {
          ...storefront.draftHomepage,
          sections: storefront.draftHomepage.sections.map((section) =>
            section.id === sectionId ? updater(section) : section
          ),
        },
      };
    });
  }

  private describeSectionBlocks(section: StorefrontHomepageSection): EditorBlockDescriptor[] {
    switch (section.type) {
      case 'announcement-bar':
        return [
          this.createBlockDescriptor(section.id, 'text', 'announcement-text', 'Announcement text', 'text'),
          this.createBlockDescriptor(section.id, 'button', 'announcement-link', 'Announcement link', 'linkLabel'),
        ];
      case 'hero':
        return [
          this.createBlockDescriptor(section.id, 'text', 'hero-eyebrow', 'Eyebrow', 'eyebrow'),
          this.createBlockDescriptor(section.id, 'text', 'hero-title', 'Headline', 'title'),
          this.createBlockDescriptor(section.id, 'text', 'hero-description', 'Description', 'description', true),
          this.createBlockDescriptor(section.id, 'button', 'hero-primary-cta', 'Primary button', 'primaryCtaLabel'),
          this.createBlockDescriptor(section.id, 'button', 'hero-secondary-cta', 'Secondary button', 'secondaryCtaLabel'),
        ];
      case 'featured-products':
        return [
          this.createBlockDescriptor(section.id, 'text', 'featured-title', 'Section title', 'title'),
          {
            id: `${section.id}:featured-grid`,
            sectionId: section.id,
            kind: 'product-list',
            label: 'Product grid',
            description: 'Select products and ordering from the inspector.',
          },
        ];
      case 'footer':
        return [
          this.createBlockDescriptor(section.id, 'text', 'footer-brand', 'Brand', 'brandText'),
          this.createBlockDescriptor(section.id, 'contact', 'footer-email', 'Email', 'contactEmail'),
          this.createBlockDescriptor(section.id, 'contact', 'footer-phone', 'Phone', 'contactPhone'),
        ];
      default:
        return [];
    }
  }

  private createBlockDescriptor(
    sectionId: string,
    kind: EditorBlockKind,
    key: string,
    label: string,
    propKey?: string,
    multiline = false
  ): EditorBlockDescriptor {
    return {
      id: `${sectionId}:${key}`,
      sectionId,
      kind,
      label,
      propKey,
      multiline,
    };
  }

  private cloneStorefront(storefront: ProjectStorefront): ProjectStorefront {
    return JSON.parse(JSON.stringify(storefront)) as ProjectStorefront;
  }

  private normalizeStorefront(storefront: ProjectStorefront): ProjectStorefront {
    const snapshot = this.cloneStorefront(storefront);
    const fallbackDocument = this.createDefaultHomepageDocument(snapshot.storeName);
    const draftHomepage = snapshot.draftHomepage as Partial<StorefrontHomepageDocument> | null | undefined;

    snapshot.draftHomepage = {
      version: typeof draftHomepage?.version === 'number' ? draftHomepage.version : fallbackDocument.version,
      pageKey: draftHomepage?.pageKey === 'home' ? 'home' : fallbackDocument.pageKey,
      seo: {
        title:
          typeof draftHomepage?.seo?.title === 'string' && draftHomepage.seo.title.trim()
            ? draftHomepage.seo.title
            : fallbackDocument.seo.title,
        description:
          typeof draftHomepage?.seo?.description === 'string' ? draftHomepage.seo.description : fallbackDocument.seo.description,
      },
      sections: Array.isArray(draftHomepage?.sections)
        ? draftHomepage.sections
        : fallbackDocument.sections,
    };

    return snapshot;
  }

  private createDefaultHomepageDocument(storeName: string | null): StorefrontHomepageDocument {
    return {
      version: 1,
      pageKey: 'home',
      seo: {
        title: storeName?.trim() || this.project()?.storeTitle || this.project()?.name || 'Storefront',
        description: '',
      },
      sections: [
        this.createSection('hero'),
        this.createSection('featured-products'),
        this.createSection('footer'),
      ],
    };
  }

  private createSection(type: StorefrontSectionType): StorefrontHomepageSection {
    switch (type) {
      case 'announcement-bar':
        return {
          id: this.createSectionId(type),
          type,
          enabled: true,
          props: {
            text: 'Free shipping on orders over 150 TND',
            linkLabel: 'Shop now',
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
            brandText: this.storeName(),
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
            eyebrow: 'New collection',
            title: 'Design your next bestseller',
            description: 'Use this hero section to introduce your products with a strong headline and clear calls to action.',
            primaryCtaLabel: 'Shop now',
            primaryCtaHref: '/products',
            secondaryCtaLabel: 'Learn more',
            secondaryCtaHref: '/about',
          },
        };
    }
  }

  private createSectionId(type: StorefrontSectionType): string {
    return `${type}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
