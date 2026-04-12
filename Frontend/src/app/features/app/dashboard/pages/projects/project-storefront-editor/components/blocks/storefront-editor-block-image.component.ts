import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StorefrontEditorImageNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-image',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <span class="storefront-editor-block-image" [ngStyle]="frameStyle()">
      @if (node().props.src; as src) {
        @if (usesCroppedStage()) {
          <span class="storefront-editor-block-image__stage" [ngStyle]="imageStageStyle()">
            <img [src]="src" [alt]="node().props.alt || 'Image'" [ngStyle]="imageStyle()" />
          </span>
        } @else {
          <img
            class="storefront-editor-block-image__full-image"
            [src]="src"
            [alt]="node().props.alt || 'Image'"
            [ngStyle]="fullImageStyle()"
          />
        }
      } @else {
        <span>Image</span>
      }
    </span>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-image {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 12px;
      background:
        linear-gradient(140deg, rgba(53, 92, 255, 0.18), transparent 45%),
        linear-gradient(180deg, #d8e8ff 0%, #a6c6f4 42%, #9dc7a0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      overflow: hidden;
    }

    .storefront-editor-block-image img {
      position: absolute;
      max-width: none;
      max-height: none;
      display: block;
    }

    .storefront-editor-block-image__full-image {
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-image__stage {
      position: absolute;
      overflow: hidden;
    }
  `],
})
export class StorefrontEditorBlockImageComponent {
  readonly node = input.required<StorefrontEditorImageNode>();
  readonly disableCrop = input(false);
  readonly renderWidth = input<number | null>(null);
  readonly renderHeight = input<number | null>(null);

  readonly frameStyle = computed<Record<string, string | null>>(() => {
    const props = this.node().props;
    const borderWidth = Math.max(0, Math.min(12, Number(props.borderWidth ?? 0)));
    const borderStyle = props.borderStyle ?? 'solid';
    const borderColor = props.borderColor ?? '#111827';
    const opacity = Math.max(0, Math.min(100, Number(props.opacity ?? 100)));
    const radius = Math.max(0, Math.min(999, Number(props.radius ?? 0)));

    return {
      borderRadius: `${radius}px`,
      borderWidth: `${borderWidth}px`,
      borderStyle: borderWidth === 0 ? 'solid' : borderStyle,
      borderColor: borderWidth === 0 ? 'transparent' : borderColor,
      boxShadow: this.getShadowValue(props.shadow ?? 'none'),
      opacity: `${opacity / 100}`,
      background: props.src ? 'transparent' : null,
    };
  });

  readonly imageStyle = computed<Record<string, string>>(() => {
    const crop = this.resolveCropRect();
    return {
      objectFit: this.resolveObjectFit(),
      width: `${100 / crop.width}%`,
      height: `${100 / crop.height}%`,
      left: `${-(crop.x / crop.width) * 100}%`,
      top: `${-(crop.y / crop.height) * 100}%`,
    };
  });

  readonly fullImageStyle = computed<Record<string, string>>(() => ({
    objectFit: this.resolveObjectFit(),
  }));

  readonly imageStageStyle = computed<Record<string, string>>(() => {
    const frame = this.node().frame;
    const width = this.renderWidth() ?? frame.width;
    const height = this.renderHeight() ?? frame.height;
    const bounds = this.resolveImageBounds(width, height);
    return {
      left: `${bounds.x}px`,
      top: `${bounds.y}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
    };
  });

  readonly usesCroppedStage = computed(() => {
    if (this.disableCrop()) {
      return false;
    }

    const crop = this.resolveCropRect();
    return crop.x > 0 || crop.y > 0 || crop.width < 0.9999 || crop.height < 0.9999;
  });

  private resolveObjectFit(): string {
    const props = this.node().props;
    const displayMode = props.displayMode ?? (props.objectFit === 'contain' ? 'fit' : 'fill');
    switch (displayMode) {
      case 'fit':
        return 'contain';
      case 'aspect':
        return 'scale-down';
      case 'fill':
      default:
        return 'cover';
    }
  }

  private resolveCropRect(): { x: number; y: number; width: number; height: number } {
    if (this.disableCrop()) {
      return {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      };
    }

    const props = this.node().props;
    const x = this.clampUnit(props.cropX ?? 0);
    const y = this.clampUnit(props.cropY ?? 0);
    const width = this.clampUnit(props.cropWidth ?? 1);
    const height = this.clampUnit(props.cropHeight ?? 1);
    return {
      x: Math.min(x, 1 - width),
      y: Math.min(y, 1 - height),
      width: Math.max(width, 0.01),
      height: Math.max(height, 0.01),
    };
  }

  private resolveImageBounds(frameWidth: number, frameHeight: number): { x: number; y: number; width: number; height: number } {
    const props = this.node().props;
    if (props.displayMode === 'fill') {
      return { x: 0, y: 0, width: frameWidth, height: frameHeight };
    }

    const frameAspectRatio = frameWidth > 0 && frameHeight > 0 ? frameWidth / frameHeight : 1;
    const imageAspectRatio = this.parseAspectRatio(props.aspectRatio, frameAspectRatio);
    if (imageAspectRatio >= frameAspectRatio) {
      const width = frameWidth;
      const height = width / imageAspectRatio;
      return {
        x: 0,
        y: (frameHeight - height) / 2,
        width,
        height,
      };
    }

    const height = frameHeight;
    const width = height * imageAspectRatio;
    return {
      x: (frameWidth - width) / 2,
      y: 0,
      width,
      height,
    };
  }

  private parseAspectRatio(value: string | null | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const normalized = value.replace(':', '/');
    const [widthRaw, heightRaw] = normalized.split('/').map((part) => Number(part.trim()));
    if (Number.isFinite(widthRaw) && Number.isFinite(heightRaw) && heightRaw > 0) {
      return widthRaw / heightRaw;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
  }

  private clampUnit(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.min(1, value));
  }

  private getShadowValue(shadow: StorefrontEditorImageNode['props']['shadow']): string {
    switch (shadow) {
      case 'soft':
        return '0 10px 24px rgba(15, 23, 42, 0.12)';
      case 'medium':
        return '0 14px 30px rgba(15, 23, 42, 0.18)';
      case 'strong':
        return '0 18px 36px rgba(15, 23, 42, 0.26)';
      case 'none':
      default:
        return 'none';
    }
  }
}
