import { StorefrontEditorComponentType } from './storefront-editor-component.model';

export type StorefrontEditorAddElementsCategory =
  | 'All'
  | 'Text'
  | 'Image'
  | 'Button'
  | 'Graphics'
  | 'Forma Store'
  | 'Forma Blog';

export type StorefrontEditorAddElementsCategoryIcon =
  | 'all'
  | 'text'
  | 'image'
  | 'button'
  | 'graphics'
  | 'store'
  | 'blog';

export type StorefrontEditorAddElementsCardPreview =
  | 'headline'
  | 'paragraph'
  | 'photo'
  | 'button'
  | 'container'
  | 'graphic'
  | 'product-feed'
  | 'blog-feed';

export interface StorefrontEditorAddElementsCategoryOption {
  id: StorefrontEditorAddElementsCategory;
  label: StorefrontEditorAddElementsCategory;
  icon: StorefrontEditorAddElementsCategoryIcon;
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
  { id: 'Forma Blog', label: 'Forma Blog', icon: 'blog' },
];

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
    componentType: 'text',
    description: 'Flexible text block with heading and paragraph styles.',
    preview: 'headline',
    keywords: ['text', 'copy', 'body', 'description', 'paragraph', 'title', 'headline', 'hero', 'heading'],
  },
  {
    id: 'image',
    title: 'Image',
    category: 'Image',
    componentType: 'image',
    description: 'Responsive media block for photos, banners, and galleries.',
    preview: 'photo',
    keywords: ['photo', 'media', 'banner', 'gallery', 'image'],
  },
  {
    id: 'button',
    title: 'Button',
    category: 'Button',
    componentType: 'button',
    description: 'Clickable call-to-action with primary or secondary styling.',
    preview: 'button',
    keywords: ['cta', 'link', 'action', 'button'],
  },
  {
    id: 'container',
    title: 'Container',
    category: 'Graphics',
    componentType: 'container',
    description: 'Flexible wrapper that groups and aligns nested components.',
    preview: 'container',
    keywords: ['stack', 'group', 'wrapper', 'layout', 'container'],
  },
  {
    id: 'graphic',
    title: 'Graphic',
    category: 'Graphics',
    componentType: 'graphic',
    description: 'Decorative shape or icon area for visual accents.',
    preview: 'graphic',
    keywords: ['shape', 'icon', 'badge', 'decor', 'graphic'],
  },
  {
    id: 'product-feed',
    title: 'Product feed',
    category: 'Forma Store',
    componentType: 'product-feed',
    description: 'Catalog-driven product strip for storefront sections.',
    preview: 'product-feed',
    previewImageSrc: 'assets/app/project/editor/grid gallery/default.png',
    keywords: ['catalog', 'products', 'shop', 'price', 'store'],
  },
  {
    id: 'blog-feed',
    title: 'Blog feed',
    category: 'Forma Blog',
    componentType: 'blog-feed',
    description: 'Recent articles list for editorial and marketing sections.',
    preview: 'blog-feed',
    keywords: ['blog', 'posts', 'articles', 'editorial', 'news'],
  },
];

export function filterStorefrontEditorAddElementsLibraryItems(
  items: readonly StorefrontEditorAddElementsLibraryItem[],
  category: StorefrontEditorAddElementsCategory,
  search: string
): StorefrontEditorAddElementsLibraryItem[] {
  const normalizedSearch = search.trim().toLowerCase();

  return items.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    if (!matchesCategory) {
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
