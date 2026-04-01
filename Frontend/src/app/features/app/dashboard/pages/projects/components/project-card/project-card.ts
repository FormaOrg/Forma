import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type ProjectStatus = 'published' | 'draft';

export type ProjectCardItem = {
  id: string;
  name: string;
  status: ProjectStatus;
  domain?: string;
  lastEditedLabel: string;
  createdLabel: string;
  accent: string;
  route: string;
};

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-card.html',
  styleUrl: './project-card.css',
})
export class ProjectCard {
  @Input({ required: true }) project!: ProjectCardItem;
  @Input() highlighted = false;
}
