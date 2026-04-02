import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HomeActivityItem } from '../../home.model';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.css',
})
export class RecentActivity {
  @Input() activities: HomeActivityItem[] = [];

  trackByIndex = (index: number): number => index;
}
