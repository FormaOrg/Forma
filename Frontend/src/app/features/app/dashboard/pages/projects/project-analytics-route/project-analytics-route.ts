import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CategoryScale,
  Chart,
  ChartConfiguration,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js';
import {
  AnalyticsRangePreset,
  ProjectAnalyticsMetricOption,
  ProjectAnalyticsPageResponse
} from '../../../../../../core/models/project-analytics.model';
import { ProjectAnalyticsService } from '../../../../../../core/services/project-analytics.service';
import { I18nService } from '../../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../../landing-page/i18n/translate.pipe';

const RANGE_OPTIONS: ReadonlyArray<{ key: string; value: AnalyticsRangePreset }> = [
  { key: 'project.analytics.range.7days', value: 'LAST_7_DAYS' },
  { key: 'project.analytics.range.30days', value: 'LAST_30_DAYS' },
  { key: 'project.analytics.range.90days', value: 'LAST_90_DAYS' }
] as const;

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

@Component({
  selector: 'app-project-analytics-route',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './project-analytics-route.html',
  styleUrl: './project-analytics-route.css',
})
export class ProjectAnalyticsRoute implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly analyticsService = inject(ProjectAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private trendChart?: Chart;
  private viewReady = false;
  private analyticsRequestToken = 0;

  @ViewChild('trendCanvas')
  private readonly trendCanvas?: ElementRef<HTMLCanvasElement>;

  readonly rangeOptions = RANGE_OPTIONS;
  readonly selectedRange = signal<AnalyticsRangePreset>('LAST_30_DAYS');
  readonly selectedMetric = signal<string>('customers');
  readonly projectId = signal<number | null>(this.parseProjectId(this.route.parent?.snapshot.paramMap.get('projectId')));
  readonly analytics = signal<ProjectAnalyticsPageResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly summaryCards = computed(() => this.analytics()?.summaryCards ?? []);
  readonly metricOptions = computed(() => this.analytics()?.metricOptions ?? []);
  readonly activeMetric = computed(() => this.metricOptions().find((option) => option.key === this.selectedMetric()) ?? this.metricOptions()[0] ?? null);
  readonly heroTitle = computed(() =>
    this.analytics()?.kind === 'PORTFOLIO'
      ? this.i18n.t('project.analytics.hero.portfolioTitle')
      : this.i18n.t('project.analytics.hero.ecommerceTitle')
  );
  readonly heroSubtitle = computed(() => {
    const projectId = this.projectId();
    if (this.analytics()?.kind === 'PORTFOLIO') {
      return `${this.i18n.t('project.analytics.hero.portfolioSubtitle.prefix')} #${projectId ?? '—'} ${this.i18n.t('project.analytics.hero.portfolioSubtitle.suffix')}`;
    }

    return `${this.i18n.t('project.analytics.hero.ecommerceSubtitle.prefix')} #${projectId ?? '—'} ${this.i18n.t('project.analytics.hero.ecommerceSubtitle.suffix')}`;
  });

  ngOnInit(): void {
    this.route.parent?.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.projectId.set(this.parseProjectId(params.get('projectId')));
        this.loadAnalytics();
      });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderTrendChart();
  }

  ngOnDestroy(): void {
    this.trendChart?.destroy();
  }

  setRange(range: AnalyticsRangePreset): void {
    if (this.selectedRange() === range) {
      return;
    }

    this.selectedRange.set(range);
    this.loadAnalytics();
  }

  setMetric(metric: string): void {
    if (this.selectedMetric() === metric) {
      return;
    }

    this.selectedMetric.set(metric);
    this.renderTrendChart();
  }

  private loadAnalytics(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.analytics.set(null);
      this.errorMessage.set(this.i18n.t('project.analytics.errors.notFound'));
      this.isLoading.set(false);
      return;
    }

    const requestToken = ++this.analyticsRequestToken;
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.analyticsService
      .getAnalyticsPage(projectId, this.selectedRange())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (requestToken !== this.analyticsRequestToken) {
            return;
          }

          this.analytics.set(response);
          const currentMetric = this.selectedMetric();
          const availableMetrics = response.metricOptions.map((option) => option.key);
          if (!availableMetrics.includes(currentMetric)) {
            this.selectedMetric.set(availableMetrics[0] ?? '');
          }

          this.isLoading.set(false);
          this.renderTrendChart();
        },
        error: () => {
          if (requestToken !== this.analyticsRequestToken) {
            return;
          }
          this.analytics.set(null);
          this.isLoading.set(false);
          this.errorMessage.set(this.i18n.t('project.analytics.errors.load'));
          this.renderTrendChart();
        }
      });
  }

  private renderTrendChart(): void {
    const canvas = this.trendCanvas?.nativeElement;
    const analytics = this.analytics();
    const activeMetric = this.activeMetric();
    if (!this.viewReady || !canvas || !analytics || !activeMetric) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const isDarkTheme =
      !!canvas.closest('.theme-dark')
      || document.body.classList.contains('theme-dark')
      || document.documentElement.classList.contains('theme-dark');

    const labels = analytics.chartPoints.map((point) => point.label);
    const data = analytics.chartPoints.map((point) =>
      point.metrics.find((metric) => metric.key === activeMetric.key)?.value ?? 0
    );

    const strokeGradient = context.createLinearGradient(0, 0, canvas.width || 600, 0);
    strokeGradient.addColorStop(0, '#8fd7ff');
    strokeGradient.addColorStop(0.55, '#7566ff');
    strokeGradient.addColorStop(1, '#5ac8a4');

    const fillGradient = context.createLinearGradient(0, 0, 0, canvas.height || 320);
    fillGradient.addColorStop(0, 'rgba(117, 102, 255, 0.24)');
    fillGradient.addColorStop(1, 'rgba(117, 102, 255, 0)');

    const configuration: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data,
            borderColor: strokeGradient,
            backgroundColor: fillGradient,
            fill: true,
            borderWidth: 4,
            tension: 0.36,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBorderWidth: 2,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#7566ff',
            clip: 12
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: {
          padding: {
            top: 8,
            right: 10,
            bottom: 0,
            left: 4
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDarkTheme ? '#111723' : '#151b28',
            padding: 12,
            titleColor: '#f4f7ff',
            bodyColor: '#dfe7fb',
            displayColors: false,
            callbacks: {
              label: (contextItem) => this.formatTooltipValue(contextItem.parsed.y ?? 0, activeMetric)
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            border: {
              display: false
            },
            ticks: {
              color: isDarkTheme ? 'rgba(226, 231, 244, 0.68)' : 'rgba(11, 11, 18, 0.52)',
              font: {
                size: 12,
                weight: 500
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: isDarkTheme ? 'rgba(226, 231, 244, 0.09)' : 'rgba(117, 102, 255, 0.12)'
            },
            border: {
              display: false
            },
            ticks: {
              color: isDarkTheme ? 'rgba(226, 231, 244, 0.62)' : 'rgba(11, 11, 18, 0.42)',
              padding: 12,
              callback: (value) => this.formatAxisTick(Number(value), activeMetric)
            }
          }
        }
      }
    };

    this.trendChart?.destroy();
    this.trendChart = new Chart(context, configuration);
  }

  private parseProjectId(value: string | null | undefined): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private formatInteger(value: number): string {
    return new Intl.NumberFormat(this.i18n.lang() === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 0 }).format(value);
  }

  formatPercentDelta(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  private formatCurrency(value: number): string {
    return `${new Intl.NumberFormat(this.i18n.lang() === 'fr' ? 'fr-FR' : 'en-US', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    }).format(value)} ${this.i18n.t('project.analytics.common.currency')}`;
  }

  private formatAxisTick(value: number, metric: ProjectAnalyticsMetricOption): string {
    if (metric.format === 'CURRENCY') {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
      }

      return `${Math.round(value)}`;
    }

    if (value >= 1000) {
      return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    }

    return String(Math.round(value));
  }

  private formatTooltipValue(value: number, metric: ProjectAnalyticsMetricOption): string {
    if (metric.format === 'CURRENCY') {
      return this.formatCurrency(value);
    }

    if (metric.format === 'PERCENT') {
      return `${value.toFixed(1)}%`;
    }

    return `${this.formatInteger(value)} ${metric.label.toLowerCase()}`;
  }
}
