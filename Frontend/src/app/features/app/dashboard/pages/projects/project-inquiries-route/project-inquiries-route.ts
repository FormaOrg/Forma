import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { Project } from '../../../../../../core/models/project.model';
import { ProjectService } from '../../../../../../core/services/project.service';

type InquiryStatus = 'new' | 'replied' | 'scheduled';

interface PortfolioInquiry {
  id: number;
  name: string;
  email: string;
  serviceLabel: string;
  budgetLabel: string;
  status: InquiryStatus;
  statusLabel: string;
  sourceLabel: string;
  receivedLabel: string;
  message: string;
}

@Component({
  selector: 'app-project-inquiries-route',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-inquiries-route.html',
})
export class ProjectInquiriesRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);

  readonly statusOptions: ReadonlyArray<{ value: InquiryStatus; label: string }> = [
    { value: 'new', label: 'New' },
    { value: 'replied', label: 'Replied' },
    { value: 'scheduled', label: 'Call scheduled' },
  ];

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly project = signal<Project | null>(null);
  readonly inquiries = signal<PortfolioInquiry[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly searchValue = signal('');
  readonly selectedStatus = signal<'ALL' | InquiryStatus>('ALL');
  readonly selectedInquiryId = signal(1);
  readonly statusDropdownOpen = signal(false);

  readonly filteredInquiries = computed(() => {
    const query = this.searchValue().trim().toLowerCase();
    const status = this.selectedStatus();

    return this.inquiries().filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.serviceLabel.toLowerCase().includes(query);
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

    this.projectService
      .getProjectById(projectId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (project) => {
          this.project.set(project);
          this.inquiries.set(this.createPortfolioInquiries(project));
          this.selectedInquiryId.set(1);
        },
        error: () => {
          this.project.set(null);
          this.inquiries.set([]);
          this.errorMessage.set('Unable to load portfolio inquiries right now.');
        },
      });
  }

  updateSearch(value: string): void {
    this.searchValue.set(value);
  }

  setStatus(status: 'ALL' | InquiryStatus): void {
    this.selectedStatus.set(status);
    this.closeDropdowns();
  }

  selectInquiry(id: number): void {
    this.selectedInquiryId.set(id);
  }

  updateInquiryStatus(inquiryId: number, status: InquiryStatus): void {
    const statusLabel = this.statusOptions.find((option) => option.value === status)?.label ?? 'New';

    this.inquiries.update((items) =>
      items.map((item) =>
        item.id === inquiryId
          ? {
              ...item,
              status,
              statusLabel,
            }
          : item
      )
    );

    this.statusDropdownOpen.set(false);
  }

  toggleStatusDropdown(): void {
    this.statusDropdownOpen.update((value) => !value);
  }

  closeDropdowns(): void {
    this.statusDropdownOpen.set(false);
  }

  trackInquiry = (_: number, item: PortfolioInquiry): number => item.id;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.project-inquiries__dropdown')) {
      this.closeDropdowns();
    }
  }

  private createPortfolioInquiries(project: Project): PortfolioInquiry[] {
    return [
      {
        id: 1,
        name: 'Amina Trabelsi',
        email: 'amina@ateliernorth.com',
        serviceLabel: 'Brand website redesign',
        budgetLabel: '3k-5k TND',
        status: 'new',
        statusLabel: 'New',
        sourceLabel: 'Contact page',
        receivedLabel: 'Today',
        message: `We love the tone of ${project.name} and would like a portfolio site that feels editorial, calm, and premium. We need help structuring the homepage, work archive, and inquiry flow.`,
      },
      {
        id: 2,
        name: 'Nour Studio',
        email: 'hello@nourstudio.co',
        serviceLabel: 'Case study refresh',
        budgetLabel: '1k-3k TND',
        status: 'replied',
        statusLabel: 'Replied',
        sourceLabel: 'Direct form',
        receivedLabel: 'Yesterday',
        message: 'We are refreshing our case studies and need a stronger way to present visuals, outcomes, and process notes across a few key projects.',
      },
      {
        id: 3,
        name: 'Rami Ben Ali',
        email: 'rami@orbital.film',
        serviceLabel: 'Portfolio build',
        budgetLabel: '5k+ TND',
        status: 'scheduled',
        statusLabel: 'Call scheduled',
        sourceLabel: 'Referral',
        receivedLabel: '2 days ago',
        message: 'I need a portfolio that helps me pitch my direction work, show selected campaigns, and collect more serious inbound leads.',
      },
    ];
  }
}
