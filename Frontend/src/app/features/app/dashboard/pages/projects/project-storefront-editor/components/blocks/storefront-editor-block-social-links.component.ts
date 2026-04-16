import { Component, computed, input } from '@angular/core';

import { Project } from '../../../../../../../../core/models/project.model';

import { StorefrontEditorSocialLinksNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-social-links',
  standalone: true,
  template: `
    <span
      class="storefront-editor-block-social-links"
      [style.gap.px]="spacing()"
      [style.background]="wrapperBackgroundColor()"
      [style.border-color]="wrapperBorderColor()"
      [style.border-width.px]="wrapperBorderWidth()"
      [style.border-radius.px]="wrapperRadius()"
    >
      @for (item of socialItems(); track item.key) {
        <span
          class="storefront-editor-block-social-links__item"
          [style.color]="iconColor()"
          [style.width.px]="itemSize()"
          [style.height.px]="itemSize()"
          [attr.aria-label]="item.label"
        >
          <span class="storefront-editor-block-social-links__icon" [style.width.px]="iconSize()" [style.height.px]="iconSize()">
            @switch (item.key) {
              @case ('instagram') {
                <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g fill="currentColor" fill-rule="evenodd">
                    <path d="M5.869652 0.12273C4.241769 0.19618 2.830805 0.5942 1.691486 1.72871.548187 2.86918.155147 4.28558.081514 5.89653.035742 6.90201-.231923 14.49818.544207 16.49028 1.067597 17.83422 2.098457 18.86749 3.454694 19.39256c.632844.24616 1.355242.41291 2.414958.46155 8.860815.401 12.145437.18263 13.53053-3.36383.245774-.63128.414931-1.35288.461698-2.40997.40498-8.88354-.065673-10.80914-1.609972-12.3516C17.027016.50685 15.5862-.32492 5.869652.12273m.081593 17.94475c-.970162-.04368-1.496538-.20547-1.847786-.34145-.883594-.34343-1.547285-1.00448-1.888583-1.88291-.591053-1.51368-.39503-8.70289-.342293-9.86619.051742-1.13948.282591-2.18069 1.086582-2.98467.995038-.99258 2.280627-1.47894 11.033979-1.08389 1.142304.05161 2.186099.28189 2.99208 1.08389.995038.99257 1.488577 2.28788 1.086582 11.00765-.043782.96776-.205973 1.49283-.342293 1.84321-.90051 2.30773-2.97218 2.62833-11.778268 2.22436" />
                    <path d="M14.089663 4.68956A1.194 1.194 0 1 0 16.47875 4.68956 1.194 1.194 0 0 0 14.089663 4.68956" />
                    <path d="M4.862673 9.98792c0 2.81494 2.287593 5.09687 5.109521 5.09687s5.109522-2.28193 5.109522-5.09687-2.287594-5.09587-5.109522-5.09587S4.862673 7.17298 4.862673 9.98792m1.793059 0c0-1.82633 1.484597-3.30825 3.316462-3.30825s3.316463 1.48192 3.316463 3.30825c0 1.82733-1.484598 3.30924-3.316463 3.30924S6.655732 11.81525 6.655732 9.98792" />
                  </g>
                </svg>
              }
              @case ('facebook') {
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="currentColor" d="M12 2.03998C6.5 2.03998 2 6.52998 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.84998C10.44 7.33998 11.93 5.95998 14.22 5.95998C15.31 5.95998 16.45 6.14998 16.45 6.14998V8.61998H15.19C13.95 8.61998 13.56 9.38998 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C15.9164 21.5878 18.0622 20.3855 19.6099 18.57C21.1576 16.7546 22.0054 14.4456 22 12.06C22 6.52998 17.5 2.03998 12 2.03998Z"/>
                </svg>
              }
              @case ('tiktok') {
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="currentColor" d="M16.656 1.029c1.637-.025 3.262-.012 4.886-.025.054 2.031.878 3.859 2.189 5.213 1.411 1.271 3.247 2.095 5.271 2.237v5.036c-1.912-.048-3.71-.489-5.331-1.247-.784-.377-1.447-.764-2.077-1.196-.012 3.649.012 7.298-.025 10.934-.103 1.853-.719 3.543-1.707 4.954-1.652 2.366-4.328 3.919-7.371 4.011-.123.006-.268.009-.414.009-1.73 0-3.347-.482-4.725-1.319-2.508-1.509-4.238-4.091-4.558-7.094-.025-.625-.037-1.25-.012-1.862.49-4.779 4.494-8.476 9.361-8.476.547 0 1.083.047 1.604.136.025 1.849-.05 3.699-.05 5.548-.423-.153-.911-.242-1.42-.242-1.868 0-3.457 1.194-4.045 2.861-.133.427-.21.918-.21 1.426 0 .206.013.41.037.61.332 2.046 2.086 3.59 4.201 3.59.061 0 .121-.001.181-.004 1.463-.044 2.733-.831 3.451-1.994.267-.372.45-.822.511-1.311.125-2.237.075-4.461.087-6.698.012-5.036-.012-10.06.025-15.083z"/>
                </svg>
              }
              @case ('whatsapp') {
                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="currentColor" d="M11.42 9.49c-.19-.09-1.1-.54-1.27-.61s-.29-.09-.42.1-.48.6-.59.73-.21.14-.4 0a5.13 5.13 0 0 1-1.49-.92 5.25 5.25 0 0 1-1-1.29c-.11-.18 0-.28.08-.38s.18-.21.28-.32a1.39 1.39 0 0 0 .18-.31.38.38 0 0 0 0-.33c0-.09-.42-1-.58-1.37s-.3-.32-.41-.32h-.4a.72.72 0 0 0-.5.23 2.1 2.1 0 0 0-.65 1.55A3.59 3.59 0 0 0 5 8.2 8.32 8.32 0 0 0 8.19 11c.44.19.78.3 1.05.39a2.53 2.53 0 0 0 1.17.07 1.93 1.93 0 0 0 1.26-.88 1.67 1.67 0 0 0 .11-.88c-.05-.07-.17-.12-.36-.21z"/>
                  <path fill="currentColor" d="M13.29 2.68A7.36 7.36 0 0 0 8 .5a7.44 7.44 0 0 0-6.41 11.15l-1 3.85 3.94-1a7.4 7.4 0 0 0 3.55.9H8a7.44 7.44 0 0 0 5.29-12.72zM8 14.12a6.12 6.12 0 0 1-3.15-.87l-.22-.13-2.34.61.62-2.28-.14-.23a6.18 6.18 0 0 1 9.6-7.65 6.12 6.12 0 0 1 1.81 4.37A6.19 6.19 0 0 1 8 14.12z"/>
                </svg>
              }
            }
          </span>
        </span>
      }
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
      width: auto;
      height: auto;
      max-width: 100%;
    }

    .storefront-editor-block-social-links {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      width: auto;
      height: auto;
      max-width: 100%;
      border: 0 solid transparent;
      box-sizing: border-box;
    }

    .storefront-editor-block-social-links__item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      flex: 0 0 auto;
    }

    .storefront-editor-block-social-links__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
    }

    .storefront-editor-block-social-links__icon :is(svg) {
      display: block;
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  `],
})
export class StorefrontEditorBlockSocialLinksComponent {
  readonly node = input.required<StorefrontEditorSocialLinksNode>();
  readonly project = input<Project | null>(null);
  readonly iconColor = computed(() => this.normalizeColor(this.node().props.color, '#111827'));
  readonly wrapperBackgroundColor = computed(() =>
    this.node().props.style === 'ghost'
      ? this.normalizeColor(this.node().props.backgroundColor, 'transparent')
      : this.normalizeColor(this.node().props.backgroundColor, '#111827')
  );
  readonly wrapperBorderColor = computed(() => this.normalizeColor(this.node().props.borderColor, '#111827'));
  readonly wrapperBorderWidth = computed(() => this.clamp(this.node().props.borderWidth ?? 1, 0, 8));
  readonly wrapperRadius = computed(() => this.clamp(this.node().props.radius ?? 12, 0, 999));
  readonly iconSize = computed(() => this.clamp(this.node().props.iconSize ?? 18, 12, 64));
  readonly itemSize = computed(() => this.clamp(this.node().props.itemSize ?? 38, 24, 120));
  readonly spacing = computed(() => this.clamp(this.node().props.spacing ?? 12, 0, 64));

  readonly socialItems = computed(() => {
    const labels = this.resolveOrder(this.node().props.labels);
    return labels.map((key) => ({
      key,
      label: this.resolveLabel(key),
    }));
  });

  private resolveOrder(labels: string[]): string[] {
    const normalized = labels
      .map((label) => this.normalizeSocialKey(label))
      .filter((value): value is string => !!value);
    const unique = Array.from(new Set(normalized));
    const fallback = ['instagram', 'facebook', 'tiktok', 'whatsapp'];
    for (const key of fallback) {
      if (!unique.includes(key)) {
        unique.push(key);
      }
    }
    return unique;
  }

  private normalizeSocialKey(value: string | null | undefined): string | null {
    const normalized = (value ?? '').trim().toLowerCase();
    switch (normalized) {
      case 'instagram':
      case 'ig':
        return 'instagram';
      case 'facebook':
      case 'fb':
        return 'facebook';
      case 'tiktok':
      case 'tt':
      case 'tk':
        return 'tiktok';
      case 'whatsapp':
      case 'wa':
      case 'whats-app':
        return 'whatsapp';
      default:
        return null;
    }
  }

  private resolveLabel(value: string): string {
    switch (value) {
      case 'instagram':
        return 'Instagram';
      case 'facebook':
        return 'Facebook';
      case 'tiktok':
        return 'TikTok';
      case 'whatsapp':
        return 'WhatsApp';
      default:
        return value;
    }
  }

  private clamp(value: number, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return min;
    }

    return Math.max(min, Math.min(max, Math.round(parsed)));
  }

  private normalizeColor(value: string | null | undefined, fallback: string): string {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed ? trimmed : fallback;
  }
}
