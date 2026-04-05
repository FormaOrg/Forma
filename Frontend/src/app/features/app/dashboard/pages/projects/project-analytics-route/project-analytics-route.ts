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
import { AnalyticsRangePreset, ProjectAnalyticsPageResponse } from '../../../../../../core/models/project-analytics.model';
import { ProjectAnalyticsService } from '../../../../../../core/services/project-analytics.service';

type AnalyticsMetric = 'customers' | 'orders' | 'revenue';

const RANGE_OPTIONS: ReadonlyArray<{ label: string; value: AnalyticsRangePreset }> = [
  { label: '7 days', value: 'LAST_7_DAYS' },
  { label: '30 days', value: 'LAST_30_DAYS' },
  { label: '90 days', value: 'LAST_90_DAYS' }
] as const;

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

@Component({
  selector: 'app-project-analytics-route',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-analytics-route.html',
})
export class ProjectAnalyticsRoute implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly analyticsService = inject(ProjectAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);
  private trendChart?: Chart;
  private viewReady = false;
  private analyticsRequestToken = 0;

  @ViewChild('trendCanvas')
  private readonly trendCanvas?: ElementRef<HTMLCanvasElement>;

  readonly rangeOptions = RANGE_OPTIONS;
  readonly selectedRange = signal<AnalyticsRangePreset>('LAST_30_DAYS');
  readonly selectedMetric = signal<AnalyticsMetric>('customers');
  readonly projectId = signal<number | null>(this.parseProjectId(this.route.parent?.snapshot.paramMap.get('projectId')));
  readonly analytics = signal<ProjectAnalyticsPageResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly summaryCards = computed(() => {
    const summary = this.analytics()?.summary;

    return [
      {
        label: 'Customers',
        value: this.formatInteger(summary?.customers ?? 0),
        change: this.formatPercentDelta(summary?.customersChangePercent ?? 0),
        tone: 'violet',
        icon: 'customers'
      },
      {
        label: 'Orders',
        value: this.formatInteger(summary?.orders ?? 0),
        change: this.formatPercentDelta(summary?.ordersChangePercent ?? 0),
        tone: 'blue',
        icon: 'orders'
      },
      {
        label: 'Revenue',
        value: this.formatCurrency(summary?.revenue ?? 0),
        change: this.formatPercentDelta(summary?.revenueChangePercent ?? 0),
        tone: 'mint',
        icon: 'revenue'
      },
      {
        label: 'Average order value',
        value: this.formatCurrency(summary?.averageOrderValue ?? 0),
        change: this.formatPercentDelta(summary?.averageOrderValueChangePercent ?? 0),
        tone: 'amber',
        icon: 'average'
      }
    ] as const;
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

  setMetric(metric: AnalyticsMetric): void {
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
      this.errorMessage.set('Project not found.');
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
          this.isLoading.set(false);
          this.renderTrendChart();
        },
        error: () => {
          if (requestToken !== this.analyticsRequestToken) {
            return;
          }
          this.analytics.set(null);
          this.isLoading.set(false);
          this.errorMessage.set('We could not load analytics right now.');
          this.renderTrendChart();
        }
      });
  }

  private renderTrendChart(): void {
    const canvas = this.trendCanvas?.nativeElement;
    const analytics = this.analytics();
    if (!this.viewReady || !canvas || !analytics) {
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
      this.selectedMetric() === 'customers' ? point.customers :
        this.selectedMetric() === 'orders' ? point.orders : point.revenue
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
              label: (contextItem) => this.formatTooltipValue(contextItem.parsed.y ?? 0)
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
              callback: (value) => this.formatAxisTick(Number(value))
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
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  }

  private formatCurrency(value: number): string {
    return `${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    }).format(value)} TND`;
  }

  private formatPercentDelta(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  private formatAxisTick(value: number): string {
    if (this.selectedMetric() === 'revenue') {
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

  private formatTooltipValue(value: number): string {
    if (this.selectedMetric() === 'revenue') {
      return this.formatCurrency(value);
    }

    if (this.selectedMetric() === 'orders') {
      return `${this.formatInteger(value)} orders`;
    }

    return `${this.formatInteger(value)} customers`;
  }
}
