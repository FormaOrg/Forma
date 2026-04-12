import { StorefrontEditorComponentType } from './storefront-editor-component.model';

export type StorefrontEditorAddElementsCategory =
  | 'All'
  | 'Text'
  | 'Image'
  | 'Button'
  | 'Graphics'
  | 'Forma Store';

export type StorefrontEditorAddElementsCategoryIcon =
  | 'all'
  | 'text'
  | 'image'
  | 'button'
  | 'graphics'
  | 'store';

export type StorefrontEditorAddElementsCardPreview =
  | 'headline'
  | 'paragraph'
  | 'photo'
  | 'button'
  | 'icon'
  | 'spacer'
  | 'social-links'
  | 'faq'
  | 'contact-form'
  | 'container'
  | 'graphic'
  | 'product-feed';

export interface StorefrontEditorAddElementsCategoryOption {
  id: StorefrontEditorAddElementsCategory;
  label: StorefrontEditorAddElementsCategory;
  icon: StorefrontEditorAddElementsCategoryIcon;
}

export interface StorefrontEditorAddElementsSubcategoryOption {
  id: string;
  label: string;
}

export interface StorefrontEditorAddElementsFeaturedShortcut {
  id: string;
  title: string;
  description: string;
  badgeLabel: string;
  badgeTone: 'default' | 'violet';
}

export interface StorefrontEditorAddElementsLibraryItem {
  id: string;
  title: string;
  category: Exclude<StorefrontEditorAddElementsCategory, 'All'>;
  subcategoryIds?: readonly string[];
  componentType: StorefrontEditorComponentType;
  description: string;
  preview: StorefrontEditorAddElementsCardPreview;
  previewImageSrc?: string;
  keywords: readonly string[];
}

export const STOREFRONT_EDITOR_ADD_ELEMENTS_CATEGORIES: readonly StorefrontEditorAddElementsCategoryOption[] = [
  { id: 'All', label: 'All', icon: 'all' },
  { id: 'Text', label: 'Text', icon: 'text' },
  { id: 'Image', label: 'Image', icon: 'image' },
  { id: 'Button', label: 'Button', icon: 'button' },
  { id: 'Graphics', label: 'Graphics', icon: 'graphics' },
  { id: 'Forma Store', label: 'Forma Store', icon: 'store' },
];

export const STOREFRONT_EDITOR_ADD_ELEMENTS_SUBCATEGORIES: Readonly<
  Record<
    Exclude<StorefrontEditorAddElementsCategory, 'All'>,
    readonly StorefrontEditorAddElementsSubcategoryOption[]
  >
> = {
  Text: [
    { id: 'all', label: 'All' },
    { id: 'titles', label: 'Titles' },
    { id: 'paragraphs', label: 'Paragraphs' },
    { id: 'text-combos', label: 'Text combos' },
    { id: 'running-text', label: 'Running text' },
    { id: 'faq', label: 'FAQ' },
    { id: 'forms', label: 'Forms' },
  ],
  Image: [
    { id: 'all', label: 'All' },
    { id: 'single-images', label: 'Single images' },
    { id: 'galleries', label: 'Galleries' },
    { id: 'banners', label: 'Banners' },
  ],
  Button: [
    { id: 'all', label: 'All' },
    { id: 'primary-buttons', label: 'Primary buttons' },
    { id: 'secondary-buttons', label: 'Secondary buttons' },
    { id: 'icon-buttons', label: 'Icon buttons' },
  ],
  Graphics: [
    { id: 'all', label: 'All' },
    { id: 'icons', label: 'Icons' },
    { id: 'social', label: 'Social' },
    { id: 'spacing', label: 'Spacing' },
    { id: 'containers', label: 'Containers' },
    { id: 'shapes', label: 'Shapes' },
    { id: 'decorative', label: 'Decorative' },
  ],
  'Forma Store': [
    { id: 'all', label: 'All' },
    { id: 'grid-gallery', label: 'Grid gallery' },
    { id: 'featured-products', label: 'Featured products' },
  ],
};

export const STOREFRONT_EDITOR_ADD_ELEMENTS_FEATURED_SHORTCUTS: readonly StorefrontEditorAddElementsFeaturedShortcut[] = [
  {
    id: 'upload-media',
    title: 'Upload Media',
    description: 'Bring in images and visual assets.',
    badgeLabel: '↑',
    badgeTone: 'default',
  },
  {
    id: 'text-stack',
    title: 'Text Stack',
    description: 'Start quickly with a heading and paragraph.',
    badgeLabel: 'T',
    badgeTone: 'violet',
  },
];

export const STOREFRONT_EDITOR_ADD_ELEMENTS_LIBRARY_ITEMS: readonly StorefrontEditorAddElementsLibraryItem[] = [
  {
    id: 'text',
    title: 'Text',
    category: 'Text',
    subcategoryIds: ['all', 'titles', 'paragraphs', 'text-combos', 'running-text'],
    componentType: 'text',
    description: 'Flexible text block with heading and paragraph styles.',
    preview: 'headline',
    keywords: ['text', 'copy', 'body', 'description', 'paragraph', 'title', 'headline', 'hero', 'heading'],
  },
  {
    id: 'faq',
    title: 'FAQ',
    category: 'Text',
    subcategoryIds: ['all', 'faq', 'text-combos'],
    componentType: 'faq',
    description: 'Question-and-answer block for shipping, returns, support, and policies.',
    preview: 'faq',
    keywords: ['faq', 'accordion', 'questions', 'answers', 'help', 'support'],
  },
  {
    id: 'contact-form',
    title: 'Contact form',
    category: 'Text',
    subcategoryIds: ['all', 'forms', 'text-combos'],
    componentType: 'contact-form',
    description: 'Polished inquiry form with message fields, consent, and a built-in success state.',
    preview: 'contact-form',
    keywords: ['form', 'contact', 'message', 'email', 'support', 'lead'],
  },
  {
    id: 'image',
    title: 'Image',
    category: 'Image',
    subcategoryIds: ['all', 'single-images', 'galleries', 'banners'],
    componentType: 'image',
    description: 'Responsive media block for photos, banners, and galleries.',
    preview: 'photo',
    keywords: ['photo', 'media', 'banner', 'gallery', 'image'],
  },
  {
    id: 'button',
    title: 'Button',
    category: 'Button',
    subcategoryIds: ['all', 'primary-buttons', 'secondary-buttons', 'icon-buttons'],
    componentType: 'button',
    description: 'Clickable call-to-action with primary or secondary styling.',
    preview: 'button',
    keywords: ['cta', 'link', 'action', 'button'],
  },
  {
    id: 'container',
    title: 'Container',
    category: 'Graphics',
    subcategoryIds: ['all', 'containers', 'decorative'],
    componentType: 'container',
    description: 'Flexible wrapper that groups and aligns nested components.',
    preview: 'container',
    keywords: ['stack', 'group', 'wrapper', 'layout', 'container'],
  },
  {
    id: 'icon',
    title: 'Icon',
    category: 'Graphics',
    subcategoryIds: ['all', 'icons', 'decorative'],
    componentType: 'icon',
    description: 'Standalone icon chip for highlights, benefits, and contact details.',
    preview: 'icon',
    keywords: ['icon', 'symbol', 'feature', 'badge', 'contact'],
  },
  {
    id: 'spacer',
    title: 'Spacer',
    category: 'Graphics',
    subcategoryIds: ['all', 'spacing', 'decorative'],
    componentType: 'spacer',
    description: 'Add breathing room or a subtle divider between elements.',
    preview: 'spacer',
    keywords: ['space', 'spacer', 'divider', 'gap', 'separator'],
  },
  {
    id: 'social-links',
    title: 'Social links',
    category: 'Graphics',
    subcategoryIds: ['all', 'social', 'decorative'],
    componentType: 'social-links',
    description: 'Quick social pills for headers, footers, and contact areas.',
    preview: 'social-links',
    keywords: ['social', 'instagram', 'facebook', 'tiktok', 'links'],
  },
  {
    id: 'graphic',
    title: 'Graphic',
    category: 'Graphics',
    subcategoryIds: ['all', 'icons', 'shapes', 'decorative'],
    componentType: 'graphic',
    description: 'Decorative shape or icon area for visual accents.',
    preview: 'graphic',
    keywords: ['shape', 'icon', 'badge', 'decor', 'graphic'],
  },
  {
    id: 'product-feed',
    title: 'Product feed',
    category: 'Forma Store',
    subcategoryIds: ['all', 'grid-gallery', 'featured-products'],
    componentType: 'product-feed',
    description: 'Catalog-driven product strip for storefront sections.',
    preview: 'product-feed',
    previewImageSrc: 'assets/app/project/editor/grid gallery/default.png',
    keywords: ['catalog', 'products', 'shop', 'price', 'store'],
  },
];

export function filterStorefrontEditorAddElementsLibraryItems(
  items: readonly StorefrontEditorAddElementsLibraryItem[],
  category: StorefrontEditorAddElementsCategory,
  subcategory: string,
  search: string
): StorefrontEditorAddElementsLibraryItem[] {
  const normalizedSearch = search.trim().toLowerCase();
  const normalizedSubcategory = subcategory.trim().toLowerCase();

  return items.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    if (!matchesCategory) {
      return false;
    }

    const matchesSubcategory =
      category === 'All' ||
      !normalizedSubcategory ||
      normalizedSubcategory === 'all' ||
      !item.subcategoryIds?.length ||
      item.subcategoryIds.includes(normalizedSubcategory);
    if (!matchesSubcategory) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystack = [item.title, item.description, item.category, ...item.keywords]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });
}
