import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeader } from '../../../shared/app/app-header/app-header';
import { SideBar } from '../../../shared/app/side-bar/side-bar';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    AppHeader,
    SideBar
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private sidebarStateService = inject(SidebarStateService);

  get sidebarCollapsed(): boolean {
    return this.sidebarStateService.isCollapsed;
  }

  toggleSidebar(): void {
    this.sidebarStateService.toggleCollapsed();
  }
}