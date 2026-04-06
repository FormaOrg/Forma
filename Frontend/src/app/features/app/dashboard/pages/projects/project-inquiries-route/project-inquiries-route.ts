import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import {
  PortfolioInquiriesPage,
  PortfolioInquiryItem,
  PortfolioInquiryStatus,
} from '../../../../../../core/models/portfolio-inquiries.model';
import { PortfolioInquiriesService } from '../../../../../../core/services/portfolio-inquiries.service';

@Component({
  selector: 'app-project-inquiries-route',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-inquiries-route.html',
  styleUrl: './project-inquiries-route.css',
})
export class ProjectInquiriesRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly portfolioInquiriesService = inject(PortfolioInquiriesService);

  readonly statusOptions: ReadonlyArray<{ value: PortfolioInquiryStatus; label: string }> = [
    { value: 'new', label: 'New' },
    { value: 'replied', label: 'Replied' },
    { value: 'scheduled', label: 'Call scheduled' },
  ];

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly page = signal<PortfolioInquiriesPage | null>(null);
  readonly inquiries = signal<PortfolioInquiryItem[]>([]);
  readonly isLoading = signal(true);
  readonly isUpdatingStatus = signal(false);
  readonly errorMessage = signal('');
  readonly searchValue = signal('');
  readonly selectedStatus = signal<'ALL' | PortfolioInquiryStatus>('ALL');
  readonly selectedInquiryId = signal<number | null>(null);
  readonly statusDropdownOpen = signal(false);
  readonly project = computed(() => this.page());

  readonly filteredInquiries = computed(() => {
    const query = this.searchValue().trim().toLowerCase();
    const status = this.selectedStatus();

    return this.inquiries().filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        (item.serviceLabel ?? '').toLowerCase().includes(query);
      const matchesStatus = status === 'ALL' || item.status === status;
      return matchesQuery && matchesStatus;
    });
  });

  readonly selectedInquiry = computed(
    () => this.filteredInquiries().find((item) => item.id === this.selectedInquiryId()) ?? this.filteredInquiries()[0] ?? null
  );
  readonly newCount = computed(() => this.inquiries().filter((item) => item.status === 'new').length);
  readonly repliedCount = computed(() => this.inquiries().filter((item) => item.status === 'replied').length);

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

    this.portfolioInquiriesService
      .getInquiriesPage(projectId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (page: PortfolioInquiriesPage) => {
          this.page.set(page);
          this.inquiries.set(page.inquiries);
          this.selectedInquiryId.set(page.inquiries[0]?.id ?? null);
        },
        error: () => {
          this.page.set(null);
          this.inquiries.set([]);
          this.errorMessage.set('Unable to load portfolio inquiries right now.');
        },
      });
  }

  updateSearch(value: string): void {
    this.searchValue.set(value);
  }

  setStatus(status: 'ALL' | PortfolioInquiryStatus): void {
    this.selectedStatus.set(status);
    const nextSelected = this.filteredInquiries()[0]?.id ?? null;
    this.selectedInquiryId.set(nextSelected);
    this.closeDropdowns();
  }

  selectInquiry(id: number): void {
    this.selectedInquiryId.set(id);
  }

  updateInquiryStatus(inquiryId: number, status: PortfolioInquiryStatus): void {
    const projectId = this.projectId();
    if (!projectId || this.isUpdatingStatus()) {
      return;
    }

    this.isUpdatingStatus.set(true);
    this.portfolioInquiriesService
      .updateInquiryStatus(projectId, inquiryId, status)
      .pipe(finalize(() => this.isUpdatingStatus.set(false)))
      .subscribe({
        next: (updatedInquiry) => {
          this.inquiries.update((items) =>
            items.map((item) => (item.id === inquiryId ? updatedInquiry : item))
          );
          this.statusDropdownOpen.set(false);
        },
        error: () => {
          this.statusDropdownOpen.set(false);
        },
      });
  }

  toggleStatusDropdown(): void {
    this.statusDropdownOpen.update((value) => !value);
  }

  closeDropdowns(): void {
    this.statusDropdownOpen.set(false);
  }

  trackInquiry = (_: number, item: PortfolioInquiryItem): number => item.id;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.project-inquiries__dropdown')) {
      this.closeDropdowns();
    }
  }

  formatReceivedLabel(value: string | null | undefined): string {
    if (!value) {
      return 'Recently';
    }

    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
      return 'Recently';
    }

    const now = Date.now();
    const diffMs = Math.max(0, now - parsed);
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    }
    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    return `${diffDays} days ago`;
  }
}
