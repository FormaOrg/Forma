import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { DashboardTemplateItem } from '../../../../../core/models/dashboard.model';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { ProjectService } from '../../../../../core/services/project.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { I18nService } from '../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../landing-page/i18n/translate.pipe';
import { DataCard } from '../home/components/data-card/data-card';
import { TemplateCard } from './components/template-card/template-card';

type TemplateScope = 'all' | 'my';
type TemplateSort = 'featured' | 'popular' | 'newest' | 'name';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataCard, TemplateCard, TranslatePipe],
  templateUrl: './templates.html',
  styleUrl: './templates.css',
  encapsulation: ViewEncapsulation.None,
})
export class Templates implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly projectService = inject(ProjectService);
  private readonly toastService = inject(ToastService);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly layersIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L20 8.5L12 13L4 8.5L12 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M4 12.5L12 17L20 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 16.5L12 21L20 16.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `;

  readonly sparkIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
  </svg>
  `;

  readonly bookIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 5.5C6 4.67157 6.67157 4 7.5 4H18V18.5C18 19.3284 17.3284 20 16.5 20H7.5C6.67157 20 6 19.3284 6 18.5V5.5Z" stroke="currentColor" stroke-width="1.8"/>
    <path d="M9 8H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M9 12H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
  `;

  readonly templates = signal<DashboardTemplateItem[]>([]);
  readonly searchTerm = signal('');
  readonly activeScope = signal<TemplateScope>('all');
  readonly activeCategory = signal('all');
  readonly activeSort = signal<TemplateSort>('featured');
  readonly categoryDropdownOpen = signal(false);
  readonly sortDropdownOpen = signal(false);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly creatingTemplateId = signal<string | null>(null);

  readonly categories = computed(() => {
    const values = new Set(this.templates().map((template) => template.categoryLabel));
    return ['all', ...Array.from(values).sort((left, right) => left.localeCompare(right))];
  });

  readonly totalTemplates = computed(() => this.templates().length);
  readonly featuredTemplates = computed(() => this.templates().filter((template) => template.isFeatured).length);
  readonly categoryCount = computed(() => Math.max(0, this.categories().length - 1));
  readonly activeCategoryLabel = computed(() => this.activeCategory() === 'all' ? this.i18n.t('dashboard.templates.category.all') : this.activeCategory());
  readonly activeSortLabel = computed(() => {
    switch (this.activeSort()) {
      case 'popular':
        return 'dashboard.templates.sort.mostUsed';
      case 'newest':
        return 'dashboard.templates.sort.newest';
      case 'name':
        return 'dashboard.templates.sort.name';
      default:
        return 'dashboard.templates.sort.featured';
    }
  });

  readonly filteredTemplates = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const scope = this.activeScope();
    const category = this.activeCategory();
    const sort = this.activeSort();

    const filtered = this.templates().filter((template) => {
      const matchesQuery =
        query.length === 0 ||
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.categoryLabel.toLowerCase().includes(query) ||
        template.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesScope = scope === 'all' || template.isOwned;
      const matchesCategory = category === 'all' || template.categoryLabel === category;

      return matchesQuery && matchesScope && matchesCategory;
    });

    return filtered.sort((left, right) => {
      if (sort === 'name') {
        return left.name.localeCompare(right.name);
      }

      if (sort === 'newest') {
        return right.updatedAt - left.updatedAt;
      }

      if (sort === 'popular') {
        return right.usesCount - left.usesCount;
      }

      if (left.isFeatured !== right.isFeatured) {
        return Number(right.isFeatured) - Number(left.isFeatured);
      }

      if (left.usesCount !== right.usesCount) {
        return right.usesCount - left.usesCount;
      }

      return left.sortIndex - right.sortIndex;
    });
  });

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.subscribe((params) => {
      this.activeScope.set(params.get('tab') === 'my' ? 'my' : 'all');
    });

    this.loadTemplates();
  }

  loadTemplates(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardDataService
      .getTemplatesOverview()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (templates) => this.templates.set(templates),
        error: (error) => {
          this.templates.set([]);
          this.errorMessage.set(this.toTemplatesErrorMessage(error));
        },
      });
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  updateScope(scope: TemplateScope): void {
    this.closeDropdowns();
    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: scope === 'my' ? { tab: 'my' } : { tab: null },
      queryParamsHandling: 'merge',
    });
  }

  updateCategory(category: string): void {
    this.activeCategory.set(category);
    this.categoryDropdownOpen.set(false);
  }

  updateSort(sort: TemplateSort): void {
    this.activeSort.set(sort);
    this.sortDropdownOpen.set(false);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.activeCategory.set('all');
    this.closeDropdowns();
    this.updateScope('all');
  }

  useTemplate(template: DashboardTemplateItem): void {
    if (this.creatingTemplateId()) {
      return;
    }

    this.creatingTemplateId.set(template.id);

    this.projectService.createProject({
      name: template.name,
      description: template.description,
      type: template.projectType,
      creationMethod: template.creationMethod,
      templateId: typeof template.backendId === 'number' ? template.backendId : null,
    }).pipe(finalize(() => this.creatingTemplateId.set(null)))
      .subscribe({
        next: () => {
          this.dashboardDataService.invalidateProjectsOverviewCache();
          this.dashboardDataService.invalidateTemplatesOverviewCache();
          this.toastService.success(`${template.name} ${this.i18n.t('dashboard.templates.toast.readySuffix')}`);
          void this.router.navigate(['/app/projects']);
        },
        error: () => {
          this.toastService.error(this.i18n.t('dashboard.templates.toast.createError'));
        },
      });
  }

  trackByTemplate = (_: number, template: DashboardTemplateItem): string => template.id;

  toggleCategoryDropdown(): void {
    this.categoryDropdownOpen.update((value) => !value);
    this.sortDropdownOpen.set(false);
  }

  toggleSortDropdown(): void {
    this.sortDropdownOpen.update((value) => !value);
    this.categoryDropdownOpen.set(false);
  }

  closeDropdowns(): void {
    this.categoryDropdownOpen.set(false);
    this.sortDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.templates-toolbar__dropdown')) {
      this.closeDropdowns();
    }
  }

  private toTemplatesErrorMessage(error: unknown): string {
    const status = this.readErrorStatus(error);

    if (status === 0) {
      return this.i18n.t('dashboard.templates.errors.connection');
    }

    return this.i18n.t('dashboard.templates.errors.load');
  }

  private readErrorStatus(error: unknown): number | undefined {
    if (typeof error === 'object' && error && 'status' in error) {
      const value = (error as { status?: unknown }).status;
      return typeof value === 'number' ? value : undefined;
    }

    return undefined;
  }
}
