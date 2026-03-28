import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeader } from '../../../shared/app/app-header/app-header';
import { SideBar } from '../../../shared/app/side-bar/side-bar';

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
  sidebarCollapsed = false;

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}