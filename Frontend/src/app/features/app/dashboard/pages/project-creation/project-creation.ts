import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreationMethod, Project, ProjectType } from '../../../../../core/models/project.model';
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

interface LaunchStep {
  label: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: 'PORTFOLIO',
    label: 'Portfolio',
    description: 'Highlight your work, story, and signature style in a refined personal space.',
    tag: 'Creative',
    previewImage: 'assets/Portfolio Website Gallery/Templates/Music1.avif',
    accent: '#7566ff',
  },
  {
    type: 'ECOMMERCE',
    label: 'E-commerce',
    description: 'Launch a storefront with product drops, collections, and polished buying flows.',
    tag: 'Store',
    previewImage: 'assets/Ecommerce Showcase/Templates/Fashion2.png',
    accent: '#f29d64',
  },
  {
    type: 'BLOG',
    label: 'Blog',
    description: 'Publish essays, updates, and articles with a clean editorial presence.',
    tag: 'Editorial',
    previewImage: 'assets/Blog Showcase/Templates/personal1.png',
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

const LAUNCH_STEPS: LaunchStep[] = [
  { label: 'Adding site details to your dashboard' },
  { label: 'Preparing tools to manage your site' },
  { label: 'Personalizing steps in your setup guide' },
];

const CUSTOMIZING_TEXT = 'Customizing the next steps for you';
const SCREEN_EXIT_DELAY = 1000;
const SCREEN_ENTER_DURATION = 2000;
const CUSTOMIZING_HOLD_DURATION = 3200;

@Component({
  selector: 'app-project-creation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-creation.html',
})
export class ProjectCreation implements OnDestroy {
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly toastService = inject(ToastService);
  private readonly timeouts: number[] = [];
  private readonly screenActivatedAt = new Map<CreationScreen, number>();
  private readonly handleResize = () => this.scheduleTransitionLineLayout();
  private layoutFrame: number | null = null;

  @ViewChild('customizingMeasure') private customizingMeasure?: ElementRef<HTMLElement>;
  @ViewChild('launchMeasure') private launchMeasure?: ElementRef<HTMLElement>;

  readonly screen = signal<CreationScreen>('type');
  readonly leavingScreen = signal<CreationScreen | null>(null);
  readonly selectedType = signal<ProjectType | null>(null);
  readonly siteName = signal('');
  readonly selectedGoals = signal<string[]>([]);
  readonly goalsText = signal('');
  readonly isCreating = signal(false);
  readonly isTransitioning = signal(false);
  readonly launchStepProgress = signal(0);
  readonly customizingLines = signal<string[]>([CUSTOMIZING_TEXT]);
  readonly launchLines = signal<string[]>([]);
  readonly sceneMotion = signal<'prep' | 'enter' | 'leave' | 'rest'>('prep');
  readonly typeOptions = TYPE_OPTIONS;
  readonly sceneCards = SCENE_CARDS;
  readonly launchSteps = LAUNCH_STEPS;
  readonly customizingText = CUSTOMIZING_TEXT;
  readonly customizingMeasureWords = this.splitMeasureWords(CUSTOMIZING_TEXT);

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

  readonly launchText = computed(() => `Taking you to your site dashboard for ${this.resolvedSiteName()}`);
  readonly launchMeasureWords = computed(() => this.splitMeasureWords(this.launchText()));

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

  constructor() {
    this.markScreenActivated(this.screen());
    window.addEventListener('resize', this.handleResize);

    this.queueTimeout(() => {
      this.sceneMotion.set('enter');
    }, 40);

    this.queueTimeout(() => {
      if (this.sceneMotion() === 'enter') {
        this.sceneMotion.set('rest');
      }
    }, SCREEN_ENTER_DURATION + 80);

    effect(() => {
      this.screen();
      this.launchText();
      this.scheduleTransitionLineLayout();
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize);
    if (this.layoutFrame !== null) {
      window.cancelAnimationFrame(this.layoutFrame);
    }
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
      const nextGoals = currentGoals.filter((item) => item !== goal);
      const nextValue = nextGoals.join(', ');

      this.goalsText.set(nextValue);
      this.selectedGoals.set(nextGoals);
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

  transitionCycle(lineCount: number): string {
    return `${Math.max(1, lineCount) * 1450}ms`;
  }

  transitionDelay(index: number): string {
    return `${index * 1450}ms`;
  }

  shineOffset(screen: CreationScreen): string {
    if (screen !== 'customizing' && screen !== 'launching') {
      return '0ms';
    }

    const activatedAt = this.screenActivatedAt.get(screen);
    if (!activatedAt) {
      return '0ms';
    }

    return `${Math.max(0, Date.now() - activatedAt)}ms`;
  }

  launchStepState(index: number): 'done' | 'loading' | 'pending' {
    const progress = this.launchStepProgress();
    if (index < progress) {
      return 'done';
    }

    if (index === progress && progress < this.launchSteps.length) {
      return 'loading';
    }

    return 'pending';
  }

  goBack(): void {
    if (this.isTransitioning()) {
      return;
    }

    switch (this.screen()) {
      case 'name':
        this.setScreen('type');
        break;
      case 'goals':
        this.setScreen('name');
        break;
      default:
        void this.router.navigate(['/app/projects']);
    }
  }

  continue(): void {
    if (this.isTransitioning()) {
      return;
    }

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
        this.setScreen('goals');
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
    if (this.isTransitioning()) {
      return;
    }

    switch (this.screen()) {
      case 'name':
        this.siteName.set(this.resolvedSiteName());
        this.setScreen('goals');
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

    const type = this.selectedType() ?? 'PORTFOLIO';
    const defaultName = this.selectedType()
      ? `Untitled ${this.typeLabel()}`
      : 'Untitled Project';

    this.isCreating.set(true);
    this.createProjectWithFallback({
      name: defaultName,
      description: '',
      type,
      creationMethod: 'QUICK_START',
    }, 'VISUAL_DESIGNER').subscribe({
      next: (project) => {
        this.dashboardDataService.invalidateProjectsOverviewCache();
        this.toastService.success(`${defaultName} is ready in your dashboard.`);
        void this.router.navigate(['/app/projects', project.id]);
      },
      error: () => {
        this.isCreating.set(false);
        this.toastService.error('We could not create your quick project. Please try again.');
      },
    });
  }

  private startCustomizingTransition(): void {
    if (this.isTransitioning()) {
      return;
    }

    this.setScreen('customizing');
    this.queueTimeout(() => this.setScreen('name'), CUSTOMIZING_HOLD_DURATION);
  }

  private startProjectCreation(): void {
    const type = this.selectedType();
    if (!type || this.isCreating() || this.isTransitioning()) {
      return;
    }

    this.clearTimers();
    this.setScreen('launching');
    this.isCreating.set(true);
    this.launchStepProgress.set(0);

    const totalDuration = 5000;
    const firstStepDuration = 1700;
    const secondStepDuration = 1000;
    const thirdStepStart = firstStepDuration + secondStepDuration;

    this.queueTimeout(() => this.launchStepProgress.set(1), firstStepDuration);
    this.queueTimeout(() => this.launchStepProgress.set(2), thirdStepStart);

    const startedAt = Date.now();
    this.createProjectWithFallback({
      name: this.resolvedSiteName(),
      description: this.buildProjectDescription(),
      type,
      creationMethod: 'GUIDED_SETUP',
    }, 'VISUAL_DESIGNER').subscribe({
      next: (project) => {
        this.dashboardDataService.invalidateProjectsOverviewCache();

        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, totalDuration - elapsed);

        this.queueTimeout(() => {
          this.launchStepProgress.set(this.launchSteps.length);
          this.toastService.success(`${this.resolvedSiteName()} is ready in your dashboard.`);
          void this.router.navigate(['/app/projects', project.id]);
        }, remaining);
      },
      error: () => {
        this.clearTimers();
        this.isCreating.set(false);
        this.launchStepProgress.set(0);
        this.setScreen('goals');
        this.toastService.error('We could not create your project. Please try again.');
      },
    });
  }

  private createProjectWithFallback(
    request: {
      name: string;
      description: string;
      type: ProjectType;
      creationMethod: CreationMethod;
    },
    fallbackCreationMethod: CreationMethod
  ): Observable<Project> {
    return this.projectService.createProject(request).pipe(
      catchError((error) => {
        if (!this.shouldRetryWithFallback(error, request.creationMethod, fallbackCreationMethod)) {
          return throwError(() => error);
        }

        return this.projectService.createProject({
          ...request,
          creationMethod: fallbackCreationMethod,
        });
      })
    );
  }

  private shouldRetryWithFallback(
    error: unknown,
    creationMethod: CreationMethod,
    fallbackCreationMethod: CreationMethod
  ): boolean {
    if (creationMethod === fallbackCreationMethod) {
      return false;
    }

    if (typeof error !== 'object' || !error) {
      return false;
    }

    const status = 'status' in error && typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : undefined;

    return status === 400 || status === 500;
  }

  private setScreen(next: CreationScreen): void {
    const current = this.screen();
    if (current === next || this.isTransitioning()) {
      return;
    }

    this.isTransitioning.set(true);
    this.leavingScreen.set(current);
    this.sceneMotion.set('leave');
      this.queueTimeout(() => {
        this.screen.set(next);
        this.markScreenActivated(next);
        this.sceneMotion.set('prep');

      this.queueTimeout(() => {
        this.sceneMotion.set('enter');
      }, 16);

      this.queueTimeout(() => {
        if (this.leavingScreen() === current) {
          this.leavingScreen.set(null);
        }
        this.isTransitioning.set(false);
      }, SCREEN_ENTER_DURATION);

      this.queueTimeout(() => {
        if (this.sceneMotion() === 'enter') {
          this.sceneMotion.set('rest');
        }
      }, SCREEN_ENTER_DURATION + 32);
    }, SCREEN_EXIT_DELAY);
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

  private splitMeasureWords(text: string): string[] {
    return text
      .split(' ')
      .map((word, index, words) => (index < words.length - 1 ? `${word} ` : word));
  }

  private scheduleTransitionLineLayout(): void {
    if (this.layoutFrame !== null) {
      window.cancelAnimationFrame(this.layoutFrame);
    }

    this.layoutFrame = window.requestAnimationFrame(() => {
      this.layoutFrame = null;
      this.recomputeTransitionLines();
    });
  }

  private recomputeTransitionLines(): void {
    const customizingMeasured = this.measureRenderedLines(this.customizingMeasure?.nativeElement);
    if (customizingMeasured.length) {
      this.customizingLines.set(customizingMeasured);
    }

    const launchMeasured = this.measureRenderedLines(this.launchMeasure?.nativeElement);
    if (launchMeasured.length) {
      this.launchLines.set(launchMeasured);
    } else {
      this.launchLines.set([this.launchText()]);
    }
  }

  private measureRenderedLines(container?: HTMLElement): string[] {
    if (!container) {
      return [];
    }

    const words = Array.from(container.querySelectorAll<HTMLElement>('.project-creation__transition-measure-word'));
    if (!words.length) {
      return [];
    }

    const lines: string[] = [];
    let currentTop: number | null = null;
    let currentLine = '';

    for (const word of words) {
      const top = Math.round(word.offsetTop);

      if (currentTop === null) {
        currentTop = top;
      }

      if (Math.abs(top - currentTop) > 1) {
        lines.push(currentLine.trimEnd());
        currentLine = '';
        currentTop = top;
      }

      currentLine += word.textContent ?? '';
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trimEnd());
    }

    return lines;
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

  private markScreenActivated(screen: CreationScreen): void {
    this.screenActivatedAt.set(screen, Date.now());
  }
}
