import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { SalesTopProductView } from './project-sales-page.types';

@Component({
  selector: 'app-project-sales-products-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-sales-products-panel.component.html',
  styleUrl: './project-sales-products-panel.component.css'
})
export class ProjectSalesProductsPanelComponent {
  @Input({ required: true }) products: ReadonlyArray<SalesTopProductView> = [];
}
