import type { AppIconName } from './icons/app-icon';

/** Child link in an expandable sidebar item. */
export interface SidebarChildItem {
  label: string;
  route: string;
}

/** Primary nav row: link or expandable group. */
export interface SidebarItem {
  label: string;
  icon: AppIconName;
  route?: string;
  hasDropdown: boolean;
  expanded?: boolean;
  children?: SidebarChildItem[];
}

/** Group heading + items (e.g. Menu, Account). */
export interface SidebarSection {
  id: string;
  label: string;
  items: SidebarItem[];
}

export type ProfileMenuAction = 'profile' | 'billing' | 'settings' | 'help' | 'logout';

export interface ProfileMenuItem {
  label: string;
  icon: AppIconName;
  action: ProfileMenuAction;
  route?: string;
  danger?: boolean;
}

export interface HeaderActionButton {
  label: string;
  variant: 'primary' | 'secondary';
  route?: string;
}
