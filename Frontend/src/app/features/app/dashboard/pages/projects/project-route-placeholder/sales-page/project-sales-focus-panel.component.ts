import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { SalesFocusItem } from './project-sales-page.types';

@Component({
  selector: 'app-project-sales-focus-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-sales-focus-panel.component.html',
  styleUrl: './project-sales-focus-panel.component.css'
})
export class ProjectSalesFocusPanelComponent {
  @Input({ required: true }) items: ReadonlyArray<SalesFocusItem> = [];
}
