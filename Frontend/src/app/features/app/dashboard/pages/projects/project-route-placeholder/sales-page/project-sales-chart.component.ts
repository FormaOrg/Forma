import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { SalesTrendPoint } from './project-sales-page.types';

interface SalesChartPointView extends SalesTrendPoint {
  x: number;
  y: number;
}

interface SalesChartTickView {
  value: number;
  offset: number;
}

@Component({
  selector: 'app-project-sales-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-sales-chart.component.html',
  styleUrl: './project-sales-chart.component.css'
})
export class ProjectSalesChartComponent {
  @Input({ required: true })
  set trend(value: ReadonlyArray<SalesTrendPoint>) {
    this._trend = value;
    this.rebuildChartView();
  }

  get trend(): ReadonlyArray<SalesTrendPoint> {
    return this._trend;
  }

  private _trend: ReadonlyArray<SalesTrendPoint> = [];

  polyline = '';
  areaPathValue = '';
  tickMarkers: ReadonlyArray<SalesChartTickView> = [];
  points: ReadonlyArray<SalesChartPointView> = [];

  private rebuildChartView(): void {
    if (!this._trend.length) {
      this.polyline = '';
      this.areaPathValue = '';
      this.tickMarkers = [];
      this.points = [];
      return;
    }

    const width = 640;
    const height = 240;
    const max = Math.max(...this._trend.map((point) => point.revenue), 1);
    const step = width / Math.max(this._trend.length - 1, 1);

    this.points = this._trend.map((point, index) => {
      const x = Math.round(index * step);
      const y = Math.round(height - (point.revenue / max) * (height - 20) - 10);
      return { ...point, x, y };
    });
    this.polyline = this.points.map((point) => `${point.x},${point.y}`).join(' ');
    this.areaPathValue = this.polyline
      ? `M ${this.polyline.split(' ').join(' L ')} L 640,240 L 0,240 Z`
      : '';
    this.tickMarkers = [1, 0.75, 0.5, 0.25].map((ratio) => {
      const value = Math.round((max * ratio) / 1000) * 1000;
      return {
        value,
        offset: Math.round(240 - (value / max) * (240 - 20) - 10)
      };
    });
  }
}
