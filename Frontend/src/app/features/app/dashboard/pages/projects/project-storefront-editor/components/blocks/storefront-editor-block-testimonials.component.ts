import { Component, computed, input } from '@angular/core';

import { StorefrontEditorTestimonialsNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-testimonials',
  standalone: true,
  template: `
    <section class="storefront-editor-block-testimonials" [style.--testimonials-accent]="accentColor()" [style.--testimonials-text]="textColor()" [style.--testimonials-card-bg]="cardBackground()">
      <header class="storefront-editor-block-testimonials__header">
        <span class="storefront-editor-block-testimonials__eyebrow">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden="true">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          Reviews
        </span>
        <h4>{{ node().props.title }}</h4>
        <div class="storefront-editor-block-testimonials__meta">
          <span class="storefront-editor-block-testimonials__stars" aria-hidden="true">
            @for (s of fiveStars; track s) {
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
            }
          </span>
          <span class="storefront-editor-block-testimonials__avg">{{ avgRating() }} · {{ node().props.items.length }} reviews</span>
        </div>
      </header>

      <div class="storefront-editor-block-testimonials__grid" [class.storefront-editor-block-testimonials__grid--stack]="node().props.layout === 'stack'">
        @for (item of node().props.items; track item.name) {
          <article class="storefront-editor-block-testimonials__card">
            <div class="storefront-editor-block-testimonials__card-stars" aria-hidden="true">
              @for (s of starArray(item.rating); track s.i) {
                <svg viewBox="0 0 24 24" [attr.fill]="s.filled ? 'currentColor' : 'none'" width="13" height="13" aria-hidden="true">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" [attr.stroke]="s.filled ? 'none' : 'currentColor'" stroke-width="1.5"/>
                </svg>
              }
            </div>
            <p class="storefront-editor-block-testimonials__quote">&ldquo;{{ item.text }}&rdquo;</p>
            <footer class="storefront-editor-block-testimonials__reviewer">
              <span class="storefront-editor-block-testimonials__avatar" aria-hidden="true">{{ item.initials }}</span>
              <span class="storefront-editor-block-testimonials__reviewer-info">
                <strong>{{ item.name }}</strong>
                <small>{{ item.role }}</small>
              </span>
            </footer>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-testimonials {
      --testimonials-accent: #f59e0b;
      --testimonials-text: #0f172a;
      --testimonials-card-bg: #ffffff;
      display: grid;
      grid-template-rows: auto 1fr;
      gap: 16px;
      width: 100%;
      height: 100%;
      padding: 22px;
      border-radius: 26px;
      background:
        radial-gradient(circle at top right, rgba(245, 158, 11, 0.09), transparent 34%),
        radial-gradient(circle at bottom left, rgba(15, 23, 42, 0.04), transparent 28%),
        linear-gradient(160deg, rgba(255, 255, 255, 0.99), rgba(255, 253, 245, 0.97));
      border: 1px solid rgba(15, 23, 42, 0.07);
      box-shadow: 0 16px 34px rgba(15, 23, 42, 0.07);
      box-sizing: border-box;
      overflow: hidden;
    }

    .storefront-editor-block-testimonials h4,
    .storefront-editor-block-testimonials p,
    .storefront-editor-block-testimonials strong,
    .storefront-editor-block-testimonials small {
      margin: 0;
    }

    /* ── Header ── */

    .storefront-editor-block-testimonials__header {
      display: grid;
      gap: 8px;
    }

    .storefront-editor-block-testimonials__eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      justify-self: start;
      min-height: 26px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .storefront-editor-block-testimonials__eyebrow svg {
      color: #f59e0b;
    }

    .storefront-editor-block-testimonials__header h4 {
      font-size: 1.08rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--testimonials-text);
    }

    .storefront-editor-block-testimonials__meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .storefront-editor-block-testimonials__stars {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      color: var(--testimonials-accent);
    }

    .storefront-editor-block-testimonials__avg {
      color: #64748b;
      font-size: 0.78rem;
      font-weight: 600;
    }

    /* ── Grid ── */

    .storefront-editor-block-testimonials__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 10px;
      align-items: start;
    }

    .storefront-editor-block-testimonials__grid--stack {
      grid-template-columns: 1fr;
    }

    /* ── Card ── */

    .storefront-editor-block-testimonials__card {
      display: grid;
      gap: 10px;
      padding: 14px;
      border-radius: 18px;
      background: var(--testimonials-card-bg);
      border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 6px 14px rgba(15, 23, 42, 0.05);
    }

    .storefront-editor-block-testimonials__card-stars {
      display: flex;
      align-items: center;
      gap: 2px;
      color: var(--testimonials-accent);
    }

    .storefront-editor-block-testimonials__quote {
      color: var(--testimonials-text);
      font-size: 0.82rem;
      line-height: 1.55;
      opacity: 0.86;
    }

    /* ── Reviewer ── */

    .storefront-editor-block-testimonials__reviewer {
      display: flex;
      align-items: center;
      gap: 9px;
      padding-top: 6px;
      border-top: 1px solid rgba(15, 23, 42, 0.07);
    }

    .storefront-editor-block-testimonials__avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 999px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.08));
      color: #b45309;
      font-size: 0.66rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      flex-shrink: 0;
    }

    .storefront-editor-block-testimonials__reviewer-info {
      display: grid;
      gap: 1px;
      min-width: 0;
    }

    .storefront-editor-block-testimonials__reviewer-info strong {
      display: block;
      color: var(--testimonials-text);
      font-size: 0.78rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .storefront-editor-block-testimonials__reviewer-info small {
      display: block;
      color: #64748b;
      font-size: 0.7rem;
      font-weight: 500;
    }
  `],
})
export class StorefrontEditorBlockTestimonialsComponent {
  readonly node = input.required<StorefrontEditorTestimonialsNode>();

  readonly accentColor = computed(() => this.node().props.accentColor || '#f59e0b');
  readonly textColor = computed(() => this.node().props.textColor || '#0f172a');
  readonly cardBackground = computed(() => this.node().props.cardBackground || '#ffffff');

  readonly fiveStars = [1, 2, 3, 4, 5];

  readonly avgRating = computed(() => {
    const items = this.node().props.items;
    if (!items.length) return '5.0';
    const avg = items.reduce((sum, i) => sum + i.rating, 0) / items.length;
    return avg.toFixed(1);
  });

  starArray(rating: number): { i: number; filled: boolean }[] {
    return [1, 2, 3, 4, 5].map((i) => ({ i, filled: i <= rating }));
  }
}
