import type { AppIconName } from '../app/icons/app-icon';

export interface SettingsSidebarItem {
  label: string;
  icon: AppIconName;
  route: string;
}

export interface SettingsSidebarSection {
  id: string;
  label: string;
  items: SettingsSidebarItem[];
}
