import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AppIcon } from '../../../../../../../shared/app/icons/app-icon';
import { SalesOrderSelectionChange, SalesOrderView } from './project-sales-page.types';

@Component({
  selector: 'app-project-sales-orders-table',
  standalone: true,
  imports: [CommonModule, AppIcon],
  templateUrl: './project-sales-orders-table.component.html',
  styleUrl: './project-sales-orders-table.component.css'
})
export class ProjectSalesOrdersTableComponent {
  @Input({ required: true }) orders: ReadonlyArray<SalesOrderView> = [];
  @Input({ required: true }) selectedOrderIds: ReadonlyArray<number> = [];
  @Input({ required: true }) allVisibleOrdersSelected = false;

  @Output() selectAllChange = new EventEmitter<boolean>();
  @Output() orderSelectionChange = new EventEmitter<SalesOrderSelectionChange>();
  @Output() editOrder = new EventEmitter<number>();

  isSelected(orderId: number): boolean {
    return this.selectedOrderIds.includes(orderId);
  }

  onSelectAllChange(selected: boolean): void {
    this.selectAllChange.emit(selected);
  }

  onOrderSelectionChange(orderId: number, selected: boolean): void {
    this.orderSelectionChange.emit({ orderId, selected });
  }

  onEditOrder(orderId: number): void {
    this.editOrder.emit(orderId);
  }
}
