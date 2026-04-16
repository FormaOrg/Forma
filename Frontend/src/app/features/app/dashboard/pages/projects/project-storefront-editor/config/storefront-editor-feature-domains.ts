import { StorefrontSectionType } from '../../../../../../../core/models/project-storefront.model';

export type SectionInsertMode = 'append' | 'after-selected';
export type EditorSidebarMode = 'structure' | 'page' | 'theme' | 'assets';
export type PagesPanelLayoutMode = 'grid' | 'rows';
export type ComponentSelectionBox = { x: number; y: number; width: number; height: number };

export type StorefrontPageDesignCategory = 'Business' | 'Store' | 'Info' | 'Policy';

export type StorefrontPageDesignTemplate = {
  id: string;
  name: string;
  description: string;
  category: StorefrontPageDesignCategory;
  accent: 'linen' | 'cobalt' | 'ink' | 'sand';
};

export type SectionLibraryCategory =
  | 'Essentials'
  | 'Promotions'
  | 'Catalog'
  | 'Contact';

export type SectionLibraryTemplate = {
  id: string;
  title: string;
  description: string;
  category: SectionLibraryCategory;
  type: StorefrontSectionType;
  layout: 'wide' | 'standard' | 'tall';
  accent: 'cobalt' | 'linen' | 'ink' | 'sand' | 'sky' | 'charcoal';
  props?: Record<string, unknown>;
};

export const STOREFRONT_EDITOR_SECTION_LIBRARY_CATEGORIES: SectionLibraryCategory[] = [
  'Essentials',
  'Promotions',
  'Catalog',
  'Contact',
];

export const STOREFRONT_EDITOR_SECTION_LIBRARY_TEMPLATES: SectionLibraryTemplate[] = [
  {
    id: 'main-hero',
    title: 'Main Hero',
    description: 'A primary landing section with a clear headline and two calls to action.',
    category: 'Essentials',
    type: 'hero',
    layout: 'wide',
    accent: 'cobalt',
    props: {
      eyebrow: 'New collection',
      title: 'Launch your storefront with confidence',
      description: 'Show what you sell, why it matters, and where shoppers should go next.',
      primaryCtaLabel: 'Shop now',
      primaryCtaHref: '/products',
      secondaryCtaLabel: 'View featured picks',
      secondaryCtaHref: '#featured',
      editorLabel: 'Main Hero',
    },
  },
  {
    id: 'promo-bar',
    title: 'Promotion Bar',
    description: 'A compact top banner for sales, shipping notices, or limited-time offers.',
    category: 'Promotions',
    type: 'announcement-bar',
    layout: 'wide',
    accent: 'linen',
    props: {
      text: 'Free shipping on orders over 150 TND',
      linkLabel: 'Shop offers',
      linkHref: '/products',
      editorLabel: 'Promotion Bar',
    },
  },
  {
    id: 'featured-grid',
    title: 'Featured Products',
    description: 'A product spotlight section wired to the catalog and ready for selected items.',
    category: 'Catalog',
    type: 'featured-products',
    layout: 'standard',
    accent: 'sand',
    props: {
      title: 'Best sellers this week',
      maxItems: 4,
      editorLabel: 'Featured Products',
    },
  },
  {
    id: 'contact-card',
    title: 'Contact Section',
    description: 'Share your support email, phone, location, and a direct contact CTA.',
    category: 'Contact',
    type: 'contact',
    layout: 'standard',
    accent: 'sky',
    props: {
      eyebrow: 'Need help?',
      title: 'We are here for product questions and custom orders',
      description: 'Add your best contact channels so customers know exactly how to reach you.',
      email: 'support@store.com',
      phone: '+216 71 000 000',
      address: 'Lac 2, Tunis',
      ctaLabel: 'Contact support',
      ctaHref: 'mailto:support@store.com',
      editorLabel: 'Contact Section',
    },
  },
];

export const STOREFRONT_EDITOR_PAGE_DESIGN_TEMPLATES: StorefrontPageDesignTemplate[] = [
  {
    id: 'about',
    name: 'About',
    description: 'Tell the story behind the brand and introduce the team.',
    category: 'Business',
    accent: 'linen',
  },
  {
    id: 'contact',
    name: 'Contact',
    description: 'Give visitors a clean way to reach you and ask questions.',
    category: 'Business',
    accent: 'cobalt',
  },
  {
    id: 'privacy-policy',
    name: 'Privacy Policy',
    description: 'Start from a legal-style layout for policies and business info.',
    category: 'Policy',
    accent: 'sand',
  },
  {
    id: 'shipping-policy',
    name: 'Shipping Policy',
    description: 'Use a policy page layout focused on delivery details and returns.',
    category: 'Policy',
    accent: 'ink',
  },
  {
    id: 'product-page',
    name: 'Product Page',
    description: 'Begin with a commerce-focused page title and supporting details.',
    category: 'Store',
    accent: 'cobalt',
  },
];

export const STOREFRONT_EDITOR_PAGE_DESIGN_CATEGORIES: StorefrontPageDesignCategory[] = [
  'Business',
  'Store',
  'Info',
  'Policy',
];
