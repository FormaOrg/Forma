import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GreetingSection } from './components/greeting-section/greeting-section';
import { DataCard } from './components/data-card/data-card';
import { RecentProjects } from './components/recent-projects/recent-projects';
import { RecentActivity } from './components/recent-activity/recent-activity';
import { RecentTemplates } from './components/recent-templates/recent-templates';
import { AccountSnapshot } from './components/account-snapshot/account-snapshot';
import { SetupProgress } from './components/setup-progress/setup-progress';

type StatIconKey = 'globe' | 'check' | 'draft' | 'clock';

type HomeStatCard = {
  id: string;
  iconKey: StatIconKey;
  title: string;
  value: string;
  description: string;
};

type HomeQuickLink = {
  label: string;
  path: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    GreetingSection,
    DataCard,
    RecentProjects,
    RecentActivity,
    RecentTemplates,
    AccountSnapshot,
    SetupProgress
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private readonly svg: Record<StatIconKey, string> = {
    globe: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12H22" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><path d="M12 2C14.5 4.7 16 8.2 16 12C16 15.8 14.5 19.3 12 22C9.5 19.3 8 15.8 8 12C8 8.2 9.5 4.7 12 2Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.75"/><path d="M8 12L10.8 14.8L16 9.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    draft: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 3H14L19 8V21H7V3Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M14 3V8H19" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M10 12H16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><path d="M10 16H16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.75"/><path d="M12 7V12L15 15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };

  readonly quickLinks = signal<HomeQuickLink[]>([
    { label: 'Projects', path: '/app/projects' },
    { label: 'Templates', path: '/app/templates' },
    { label: 'Billing', path: '/app/billing' },
    { label: 'Settings', path: '/app/settings' },
    { label: 'Support', path: '/contact' }
  ]);

  readonly statCards = signal<HomeStatCard[]>([
    {
      id: 'sites',
      iconKey: 'globe',
      title: 'Sites',
      value: '12',
      description: '+2 this month'
    },
    {
      id: 'live',
      iconKey: 'check',
      title: 'Published',
      value: '8',
      description: '66% of total'
    },
    {
      id: 'drafts',
      iconKey: 'draft',
      title: 'Drafts',
      value: '4',
      description: 'Ready to ship'
    },
    {
      id: 'activity',
      iconKey: 'clock',
      title: 'Last edit',
      value: '2h ago',
      description: 'Portfolio site'
    }
  ]);

  iconFor(key: StatIconKey): string {
    return this.svg[key];
  }
}
