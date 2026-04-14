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
    return buildDefaultHeaderComponents(storeName);
  }

  const normalized = components.map((component) => {
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

  const withSearch = normalized.some((component) => component.type === 'search')
    ? normalized
    : normalized.concat(buildHeaderSearchComponent(headerContainer.id));

  return withSearch.some((component) => component.type === 'cart')
    ? withSearch
    : withSearch.concat(buildHeaderCartComponent(headerContainer.id));
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
    sections: [
      buildSection('header', storeName),
      buildSection('announcement-bar', storeName),
      buildSection('hero', storeName),
      buildSection('featured-products', storeName),
      buildSection('footer', storeName),
    ],
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

export function normalizeStorefrontData(
  storefront: ProjectStorefront,
  options: StorefrontNormalizationOptions
): ProjectStorefront {
  const snapshot = JSON.parse(JSON.stringify(storefront)) as ProjectStorefront;
  const fallbackStoreName = snapshot.storeName?.trim() || options.fallbackStoreName || 'Storefront';

  snapshot.storeName = fallbackStoreName;
  snapshot.themeKey = snapshot.themeKey?.trim() || 'commerce-minimal';
  snapshot.activePageKey = 'home';

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
