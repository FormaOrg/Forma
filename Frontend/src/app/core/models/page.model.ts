// ── Enums ──────────────────────────────────────────────────
export type ComponentType =
  | 'HEADER'
  | 'NAVIGATION'
  | 'HERO'
  | 'TEXT_SECTION'
  | 'IMAGE'
  | 'FORM'
  | 'PRODUCT_GRID'
  | 'FOOTER'
  | 'CUSTOM';

// ── CssStyle — hybrid: predefined + escape hatch ──────────
export interface CssStyle {
  predefined?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    fontFamily?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    display?: string;
    flexDirection?: string;
    alignItems?: string;
    justifyContent?: string;
  };
  custom?: Record<string, string>; // escape hatch for advanced users
}

// ── Layout position — required for drag & drop ────────────
export interface ComponentPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  responsive?: {
    mobile?: Partial<ComponentPosition>;
    tablet?: Partial<ComponentPosition>;
  };
}

// ── Component — structured props, no raw HTML ─────────────
export interface SiteComponent {
  id: number;
  type: ComponentType;
  name: string;
  orderIndex: number;
  props?: Record<string, unknown>; // structured per type, no raw HTML
  style?: CssStyle;
  position?: ComponentPosition;    // needed for drag & drop canvas
  isVisible: boolean;
}

// ── Page ──────────────────────────────────────────────────
export interface Page {
  id: number;
  projectId: number;
  name: string;
  slug: string;
  title: string;
  metaDescription?: string;
  canonicalUrl?: string;           // SEO
  robotsDirective?: 'index' | 'noindex' | 'nofollow';  // SEO
  orderIndex: number;
  isHomePage: boolean;
  isVisible: boolean;
  components: SiteComponent[];
}

// ── Request DTOs ───────────────────────────────────────────
export interface CreatePageRequest {
  name: string;
  slug: string;
  title: string;
  metaDescription?: string;
  orderIndex?: number;
  isHomePage?: boolean;
}

export interface UpdatePageRequest {
  name?: string;
  title?: string;
  slug?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  robotsDirective?: 'index' | 'noindex' | 'nofollow';
  isVisible?: boolean;
  orderIndex?: number;
}

export interface AddComponentRequest {
  type: ComponentType;
  name: string;
  orderIndex: number;
  props?: Record<string, unknown>;
  style?: CssStyle;
  position?: ComponentPosition;
}

export interface UpdateComponentRequest {
  name?: string;
  props?: Record<string, unknown>;
  style?: CssStyle;
  position?: ComponentPosition;
  isVisible?: boolean;
  orderIndex?: number;
}

export interface ReorderComponentsRequest {
  componentIds: number[]; // ordered array of ids
}