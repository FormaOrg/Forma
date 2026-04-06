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
  | 'trash'
  | 'undo-flow'
  | 'redo-flow'
  | 'zoom-minus'
  | 'zoom-plus'
  | 'cloud-check'
  | 'device-desktop'
  | 'device-mobile'
  | 'account-settings'
  | 'logout-door'
  | 'invite-plus'
  | 'move-up'
  | 'move-down'
  | 'more-horizontal';

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
        @case ('undo-flow') {
          <path
            fill="currentColor"
            stroke="none"
            d="M7.91 5.595a.75.75 0 1 1 1.06 1.06l-1.469 1.47h6.309a5.244 5.244 0 0 1 5.25 5.25 5.244 5.244 0 0 1-5.25 5.25h-1.88a.75.75 0 0 1 0-1.5h1.88a3.744 3.744 0 0 0 3.75-3.75 3.744 3.744 0 0 0-3.75-3.75H7.5l1.47 1.47.051.056a.75.75 0 0 1-1.055 1.056l-.057-.052-2.75-2.75a.75.75 0 0 1 0-1.06l2.75-2.75Z"
          />
        }
        @case ('redo-flow') {
          <path
            fill="currentColor"
            stroke="none"
            d="M15.03 5.595a.75.75 0 0 1 1.06 0l2.75 2.75a.75.75 0 0 1 0 1.06l-2.75 2.75-.057.052a.75.75 0 0 1-1.056-1.056l.052-.056 1.47-1.47H10.19a3.744 3.744 0 0 0-3.75 3.75 3.744 3.744 0 0 0 3.75 3.75h1.88a.75.75 0 0 1 0 1.5h-1.88a5.244 5.244 0 0 1-5.25-5.25 5.244 5.244 0 0 1 5.25-5.25h6.31l-1.47-1.47a.75.75 0 0 1 0-1.06Z"
          />
        }
        @case ('zoom-minus') {
          <path
            fill="currentColor"
            stroke="none"
            d="M16.25 11.25a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5h8.5Z"
          />
        }
        @case ('zoom-plus') {
          <path
            fill="currentColor"
            stroke="none"
            d="M12 5.75a.75.75 0 0 1 .75.75v4.75h4.75a.75.75 0 0 1 0 1.5h-4.75v4.75a.75.75 0 0 1-1.5 0v-4.75H6.5a.75.75 0 0 1 0-1.5h4.75V6.5a.75.75 0 0 1 .75-.75Z"
          />
        }
        @case ('cloud-check') {
          <path
            fill="currentColor"
            stroke="none"
            d="M13.39 11.05a.75.75 0 0 1 1.08 1.04l-2.76 2.861a.75.75 0 0 1-1.165-.106l-1.1-1.66a.75.75 0 0 1 1.25-.829l.584.88 2.112-2.186Z"
          />
          <path
            fill="currentColor"
            stroke="none"
            d="M12 5c2.95 0 5.36 2.34 5.49 5.26 1.75.61 3.01 2.28 3.01 4.24 0 2.48-2.02 4.5-4.5 4.5H8.5c-2.76 0-5-2.24-5-5 0-2.04 1.27-3.86 3.11-4.61C7.13 6.89 9.35 5 12 5Zm0 1.5a4 4 0 0 0-4 4v.05c-1.69.24-3 1.69-3 3.45 0 1.93 1.57 3.5 3.5 3.5H16c1.66 0 3-1.34 3-3s-1.34-3-3-3v-1a4 4 0 0 0-4-4Z"
          />
        }
        @case ('device-desktop') {
          <path
            fill="currentColor"
            stroke="none"
            d="M16 6c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2h-3.25v1.5h1.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5h1.5V15H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h8ZM8 7.5c-.28 0-.5.22-.5.5v5c0 .28.22.5.5.5h8c.28 0 .5-.22.5-.5V8c0-.28-.22-.5-.5-.5H8Z"
          />
        }
        @case ('device-mobile') {
          <path
            fill="currentColor"
            stroke="none"
            d="M12.25 8.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5h.5Z"
          />
          <path
            fill="currentColor"
            stroke="none"
            d="M14 6c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h4Zm-4 1.5c-.28 0-.5.22-.5.5v8c0 .28.22.5.5.5h4c.28 0 .5-.22.5-.5V8c0-.28-.22-.5-.5-.5h-4Z"
          />
        }
        @case ('account-settings') {
          <path
            fill="currentColor"
            stroke="none"
            d="M11.99 9.51a2.5 2.5 0 0 1 0 5 2.5 2.5 0 0 1 0-5Zm0 1.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1Z"
          />
          <path
            fill="currentColor"
            stroke="none"
            d="M12.48 4.51c.944 0 1.71.766 1.71 1.71v.151c.08.031.16.064.239.099l.101-.1a1.705 1.705 0 0 1 2.421 0l.672.672c.686.668.676 1.759.008 2.428l-.102.1c.035.079.068.159.099.24h.152c.944 0 1.711.766 1.711 1.71v.96c0 .943-.767 1.709-1.71 1.71h-.152c-.031.08-.065.16-.1.238l.102.101a1.705 1.705 0 0 1 0 2.421l-.68.68v-.001a1.703 1.703 0 0 1-2.42 0l-.102-.1a6.084 6.084 0 0 1-.239.098v.152c0 .944-.766 1.71-1.71 1.711h-.96c-.944 0-1.71-.767-1.71-1.71v-.153a5.957 5.957 0 0 1-.239-.099l-.093.094a1.703 1.703 0 0 1-2.427.008l-.68-.68a1.705 1.705 0 0 1 0-2.42l.1-.102a5.943 5.943 0 0 1-.099-.239h-.151a1.712 1.712 0 0 1-1.712-1.71v-.96c0-.944.768-1.71 1.712-1.71h.152c.031-.08.063-.16.098-.239l-.1-.1a1.704 1.704 0 0 1 0-2.42l.68-.68a1.704 1.704 0 0 1 2.42 0l.1.1c.079-.035.16-.068.24-.099V6.22c0-.944.765-1.71 1.71-1.71h.96Zm-.96 1.5a.21.21 0 0 0-.21.21v.69a.75.75 0 0 1-.55.723 4.426 4.426 0 0 0-.975.402.751.751 0 0 1-.894-.125l-.48-.48a.205.205 0 0 0-.293-.007l-.687.687a.204.204 0 0 0-.007.292l.487.488a.752.752 0 0 1 .125.894 4.42 4.42 0 0 0-.402.975.75.75 0 0 1-.723.55h-.69a.21.21 0 0 0-.21.21v.96c0 .116.094.21.21.21h.69l.124.011c.284.048.52.257.599.541.093.338.229.662.402.975a.752.752 0 0 1-.125.894l-.48.48a.206.206 0 0 0-.032.262l.025.03.687.687c.091.09.22.08.292.007l.007-.007.48-.48.094-.08a.751.751 0 0 1 .801-.045c.312.173.638.31.975.402.325.09.55.387.55.724v.69c0 .115.095.21.21.21h.96a.21.21 0 0 0 .21-.21v-.69c0-.338.227-.634.552-.724a4.43 4.43 0 0 0 .975-.402l.112-.05a.752.752 0 0 1 .782.176l.48.48c.09.09.221.08.293.006l.686-.686a.206.206 0 0 0 .007-.293l-.486-.487a.75.75 0 0 1-.126-.894c.173-.312.31-.638.402-.975l.043-.117a.751.751 0 0 1 .68-.434h.69a.212.212 0 0 0 .211-.21v-.96a.212.212 0 0 0-.21-.21h-.69a.75.75 0 0 1-.724-.551 4.421 4.421 0 0 0-.402-.975.75.75 0 0 1 .126-.894l.48-.48a.205.205 0 0 0 .006-.293l-.686-.687a.205.205 0 0 0-.293-.007l-.007.007-.48.48a.751.751 0 0 1-.894.125 4.428 4.428 0 0 0-.975-.402.75.75 0 0 1-.552-.723v-.69a.211.211 0 0 0-.21-.21h-.96Z"
          />
        }
        @case ('logout-door') {
          <path
            fill="currentColor"
            stroke="none"
            d="M16 5c1.104 0 2 .897 2 2.001v1.25a.75.75 0 0 1-1.5 0v-1.25a.5.5 0 0 0-.5-.5H8a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-1.25a.75.75 0 0 1 1.5 0v1.25a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-10C6 5.897 6.896 5 8 5h8Z"
          />
          <path
            fill="currentColor"
            stroke="none"
            d="M14.245 8.696a.75.75 0 0 1 1.06.05l2.5 2.75c.26.286.26.724 0 1.01l-2.5 2.75a.751.751 0 0 1-1.11-1.01l1.36-1.495H9.75a.75.75 0 0 1 0-1.5h5.805l-1.36-1.495a.75.75 0 0 1 .05-1.06Z"
          />
        }
        @case ('invite-plus') {
          <path
            fill="currentColor"
            stroke="none"
            d="M12 5.75a.75.75 0 0 1 .75.75v4.75h4.75a.75.75 0 0 1 0 1.5h-4.75v4.75a.75.75 0 0 1-1.5 0v-4.75H6.5a.75.75 0 0 1 0-1.5h4.75V6.5a.75.75 0 0 1 .75-.75Z"
          />
        }
        @case ('move-up') {
          <path
            fill="currentColor"
            stroke="none"
            d="M8.47 10.28a.75.75 0 0 1 0-1.06l3-3a.745.745 0 0 1 .16-.118.659.659 0 0 1 .083-.044.746.746 0 0 1 .715.078c.035.025.07.052.102.084l3 3a.75.75 0 0 1-1.06 1.06l-1.72-1.72v8.69a.75.75 0 0 1-1.5 0V8.56l-1.72 1.72a.75.75 0 0 1-1.06 0Z"
          />
        }
        @case ('move-down') {
          <path
            fill="currentColor"
            stroke="none"
            d="M8.47 14.78a.75.75 0 1 1 1.06-1.06l1.72 1.72V6.75a.75.75 0 0 1 1.5 0v8.69l1.72-1.72a.75.75 0 0 1 1.06 1.06l-3 3a.757.757 0 0 1-.812.165l-.01-.004a.75.75 0 0 1-.238-.16l-3-3Z"
          />
        }
        @case ('more-horizontal') {
          <path
            fill="currentColor"
            stroke="none"
            d="M7.25 10.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm4.75 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm4.75 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"
          />
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
