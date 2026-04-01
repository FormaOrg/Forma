import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardTemplateItem } from '../../../../../../../core/models/dashboard.model';

@Component({
  selector: 'app-template-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './template-card.html',
  styleUrl: './template-card.css',
})
export class TemplateCard {
  @Input({ required: true }) template!: DashboardTemplateItem;
  @Input() isCreating = false;
  @Output() readonly useTemplate = new EventEmitter<void>();
}
