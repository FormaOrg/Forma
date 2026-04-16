import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { PortfolioPageItem, PortfolioPagesPage } from '../../../../../../core/models/portfolio-pages.model';
import { PortfolioPagesService } from '../../../../../../core/services/portfolio-pages.service';

@Component({
  selector: 'app-project-pages-route',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-pages-route.html',
  styleUrl: './project-pages-route.css',
})
export class ProjectPagesRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly portfolioPagesService = inject(PortfolioPagesService);

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly page = signal<PortfolioPagesPage | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly selectedPageId = signal<number | null>(null);

  readonly project = computed(() => this.page());
  readonly pages = computed<PortfolioPageItem[]>(() => this.page()?.pages ?? []);

  readonly selectedPage = computed(
    () => this.pages().find((page) => page.id === this.selectedPageId()) ?? this.pages()[0] ?? null
  );
  readonly publishedCount = computed(() => this.pages().filter((page) => page.status === 'published').length);
  readonly totalSections = computed(() => this.pages().reduce((sum, page) => sum + page.sectionCount, 0));

  constructor() {
    this.loadProject();
  }

  loadProject(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Project not found.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.portfolioPagesService
      .getPagesPage(projectId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (page) => {
          this.page.set(page);
          this.selectedPageId.set(page.pages[0]?.id ?? null);
        },
        error: () => {
          this.page.set(null);
          this.errorMessage.set('Unable to load portfolio pages right now.');
        },
      });
  }

  selectPage(pageId: number): void {
    this.selectedPageId.set(pageId);
  }

  trackPage = (_: number, page: PortfolioPageItem): number => page.id;

  formatDate(value: string | null | undefined): string {
    const parsed = Date.parse(value ?? '');
    if (!Number.isFinite(parsed)) {
      return 'Recently updated';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(parsed);
  }
}
