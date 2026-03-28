import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Lucide / Heroicons-style outline icons, 24×24 viewBox. */
export type AppIconName =
  | 'menu'
  | 'home'
  | 'folder'
  | 'layout-grid'
  | 'chevron-down'
  | 'user'
  | 'credit-card'
  | 'settings'
  | 'help'
  | 'search'
  | 'log-out'
  | 'sparkles'
  | 'panel-left';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.width]="size"
      [attr.height]="size"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name) {
        @case ('menu') {
          <path d="M4 6h16M4 12h16M4 18h16" />
        }
        @case ('panel-left') {
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
        }
        @case ('home') {
          <g>
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M9 22V12h6v10" />
          </g>
        }
        @case ('folder') {
          <path
            d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.6a2 2 0 0 1-1.7-.9l-.9-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"
          />
        }
        @case ('layout-grid') {
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        }
        @case ('chevron-down') {
          <path d="m6 9 6 6 6-6" />
        }
        @case ('user') {
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1" />
        }
        @case ('credit-card') {
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
          />
        }
        @case ('help') {
          <g>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </g>
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        }
        @case ('log-out') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        }
        @case ('sparkles') {
          <path d="M9.9 4.2 12 2l2.1 2.2L16 6l-1.9 1.9L12 12l-2.1-4.1L8 6z" />
          <path d="M4.5 13.5 6 12l1.5 1.5L9 15l-1.5 1.5L6 18l-1.5-1.5L3 15z" />
          <path d="m14.5 16.5 1-1 1 1-1 1-1-1z" />
        }
      }
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      color: inherit;
      align-items: center;
      justify-content: center;
    }
  `
})
export class AppIcon {
  @Input({ required: true }) name!: AppIconName;
  @Input() size = 20;
}
