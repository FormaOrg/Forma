import {
  ProjectStorefront,
  StorefrontEditorSession,
  StorefrontHomepageDocument,
  StorefrontHomepageSection,
  StorefrontSectionType,
} from '../../../../../../../core/models/project-storefront.model';
import {
  buildStorefrontEditorTextProps,
  createStorefrontEditorComponentNode,
  StorefrontEditorAccountNode,
  StorefrontEditorButtonNode,
  StorefrontEditorCartNode,
  StorefrontEditorComponentNode,
  StorefrontEditorContainerNode,
  StorefrontEditorSearchNode,
  StorefrontEditorTextNode,
} from '../components/storefront-editor-component.model';

const STOREFRONT_STABLE_SECTION_TYPES = ['header', 'footer'] as const;

type NormalizeEditorSession = (
  session: StorefrontEditorSession | null | undefined,
  homeDraftDocument?: StorefrontHomepageDocument | null
) => StorefrontEditorSession;

type StorefrontNormalizationOptions = {
  fallbackStoreName: string;
  normalizeEditorSession: NormalizeEditorSession;
};

function buildHeaderContainerComponent(): StorefrontEditorContainerNode {
  const container = createStorefrontEditorComponentNode('container') as StorefrontEditorContainerNode;
  return {
    ...container,
    name: 'Header Shell',
    zIndex: 1,
    frame: {
      x: 32,
      y: 16,
      width: 1136,
      height: 64,
    },
    props: {
      ...container.props,
      backgroundColor: '#ffffff',
      borderColor: '#d8e0ea',
      borderWidth: 1,
      borderStyle: 'solid',
      radius: 20,
      shadow: 'none',
      opacity: 100,
    },
  };
}

function buildHeaderBrandComponent(storeName: string, parentContainerId: string): StorefrontEditorTextNode {
  const text = createStorefrontEditorComponentNode('text') as StorefrontEditorTextNode;
  return {
    ...text,
    name: 'Brand',
    parentContainerId,
    zIndex: 2,
    frame: {
      x: 56,
      y: 29,
      width: 220,
      height: 28,
    },
    props: buildStorefrontEditorTextProps('Heading 5', {
      text: storeName,
      richTextHtml: '',
      fontFamily: 'Poppins',
      fontSize: 20,
      fontWeight: 600,
      color: '#0f172a',
      lineHeight: 1.15,
      letterSpacing: -0.01,
    }),
  };
}

function buildHeaderNavButtonComponent(
  label: string,
  href: string,
  frame: { x: number; y: number; width: number; height: number },
  parentContainerId: string
): StorefrontEditorButtonNode {
  const button = createStorefrontEditorComponentNode('button') as StorefrontEditorButtonNode;
  return {
    ...button,
    name: label,
    parentContainerId,
    zIndex: 2,
    frame,
    props: {
      ...button.props,
      label,
      href,
      variant: 'secondary',
      textPreset: 'Paragraph 2',
      fontFamily: 'Poppins',
      fontSize: 15,
      fontWeight: 500,
      textColor: '#475569',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      borderStyle: 'none',
      radius: 12,
      shadow: 'none',
      padding: 14,
      showText: true,
      showIcon: false,
    },
  };
}

function buildHeaderPrimaryActionComponent(parentContainerId: string): StorefrontEditorButtonNode {
  const button = createStorefrontEditorComponentNode('button') as StorefrontEditorButtonNode;
  return {
    ...button,
    name: 'Browse Products',
    parentContainerId,
    zIndex: 2,
    frame: {
      x: 850,
      y: 24,
      width: 180,
      height: 48,
    },
    props: {
      ...button.props,
      label: 'Browse products',
      href: '/products',
      variant: 'primary',
      textPreset: 'Paragraph 2',
      fontFamily: 'Poppins',
      fontSize: 15,
      fontWeight: 500,
      textColor: '#ffffff',
      backgroundColor: '#0f172a',
      borderColor: '#0f172a',
      borderWidth: 0,
      borderStyle: 'none',
      radius: 14,
      shadow: 'none',
      padding: 18,
      showText: true,
      showIcon: false,
    },
  };
}

function buildHeaderCartComponent(parentContainerId: string): StorefrontEditorCartNode {
  const cart = createStorefrontEditorComponentNode('cart') as StorefrontEditorCartNode;
  return {
    ...cart,
    name: 'Cart',
    parentContainerId,
    zIndex: 2,
    frame: {
      x: 1080,
      y: 24,
      width: 72,
      height: 48,
    },
    props: {
      ...cart.props,
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
}

function buildHeaderAccountComponent(parentContainerId: string): StorefrontEditorAccountNode {
  const account = createStorefrontEditorComponentNode('account') as StorefrontEditorAccountNode;
  return {
    ...account,
    name: 'Account',
    parentContainerId,
    zIndex: 2,
    frame: {
      x: 992,
      y: 28,
      width: 40,
      height: 40,
    },
    props: {
      ...account.props,
      iconColor: '#0f172a',
      borderColor: '#0f172a',
    },
  };
}

function buildHeaderSearchComponent(parentContainerId: string): StorefrontEditorSearchNode {
  const search = createStorefrontEditorComponentNode('search') as StorefrontEditorSearchNode;
  return {
    ...search,
    name: 'Search',
    parentContainerId,
    zIndex: 2,
    frame: {
      x: 1028,
      y: 24,
      width: 40,
      height: 48,
    },
    props: {
      ...search.props,
      iconColor: '#111827',
    },
  };
}

function ensureHeaderCartComponent(
  components: StorefrontEditorComponentNode[],
  storeName: string
): StorefrontEditorComponentNode[] {
  if (!Array.isArray(components) || !components.length) {
    return buildDefaultHeaderComponents(storeName);
  }

  const headerContainer = components.find((component) => component.type === 'container');
  if (!headerContainer || headerContainer.type !== 'container') {
    return components;
  }

  const normalized = components.map((component) => {
    if (component.type === 'button' && component.props.href === '/account') {
      return {
        ...buildHeaderAccountComponent(component.parentContainerId ?? headerContainer.id),
        id: component.id,
        parentContainerId: component.parentContainerId ?? headerContainer.id,
        zIndex: component.zIndex,
        isLocked: component.isLocked,
        isVisible: component.isVisible,
        rotation: component.rotation,
        frame: {
          ...component.frame,
          width: 40,
          height: 40,
        },
        responsiveFrames: component.responsiveFrames,
        responsiveProps: undefined,
      };
    }

    if (
      component.type === 'button'
      && component.props.label === 'Browse products'
      && component.frame.x === 948
      && component.frame.y === 24
      && component.frame.width === 164
      && component.frame.height === 48
    ) {
      return {
        ...component,
        frame: {
          ...component.frame,
          x: 850,
          width: 180,
        },
      };
    }

    if (
      component.type === 'cart'
      && component.frame.x === 1050
      && component.frame.y === 24
      && component.frame.width === 72
      && component.frame.height === 48
    ) {
      return {
        ...component,
        frame: {
          ...component.frame,
          x: 1080,
        },
      };
    }

    return component;
  });

  const shouldUpgradeLegacyHeader =
    normalized.some(
      (component) =>
        component.type === 'button'
        && component.props.label === 'Browse products'
        && component.frame.x === 948
        && component.frame.y === 24
        && component.frame.width === 164
        && component.frame.height === 48
    )
    || normalized.some(
      (component) =>
        component.type === 'cart'
        && component.frame.x === 1050
        && component.frame.y === 24
        && component.frame.width === 72
        && component.frame.height === 48
    );

  const withSearch = normalized.some((component) => component.type === 'search')
    ? normalized
    : normalized.concat(buildHeaderSearchComponent(headerContainer.id));

  const withAccount = withSearch.some(
    (component) => component.type === 'account'
  )
    ? withSearch
    : withSearch.concat(buildHeaderAccountComponent(headerContainer.id));

  return withAccount.some((component) => component.type === 'cart')
    ? withAccount
    : withAccount.concat(buildHeaderCartComponent(headerContainer.id));
}

function buildDefaultHeaderComponents(storeName: string): StorefrontEditorComponentNode[] {
  const container = buildHeaderContainerComponent();

  return [
    container,
    buildHeaderBrandComponent(storeName, container.id),
    buildHeaderNavButtonComponent('Home', '/', { x: 396, y: 28, width: 72, height: 40 }, container.id),
    buildHeaderNavButtonComponent('Shop', '/products', { x: 474, y: 28, width: 76, height: 40 }, container.id),
    buildHeaderNavButtonComponent('Featured', '#featured', { x: 560, y: 28, width: 104, height: 40 }, container.id),
    buildHeaderNavButtonComponent('Contact', '#contact', { x: 674, y: 28, width: 94, height: 40 }, container.id),
    buildHeaderPrimaryActionComponent(container.id),
    buildHeaderAccountComponent(container.id),
    buildHeaderSearchComponent(container.id),
    buildHeaderCartComponent(container.id),
  ];
}

export function createStorefrontSectionId(type: StorefrontSectionType): string {
  return `${type}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeStorefrontSectionType(type: unknown): StorefrontSectionType {
  switch (type) {
    case 'header':
    case 'announcement-bar':
    case 'hero':
    case 'featured-products':
    case 'contact':
    case 'footer':
      return type;
    default:
      return 'hero';
  }
}

export function buildStorefrontSection(
  type: StorefrontSectionType,
  storeName: string,
  createSectionId: (sectionType: StorefrontSectionType) => string = createStorefrontSectionId
): StorefrontHomepageSection {
  switch (type) {
    case 'header':
      return {
        id: createSectionId(type),
        type,
        enabled: true,
        props: {
          editorHeight: 96,
          editorComponents: buildDefaultHeaderComponents(storeName),
        },
      };
    case 'announcement-bar':
      return {
        id: createSectionId(type),
        type,
        enabled: true,
        props: {
          text: 'Welcome to your storefront',
          linkLabel: 'Browse products',
          linkHref: '/products',
        },
      };
    case 'featured-products':
      return {
        id: createSectionId(type),
        type,
        enabled: true,
        props: {
          title: 'Featured products',
          productIds: [],
          maxItems: 4,
        },
      };
    case 'contact':
      return {
        id: createSectionId(type),
        type,
        enabled: true,
        props: {
          eyebrow: 'Contact',
          title: `Talk to ${storeName}`,
          description:
            'Invite visitors to ask about custom orders, shipping questions, or product recommendations.',
          email: 'hello@store.com',
          phone: '+216 00 000 000',
          address: 'Tunis, Tunisia',
          ctaLabel: 'Email us',
          ctaHref: 'mailto:hello@store.com',
        },
      };
    case 'footer':
      return {
        id: createSectionId(type),
        type,
        enabled: true,
        props: {
          editorHeight: 168,
          brandText: storeName,
          contactEmail: 'store@example.com',
          contactPhone: '+216 00 000 000',
        },
      };
    default:
      return {
        id: createSectionId(type),
        type,
        enabled: true,
        props: {
          eyebrow: 'New store',
          title: storeName,
          description:
            'Introduce your brand, highlight what makes the catalog special, and guide visitors toward your products.',
          primaryCtaLabel: 'Browse products',
          primaryCtaHref: '/products',
          secondaryCtaLabel: 'Featured picks',
          secondaryCtaHref: '#featured',
        },
      };
  }
}

function buildDesignedDefaultHomepageSections(storeName: string): StorefrontHomepageSection[] {
  return [
    {
      id: 'header-9kf8srka',
      type: 'header',
      enabled: true,
      props: {
        editorHeight: 64,
        editorBackgroundColor: '#ffffff',
        editorLayoutAssignments: [],
        editorComponents: [
          {
            id: 'cart-3cd2fa37-0ae4-447c-a507-0f0dc3806b8b',
            name: 'Cart',
            type: 'cart',
            frame: { x: 1112, y: 16, width: 40, height: 40 },
            props: {
              label: 'Cart',
              openMode: 'side',
              iconStyle: 'cart-outline',
              labelColor: '#000000',
              badgeTextColor: '#ffffff',
              badgeFontFamily: 'Poppins',
              labelFontFamily: 'Poppins',
              badgeBackgroundColor: '#000000',
            },
            zIndex: 4,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            responsiveFrames: {
              tablet: { x: 704, y: 12, width: 40, height: 40 },
            },
            parentContainerId: 'container-56bc6d8a-a60c-450c-a3bf-b38dff33cc60',
          },
          {
            id: 'search-dbf4e459-fd28-450b-baa0-3ebdb7001907',
            name: 'Search',
            type: 'search',
            frame: { x: 1024, y: 16, width: 40, height: 40 },
            props: {
              label: 'Search',
              iconColor: '#111827',
              placeholder: 'Search products',
            },
            zIndex: 4,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            responsiveFrames: {
              tablet: { x: 624, y: 12, width: 40, height: 40 },
            },
            parentContainerId: 'container-56bc6d8a-a60c-450c-a3bf-b38dff33cc60',
          },
          {
            id: 'container-56bc6d8a-a60c-450c-a3bf-b38dff33cc60',
            name: 'Container',
            type: 'container',
            frame: { x: -8, y: 0, width: 1200, height: 64 },
            props: {
              gap: 0,
              wrap: false,
              align: 'stretch',
              layout: 'stack',
              radius: 0,
              shadow: 'none',
              justify: 'start',
              opacity: 100,
              padding: 0,
              borderColor: '#111827',
              borderStyle: 'none',
              borderWidth: 0,
              backgroundColor: '#ffffff',
            },
            zIndex: 3,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            responsiveFrames: {
              tablet: { x: 0, y: 0, width: 768, height: 64 },
            },
          },
          {
            id: 'menu-fbaa583d-0d89-4729-9e79-f7925c2ef83d',
            name: 'Menu',
            type: 'menu',
            frame: { x: 24, y: 16, width: 400, height: 32 },
            props: {
              items: [
                { id: 'menu-item-2b020776-a53f-4152-9221-4915ea4fd9d5', href: '/', label: 'WOMEN', openInNewTab: false },
                { id: 'menu-item-11d18524-889d-4b40-9676-b03367d402ed', href: '/', label: 'MEN', openInNewTab: false },
                { id: 'menu-item-d32e890b-c6c7-4270-9706-6167b98d4017', href: '/products', label: 'KIDS', openInNewTab: false },
                { id: 'menu-item-91197213-c4eb-48f1-88c5-beff161b1c87', href: '/products', label: 'BEST SELLERS', openInNewTab: false },
              ],
              radius: 16,
              spacing: 29,
              fontSize: 16,
              textColor: '#18263c',
              fontFamily: 'Sora',
              fontWeight: 400,
              textPreset: 'Paragraph 2',
              borderColor: '#d6deec',
              borderStyle: 'none',
              borderWidth: 0,
              displayMode: 'menu-bar',
              orientation: 'horizontal',
            },
            zIndex: 4,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            responsiveProps: {
              tablet: { displayMode: 'hamburger' },
            },
            responsiveFrames: {
              tablet: { x: 16.92, y: 16, width: 40, height: 32 },
            },
            parentContainerId: 'container-56bc6d8a-a60c-450c-a3bf-b38dff33cc60',
          },
          {
            id: 'image-ea3da76e-abf3-41f2-a805-519c436b8c53',
            name: 'Image',
            type: 'image',
            frame: { x: 576, y: 8, width: 48, height: 48 },
            props: {
              alt: `${storeName} logo`,
              src: 'https://res.cloudinary.com/dfml64rbi/image/upload/v1776246792/forma/media/file_uequaq.png',
              href: '/',
              cropX: 0,
              cropY: 0,
              radius: 0,
              shadow: 'none',
              opacity: 100,
              cropWidth: 1,
              objectFit: 'cover',
              cropHeight: 1,
              aspectRatio: '1 / 1',
              borderColor: '#111827',
              borderStyle: 'solid',
              borderWidth: 0,
              displayMode: 'fill',
              sourceWidth: 320,
              openInNewTab: false,
              sourceHeight: 320,
              cropOuterWidth: 48,
              cropOuterHeight: 48,
              cropOuterOffsetX: 0,
              cropOuterOffsetY: 0,
            },
            zIndex: 5,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            responsiveFrames: {
              tablet: { x: 360, y: 8, width: 48, height: 48 },
            },
            parentContainerId: 'container-56bc6d8a-a60c-450c-a3bf-b38dff33cc60',
          },
          {
            id: 'account-35e1a85a-88fa-47fe-9621-20174f7d4d7f',
            name: 'Account',
            type: 'account',
            frame: { x: 1064, y: 12, width: 40, height: 48 },
            props: {
              iconSize: 28,
              iconColor: '#0f172a',
              iconStyle: 'person-outline',
              borderColor: '#0f172a',
            },
            zIndex: 6,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            responsiveFrames: {
              tablet: { x: 664, y: 14, width: 40, height: 40 },
            },
            parentContainerId: 'container-56bc6d8a-a60c-450c-a3bf-b38dff33cc60',
          },
        ],
      },
    },
    {
      id: 'hero-8mu7cyew',
      type: 'hero',
      enabled: true,
      props: {
        eyebrow: '',
        title: '',
        description: '',
        primaryCtaLabel: '',
        primaryCtaHref: '',
        secondaryCtaLabel: '',
        secondaryCtaHref: '',
        editorLabel: 'Blank section',
        editorHeight: 567,
        editorLayoutRows: 1,
        editorBlankSection: true,
        editorLayoutPreset: 'two-columns',
        editorLayoutColumns: 3,
        editorLayoutRowSizes: [100],
        editorBackgroundColor: '#f8fafc',
        editorLayoutAssignments: [
          { componentId: 'text-63121801-d4bc-40da-a0bf-958a9430dc71', column: 2, row: 1 },
          { componentId: 'text-f951d0db-2a06-44ae-bec6-298b468f1e83', column: 2, row: 1 },
          { componentId: 'button-21c3e3b1-6111-4fce-8dc5-ee6db44fc359', column: 2, row: 1 },
          { componentId: 'image-1b00f6b6-9243-4b79-b436-64857ca5d1e2', column: 3, row: 1 },
        ],
        editorLayoutColumnSizes: [35.6844, 28.86621253918495, 35.449387460815046],
        editorComponents: [
          {
            id: 'image-3b4889bc-a25c-420e-8dfc-d1de8142027e',
            name: 'Image',
            type: 'image',
            frame: { x: 0, y: 0, width: 427.08, height: 566.99 },
            props: {
              alt: 'Hero left image',
              src: 'https://res.cloudinary.com/dfml64rbi/image/upload/v1776295037/forma/media/file_i1dfym.jpg',
              href: '',
              cropX: 0.011474127966274622,
              cropY: 0,
              radius: 0,
              shadow: 'none',
              opacity: 100,
              cropWidth: 0.9770517440674508,
              objectFit: 'cover',
              cropHeight: 1,
              aspectRatio: '764 / 991',
              borderColor: '#111827',
              borderStyle: 'solid',
              borderWidth: 0,
              displayMode: 'fill',
              sourceWidth: 764,
              openInNewTab: false,
              sourceHeight: 991,
              cropOuterWidth: 437.11,
              cropOuterHeight: 566.99,
              cropOuterOffsetX: -5.02,
              cropOuterOffsetY: 0,
            },
            zIndex: 3,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'text-63121801-d4bc-40da-a0bf-958a9430dc71',
            name: 'Text',
            type: 'text',
            frame: { x: 460, y: 56, width: 280, height: 168 },
            props: {
              text: 'The Latest in Streetwear Fashion',
              textStyle: 'Heading 2',
              href: '',
              openInNewTab: false,
              richTextHtml: '<h1>The Latest<br>in Streetwear Fashion</h1>',
              fontFamily: 'DM Serif Display',
              fontSize: 36,
              fontWeight: 600,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#020202',
              align: 'center',
              lineHeight: 1.5,
              letterSpacing: 0.02,
            },
            zIndex: 9,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'image-1b00f6b6-9243-4b79-b436-64857ca5d1e2',
            name: 'Image',
            type: 'image',
            frame: { x: 776, y: 0, width: 440, height: 568 },
            props: {
              alt: 'Hero right image',
              src: 'https://res.cloudinary.com/dfml64rbi/image/upload/v1776295033/forma/media/file_gg8xy2.jpg',
              href: '',
              cropX: 0,
              cropY: 0.0030455921475094454,
              radius: 0,
              shadow: 'none',
              opacity: 100,
              cropWidth: 1,
              objectFit: 'cover',
              cropHeight: 0.9939088157049811,
              aspectRatio: '763 / 991',
              borderColor: '#111827',
              borderStyle: 'solid',
              borderWidth: 0,
              displayMode: 'fill',
              sourceWidth: 763,
              openInNewTab: false,
              sourceHeight: 991,
              cropOuterWidth: 440,
              cropOuterHeight: 571.48,
              cropOuterOffsetX: 0,
              cropOuterOffsetY: -1.74,
            },
            zIndex: 10,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'text-f951d0db-2a06-44ae-bec6-298b468f1e83',
            name: 'Text',
            type: 'text',
            frame: { x: 488, y: 344, width: 224, height: 56 },
            props: {
              text: 'This is a space to welcome visitors to your site.',
              textStyle: 'Heading 2',
              href: '',
              openInNewTab: false,
              richTextHtml: '<p>This is a space to welcome visitors to your site.</p>',
              fontFamily: 'Inter',
              fontSize: 18,
              fontWeight: 400,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#1f2937',
              align: 'center',
              lineHeight: 1.5,
              letterSpacing: -0.02,
            },
            zIndex: 11,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'button-21c3e3b1-6111-4fce-8dc5-ee6db44fc359',
            name: 'Button',
            type: 'button',
            frame: { x: 515, y: 408, width: 170, height: 48 },
            props: {
              href: '',
              label: 'Shop Now',
              radius: 25,
              shadow: 'none',
              padding: 18,
              variant: 'primary',
              fontSize: 18,
              iconName: 'external-link',
              showIcon: false,
              showText: true,
              fontStyle: 'normal',
              textColor: '#ffffff',
              fontFamily: 'Fira Mono',
              fontWeight: 500,
              iconMotion: 'static',
              lineHeight: 1.5,
              textPreset: 'Paragraph 2',
              borderColor: '#0f172a',
              borderStyle: 'none',
              borderWidth: 0,
              iconPosition: 'right',
              customIconSrc: null,
              letterSpacing: 0,
              textDecoration: 'none',
              backgroundColor: '#008528',
            },
            zIndex: 12,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
        ],
      },
    },
    {
      id: 'hero-7onit1yv',
      type: 'hero',
      enabled: true,
      props: {
        eyebrow: '',
        title: '',
        description: '',
        primaryCtaLabel: '',
        primaryCtaHref: '',
        secondaryCtaLabel: '',
        secondaryCtaHref: '',
        editorLabel: 'Blank section',
        editorHeight: 1050,
        editorBlankSection: true,
        editorBackgroundColor: '#f8fafc',
        editorLayoutAssignments: [],
        editorComponents: [
          {
            id: 'text-a1370d33-5eb0-48d7-af86-ba3ed04d2df1',
            name: 'Text',
            type: 'text',
            frame: { x: 456, y: 24, width: 288, height: 80 },
            props: {
              href: '',
              text: 'New Drops',
              align: 'center',
              color: '#050505',
              fontSize: 48,
              fontStyle: 'normal',
              textStyle: 'Heading 2',
              fontFamily: 'DM Serif Display',
              fontWeight: 600,
              lineHeight: 1.5,
              openInNewTab: false,
              richTextHtml: '<h1>New Drops</h1>',
              letterSpacing: 0.02,
              textDecoration: 'none',
            },
            zIndex: 1,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'product-feed-50e58383-ca01-4b96-bbf6-74965085842e',
            name: 'Grid gallery',
            type: 'product-feed',
            frame: { x: 88, y: 128, width: 1024, height: 576 },
            props: {
              limit: 6,
              title: 'Grid gallery',
              source: 'catalog',
              columns: 3,
              category: 'all',
              showSort: false,
              textColor: '#202124',
              showBadges: true,
              imageRadius: 0,
              showFilters: false,
              designPreset: 'grid-gallery',
              quickAddStyle: 'none',
              showAddToCart: false,
              showColorDots: false,
              badgeTextColor: '#ffffff',
              showCompareAtPrice: true,
              badgeBackgroundColor: '#111111',
            },
            zIndex: 2,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
          },
          {
            id: 'button-7425180a-7afe-467c-a801-a9f88d78af98',
            name: 'Button',
            type: 'button',
            frame: { x: 515, y: 960, width: 170, height: 48 },
            props: {
              href: '',
              label: 'Shop Now',
              radius: 25,
              shadow: 'none',
              padding: 18,
              variant: 'primary',
              fontSize: 18,
              iconName: 'external-link',
              showIcon: false,
              showText: true,
              fontStyle: 'normal',
              textColor: '#ffffff',
              fontFamily: 'Fira Mono',
              fontWeight: 500,
              iconMotion: 'static',
              lineHeight: 1.5,
              textPreset: 'Paragraph 2',
              borderColor: '#0f172a',
              borderStyle: 'none',
              borderWidth: 0,
              iconPosition: 'right',
              customIconSrc: null,
              letterSpacing: 0,
              textDecoration: 'none',
              backgroundColor: '#008528',
            },
            zIndex: 3,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
        ],
      },
    },
    {
      id: 'hero-on8pwsdy',
      type: 'hero',
      enabled: true,
      props: {
        eyebrow: '',
        title: '',
        description: '',
        primaryCtaLabel: '',
        primaryCtaHref: '',
        secondaryCtaLabel: '',
        secondaryCtaHref: '',
        editorLabel: 'Blank section',
        editorHeight: 560,
        editorLayoutRows: 1,
        editorBlankSection: true,
        editorLayoutPreset: 'two-columns',
        editorLayoutColumns: 3,
        editorLayoutRowSizes: [100],
        editorBackgroundColor: '#e7e7e7',
        editorLayoutAssignments: [
          { row: 1, column: 3, componentId: 'image-064108ea-ae15-459e-bbaf-8195906a1c6a' },
          { row: 1, column: 1, componentId: 'image-62743d67-cece-499f-8af6-b4aa21f7498e' },
          { row: 1, column: 2, componentId: 'text-ca57e50c-fc15-4af0-acfe-878dff59d971' },
          { row: 1, column: 2, componentId: 'button-21c3e3b1-6111-4fce-8dc5-ee6db44fc359' },
          { row: 1, column: 2, componentId: 'icon-68d1ee1d-29b1-42ec-92d1-3179d3b43965' },
          { row: 1, column: 2, componentId: 'text-813b2921-acd9-4279-b6b7-9707356d3168' },
        ],
        editorLayoutColumnSizes: [35.6844, 28.86621253918495, 35.449387460815046],
        editorComponents: [
          {
            id: 'button-21c3e3b1-6111-4fce-8dc5-ee6db44fc359',
            name: 'Button',
            type: 'button',
            frame: { x: 532, y: 312, width: 136, height: 32 },
            props: {
              href: '',
              label: 'Shop Now',
              radius: 25,
              shadow: 'none',
              padding: 18,
              variant: 'primary',
              fontSize: 16,
              iconName: 'external-link',
              showIcon: false,
              showText: true,
              fontStyle: 'normal',
              textColor: '#ffffff',
              fontFamily: 'Fira Mono',
              fontWeight: 500,
              iconMotion: 'static',
              lineHeight: 1.5,
              textPreset: 'Paragraph 2',
              borderColor: '#0f172a',
              borderStyle: 'none',
              borderWidth: 0,
              iconPosition: 'right',
              customIconSrc: null,
              letterSpacing: 0,
              textDecoration: 'none',
              backgroundColor: '#008528',
            },
            zIndex: 12,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'image-62743d67-cece-499f-8af6-b4aa21f7498e',
            name: 'Image',
            type: 'image',
            frame: { x: 0, y: 0, width: 432, height: 560 },
            props: {
              alt: 'Promo left image',
              src: 'https://res.cloudinary.com/dfml64rbi/image/upload/v1776296716/forma/media/file_d8vzsd.jpg',
              href: '',
              cropX: 0,
              cropY: 0.002562536512825988,
              radius: 0,
              shadow: 'none',
              opacity: 100,
              cropWidth: 1,
              objectFit: 'cover',
              cropHeight: 0.847768557706509,
              aspectRatio: '635 / 991',
              borderColor: '#111827',
              borderStyle: 'solid',
              borderWidth: 0,
              displayMode: 'fill',
              sourceWidth: 635,
              openInNewTab: false,
              sourceHeight: 991,
              cropOuterWidth: 432,
              cropOuterHeight: 660.56,
              cropOuterOffsetX: 0,
              cropOuterOffsetY: -1.69,
            },
            zIndex: 13,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
          },
          {
            id: 'image-064108ea-ae15-459e-bbaf-8195906a1c6a',
            name: 'Image',
            type: 'image',
            frame: { x: 776, y: 0, width: 424, height: 560 },
            props: {
              alt: 'Promo right image',
              src: 'https://res.cloudinary.com/dfml64rbi/image/upload/v1776295030/forma/media/file_hseyjz.jpg',
              href: '',
              cropX: 0.0978945623342175,
              cropY: 0.01846590909090909,
              radius: 0,
              shadow: 'none',
              opacity: 100,
              cropWidth: 0.8216180371352785,
              objectFit: 'cover',
              cropHeight: 0.8863636363636364,
              aspectRatio: '377 / 462',
              borderColor: '#111827',
              borderStyle: 'solid',
              borderWidth: 0,
              displayMode: 'fill',
              sourceWidth: 377,
              openInNewTab: false,
              sourceHeight: 462,
              cropOuterWidth: 516.05,
              cropOuterHeight: 631.79,
              cropOuterOffsetX: -50.52,
              cropOuterOffsetY: -11.67,
            },
            zIndex: 14,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
          },
          {
            id: 'text-813b2921-acd9-4279-b6b7-9707356d3168',
            name: 'Text',
            type: 'text',
            frame: { x: 516, y: 192, width: 168, height: 56 },
            props: {
              href: '',
              text: '25% OFF',
              align: 'center',
              color: '#1f2937',
              fontSize: 36,
              fontStyle: 'normal',
              textStyle: 'Heading 2',
              fontFamily: 'Montserrat',
              fontWeight: 700,
              lineHeight: 1.5,
              openInNewTab: false,
              richTextHtml: '<h2>25% OFF</h2>',
              letterSpacing: 0,
              textDecoration: 'none',
            },
            zIndex: 15,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
          },
          {
            id: 'text-ca57e50c-fc15-4af0-acfe-878dff59d971',
            name: 'Text',
            type: 'text',
            frame: { x: 500, y: 248, width: 200, height: 56 },
            props: {
              href: '',
              text: '25% off sitewide using FORMA26 at checkout',
              align: 'center',
              color: '#1f2937',
              fontSize: 16,
              fontStyle: 'normal',
              textStyle: 'Heading 2',
              fontFamily: 'Montserrat',
              fontWeight: 400,
              lineHeight: 1.5,
              openInNewTab: false,
              richTextHtml: '<p>25% off sitewide using FORMA26 at checkout</p>',
              letterSpacing: 0,
              textDecoration: 'none',
            },
            zIndex: 17,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'icon-68d1ee1d-29b1-42ec-92d1-3179d3b43965',
            name: 'Icon',
            type: 'icon',
            frame: { x: 564, y: 120, width: 72, height: 72 },
            props: {
              color: '#000000',
              radius: 20,
              iconName: 'package',
              iconSize: 40,
              borderColor: 'rgba(53, 92, 255, 0.16)',
              borderWidth: 0,
              backgroundColor: 'transparent',
            },
            zIndex: 18,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
          },
        ],
      },
    },
    {
      id: 'footer-1',
      type: 'footer',
      enabled: true,
      props: {
        editorHeight: 312,
        brandText: storeName,
        contactEmail: '',
        contactPhone: '',
        editorLabel: 'Footer',
        editorRadius: 0,
        editorOpacity: 100,
        editorBorderWidth: 0,
        editorBackgroundColor: '#0b0f19',
        editorLayoutAssignments: [],
        editorComponents: [
          {
            id: 'image-5ca8ac96-be9b-4a92-8053-6b4d5f9c722f',
            name: 'Image',
            type: 'image',
            frame: { x: 38, y: 48, width: 40, height: 40 },
            props: {
              alt: `${storeName} logo`,
              src: 'https://res.cloudinary.com/dfml64rbi/image/upload/v1776246792/forma/media/file_uequaq.png',
              href: '',
              cropX: 0,
              cropY: 0,
              radius: 0,
              shadow: 'none',
              opacity: 100,
              cropWidth: 1,
              objectFit: 'cover',
              cropHeight: 1,
              aspectRatio: '1 / 1',
              borderColor: '#111827',
              borderStyle: 'solid',
              borderWidth: 0,
              displayMode: 'fill',
              sourceWidth: 320,
              openInNewTab: false,
              sourceHeight: 320,
              cropOuterWidth: 40,
              cropOuterHeight: 40,
              cropOuterOffsetX: 0,
              cropOuterOffsetY: 0,
            },
            zIndex: 1,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
          },
          {
            id: 'text-4baaad5e-415f-4f84-a9de-850bd7339fcb',
            name: 'Text',
            type: 'text',
            frame: { x: 312, y: 48, width: 176, height: 32 },
            props: {
              text: 'FOR CUSTOMERS',
              textStyle: 'Paragraph 2',
              href: '',
              openInNewTab: false,
              richTextHtml: 'FOR CUSTOMERS',
              fontFamily: 'Sora',
              fontSize: 16,
              fontWeight: 700,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#ffffff',
              align: 'left',
              lineHeight: 1.5,
              letterSpacing: 0.08,
            },
            zIndex: 2,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
          },
          {
            id: 'text-54c9de56-819a-4a5e-b3da-a1dd3a408f74',
            name: 'Text',
            type: 'text',
            frame: { x: 312, y: 96, width: 64, height: 24 },
            props: {
              text: 'Shipping',
              textStyle: 'Paragraph 2',
              href: '/',
              openInNewTab: false,
              richTextHtml: 'Shipping',
              fontFamily: 'Sora',
              fontSize: 12,
              fontWeight: 400,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#ffffff',
              align: 'left',
              lineHeight: 1.5,
              letterSpacing: 0.08,
            },
            zIndex: 3,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'text-855ac60a-5cb8-452b-aa9e-bb784a0d2c4c',
            name: 'Text',
            type: 'text',
            frame: { x: 312, y: 120, width: 64, height: 24 },
            props: {
              text: 'Returns',
              textStyle: 'Paragraph 2',
              href: '/',
              openInNewTab: false,
              richTextHtml: 'Returns',
              fontFamily: 'Sora',
              fontSize: 12,
              fontWeight: 400,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#ffffff',
              align: 'left',
              lineHeight: 1.5,
              letterSpacing: 0.08,
            },
            zIndex: 4,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'text-e9ad8940-d47f-4a27-b60b-2e2405a89fc4',
            name: 'Text',
            type: 'text',
            frame: { x: 312, y: 144, width: 64, height: 24 },
            props: {
              text: 'FAQ',
              textStyle: 'Paragraph 2',
              href: '/',
              openInNewTab: false,
              richTextHtml: 'FAQ',
              fontFamily: 'Sora',
              fontSize: 12,
              fontWeight: 400,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#ffffff',
              align: 'left',
              lineHeight: 1.5,
              letterSpacing: 0.08,
            },
            zIndex: 5,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'text-82987e22-0776-48e7-9f68-76d76484a9bb',
            name: 'Text',
            type: 'text',
            frame: { x: 576, y: 48, width: 176, height: 32 },
            props: {
              text: 'ABOUT COMPANY',
              textStyle: 'Paragraph 2',
              href: '',
              openInNewTab: false,
              richTextHtml: 'ABOUT COMPANY',
              fontFamily: 'Inter',
              fontSize: 16,
              fontWeight: 700,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#ffffff',
              align: 'left',
              lineHeight: 1.5,
              letterSpacing: 0.08,
            },
            zIndex: 6,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'text-21f6ba15-324a-4a0e-aaaa-99324f714812',
            name: 'Text',
            type: 'text',
            frame: { x: 576, y: 96, width: 64, height: 24 },
            props: {
              text: 'About us',
              textStyle: 'Paragraph 2',
              href: '/',
              openInNewTab: false,
              richTextHtml: 'About us',
              fontFamily: 'Sora',
              fontSize: 12,
              fontWeight: 400,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#ffffff',
              align: 'left',
              lineHeight: 1.5,
              letterSpacing: 0.08,
            },
            zIndex: 7,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'text-42c45a91-4cd6-4565-92b0-8b6710b8df39',
            name: 'Text',
            type: 'text',
            frame: { x: 576, y: 128, width: 64, height: 24 },
            props: {
              text: 'Contact',
              textStyle: 'Paragraph 2',
              href: '/',
              openInNewTab: false,
              richTextHtml: 'Contact',
              fontFamily: 'Sora',
              fontSize: 12,
              fontWeight: 400,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#ffffff',
              align: 'left',
              lineHeight: 1.5,
              letterSpacing: 0.08,
            },
            zIndex: 8,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'text-d0990b34-4f54-4b1c-af41-9851927ab075',
            name: 'Text',
            type: 'text',
            frame: { x: 824, y: 240, width: 328, height: 24 },
            props: {
              text: 'Forma store, 2025. All rights reserved',
              textStyle: 'Paragraph 2',
              href: '',
              openInNewTab: false,
              richTextHtml: 'Forma store, 2025. All rights reserved',
              fontFamily: 'Sora',
              fontSize: 12,
              fontWeight: 400,
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#ffffff',
              align: 'right',
              lineHeight: 1.5,
              letterSpacing: 0.08,
            },
            zIndex: 11,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
            parentContainerId: null,
          },
          {
            id: 'social-links-eb4f5623-d054-4f7a-ab59-dd997ccf2f2d',
            name: 'Social links',
            type: 'social-links',
            frame: { x: 571, y: 158, width: 136, height: 32 },
            props: {
              color: '#ffffff',
              style: 'ghost',
              labels: ['facebook', 'instagram', 'whatsapp', 'tiktok'],
              radius: 12,
              spacing: 7,
              iconSize: 18,
              itemSize: 26,
              borderColor: '#111827',
              borderWidth: 0,
              backgroundColor: '#0b0f19',
            },
            zIndex: 12,
            children: [],
            isLocked: false,
            rotation: 0,
            isVisible: true,
          },
        ],
      },
    },
  ];
}

export function buildDefaultStorefrontHomepageDocument(
  storeName: string,
  buildSection: (type: StorefrontSectionType, name: string) => StorefrontHomepageSection = (type, name) =>
    buildStorefrontSection(type, name)
): ProjectStorefront['draftHomepage'] {
  return {
    version: 1,
    pageKey: 'home',
    seo: {
      title: storeName,
      description: '',
    },
    sections: buildDesignedDefaultHomepageSections(storeName),
  };
}

export function normalizeStorefrontSection(
  section: Partial<StorefrontHomepageSection> | null | undefined,
  storeName: string,
  buildSection: (type: StorefrontSectionType, name: string) => StorefrontHomepageSection = (type, name) =>
    buildStorefrontSection(type, name),
  normalizeSectionType: (type: unknown) => StorefrontSectionType = normalizeStorefrontSectionType,
  createSectionId: (type: StorefrontSectionType) => string = createStorefrontSectionId
): StorefrontHomepageSection {
  const safeType = normalizeSectionType(section?.type);
  const baseSection = buildSection(safeType, storeName);
  const props =
    section?.props && typeof section.props === 'object' && !Array.isArray(section.props)
      ? { ...baseSection.props, ...section.props }
      : baseSection.props;
  const normalizedProps =
    safeType === 'header'
      ? {
          ...props,
          editorComponents: ensureHeaderCartComponent(
            Array.isArray((props as Record<string, unknown>)['editorComponents'])
              ? ((props as Record<string, unknown>)['editorComponents'] as StorefrontEditorComponentNode[])
              : [],
            storeName
          ),
        }
      : props;

  return {
    ...baseSection,
    id:
      typeof section?.id === 'string' && section.id.trim()
        ? section.id
        : createSectionId(safeType),
    enabled: typeof section?.enabled === 'boolean' ? section.enabled : true,
    props: normalizedProps,
  };
}

export function ensureStableStorefrontSections(
  sections: StorefrontHomepageSection[],
  storeName: string,
  buildSection: (type: StorefrontSectionType, name: string) => StorefrontHomepageSection = (type, name) =>
    buildStorefrontSection(type, name)
): StorefrontHomepageSection[] {
  const stableSections = new Map<(typeof STOREFRONT_STABLE_SECTION_TYPES)[number], StorefrontHomepageSection>();
  const contentSections: StorefrontHomepageSection[] = [];

  for (const section of sections) {
    if (section.type === 'header' || section.type === 'footer') {
      if (!stableSections.has(section.type)) {
        stableSections.set(section.type, {
          ...section,
          enabled: true,
        });
      }
      continue;
    }

    contentSections.push(section);
  }

  const header = stableSections.get('header') ?? buildSection('header', storeName);
  const footer = stableSections.get('footer') ?? buildSection('footer', storeName);

  return [
    {
      ...header,
      enabled: true,
    },
    ...contentSections,
    {
      ...footer,
      enabled: true,
    },
  ];
}

function isLegacyGeneratedHomepageDocument(
  homepage: ProjectStorefront['draftHomepage'] | ProjectStorefront['publishedHomepage'] | null | undefined
): homepage is NonNullable<ProjectStorefront['draftHomepage']> {
  if (!homepage || typeof homepage !== 'object' || !Array.isArray(homepage.sections)) {
    return false;
  }

  const sectionIds = homepage.sections.map((section) => section.id);
  const sectionTypes = homepage.sections.map((section) => section.type);

  return (
    sectionIds.length === 4 &&
    sectionIds[0] === 'announcement-1' &&
    sectionIds[1] === 'hero-1' &&
    sectionIds[2] === 'featured-products-1' &&
    sectionIds[3] === 'footer-1' &&
    sectionTypes[0] === 'announcement-bar' &&
    sectionTypes[1] === 'hero' &&
    sectionTypes[2] === 'featured-products' &&
    sectionTypes[3] === 'footer'
  );
}

export function normalizeStorefrontData(
  storefront: ProjectStorefront,
  options: StorefrontNormalizationOptions
): ProjectStorefront {
  const snapshot = JSON.parse(JSON.stringify(storefront)) as ProjectStorefront;
  const fallbackStoreName = snapshot.storeName?.trim() || options.fallbackStoreName || 'Storefront';

  snapshot.storeName = fallbackStoreName;
  snapshot.themeKey = snapshot.themeKey?.trim() || 'commerce-minimal';
  snapshot.activePageKey = 'home';

  if (isLegacyGeneratedHomepageDocument(snapshot.draftHomepage)) {
    snapshot.draftHomepage = buildDefaultStorefrontHomepageDocument(fallbackStoreName);
  }

  if (isLegacyGeneratedHomepageDocument(snapshot.publishedHomepage)) {
    snapshot.publishedHomepage = buildDefaultStorefrontHomepageDocument(fallbackStoreName);
  }

  const draftHomepage = snapshot.draftHomepage;
  const normalizedHomepage =
    draftHomepage &&
    typeof draftHomepage === 'object' &&
    Array.isArray(draftHomepage.sections) &&
    draftHomepage.sections.length
      ? {
          version:
            typeof draftHomepage.version === 'number' && Number.isFinite(draftHomepage.version)
              ? draftHomepage.version
              : 1,
          pageKey: 'home' as const,
          seo: {
            title:
              typeof draftHomepage.seo?.title === 'string' && draftHomepage.seo.title.trim()
                ? draftHomepage.seo.title
                : fallbackStoreName,
            description:
              typeof draftHomepage.seo?.description === 'string' ? draftHomepage.seo.description : '',
          },
          sections: ensureStableStorefrontSections(
            draftHomepage.sections.map((section) => normalizeStorefrontSection(section, fallbackStoreName)),
            fallbackStoreName
          ),
        }
      : buildDefaultStorefrontHomepageDocument(fallbackStoreName);

  snapshot.draftHomepage = normalizedHomepage;
  snapshot.editorSession = options.normalizeEditorSession(snapshot.editorSession, normalizedHomepage);
  snapshot.publishedHomepage = snapshot.publishedHomepage
    ? {
        ...snapshot.publishedHomepage,
        pageKey: 'home',
        seo: {
          title:
            typeof snapshot.publishedHomepage.seo?.title === 'string' &&
            snapshot.publishedHomepage.seo.title.trim()
              ? snapshot.publishedHomepage.seo.title
              : normalizedHomepage.seo.title,
          description:
            typeof snapshot.publishedHomepage.seo?.description === 'string'
              ? snapshot.publishedHomepage.seo.description
              : '',
        },
        sections: Array.isArray(snapshot.publishedHomepage.sections)
          ? ensureStableStorefrontSections(
              snapshot.publishedHomepage.sections.map((section) =>
                normalizeStorefrontSection(section, fallbackStoreName)
              ),
              fallbackStoreName
            )
          : normalizedHomepage.sections,
      }
    : null;

  return snapshot;
}
