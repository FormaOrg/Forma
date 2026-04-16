import { StorefrontEditorViewport } from '../../../../../../../core/models/project-storefront.model';

export type StorefrontEditorComponentType =
  | 'text'
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'button'
  | 'menu'
  | 'search'
  | 'account'
  | 'cart'
  | 'icon'
  | 'spacer'
  | 'social-links'
  | 'faq'
  | 'contact-form'
  | 'testimonials'
  | 'checkout-form'
  | 'container'
  | 'graphic'
  | 'product-feed'
  | 'product-details'
  | 'cart-content'
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

export type StorefrontEditorResponsiveProps<TProps> = Partial<
  Record<Exclude<StorefrontEditorViewport, 'desktop'>, Partial<TProps>>
>;

export interface StorefrontEditorTextProps {
  text: string;
  richTextHtml: string;
  textStyle: StorefrontEditorTextStylePreset;
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
  align: StorefrontEditorTextAlign;
  lineHeight: number;
  letterSpacing: number;
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
  sourceWidth: number | null;
  sourceHeight: number | null;
  objectFit: 'cover' | 'contain';
  displayMode: 'fill' | 'fit' | 'aspect';
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  cropOuterOffsetX: number;
  cropOuterOffsetY: number;
  cropOuterWidth: number;
  cropOuterHeight: number;
  href: string;
  openInNewTab: boolean;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  radius: number;
  shadow: 'none' | 'soft' | 'medium' | 'bottom' | 'strong';
}

export interface StorefrontEditorButtonProps {
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
  textPreset: 'Paragraph 1' | 'Paragraph 2' | 'Heading 4';
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textColor: string;
  lineHeight: number;
  letterSpacing: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'none' | 'solid';
  radius: number;
  shadow: 'none' | 'soft' | 'medium' | 'bottom' | 'strong';
  padding: number;
  showText: boolean;
  showIcon: boolean;
  iconName: 'external-link' | 'invite-plus' | 'sparkles' | 'package' | 'wand' | 'eye' | 'user';
  customIconSrc: string | null;
  iconMotion: 'static' | 'animated';
  iconPosition: 'left' | 'right';
}

export interface StorefrontEditorMenuItem {
  id: string;
  label: string;
  href: string;
  openInNewTab: boolean;
}

export interface StorefrontEditorMenuProps {
  items: StorefrontEditorMenuItem[];
  displayMode: 'menu-bar' | 'hamburger';
  orientation: 'horizontal' | 'vertical';
  textPreset: 'Paragraph 1' | 'Paragraph 2' | 'Heading 4';
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  radius: number;
  spacing: number;
}

export type StorefrontEditorCartIconStyle =
  | 'bag-filled'
  | 'bag-outline'
  | 'basket-outline'
  | 'cart-outline'
  | 'text-inline'
  | 'cart-inline'
  | 'badge-only'
  | 'basket-badge'
  | 'text-badge';

export interface StorefrontEditorCartProps {
  label: string;
  iconStyle: StorefrontEditorCartIconStyle;
  labelFontFamily: string;
  labelColor: string;
  badgeFontFamily: string;
  badgeTextColor: string;
  badgeBackgroundColor: string;
  openMode: 'side' | 'page';
}

export interface StorefrontEditorSearchProps {
  iconColor: string;
  label: string;
  placeholder: string;
}

export type StorefrontEditorAccountIconStyle =
  | 'person-outline'
  | 'person-filled'
  | 'person-circle-outline'
  | 'person-circle-filled';

export interface StorefrontEditorAccountProps {
  iconColor: string;
  iconStyle: StorefrontEditorAccountIconStyle;
  iconSize: number;
  borderColor: string;
}

export interface StorefrontEditorIconProps {
  iconName:
    | 'sparkles'
    | 'package'
    | 'wand'
    | 'eye'
    | 'external-link'
    | 'rocket'
    | 'shield'
    | 'users'
    | 'bar-chart'
    | 'help-circle'
    | 'pen'
    | 'dollar-sign';
  iconSize: number;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
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
  borderColor: string;
  borderWidth: number;
  iconSize: number;
  itemSize: number;
  spacing: number;
  radius: number;
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

export interface StorefrontEditorTestimonialItem {
  name: string;
  role: string;
  text: string;
  rating: number;
  initials: string;
}

export interface StorefrontEditorTestimonialsProps {
  title: string;
  layout: 'grid' | 'stack';
  accentColor: string;
  cardBackground: string;
  textColor: string;
  items: StorefrontEditorTestimonialItem[];
}

export interface StorefrontEditorCheckoutFormProps {
  title: string;
  description: string;
  firstNameLabel: string;
  lastNameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  addressLabel: string;
  notesLabel: string;
  submitLabel: string;
}

export interface StorefrontEditorContainerProps {
  layout: 'stack' | 'row' | 'grid';
  gap: number;
  padding: number;
  justify: 'start' | 'center' | 'end' | 'space-between';
  align: 'start' | 'center' | 'end' | 'stretch';
  wrap: boolean;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  radius: number;
  shadow: 'none' | 'soft' | 'medium' | 'bottom' | 'strong';
  opacity: number;
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

export interface StorefrontEditorProductDetailsProps {
  quantityLabel: string;
  addToCartLabel: string;
  buyNowLabel: string;
  skuLabel: string;
  inStockLabel: string;
  outOfStockLabel: string;
  showCategory: boolean;
  showDescription: boolean;
  showFacts: boolean;
  showTags: boolean;
  showCompareAtPrice: boolean;
}

export interface StorefrontEditorCartContentProps {
  cartTitle: string;
  summaryTitle: string;
  subtotalLabel: string;
  totalLabel: string;
  promoPlaceholder: string;
  applyLabel: string;
  checkoutLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyButtonLabel: string;
  showImages: boolean;
  showMeta: boolean;
  showPromoCode: boolean;
}

export interface StorefrontEditorComponentBase<TType extends StorefrontEditorComponentType, TProps> {
  id: string;
  type: TType;
  name: string;
  isLocked: boolean;
  isVisible: boolean;
  zIndex: number;
  parentContainerId?: string | null;
  groupId?: string;
  rotation: number;
  frame: StorefrontEditorComponentFrame;
  responsiveFrames?: StorefrontEditorResponsiveFrames;
  responsiveProps?: StorefrontEditorResponsiveProps<TProps>;
  props: TProps;
  children: StorefrontEditorComponentNode[];
}

export type StorefrontEditorTextNode = StorefrontEditorComponentBase<'text', StorefrontEditorTextProps>;
export type StorefrontEditorHeadingNode = StorefrontEditorComponentBase<'heading', StorefrontEditorHeadingProps>;
export type StorefrontEditorParagraphNode = StorefrontEditorComponentBase<'paragraph', StorefrontEditorParagraphProps>;
export type StorefrontEditorImageNode = StorefrontEditorComponentBase<'image', StorefrontEditorImageProps>;
export type StorefrontEditorButtonNode = StorefrontEditorComponentBase<'button', StorefrontEditorButtonProps>;
export type StorefrontEditorMenuNode = StorefrontEditorComponentBase<'menu', StorefrontEditorMenuProps>;
export type StorefrontEditorSearchNode = StorefrontEditorComponentBase<'search', StorefrontEditorSearchProps>;
export type StorefrontEditorAccountNode = StorefrontEditorComponentBase<'account', StorefrontEditorAccountProps>;
export type StorefrontEditorCartNode = StorefrontEditorComponentBase<'cart', StorefrontEditorCartProps>;
export type StorefrontEditorIconNode = StorefrontEditorComponentBase<'icon', StorefrontEditorIconProps>;
export type StorefrontEditorSpacerNode = StorefrontEditorComponentBase<'spacer', StorefrontEditorSpacerProps>;
export type StorefrontEditorSocialLinksNode = StorefrontEditorComponentBase<'social-links', StorefrontEditorSocialLinksProps>;
export type StorefrontEditorFaqNode = StorefrontEditorComponentBase<'faq', StorefrontEditorFaqProps>;
export type StorefrontEditorContactFormNode = StorefrontEditorComponentBase<'contact-form', StorefrontEditorContactFormProps>;
export type StorefrontEditorTestimonialsNode = StorefrontEditorComponentBase<'testimonials', StorefrontEditorTestimonialsProps>;
export type StorefrontEditorCheckoutFormNode = StorefrontEditorComponentBase<'checkout-form', StorefrontEditorCheckoutFormProps>;
export type StorefrontEditorContainerNode = StorefrontEditorComponentBase<'container', StorefrontEditorContainerProps>;
export type StorefrontEditorGraphicNode = StorefrontEditorComponentBase<'graphic', StorefrontEditorGraphicProps>;
export type StorefrontEditorProductFeedNode = StorefrontEditorComponentBase<'product-feed', StorefrontEditorProductFeedProps>;
export type StorefrontEditorBlogFeedNode = StorefrontEditorComponentBase<'blog-feed', StorefrontEditorBlogFeedProps>;
export type StorefrontEditorProductDetailsNode = StorefrontEditorComponentBase<'product-details', StorefrontEditorProductDetailsProps>;
export type StorefrontEditorCartContentNode = StorefrontEditorComponentBase<'cart-content', StorefrontEditorCartContentProps>;

export type StorefrontEditorComponentNode =
  | StorefrontEditorTextNode
  | StorefrontEditorHeadingNode
  | StorefrontEditorParagraphNode
  | StorefrontEditorImageNode
  | StorefrontEditorButtonNode
  | StorefrontEditorMenuNode
  | StorefrontEditorSearchNode
  | StorefrontEditorAccountNode
  | StorefrontEditorCartNode
  | StorefrontEditorIconNode
  | StorefrontEditorSpacerNode
  | StorefrontEditorSocialLinksNode
  | StorefrontEditorFaqNode
  | StorefrontEditorContactFormNode
  | StorefrontEditorTestimonialsNode
  | StorefrontEditorCheckoutFormNode
  | StorefrontEditorContainerNode
  | StorefrontEditorGraphicNode
  | StorefrontEditorProductFeedNode
  | StorefrontEditorProductDetailsNode
  | StorefrontEditorCartContentNode
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
    case 'menu':
      return { x: 32, y: 236, width: 320, height: 48 };
    case 'search':
      return { x: 364, y: 236, width: 48, height: 48 };
    case 'account':
      return { x: 420, y: 236, width: 40, height: 48 };
    case 'cart':
      return { x: 220, y: 236, width: 132, height: 48 };
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
    case 'testimonials':
      return { x: 32, y: 32, width: 560, height: 320 };
    case 'checkout-form':
      return { x: 32, y: 120, width: 760, height: 520 };
    case 'container':
      return { x: 32, y: 32, width: 340, height: 220 };
    case 'graphic':
      return { x: 420, y: 250, width: 96, height: 96 };
    case 'product-feed':
      return { x: 32, y: 32, width: 560, height: 300 };
    case 'blog-feed':
      return { x: 32, y: 32, width: 360, height: 180 };
    case 'product-details':
      return { x: 32, y: 32, width: 860, height: 520 };
    case 'cart-content':
      return { x: 32, y: 32, width: 920, height: 520 };
  }
}

export function resolveStorefrontEditorImageDisplayMode(
  props: Pick<StorefrontEditorImageProps, 'displayMode' | 'objectFit'>
): StorefrontEditorImageProps['displayMode'] {
  const displayMode = props.displayMode;
  if (displayMode === 'fit' || displayMode === 'aspect' || displayMode === 'fill') {
    return displayMode;
  }

  return props.objectFit === 'contain' ? 'fit' : 'fill';
}

export function resolveStorefrontEditorImageAspectRatio(
  props: Pick<StorefrontEditorImageProps, 'sourceWidth' | 'sourceHeight' | 'aspectRatio'>,
  fallback: number
): number {
  const sourceWidth = Number(props.sourceWidth ?? 0);
  const sourceHeight = Number(props.sourceHeight ?? 0);
  if (Number.isFinite(sourceWidth) && Number.isFinite(sourceHeight) && sourceWidth > 0 && sourceHeight > 0) {
    return sourceWidth / sourceHeight;
  }

  return parseStorefrontEditorAspectRatio(props.aspectRatio, fallback);
}

export function normalizeStorefrontEditorImageCropRect(
  props: Pick<StorefrontEditorImageProps, 'cropX' | 'cropY' | 'cropWidth' | 'cropHeight'>
): { x: number; y: number; width: number; height: number } {
  const width = Math.max(0.01, clampImageUnit(props.cropWidth ?? 1));
  const height = Math.max(0.01, clampImageUnit(props.cropHeight ?? 1));
  const x = Math.min(clampImageUnit(props.cropX ?? 0), 1 - width);
  const y = Math.min(clampImageUnit(props.cropY ?? 0), 1 - height);
  return { x, y, width, height };
}

export function resolveStorefrontEditorImageViewportBounds(
  props: Pick<StorefrontEditorImageProps, 'displayMode' | 'objectFit' | 'sourceWidth' | 'sourceHeight' | 'aspectRatio'>,
  frameWidth: number,
  frameHeight: number
): { x: number; y: number; width: number; height: number } {
  if (resolveStorefrontEditorImageDisplayMode(props) === 'fill') {
    return { x: 0, y: 0, width: frameWidth, height: frameHeight };
  }

  const frameAspectRatio = frameWidth > 0 && frameHeight > 0 ? frameWidth / frameHeight : 1;
  const imageAspectRatio = resolveStorefrontEditorImageAspectRatio(props, frameAspectRatio);
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

export function buildStorefrontEditorImageSourceMetadata(
  width: number,
  height: number
): Pick<StorefrontEditorImageProps, 'sourceWidth' | 'sourceHeight' | 'aspectRatio'> {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const divisor = greatestCommonDivisor(safeWidth, safeHeight);

  return {
    sourceWidth: safeWidth,
    sourceHeight: safeHeight,
    aspectRatio: `${safeWidth / divisor} / ${safeHeight / divisor}`,
  };
}

function parseStorefrontEditorAspectRatio(value: string | null | undefined, fallback: number): number {
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

function clampImageUnit(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return Math.max(a, 1);
}

export function buildStorefrontEditorTextProps(
  textStyle: StorefrontEditorTextStylePreset,
  overrides: Partial<StorefrontEditorTextProps> = {}
): StorefrontEditorTextProps {
  const lineHeight =
    textStyle === 'Heading 1' ? 1 :
    textStyle === 'Heading 2' ? 1.04 :
    textStyle === 'Heading 3' ? 1.08 :
    textStyle === 'Heading 4' ? 1.14 :
    textStyle === 'Heading 5' ? 1.2 :
    textStyle === 'Heading 6' ? 1.24 :
    textStyle === 'Paragraph 1' ? 1.55 :
    textStyle === 'Paragraph 2' ? 1.5 :
    1.42;
  const letterSpacing =
    textStyle === 'Heading 1' ? -0.06 :
    textStyle === 'Heading 2' ? -0.05 :
    textStyle === 'Heading 3' ? -0.03 :
    textStyle.startsWith('Heading') ? -0.02 :
    0;

  const baseByStyle: Record<
    StorefrontEditorTextStylePreset,
    Omit<StorefrontEditorTextProps, 'text' | 'textStyle' | 'href' | 'openInNewTab'>
  > = {
    'Heading 1': {
      richTextHtml: '',
      fontFamily: 'Playfair Display',
      fontSize: 48,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
      lineHeight,
      letterSpacing,
    },
    'Heading 2': {
      richTextHtml: '',
      fontFamily: 'Playfair Display',
      fontSize: 36,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
      lineHeight,
      letterSpacing,
    },
    'Heading 3': {
      richTextHtml: '',
      fontFamily: 'Poppins',
      fontSize: 28,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
      lineHeight,
      letterSpacing,
    },
    'Heading 4': {
      richTextHtml: '',
      fontFamily: 'Poppins',
      fontSize: 22,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
      lineHeight,
      letterSpacing,
    },
    'Heading 5': {
      richTextHtml: '',
      fontFamily: 'Poppins',
      fontSize: 18,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
      lineHeight,
      letterSpacing,
    },
    'Heading 6': {
      richTextHtml: '',
      fontFamily: 'Poppins',
      fontSize: 15,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#18263c',
      align: 'left',
      lineHeight,
      letterSpacing,
    },
    'Paragraph 1': {
      richTextHtml: '',
      fontFamily: 'Fira Sans',
      fontSize: 18,
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#1f2937',
      align: 'left',
      lineHeight,
      letterSpacing,
    },
    'Paragraph 2': {
      richTextHtml: '',
      fontFamily: 'Fira Sans',
      fontSize: 15,
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#1f2937',
      align: 'left',
      lineHeight,
      letterSpacing,
    },
    'Paragraph 3': {
      richTextHtml: '',
      fontFamily: 'Fira Mono',
      fontSize: 13,
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#4b5563',
      align: 'left',
      lineHeight,
      letterSpacing,
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

function createStorefrontEditorMenuItem(
  label: string,
  href: string,
  openInNewTab = false
): StorefrontEditorMenuItem {
  return {
    id: createStorefrontEditorComponentId('menu'),
    label,
    href,
    openInNewTab,
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
          sourceWidth: null,
          sourceHeight: null,
          objectFit: 'cover',
          displayMode: 'fill',
          cropX: 0,
          cropY: 0,
          cropWidth: 1,
          cropHeight: 1,
          cropOuterOffsetX: 0,
          cropOuterOffsetY: 0,
          cropOuterWidth: getDefaultStorefrontEditorComponentFrame('image').width,
          cropOuterHeight: getDefaultStorefrontEditorComponentFrame('image').height,
          href: '',
          openInNewTab: false,
          opacity: 100,
          borderColor: '#111827',
          borderWidth: 0,
          borderStyle: 'solid',
          radius: 0,
          shadow: 'none',
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
          fontStyle: 'normal',
          textDecoration: 'none',
          textColor: '#ffffff',
          lineHeight: 1.5,
          letterSpacing: 0,
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
    case 'menu':
      return {
        ...createStorefrontEditorComponentBase('menu'),
        name: 'Menu',
        props: {
          items: [
            createStorefrontEditorMenuItem('Home', '/'),
            createStorefrontEditorMenuItem('Shop', '/products'),
            createStorefrontEditorMenuItem('Contact', '/contact'),
          ],
          displayMode: 'menu-bar',
          orientation: 'horizontal',
          textPreset: 'Paragraph 2',
          fontFamily: 'Poppins',
          fontSize: 15,
          fontWeight: 500,
          textColor: '#18263c',
          borderColor: '#d6deec',
          borderWidth: 0,
          borderStyle: 'none',
          radius: 16,
          spacing: 22,
        },
      };
    case 'search':
      return {
        ...createStorefrontEditorComponentBase('search'),
        name: 'Search',
        props: {
          iconColor: '#111827',
          label: 'Search',
          placeholder: 'Search products',
        },
      };
    case 'account':
      return {
        ...createStorefrontEditorComponentBase('account'),
        name: 'Account',
        props: {
          iconColor: '#111827',
          iconStyle: 'person-outline',
          iconSize: 24,
          borderColor: '#111827',
        },
      };
    case 'cart':
      return {
        ...createStorefrontEditorComponentBase('cart'),
        name: 'Cart',
        props: {
          label: 'Cart',
          iconStyle: 'cart-outline',
          labelFontFamily: 'Poppins',
          labelColor: '#2563eb',
          badgeFontFamily: 'Poppins',
          badgeTextColor: '#ffffff',
          badgeBackgroundColor: '#2563eb',
          openMode: 'side',
        },
      };
    case 'icon':
      return {
        ...createStorefrontEditorComponentBase('icon'),
        name: 'Icon',
        props: {
          iconName: 'sparkles',
          iconSize: 30,
          color: '#355cff',
          backgroundColor: 'transparent',
          borderColor: 'rgba(53, 92, 255, 0.16)',
          borderWidth: 0,
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
          borderColor: '#111827',
          borderWidth: 1,
          iconSize: 18,
          itemSize: 38,
          spacing: 12,
          radius: 12,
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
    case 'testimonials':
      return {
        ...createStorefrontEditorComponentBase('testimonials'),
        name: 'Testimonials',
        props: {
          title: 'What customers say',
          layout: 'grid',
          accentColor: '#f59e0b',
          cardBackground: '#ffffff',
          textColor: '#0f172a',
          items: [
            {
              name: 'Sarah M.',
              role: 'Verified buyer',
              text: 'Absolutely love this product. The quality exceeded my expectations and shipping was super fast.',
              rating: 5,
              initials: 'SM',
            },
            {
              name: 'James T.',
              role: 'Verified buyer',
              text: 'Great value for the price. Already recommended it to three friends. Will definitely buy again.',
              rating: 5,
              initials: 'JT',
            },
            {
              name: 'Priya L.',
              role: 'Verified buyer',
              text: 'Beautiful packaging, fast delivery, and the product is exactly as described. Five stars.',
              rating: 5,
              initials: 'PL',
            },
          ],
        },
      };
    case 'checkout-form':
      return {
        ...createStorefrontEditorComponentBase('checkout-form'),
        name: 'Checkout form',
        props: {
          title: 'Checkout',
          description: 'Collect delivery and contact information before placing the order.',
          firstNameLabel: 'First name',
          lastNameLabel: 'Last name',
          phoneLabel: 'Phone',
          emailLabel: 'Email',
          addressLabel: 'Address',
          notesLabel: 'Order notes',
          submitLabel: 'Place order',
        },
      };
    case 'container':
      return {
        ...createStorefrontEditorComponentBase('container'),
        name: 'Container',
        props: {
          layout: 'stack',
          gap: 0,
          padding: 0,
          justify: 'start',
          align: 'stretch',
          wrap: false,
          backgroundColor: '#ffffff',
          borderColor: '#111827',
          borderWidth: 0,
          borderStyle: 'none',
          radius: 0,
          shadow: 'none',
          opacity: 100,
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
    case 'product-details':
      return {
        ...createStorefrontEditorComponentBase('product-details'),
        name: 'Product details',
        props: {
          quantityLabel: 'Quantity',
          addToCartLabel: 'Add to Cart',
          buyNowLabel: 'Buy it now',
          skuLabel: 'SKU',
          inStockLabel: 'In stock',
          outOfStockLabel: 'Out of stock',
          showCategory: true,
          showDescription: true,
          showFacts: true,
          showTags: true,
          showCompareAtPrice: true,
        },
      };
    case 'cart-content':
      return {
        ...createStorefrontEditorComponentBase('cart-content'),
        name: 'Cart content',
        props: {
          cartTitle: 'YOUR CART',
          summaryTitle: 'Order Summary',
          subtotalLabel: 'Subtotal',
          totalLabel: 'Total',
          promoPlaceholder: 'Add promo code',
          applyLabel: 'Apply',
          checkoutLabel: 'Go to Checkout',
          emptyTitle: 'Your cart is empty',
          emptyDescription: 'Add products to the cart to see them here.',
          emptyButtonLabel: 'Continue shopping',
          showImages: true,
          showMeta: true,
          showPromoCode: true,
        },
      };
  }
}
