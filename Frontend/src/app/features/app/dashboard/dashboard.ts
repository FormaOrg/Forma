import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeader } from '../../../shared/app/app-header/app-header';
import { SideBar } from '../../../shared/app/side-bar/side-bar';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { AppBootstrapService } from '../../../core/services/app-bootstrap.service';
import { BootstrapLoader } from '../../../shared/app/bootstrap-loader/bootstrap-loader';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    AppHeader,
    SideBar,
    BootstrapLoader
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private sidebarStateService = inject(SidebarStateService);
  readonly appBootstrapService = inject(AppBootstrapService);

  get sidebarCollapsed(): boolean {
    return this.sidebarStateService.isCollapsed;
  }

  ngOnInit(): void {
    void this.appBootstrapService.ensureInitialized();
  }

  toggleSidebar(): void {
    this.sidebarStateService.toggleCollapsed();
  }
}
