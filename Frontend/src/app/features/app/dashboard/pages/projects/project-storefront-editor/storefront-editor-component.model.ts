export type StorefrontEditorComponentType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'button'
  | 'container'
  | 'graphic'
  | 'product-feed'
  | 'blog-feed';

export type StorefrontEditorTextAlign = 'left' | 'center' | 'right';
export type StorefrontEditorSlotName = 'default' | 'content' | 'media' | 'actions';

export interface StorefrontEditorComponentFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StorefrontEditorHeadingProps {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  align: StorefrontEditorTextAlign;
}

export interface StorefrontEditorParagraphProps {
  text: string;
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
}

export interface StorefrontEditorContainerProps {
  layout: 'stack' | 'row' | 'grid';
  gap: number;
  padding: number;
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
  props: TProps;
  children: StorefrontEditorComponentNode[];
}

export type StorefrontEditorHeadingNode = StorefrontEditorComponentBase<'heading', StorefrontEditorHeadingProps>;
export type StorefrontEditorParagraphNode = StorefrontEditorComponentBase<'paragraph', StorefrontEditorParagraphProps>;
export type StorefrontEditorImageNode = StorefrontEditorComponentBase<'image', StorefrontEditorImageProps>;
export type StorefrontEditorButtonNode = StorefrontEditorComponentBase<'button', StorefrontEditorButtonProps>;
export type StorefrontEditorContainerNode = StorefrontEditorComponentBase<'container', StorefrontEditorContainerProps>;
export type StorefrontEditorGraphicNode = StorefrontEditorComponentBase<'graphic', StorefrontEditorGraphicProps>;
export type StorefrontEditorProductFeedNode = StorefrontEditorComponentBase<'product-feed', StorefrontEditorProductFeedProps>;
export type StorefrontEditorBlogFeedNode = StorefrontEditorComponentBase<'blog-feed', StorefrontEditorBlogFeedProps>;

export type StorefrontEditorComponentNode =
  | StorefrontEditorHeadingNode
  | StorefrontEditorParagraphNode
  | StorefrontEditorImageNode
  | StorefrontEditorButtonNode
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
    case 'heading':
      return { x: 32, y: 32, width: 280, height: 64 };
    case 'paragraph':
      return { x: 32, y: 120, width: 320, height: 92 };
    case 'image':
      return { x: 380, y: 36, width: 260, height: 180 };
    case 'button':
      return { x: 32, y: 236, width: 170, height: 48 };
    case 'container':
      return { x: 32, y: 32, width: 340, height: 220 };
    case 'graphic':
      return { x: 420, y: 250, width: 96, height: 96 };
    case 'product-feed':
      return { x: 32, y: 32, width: 420, height: 220 };
    case 'blog-feed':
      return { x: 32, y: 32, width: 360, height: 180 };
  }
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
        name: 'Product feed',
        props: {
          title: 'Featured products',
          source: 'catalog',
          limit: 4,
        },
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
