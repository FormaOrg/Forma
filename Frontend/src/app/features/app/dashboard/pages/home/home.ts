import { Component } from '@angular/core';
import { GreetingSection } from './components/greeting-section/greeting-section';
import { DataCard } from "./components/data-card/data-card";
import { RecentProjects } from "./components/recent-projects/recent-projects";
import { RecentActivity } from "./components/recent-activity/recent-activity";
import { AccountSnapshot } from './components/account-snapshot/account-snapshot';
import { SetupProgress } from './components/setup-progress/setup-progress';
import { RecentTemplates } from './components/recent-templates/recent-templates';

@Component({
  selector: 'app-home',
  imports: [GreetingSection, DataCard, RecentProjects, RecentActivity, AccountSnapshot, SetupProgress, RecentTemplates],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  globeIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2Z" stroke="currentColor" stroke-width="1.8"/>
    <path d="M2 12H22" stroke="currentColor" stroke-width="1.8"/>
    <path d="M12 2C14.5 4.7 16 8.2 16 12C16 15.8 14.5 19.3 12 22C9.5 19.3 8 15.8 8 12C8 8.2 9.5 4.7 12 2Z" stroke="currentColor" stroke-width="1.8"/>
  </svg>
  `;

  checkIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
    <path d="M8 12L10.8 14.8L16 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `;

  draftIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 3H14L19 8V21H7V3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M14 3V8H19" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M10 12H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M10 16H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
  `;

  clockIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
    <path d="M12 7V12L15 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `;
}
