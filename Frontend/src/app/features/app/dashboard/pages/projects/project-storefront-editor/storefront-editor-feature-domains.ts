import { StorefrontSectionType } from '../../../../../../core/models/project-storefront.model';

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
  | 'Welcome'
  | 'About'
  | 'Portfolio'
  | 'Services'
  | 'Products'
  | 'Promote & Engage';

export type SectionLibraryTemplate = {
  id: string;
  title: string;
  category: SectionLibraryCategory;
  type: StorefrontSectionType;
  layout: 'wide' | 'standard' | 'tall';
  accent: 'cobalt' | 'linen' | 'ink' | 'sand' | 'sky' | 'charcoal';
};

export const STOREFRONT_EDITOR_SECTION_LIBRARY_CATEGORIES: SectionLibraryCategory[] = [
  'Welcome',
  'About',
  'Portfolio',
  'Services',
  'Products',
  'Promote & Engage',
];

export const STOREFRONT_EDITOR_SECTION_LIBRARY_TEMPLATES: SectionLibraryTemplate[] = [
  { id: 'hero-cobalt', title: 'Shop Our Latest Collection', category: 'Welcome', type: 'hero', layout: 'wide', accent: 'cobalt' },
  { id: 'hero-editorial', title: 'Explore My Latest Work', category: 'Portfolio', type: 'hero', layout: 'standard', accent: 'linen' },
  { id: 'hero-services', title: 'Efficient Services & Solutions', category: 'Services', type: 'hero', layout: 'tall', accent: 'ink' },
  { id: 'hero-business', title: 'Reach Your Business Potential', category: 'Promote & Engage', type: 'hero', layout: 'tall', accent: 'sky' },
  { id: 'products-fashion', title: 'Shop Our Unique Products', category: 'Products', type: 'featured-products', layout: 'standard', accent: 'sand' },
  { id: 'footer-minimal', title: 'Elegant Footer Details', category: 'About', type: 'footer', layout: 'standard', accent: 'charcoal' },
  { id: 'announcement-editorial', title: 'Highlight a Quick Announcement', category: 'Welcome', type: 'announcement-bar', layout: 'wide', accent: 'linen' },
  { id: 'products-beauty', title: 'Discover Modern Products', category: 'Products', type: 'featured-products', layout: 'wide', accent: 'charcoal' },
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
