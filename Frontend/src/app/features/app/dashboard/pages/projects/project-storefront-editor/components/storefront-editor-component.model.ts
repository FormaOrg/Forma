import { StorefrontEditorViewport } from '../../../../../../../core/models/project-storefront.model';

export type StorefrontEditorComponentType =
  | 'text'
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'button'
  | 'icon'
  | 'spacer'
  | 'social-links'
  | 'faq'
  | 'contact-form'
  | 'container'
  | 'graphic'
  | 'product-feed'
  | 'blog-feed';

export type StorefrontEditorTextAlign = 'left' | 'center' | 'right' | 'justify';
export type StorefrontEditorSlotName = 'default' | 'content' | 'media' | 'actions';
export type StorefrontEditorTextStylePreset =
  | 'Heading 1'
  | 'Heading 2'
  | 'Heading 3'
  | 'Heading 4'
  | 'Heading 5'
  | 'Heading 6'
  | 'Paragraph 1'
  | 'Paragraph 2'
  | 'Paragraph 3';

export interface StorefrontEditorComponentFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type StorefrontEditorResponsiveFrames = Partial<
  Record<Exclude<StorefrontEditorViewport, 'desktop'>, StorefrontEditorComponentFrame>
>;

export interface StorefrontEditorTextProps {
  text: string;
  textStyle: StorefrontEditorTextStylePreset;
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
  align: StorefrontEditorTextAlign;
  href: string;
  openInNewTab: boolean;
}

export interface StorefrontEditorHeadingProps {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  align: StorefrontEditorTextAlign;
}

export interface StorefrontEditorParagraphProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
  align: StorefrontEditorTextAlign;
}

export interface StorefrontEditorImageProps {
  src: string | null;
  alt: string;
  aspectRatio: string;
  objectFit: 'cover' | 'contain';
}

export interface StorefrontEditorButtonProps {
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
  textPreset: 'Paragraph 1' | 'Paragraph 2' | 'Heading 4';
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'none' | 'solid';
  radius: number;
  shadow: 'none' | 'soft' | 'medium' | 'strong';
  padding: number;
  showText: boolean;
  showIcon: boolean;
  iconName: 'external-link' | 'invite-plus' | 'sparkles' | 'package' | 'wand' | 'eye';
  customIconSrc: string | null;
  iconMotion: 'static' | 'animated';
  iconPosition: 'left' | 'right';
}

export interface StorefrontEditorIconProps {
  iconName: 'sparkles' | 'package' | 'wand' | 'eye' | 'external-link';
  color: string;
  backgroundColor: string;
  radius: number;
}

export interface StorefrontEditorSpacerProps {
  style: 'empty' | 'line';
  lineColor: string;
}

export interface StorefrontEditorSocialLinksProps {
  style: 'ghost' | 'filled';
  color: string;
  backgroundColor: string;
  labels: string[];
}

export interface StorefrontEditorFaqItem {
  question: string;
  answer: string;
}

export interface StorefrontEditorFaqProps {
  title: string;
  items: StorefrontEditorFaqItem[];
}

export interface StorefrontEditorContactFormProps {
  eyebrow: string;
  title: string;
  description: string;
  submitLabel: string;
  consentLabel: string;
  successMessage: string;
}

export interface StorefrontEditorContainerProps {
  layout: 'stack' | 'row' | 'grid';
  gap: number;
  padding: number;
  justify: 'start' | 'center' | 'end' | 'space-between';
  align: 'start' | 'center' | 'end' | 'stretch';
  wrap: boolean;
  backgroundColor: string;
}

export interface StorefrontEditorGraphicProps {
  style: 'shape' | 'icon' | 'badge';
  accentColor: string;
}

export interface StorefrontEditorProductFeedProps {
  title: string;
  source: 'manual' | 'catalog';
  limit: number;
  designPreset: 'grid-gallery' | 'filter-gallery' | 'gallery-add-to-cart' | 'gallery-quick-add' | 'gallery-minimal';
  category: string;
  textColor: string;
  badgeTextColor: string;
  badgeBackgroundColor: string;
  showBadges: boolean;
  showCompareAtPrice: boolean;
  showColorDots: boolean;
  showFilters: boolean;
  showSort: boolean;
  showAddToCart: boolean;
  quickAddStyle: 'button' | 'overlay' | 'none';
  columns: 3 | 4 | 5;
  imageRadius: number;
}

export interface StorefrontEditorBlogFeedProps {
  title: string;
  limit: number;
}

export interface StorefrontEditorComponentBase<TType extends StorefrontEditorComponentType, TProps> {
  id: string;
  type: TType;
  name: string;
  isLocked: boolean;
  isVisible: boolean;
  zIndex: number;
  groupId?: string;
  rotation: number;
  frame: StorefrontEditorComponentFrame;
  responsiveFrames?: StorefrontEditorResponsiveFrames;
  props: TProps;
  children: StorefrontEditorComponentNode[];
}

export type StorefrontEditorTextNode = StorefrontEditorComponentBase<'text', StorefrontEditorTextProps>;
export type StorefrontEditorHeadingNode = StorefrontEditorComponentBase<'heading', StorefrontEditorHeadingProps>;
export type StorefrontEditorParagraphNode = StorefrontEditorComponentBase<'paragraph', StorefrontEditorParagraphProps>;
export type StorefrontEditorImageNode = StorefrontEditorComponentBase<'image', StorefrontEditorImageProps>;
export type StorefrontEditorButtonNode = StorefrontEditorComponentBase<'button', StorefrontEditorButtonProps>;
export type StorefrontEditorIconNode = StorefrontEditorComponentBase<'icon', StorefrontEditorIconProps>;
export type StorefrontEditorSpacerNode = StorefrontEditorComponentBase<'spacer', StorefrontEditorSpacerProps>;
export type StorefrontEditorSocialLinksNode = StorefrontEditorComponentBase<'social-links', StorefrontEditorSocialLinksProps>;
export type StorefrontEditorFaqNode = StorefrontEditorComponentBase<'faq', StorefrontEditorFaqProps>;
export type StorefrontEditorContactFormNode = StorefrontEditorComponentBase<'contact-form', StorefrontEditorContactFormProps>;
export type StorefrontEditorContainerNode = StorefrontEditorComponentBase<'container', StorefrontEditorContainerProps>;
export type StorefrontEditorGraphicNode = StorefrontEditorComponentBase<'graphic', StorefrontEditorGraphicProps>;
export type StorefrontEditorProductFeedNode = StorefrontEditorComponentBase<'product-feed', StorefrontEditorProductFeedProps>;
export type StorefrontEditorBlogFeedNode = StorefrontEditorComponentBase<'blog-feed', StorefrontEditorBlogFeedProps>;

export type StorefrontEditorComponentNode =
  | StorefrontEditorTextNode
  | StorefrontEditorHeadingNode
  | StorefrontEditorParagraphNode
  | StorefrontEditorImageNode
  | StorefrontEditorButtonNode
  | StorefrontEditorIconNode
  | StorefrontEditorSpacerNode
  | StorefrontEditorSocialLinksNode
  | StorefrontEditorFaqNode
  | StorefrontEditorContactFormNode
  | StorefrontEditorContainerNode
  | StorefrontEditorGraphicNode
  | StorefrontEditorProductFeedNode
  | StorefrontEditorBlogFeedNode;

export interface StorefrontEditorSectionSlot {
  id: string;
  name: StorefrontEditorSlotName;
  accepts: 'any' | readonly StorefrontEditorComponentType[];
  components: StorefrontEditorComponentNode[];
}

export interface StorefrontEditorSectionComposition {
  sectionId: string;
  slots: StorefrontEditorSectionSlot[];
}

function createStorefrontEditorComponentId(type: StorefrontEditorComponentType): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${type}-${random}`;
}

function getDefaultStorefrontEditorComponentFrame(
  type: StorefrontEditorComponentType
): StorefrontEditorComponentFrame {
  switch (type) {
    case 'text':
      return { x: 32, y: 120, width: 320, height: 92 };
    case 'heading':
      return { x: 32, y: 32, width: 280, height: 64 };
    case 'paragraph':
      return { x: 32, y: 120, width: 320, height: 92 };
    case 'image':
      return { x: 380, y: 36, width: 260, height: 180 };
    case 'button':
      return { x: 32, y: 236, width: 170, height: 48 };
    case 'icon':
      return { x: 32, y: 300, width: 72, height: 72 };
    case 'spacer':
      return { x: 32, y: 320, width: 320, height: 36 };
    case 'social-links':
      return { x: 32, y: 360, width: 180, height: 48 };
    case 'faq':
      return { x: 32, y: 430, width: 420, height: 220 };
    case 'contact-form':
      return { x: 32, y: 430, width: 440, height: 520 };
    case 'container':
      return { x: 32, y: 32, width: 340, height: 220 };
    case 'graphic':
      return { x: 420, y: 250, width: 96, height: 96 };
    case 'product-feed':
      return { x: 32, y: 32, width: 560, height: 300 };
    case 'blog-feed':
      return { x: 32, y: 32, width: 360, height: 180 };
  }
}

export function buildStorefrontEditorTextProps(
  textStyle: StorefrontEditorTextStylePreset,
  overrides: Partial<StorefrontEditorTextProps> = {}
): StorefrontEditorTextProps {
  const baseByStyle: Record<
    StorefrontEditorTextStylePreset,
    Omit<StorefrontEditorTextProps, 'text' | 'textStyle' | 'href' | 'openInNewTab'>
  > = {
    'Heading 1': {
      fontFamily: 'Playfair Display',
      fontSize: 48,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
    },
    'Heading 2': {
      fontFamily: 'Playfair Display',
      fontSize: 36,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
    },
    'Heading 3': {
      fontFamily: 'Poppins',
      fontSize: 28,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
    },
    'Heading 4': {
      fontFamily: 'Poppins',
      fontSize: 22,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
    },
    'Heading 5': {
      fontFamily: 'Poppins',
      fontSize: 18,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
    },
    'Heading 6': {
      fontFamily: 'Poppins',
      fontSize: 15,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
    },
    'Paragraph 1': {
      fontFamily: 'Fira Sans',
      fontSize: 18,
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#1f2937',
      align: 'left',
    },
    'Paragraph 2': {
      fontFamily: 'Fira Sans',
      fontSize: 15,
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#1f2937',
      align: 'left',
    },
    'Paragraph 3': {
      fontFamily: 'Fira Mono',
      fontSize: 13,
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#4b5563',
      align: 'left',
    },
  };

  return {
    text: textStyle.startsWith('Heading') ? 'Heading' : 'Tell visitors what this section is about and why it matters.',
    textStyle,
    href: '',
    openInNewTab: false,
    ...baseByStyle[textStyle],
    ...overrides,
  };
}

export function buildStorefrontEditorProductFeedProps(
  designPreset: StorefrontEditorProductFeedProps['designPreset'],
  overrides: Partial<StorefrontEditorProductFeedProps> = {}
): StorefrontEditorProductFeedProps {
  const baseByPreset: Record<
    StorefrontEditorProductFeedProps['designPreset'],
    Omit<StorefrontEditorProductFeedProps, 'title' | 'source' | 'limit' | 'designPreset' | 'category'>
  > = {
    'grid-gallery': {
      textColor: '#202124',
      badgeTextColor: '#ffffff',
      badgeBackgroundColor: '#111111',
      showBadges: true,
      showCompareAtPrice: true,
      showColorDots: false,
      showFilters: false,
      showSort: false,
      showAddToCart: false,
      quickAddStyle: 'none',
      columns: 4,
      imageRadius: 0,
    },
    'filter-gallery': {
      textColor: '#202124',
      badgeTextColor: '#ffffff',
      badgeBackgroundColor: '#111111',
      showBadges: true,
      showCompareAtPrice: true,
      showColorDots: true,
      showFilters: true,
      showSort: true,
      showAddToCart: false,
      quickAddStyle: 'none',
      columns: 3,
      imageRadius: 18,
    },
    'gallery-add-to-cart': {
      textColor: '#202124',
      badgeTextColor: '#5c5d62',
      badgeBackgroundColor: '#ffffff',
      showBadges: true,
      showCompareAtPrice: true,
      showColorDots: false,
      showFilters: false,
      showSort: false,
      showAddToCart: true,
      quickAddStyle: 'button',
      columns: 4,
      imageRadius: 0,
    },
    'gallery-quick-add': {
      textColor: '#202124',
      badgeTextColor: '#ffffff',
      badgeBackgroundColor: '#111111',
      showBadges: false,
      showCompareAtPrice: true,
      showColorDots: true,
      showFilters: false,
      showSort: false,
      showAddToCart: true,
      quickAddStyle: 'overlay',
      columns: 5,
      imageRadius: 0,
    },
    'gallery-minimal': {
      textColor: '#202124',
      badgeTextColor: '#ffffff',
      badgeBackgroundColor: '#111111',
      showBadges: true,
      showCompareAtPrice: true,
      showColorDots: false,
      showFilters: false,
      showSort: false,
      showAddToCart: false,
      quickAddStyle: 'none',
      columns: 3,
      imageRadius: 24,
    },
  };

  return {
    title: 'Grid gallery',
    source: 'catalog',
    limit: designPreset === 'gallery-quick-add' ? 5 : designPreset === 'gallery-minimal' ? 3 : designPreset === 'grid-gallery' ? 8 : 3,
    designPreset,
    category: 'all',
    ...baseByPreset[designPreset],
    ...overrides,
  };
}

function createStorefrontEditorComponentBase<TType extends StorefrontEditorComponentType>(type: TType) {
  return {
    id: createStorefrontEditorComponentId(type),
    type,
    isLocked: false,
    isVisible: true,
    zIndex: 1,
    rotation: 0,
    frame: getDefaultStorefrontEditorComponentFrame(type),
    children: [] as StorefrontEditorComponentNode[],
  };
}

export function createStorefrontEditorComponentNode(
  type: StorefrontEditorComponentType
): StorefrontEditorComponentNode {
  switch (type) {
    case 'text':
      return {
        ...createStorefrontEditorComponentBase('text'),
        name: 'Text',
        props: buildStorefrontEditorTextProps('Paragraph 2'),
      };
    case 'heading':
      return {
        ...createStorefrontEditorComponentBase('heading'),
        name: 'Heading',
        props: {
          text: 'Heading',
          level: 2,
          align: 'left',
        },
      };
    case 'paragraph':
      return {
        ...createStorefrontEditorComponentBase('paragraph'),
        name: 'Paragraph',
        props: {
          text: 'Tell visitors what this section is about and why it matters.',
          fontFamily: 'Fira Sans',
          fontSize: 15,
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#1f2937',
          align: 'left',
        },
      };
    case 'image':
      return {
        ...createStorefrontEditorComponentBase('image'),
        name: 'Image',
        props: {
          src: null,
          alt: '',
          aspectRatio: '4 / 3',
          objectFit: 'cover',
        },
      };
    case 'button':
      return {
        ...createStorefrontEditorComponentBase('button'),
        name: 'Button',
        props: {
          label: 'Button',
          href: '',
          variant: 'primary',
          textPreset: 'Paragraph 2',
          fontFamily: 'Fira Mono',
          fontSize: 15,
          fontWeight: 500,
          textColor: '#ffffff',
          backgroundColor: '#0f172a',
          borderColor: '#0f172a',
          borderWidth: 0,
          borderStyle: 'none',
          radius: 12,
          shadow: 'none',
          padding: 18,
          showText: true,
          showIcon: false,
          iconName: 'external-link',
          customIconSrc: null,
          iconMotion: 'static',
          iconPosition: 'right',
        },
      };
    case 'icon':
      return {
        ...createStorefrontEditorComponentBase('icon'),
        name: 'Icon',
        props: {
          iconName: 'sparkles',
          color: '#355cff',
          backgroundColor: 'rgba(53, 92, 255, 0.08)',
          radius: 20,
        },
      };
    case 'spacer':
      return {
        ...createStorefrontEditorComponentBase('spacer'),
        name: 'Spacer',
        props: {
          style: 'line',
          lineColor: 'rgba(15, 23, 42, 0.14)',
        },
      };
    case 'social-links':
      return {
        ...createStorefrontEditorComponentBase('social-links'),
        name: 'Social links',
        props: {
          style: 'ghost',
          color: '#111827',
          backgroundColor: '#111827',
          labels: ['instagram', 'facebook', 'tiktok'],
        },
      };
    case 'faq':
      return {
        ...createStorefrontEditorComponentBase('faq'),
        name: 'FAQ',
        props: {
          title: 'Frequently asked questions',
          items: [
            {
              question: 'How long does delivery take?',
              answer: 'Orders are usually prepared within 1 to 2 business days.',
            },
            {
              question: 'Can I return an item?',
              answer: 'Yes. Returns are accepted according to your store policy and product condition.',
            },
            {
              question: 'Do you offer support before purchase?',
              answer: 'Yes. Use the contact details on the page and we will help you choose the right product.',
            },
          ],
        },
      };
    case 'contact-form':
      return {
        ...createStorefrontEditorComponentBase('contact-form'),
        name: 'Contact form',
        props: {
          eyebrow: 'Start a conversation',
          title: 'Let customers reach you fast',
          description: 'Use this form for product questions, wholesale inquiries, custom orders, or support requests.',
          submitLabel: 'Send message',
          consentLabel: 'I agree to be contacted about my request.',
          successMessage: 'Thanks, your message is ready to send.',
        },
      };
    case 'container':
      return {
        ...createStorefrontEditorComponentBase('container'),
        name: 'Container',
        props: {
          layout: 'stack',
          gap: 16,
          padding: 24,
          justify: 'start',
          align: 'stretch',
          wrap: false,
          backgroundColor: 'transparent',
        },
      };
    case 'graphic':
      return {
        ...createStorefrontEditorComponentBase('graphic'),
        name: 'Graphic',
        props: {
          style: 'shape',
          accentColor: '#355cff',
        },
      };
    case 'product-feed':
      return {
        ...createStorefrontEditorComponentBase('product-feed'),
        name: 'Grid gallery',
        props: buildStorefrontEditorProductFeedProps('grid-gallery'),
      };
    case 'blog-feed':
      return {
        ...createStorefrontEditorComponentBase('blog-feed'),
        name: 'Blog feed',
        props: {
          title: 'Latest posts',
          limit: 3,
        },
      };
  }
}
