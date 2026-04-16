import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
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

import { SalesTrendPoint } from './project-sales-page.types';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

@Component({
  selector: 'app-project-sales-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-sales-chart.component.html',
  styleUrl: './project-sales-chart.component.css'
})
export class ProjectSalesChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) trend: ReadonlyArray<SalesTrendPoint> = [];

  @ViewChild('salesTrendCanvas')
  private readonly salesTrendCanvas?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderChart();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.viewReady) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(): void {
    const canvas = this.salesTrendCanvas?.nativeElement;
    if (!canvas || !this.trend.length) {
      this.chart?.destroy();
      this.chart = undefined;
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

    const labels = this.trend.map((point) => point.label);
    const values = this.trend.map((point) => point.revenue);

    const strokeGradient = context.createLinearGradient(0, 0, canvas.width || 640, 0);
    strokeGradient.addColorStop(0, '#8fd7ff');
    strokeGradient.addColorStop(0.55, '#7566ff');
    strokeGradient.addColorStop(1, '#5ac8a4');

    const fillGradient = context.createLinearGradient(0, 0, 0, canvas.height || 300);
    fillGradient.addColorStop(0, 'rgba(117, 102, 255, 0.20)');
    fillGradient.addColorStop(1, 'rgba(117, 102, 255, 0)');

    const configuration: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: strokeGradient,
            backgroundColor: fillGradient,
            fill: true,
            borderWidth: 3.5,
            tension: 0.35,
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
            top: 10,
            right: 8,
            bottom: 0,
            left: 6
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
              label: (contextItem) => `${this.formatCurrency(contextItem.parsed.y ?? 0)}`
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
              color: isDarkTheme ? 'rgba(226, 231, 244, 0.64)' : 'rgba(17, 17, 17, 0.52)',
              font: {
                size: 11,
                weight: 500
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: isDarkTheme ? 'rgba(226, 231, 244, 0.08)' : 'rgba(117, 102, 255, 0.10)'
            },
            border: {
              display: false
            },
            ticks: {
              color: isDarkTheme ? 'rgba(226, 231, 244, 0.58)' : 'rgba(17, 17, 17, 0.46)',
              padding: 10,
              callback: (value) => this.formatAxisTick(Number(value))
            }
          }
        }
      }
    };

    this.chart?.destroy();
    this.chart = new Chart(context, configuration);
  }

  private formatAxisTick(value: number): string {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    }

    return `${Math.round(value)}`;
  }

  private formatCurrency(value: number): string {
    return `${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    }).format(value)} TND`;
  }
}
