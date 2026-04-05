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
  | 'panel-left'
  | 'shield'
  | 'history'
  | 'arrow-left'
  | 'eye'
  | 'file-text'
  | 'image'
  | 'rocket'
  | 'users'
  | 'bar-chart'
  | 'package'
  | 'help-circle'
  | 'wand'
  | 'pen'
  | 'dollar-sign'
  | 'trash';

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
          <g>
            <path
              d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            />
            <circle cx="12" cy="12" r="3" />
          </g>
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
        @case ('shield') {
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        }
        @case ('history') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v6l4 2" />
        }
        @case ('arrow-left') {
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        }
        @case ('eye') {
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('file-text') {
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        }
        @case ('image') {
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="m21 15-4.5-4.5a1 1 0 0 0-1.4 0L9 16.6" />
          <path d="m14 14 1.5-1.5a1 1 0 0 1 1.4 0L21 16.6" />
        }
        @case ('rocket') {
          <path d="M12 2C12 2 7 6.5 7 13H17C17 6.5 12 2 12 2Z"
                stroke-linejoin="round" />
          <path d="M7 13L5 16L8.5 15.5"
                stroke-linecap="round" stroke-linejoin="round" />
          <path d="M17 13L19 16L15.5 15.5"
                stroke-linecap="round" stroke-linejoin="round" />
          <path d="M9.5 15.5C9.5 17 10.5 19 12 20.5C13.5 19 14.5 17 14.5 15.5"
                stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="12" cy="9.5" r="1.5" />
        }
        @case ('users') {
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7" r="3.5" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        }
        @case ('bar-chart') {
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-8" />
          <path d="M22 20v-5" />
        }
        @case ('package') {
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m12 12 8-4.5" />
          <path d="M12 12 4 7.5" />
          <path d="M12 21v-9" />
        }
        @case ('help-circle') {
          <circle cx="12" cy="12" r="10" />
          <path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        }
        @case ('wand') {
          <path d="m15 4 1.5 3L20 8.5l-3.5 1.5L15 13l-1.5-3L10 8.5 13.5 7 15 4Z" />
          <path d="m4 20 8.5-8.5" />
          <path d="m3 21 3-1 11-11-2-2L4 18l-1 3Z" />
        }
        @case ('pen') {
          <path d="m3 21 3.75-1 11-11a2.12 2.12 0 1 0-3-3l-11 11L3 21Z" />
          <path d="m14.5 6.5 3 3" />
          <path d="M12 20h9" />
        }
        @case ('dollar-sign') {
          <line x1="12" y1="2" x2="12" y2="19" />
          <path d="M16 7C16 5.343 14.209 4 12 4C9.791 4 8 5.343 8 7
                  C8 8.657 9.791 10 12 10C14.209 10 16 11.343 16 13
                  C16 14.657 14.209 16 12 16C9.791 16 8 14.657 8 13"
                stroke-linejoin="round" />
        }
        @case ('trash') {
          <path d="M3 6h18" />
          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
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
