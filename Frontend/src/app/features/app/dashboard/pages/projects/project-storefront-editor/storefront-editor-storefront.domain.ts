import {
  ProjectStorefront,
  StorefrontHomepageDocument,
  StorefrontHomepageSection,
  StorefrontEditorSession,
  StorefrontSectionType,
} from '../../../../../../core/models/project-storefront.model';

type NormalizeEditorSession = (
  session: StorefrontEditorSession | null | undefined,
  homeDraftDocument?: StorefrontHomepageDocument | null
) => StorefrontEditorSession;

type StorefrontNormalizationOptions = {
  fallbackStoreName: string;
  normalizeEditorSession: NormalizeEditorSession;
};

export function createStorefrontSectionId(type: StorefrontSectionType): string {
  return `${type}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeStorefrontSectionType(type: unknown): StorefrontSectionType {
  switch (type) {
    case 'announcement-bar':
    case 'hero':
    case 'featured-products':
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
    case 'footer':
      return {
        id: createSectionId(type),
        type,
        enabled: true,
        props: {
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

  return {
    ...baseSection,
    id:
      typeof section?.id === 'string' && section.id.trim()
        ? section.id
        : createSectionId(safeType),
    enabled: typeof section?.enabled === 'boolean' ? section.enabled : true,
    props,
  };
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
            description: typeof draftHomepage.seo?.description === 'string' ? draftHomepage.seo.description : '',
          },
          sections: draftHomepage.sections.map((section) =>
            normalizeStorefrontSection(section, fallbackStoreName)
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
          ? snapshot.publishedHomepage.sections.map((section) =>
              normalizeStorefrontSection(section, fallbackStoreName)
            )
          : normalizedHomepage.sections,
      }
    : null;

  return snapshot;
}
