export type StorefrontStatus = 'DRAFT' | 'PUBLISHED';
export type StorefrontPageKey = 'home';
export type StorefrontEditorViewport = 'desktop' | 'mobile';
export type StorefrontSectionType =
  | 'announcement-bar'
  | 'hero'
  | 'featured-products'
  | 'footer';

export interface StorefrontSeo {
  title: string;
  description: string;
}

export interface StorefrontAnnouncementBarProps {
  text: string;
  linkLabel: string;
  linkHref: string;
}

export interface StorefrontHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

export interface StorefrontFeaturedProductsProps {
  title: string;
  productIds: number[];
  maxItems: number;
}

export interface StorefrontFooterProps {
  brandText: string;
  contactEmail: string;
  contactPhone: string;
}

export interface StorefrontSection<TProps = Record<string, unknown>> {
  id: string;
  type: StorefrontSectionType;
  enabled: boolean;
  props: TProps;
}

export type StorefrontHomepageSectionProps =
  | StorefrontAnnouncementBarProps
  | StorefrontHeroProps
  | StorefrontFeaturedProductsProps
  | StorefrontFooterProps
  | Record<string, unknown>;

export type StorefrontHomepageSection = StorefrontSection<StorefrontHomepageSectionProps>;

export interface StorefrontHomepageDocument {
  version: number;
  pageKey: StorefrontPageKey;
  seo: StorefrontSeo;
  sections: StorefrontHomepageSection[];
}

export interface StorefrontEditorSnapshot {
  storeName: string | null;
  themeKey: string | null;
  activePageKey: StorefrontPageKey;
  draftHomepage: StorefrontHomepageDocument;
  selectedSectionId: string | null;
}

export interface StorefrontEditorSession {
  selectedSectionId: string | null;
  viewport: StorefrontEditorViewport;
  zoomPercent: number;
  undoStack: StorefrontEditorSnapshot[];
  redoStack: StorefrontEditorSnapshot[];
}

export interface ProjectStorefront {
  id: number;
  projectId: number;
  storeName: string | null;
  storeStatus: StorefrontStatus;
  themeKey: string | null;
  activePageKey: StorefrontPageKey;
  draftHomepage: StorefrontHomepageDocument;
  publishedHomepage: StorefrontHomepageDocument | null;
  editorSession: StorefrontEditorSession | null;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateProjectStorefrontRequest {
  storeName?: string | null;
  themeKey?: string | null;
  activePageKey?: StorefrontPageKey;
  draftHomepage?: StorefrontHomepageDocument;
  editorSession?: StorefrontEditorSession;
}

export interface PublishProjectStorefrontResponse {
  storefront: ProjectStorefront;
  publishedAt: string | null;
}
