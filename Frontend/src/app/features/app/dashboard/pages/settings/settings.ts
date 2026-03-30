import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsSidebar } from '../../../../../shared/app/settings-sidebar/settings-sidebar';
import { SidebarStateService } from '../../../../../core/services/sidebar-state.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    RouterOutlet,
    SettingsSidebar
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {
  private sidebarStateService = inject(SidebarStateService);

  get sidebarCollapsed(): boolean {
    return this.sidebarStateService.isCollapsed;
  }
}
