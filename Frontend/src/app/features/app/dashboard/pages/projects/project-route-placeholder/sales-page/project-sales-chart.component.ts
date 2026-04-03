import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { SalesTrendPoint } from './project-sales-page.types';

@Component({
  selector: 'app-project-sales-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-sales-chart.component.html',
  styleUrl: './project-sales-chart.component.css'
})
export class ProjectSalesChartComponent {
  @Input({ required: true }) trend: ReadonlyArray<SalesTrendPoint> = [];

  revenuePolyline(): string {
    if (!this.trend.length) {
      return '';
    }

    const width = 640;
    const height = 240;
    const max = Math.max(...this.trend.map((point) => point.revenue), 1);
    const step = width / Math.max(this.trend.length - 1, 1);

    return this.trend
      .map((point, index) => {
        const x = Math.round(index * step);
        const y = Math.round(height - (point.revenue / max) * (height - 20) - 10);
        return `${x},${y}`;
      })
      .join(' ');
  }

  areaPath(): string {
    const points = this.revenuePolyline();
    if (!points) {
      return '';
    }

    return `M ${points.split(' ').join(' L ')} L 640,240 L 0,240 Z`;
  }

  revenueTicks(): number[] {
    if (!this.trend.length) {
      return [0, 0, 0, 0];
    }

    const max = Math.max(...this.trend.map((point) => point.revenue), 1);
    return [1, 0.75, 0.5, 0.25].map((ratio) => Math.round((max * ratio) / 1000) * 1000);
  }

  tickOffset(value: number): number {
    const max = Math.max(...this.trend.map((point) => point.revenue), 1);
    return Math.round(240 - (value / max) * (240 - 20) - 10);
  }

  pointX(index: number): number {
    const step = 640 / Math.max(this.trend.length - 1, 1);
    return Math.round(index * step);
  }

  pointY(value: number): number {
    const max = Math.max(...this.trend.map((point) => point.revenue), 1);
    return Math.round(240 - (value / max) * (240 - 20) - 10);
  }
}
