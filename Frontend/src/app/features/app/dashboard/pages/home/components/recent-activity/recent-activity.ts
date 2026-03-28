import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type ActivityType = 'edited' | 'published' | 'created';

type RecentActivityItem = {
  title: string;
  time: string;
  type: ActivityType;
};

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.css'
})
export class RecentActivity {
  readonly activities = signal<RecentActivityItem[]>([
    {
      title: 'Portfolio Website edited',
      time: '2 hours ago',
      type: 'edited'
    },
    {
      title: 'Landing Page published',
      time: '3 days ago',
      type: 'published'
    },
    {
      title: 'E-commerce Store created',
      time: '5 days ago',
      type: 'created'
    },
    {
      title: 'Blog Platform edited',
      time: '6 days ago',
      type: 'edited'
    }
  ]);

  trackByIndex = (index: number): number => index;
}
