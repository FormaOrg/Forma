import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type ProjectStatus = 'published' | 'draft';

export type ProjectCardItem = {
  id: string;
  name: string;
  status: ProjectStatus | 'archived';
  statusLabel: string;
  domain?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  lastEditedLabel: string;
  updatedDateLabel?: string;
  createdLabel: string;
  createdDateLabel?: string;
  accent: string;
  route?: string;
  metadata?: string;
};

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-card.html',
})
export class ProjectCard {
  @Input({ required: true }) project!: ProjectCardItem;
  @Input() highlighted = false;
  @Input() actionsOpen = false;
  @Output() moreRequested = new EventEmitter<MouseEvent>();

  requestMoreActions(event: MouseEvent): void {
    event.stopPropagation();
    this.moreRequested.emit(event);
  }
}
