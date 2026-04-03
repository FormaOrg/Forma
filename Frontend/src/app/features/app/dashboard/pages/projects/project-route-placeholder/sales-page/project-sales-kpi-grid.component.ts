import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { SalesKpiCard } from './project-sales-page.types';

@Component({
  selector: 'app-project-sales-kpi-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-sales-kpi-grid.component.html',
  styleUrl: './project-sales-kpi-grid.component.css'
})
export class ProjectSalesKpiGridComponent {
  @Input({ required: true }) kpis: ReadonlyArray<SalesKpiCard> = [];
}
