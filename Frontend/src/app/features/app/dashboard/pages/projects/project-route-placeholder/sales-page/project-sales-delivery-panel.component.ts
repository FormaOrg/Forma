import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { SalesDeliveryStatView } from './project-sales-page.types';

@Component({
  selector: 'app-project-sales-delivery-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-sales-delivery-panel.component.html',
  styleUrl: './project-sales-delivery-panel.component.css'
})
export class ProjectSalesDeliveryPanelComponent {
  @Input({ required: true }) items: ReadonlyArray<SalesDeliveryStatView> = [];
}
