import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectType } from '../../../../../core/models/project.model';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { ProjectService } from '../../../../../core/services/project.service';
import { ToastService } from '../../../../../core/services/toast.service';

type CreationScreen = 'type' | 'customizing' | 'name' | 'goals' | 'launching';

interface TypeOption {
  type: ProjectType;
  label: string;
  description: string;
  tag: string;
  previewImage: string;
  accent: string;
}

interface SceneCard {
  image: string;
  label: string;
  className: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: 'PORTFOLIO',
    label: 'Portfolio',
    description: 'Highlight your work, story, and signature style in a refined personal space.',
    tag: 'Creative',
    previewImage: 'assets/Templates Gallery/Mock Templates/1.jpg',
    accent: '#7566ff',
  },
  {
    type: 'ECOMMERCE',
    label: 'E-commerce',
    description: 'Launch a storefront with product drops, collections, and polished buying flows.',
    tag: 'Store',
    previewImage: 'assets/Templates Gallery/Mock Templates/4.jpg',
    accent: '#f29d64',
  },
  {
    type: 'BLOG',
    label: 'Blog',
    description: 'Publish essays, updates, and articles with a clean editorial presence.',
    tag: 'Editorial',
    previewImage: 'assets/Templates Gallery/Mock Templates/2.jpg',
    accent: '#59b6d9',
  },
];

const TYPE_NAME_SUGGESTIONS: Record<ProjectType, string[]> = {
  PORTFOLIO: ['Atelier Portfolio', 'Creative Vault', 'Talent Showcase', 'Studio Signature'],
  BLOG: ['Journal Notes', 'Signal Stories', 'Weekly Dispatch', 'Editorial Canvas'],
  BUSINESS: ['Forma Studio', 'Northline Agency', 'Prime Service Co.', 'Nova Consulting'],
  ECOMMERCE: ['Bell & Co.', 'Knobbdy Store', 'Curated Goods', 'Daily Drop Shop'],
  LANDING_PAGE: ['Launch Prism', 'Campaign Sprint', 'Event Signal', 'Momentum Page'],
};

const TYPE_GOAL_SUGGESTIONS: Record<ProjectType, string[]> = {
  PORTFOLIO: ['Showcase my best work', 'Promote my portfolio', 'Connect with potential clients', 'Display my unique creations'],
  BLOG: ['Publish articles consistently', 'Grow my readership', 'Share my artistic journey', 'Build a newsletter audience'],
  BUSINESS: ['Generate qualified leads', 'Present my services clearly', 'Build lasting client relationships', 'Increase trust with prospects'],
  ECOMMERCE: ['Sell my creative work', 'Drive online sales', 'Launch new collections', 'Grow repeat purchases'],
  LANDING_PAGE: ['Promote a launch', 'Collect signups', 'Promoting an event', 'Drive campaign conversions'],
};

const SCENE_CARDS: SceneCard[] = [
  { image: 'assets/Templates Gallery/Mock Templates/1.jpg', label: 'Atelier', className: 'project-creation__scene-card--top-left' },
  { image: 'assets/Templates Gallery/Mock Templates/4.jpg', label: 'Bell&Co', className: 'project-creation__scene-card--right-mid' },
  { image: 'assets/Templates Gallery/Mock Templates/10.jpg', label: 'Knobbdy', className: 'project-creation__scene-card--bottom-right' },
  { image: 'assets/Templates Gallery/Mock Templates/8.jpg', label: 'Lampish', className: 'project-creation__scene-card--left-mid' },
];

@Component({
  selector: 'app-project-creation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-creation.html',
  styleUrl: './project-creation.css',
})
export class ProjectCreation implements OnDestroy {
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly toastService = inject(ToastService);
  private readonly timeouts: number[] = [];

  readonly screen = signal<CreationScreen>('type');
  readonly selectedType = signal<ProjectType | null>(null);
  readonly siteName = signal('');
  readonly selectedGoals = signal<string[]>([]);
  readonly goalsText = signal('');
  readonly isCreating = signal(false);

  readonly typeOptions = TYPE_OPTIONS;
  readonly sceneCards = SCENE_CARDS;

  readonly progressValue = computed(() => {
    switch (this.screen()) {
      case 'customizing':
      case 'type':
        return 25;
      case 'name':
        return 50;
      case 'goals':
        return 75;
      default:
        return 100;
    }
  });

  readonly shouldShowFooter = computed(() => {
    const current = this.screen();
    return current === 'type' || current === 'name' || current === 'goals';
  });

  readonly typeLabel = computed(() => {
    const current = this.selectedType();
    return this.typeOptions.find((option) => option.type === current)?.label ?? 'Site';
  });

  readonly nameSuggestions = computed(() => {
    const current = this.selectedType();
    return current ? TYPE_NAME_SUGGESTIONS[current] : [];
  });

  readonly goalSuggestions = computed(() => {
    const current = this.selectedType();
    return current ? TYPE_GOAL_SUGGESTIONS[current] : [];
  });

  readonly resolvedSiteName = computed(() => {
    const raw = this.siteName().trim();
    if (raw) {
      return raw;
    }

    const current = this.selectedType();
    if (current) {
      return TYPE_NAME_SUGGESTIONS[current][0];
    }

    return 'New Forma Site';
  });

  readonly primaryCtaLabel = computed(() => {
    switch (this.screen()) {
      case 'goals':
        return 'Create project';
      default:
        return 'Continue';
    }
  });

  readonly canContinue = computed(() => {
    switch (this.screen()) {
      case 'type':
        return Boolean(this.selectedType());
      case 'name':
        return this.siteName().trim().length > 0;
      case 'goals':
        return this.selectedGoals().length > 0 || this.goalsText().trim().length > 0;
      default:
        return false;
    }
  });

  ngOnDestroy(): void {
    this.clearTimers();
  }

  selectType(type: ProjectType): void {
    this.selectedType.set(type);
  }

  chooseNameSuggestion(value: string): void {
    this.siteName.set(value);
  }

  updateGoalsText(value: string): void {
    this.goalsText.set(value);
    this.selectedGoals.set(this.parseGoalEntries(value));
  }

  appendGoalSuggestion(goal: string): void {
    const currentGoals = this.parseGoalEntries(this.goalsText());
    if (currentGoals.includes(goal)) {
      return;
    }

    const nextGoals = [...currentGoals, goal];
    const nextValue = nextGoals.join(', ');

    this.goalsText.set(nextValue);
    this.selectedGoals.set(nextGoals);
  }

  isGoalSelected(goal: string): boolean {
    return this.selectedGoals().includes(goal);
  }

  goBack(): void {
    switch (this.screen()) {
      case 'name':
        this.screen.set('type');
        break;
      case 'goals':
        this.screen.set('name');
        break;
      default:
        void this.router.navigate(['/app/projects']);
    }
  }

  continue(): void {
    switch (this.screen()) {
      case 'type':
        if (!this.selectedType()) {
          return;
        }
        this.startCustomizingTransition();
        break;
      case 'name':
        if (!this.siteName().trim()) {
          return;
        }
        this.screen.set('goals');
        break;
      case 'goals':
        if (!this.canContinue()) {
          return;
        }
        this.startProjectCreation();
        break;
    }
  }

  skipCurrentStep(): void {
    switch (this.screen()) {
      case 'name':
        this.siteName.set(this.resolvedSiteName());
        this.screen.set('goals');
        break;
      case 'goals':
        this.startProjectCreation();
        break;
    }
  }

  skipToDashboard(): void {
    if (this.isCreating()) {
      return;
    }

    void this.router.navigate(['/app/projects']);
  }

  private startCustomizingTransition(): void {
    this.screen.set('customizing');
    this.queueTimeout(() => this.screen.set('name'), 1500);
  }

  private startProjectCreation(): void {
    const type = this.selectedType();
    if (!type || this.isCreating()) {
      return;
    }

    this.screen.set('launching');
    this.isCreating.set(true);

    const startedAt = Date.now();
    this.projectService.createProject({
      name: this.resolvedSiteName(),
      description: this.buildProjectDescription(),
      type,
      creationMethod: 'AI_PROMPT',
    }).subscribe({
      next: () => {
        this.dashboardDataService.invalidateProjectsOverviewCache();

        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(900, 1800 - elapsed);

        this.queueTimeout(() => {
          this.toastService.success(`${this.resolvedSiteName()} is ready in your projects.`);
          void this.router.navigate(['/app/projects']);
        }, remaining);
      },
      error: () => {
        this.isCreating.set(false);
        this.screen.set('goals');
        this.toastService.error('We could not create your project. Please try again.');
      },
    });
  }

  private buildProjectDescription(): string {
    const parts = this.parseGoalEntries(this.goalsText());

    if (!parts.length) {
      return `${this.typeLabel()} project created from the guided setup flow.`;
    }

    return parts.join(' • ');
  }

  private parseGoalEntries(value: string): string[] {
    return Array.from(
      new Set(
        value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  }

  private queueTimeout(callback: () => void, delay: number): void {
    const handle = window.setTimeout(() => {
      const index = this.timeouts.indexOf(handle);
      if (index >= 0) {
        this.timeouts.splice(index, 1);
      }
      callback();
    }, delay);

    this.timeouts.push(handle);
  }

  private clearTimers(): void {
    while (this.timeouts.length) {
      window.clearTimeout(this.timeouts.pop());
    }
  }
}
