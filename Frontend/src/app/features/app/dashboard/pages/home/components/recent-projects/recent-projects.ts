import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../../../landing-page/i18n/translate.pipe';
import { HomeRecentProject } from '../../home.model';

@Component({
  selector: 'app-recent-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './recent-projects.html',
  styleUrl: './recent-projects.css',
})
export class RecentProjects {
  @Input() projects: HomeRecentProject[] = [];

  trackByName = (_: number, project: HomeRecentProject): string => project.name;
}
