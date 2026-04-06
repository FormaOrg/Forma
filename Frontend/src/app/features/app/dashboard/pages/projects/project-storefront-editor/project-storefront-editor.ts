import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { ProjectCatalogProduct } from '../../../../../../core/models/project-catalog.model';
import { ProjectStorefront, StorefrontHomepageSection } from '../../../../../../core/models/project-storefront.model';
import { Project } from '../../../../../../core/models/project.model';
import { ProjectCatalogService } from '../../../../../../core/services/project-catalog.service';
import { ProjectStorefrontService } from '../../../../../../core/services/project-storefront.service';
import { ProjectService } from '../../../../../../core/services/project.service';
import { ProjectWorkspaceContextService } from '../../../../../../core/services/project-workspace-context.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { AppIcon } from '../../../../../../shared/app/icons/app-icon';
import { AppHeader } from '../../../../../../shared/app/app-header/app-header';

type EditorViewport = 'desktop' | 'mobile';

@Component({
  selector: 'app-project-storefront-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppIcon, AppHeader],
  templateUrl: './project-storefront-editor.html',
  styleUrl: './project-storefront-editor.css',
})
export class ProjectStorefrontEditor {
  private readonly route = inject(ActivatedRoute);
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
  readonly viewport = signal<EditorViewport>('desktop');
  readonly sidebarCollapsed = signal(false);
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
  readonly previewTitle = computed(() => this.workingStorefront()?.draftHomepage.seo.title || this.storeName());

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

          const snapshot = this.cloneStorefront(storefront);
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
    this.selectedSectionId.set(null);
  }

  selectSection(sectionId: string): void {
    this.selectedSectionId.set(sectionId);
  }

  setViewport(viewport: EditorViewport): void {
    this.viewport.set(viewport);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
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
          const snapshot = this.cloneStorefront(savedStorefront);
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
          const snapshot = this.cloneStorefront(response.storefront);
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
          const snapshot = this.cloneStorefront(storefront);
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

  private cloneStorefront(storefront: ProjectStorefront): ProjectStorefront {
    return JSON.parse(JSON.stringify(storefront)) as ProjectStorefront;
  }
}
