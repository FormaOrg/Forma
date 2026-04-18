import {
  ProjectStorefront,
  StorefrontEditorManagedPage,
  StorefrontEditorSession,
  StorefrontEditorSnapshot,
  StorefrontHomepageDocument,
  StorefrontHomepageSection,
} from '../../../../../../../core/models/project-storefront.model';
import { createStorefrontEditorComponentNode } from '../components/storefront-editor-component.model';
import { ensureStableStorefrontSections } from './storefront-editor-storefront.domain';

type BuildDefaultHomepageDocument = (storeName: string) => ProjectStorefront['draftHomepage'];
type NormalizeSection = (
  section: Partial<StorefrontHomepageSection> | null | undefined,
  storeName: string
) => StorefrontHomepageSection;

type ManagedPageHelpers = {
  fallbackStoreName: string;
  buildDefaultHomepageDocument: BuildDefaultHomepageDocument;
  normalizeSection: NormalizeSection;
};

const REQUIRED_MANAGED_PAGES = [
  { id: 'home', name: 'Home', kind: 'home' as const, designId: null as string | null, routeSlug: null as string | null },
  { id: 'products', name: 'Products', kind: 'designed' as const, designId: null as string | null, routeSlug: null as string | null },
  { id: 'collection', name: 'Collection', kind: 'designed' as const, designId: null as string | null, routeSlug: 'all' as string | null },
  { id: 'product-details', name: 'Product Details', kind: 'designed' as const, designId: null as string | null, routeSlug: null as string | null },
  { id: 'cart', name: 'Cart', kind: 'designed' as const, designId: null as string | null, routeSlug: null as string | null },
  { id: 'checkout', name: 'Checkout', kind: 'designed' as const, designId: null as string | null, routeSlug: null as string | null },
] as const;

const DESIGNED_DEFAULT_HOMEPAGE_SECTION_IDS = [
  'header-9kf8srka',
  'hero-8mu7cyew',
  'hero-7onit1yv',
  'hero-on8pwsdy',
  'footer-1',
] as const;

export function cloneStorefrontHomepageDocument(
  document: StorefrontHomepageDocument
): StorefrontHomepageDocument {
  return JSON.parse(JSON.stringify(document)) as StorefrontHomepageDocument;
}

export function buildDefaultManagedPages(
  homeDraftDocument: StorefrontHomepageDocument | undefined,
  buildDefaultHomepageDocument: BuildDefaultHomepageDocument
): StorefrontEditorManagedPage[] {
  return REQUIRED_MANAGED_PAGES.map((page) => ({
    id: page.id,
    name: page.name,
    kind: page.kind,
    designId: page.designId,
    routeSlug: page.routeSlug,
    draftDocument:
      page.id === 'home'
        ? cloneStorefrontHomepageDocument(homeDraftDocument ?? buildDefaultHomepageDocument('Storefront'))
        : buildDefaultManagedPageDocument(page.name, page.kind, page.designId, {
            fallbackStoreName: 'Storefront',
            buildDefaultHomepageDocument,
            normalizeSection: (section) => section as StorefrontHomepageSection,
          }),
  }));
}

export function buildDefaultManagedPageDocument(
  pageName: string,
  kind: StorefrontEditorManagedPage['kind'],
  designId: string | null,
  helpers: ManagedPageHelpers
): StorefrontHomepageDocument {
  if (safeManagedPageId(pageName) === 'products') {
    return buildProductsManagedPageDocument(pageName, kind, designId, helpers);
  }

  if (safeManagedPageId(pageName) === 'collection') {
    return buildCollectionManagedPageDocument(pageName, kind, designId, helpers);
  }

  if (safeManagedPageId(pageName) === 'product-details') {
    return buildProductDetailsManagedPageDocument(pageName, kind, designId, helpers);
  }

  if (safeManagedPageId(pageName) === 'cart') {
    return buildManagedDocumentWithSingleComponent(
      pageName,
      kind,
      designId,
      helpers,
      'cart-content',
      'Cart',
      640
    );
  }

  if (safeManagedPageId(pageName) === 'checkout') {
    return buildManagedDocumentWithSingleComponent(
      pageName,
      kind,
      designId,
      helpers,
      'contact-form',
      'Checkout',
      700
    );
  }

  const storeName = helpers.fallbackStoreName;
  const document = helpers.buildDefaultHomepageDocument(storeName);
  const safePageName = pageName.trim() || 'New page';
  const title = kind === 'home' ? storeName : safePageName;

  document.seo = {
    title,
    description: kind === 'blank' ? '' : `Content for ${safePageName}.`,
  };
  document.sections = document.sections.map((section) => {
    if (section.type === 'hero') {
      const currentDescription =
        typeof (section.props as Record<string, unknown>)['description'] === 'string'
          ? ((section.props as Record<string, unknown>)['description'] as string)
          : '';

      return {
        ...section,
        props: {
          ...section.props,
          eyebrow: kind === 'home' ? 'New store' : designId ? 'Designed page' : 'Blank page',
          title,
          description:
            kind === 'home'
              ? currentDescription
              : kind === 'blank'
                ? 'Start building this page from a clean canvas.'
                : `Customize the ${safePageName} page layout and content.`,
        },
      };
    }

    return section;
  });

  return cloneStorefrontHomepageDocument(document);
}

function safeManagedPageId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

function isLegacyDefaultHomeStarter(document: StorefrontHomepageDocument | null | undefined): boolean {
  if (!document || !Array.isArray(document.sections)) {
    return false;
  }

  const sectionTypes = document.sections.map((section) => section.type);
  return (
    sectionTypes.length === 5 &&
    sectionTypes[0] === 'header' &&
    sectionTypes[1] === 'announcement-bar' &&
    sectionTypes[2] === 'hero' &&
    sectionTypes[3] === 'featured-products' &&
    sectionTypes[4] === 'footer'
  );
}

function isDesignedDefaultHomepageDocument(document: StorefrontHomepageDocument | null | undefined): boolean {
  if (!document || !Array.isArray(document.sections)) {
    return false;
  }

  const sectionIds = document.sections.map((section) => section.id);
  return DESIGNED_DEFAULT_HOMEPAGE_SECTION_IDS.every((id) => sectionIds.includes(id));
}

function buildProductsManagedPageDocument(
  pageName: string,
  kind: StorefrontEditorManagedPage['kind'],
  designId: string | null,
  helpers: ManagedPageHelpers
): StorefrontHomepageDocument {
  const storeName = helpers.fallbackStoreName;
  const base = helpers.buildDefaultHomepageDocument(storeName);
  const header = base.sections.find((section) => section.type === 'header') ?? base.sections[0];
  const footer = base.sections.find((section) => section.type === 'footer') ?? base.sections[base.sections.length - 1];
  const contentBase =
    base.sections.find((section) => section.type !== 'header' && section.type !== 'footer') ?? base.sections[0];
  const block = createStorefrontEditorComponentNode('product-feed');

  block.name = 'Products grid';
  block.frame = { x: 88, y: 96, width: 1024, height: 760 };

  const contentSection: StorefrontHomepageSection = {
    ...contentBase,
    id: 'products-content',
    type: contentBase.type,
    props: {
      ...contentBase.props,
      editorLabel: 'Products',
      editorBlankSection: false,
      editorHeight: 920,
      editorTabletHeight: 920,
      editorMobileHeight: 1180,
      editorBackgroundColor: '#f8fafc',
      editorBorderWidth: 0,
      editorBorderStyle: 'none',
      editorBorderColor: 'transparent',
      editorRadius: 0,
      editorShadow: 'none',
      editorOpacity: 100,
      editorComponents: [
        {
          ...block,
          props: {
            ...block.props,
            title: 'Products',
            source: 'catalog',
            category: 'all',
            limit: 12,
            columns: 3,
            designPreset: 'grid-gallery',
            showBadges: true,
            showCompareAtPrice: true,
            showAddToCart: false,
            showFilters: true,
            showSort: true,
            showColorDots: false,
            quickAddStyle: 'none',
            textColor: '#202124',
            badgeTextColor: '#ffffff',
            badgeBackgroundColor: '#111111',
            imageRadius: 0,
          },
          responsiveFrames: {
            tablet: { x: 24, y: 88, width: 720, height: 900 },
            mobile: { x: 16, y: 72, width: 328, height: 1000 },
          },
        },
      ],
    },
  };

  return {
    version: base.version,
    pageKey: base.pageKey,
    seo: {
      title: kind === 'home' ? storeName : pageName,
      description: designId ? `Designed ${pageName} page.` : `Editable ${pageName} page.`,
    },
    sections: [header, contentSection, footer].map((section) =>
      cloneStorefrontHomepageDocument({
        ...base,
        sections: [section],
      }).sections[0]
    ),
  };
}

function buildCollectionManagedPageDocument(
  pageName: string,
  kind: StorefrontEditorManagedPage['kind'],
  designId: string | null,
  helpers: ManagedPageHelpers
): StorefrontHomepageDocument {
  const storeName = helpers.fallbackStoreName;
  const base = helpers.buildDefaultHomepageDocument(storeName);
  const header = base.sections.find((section) => section.type === 'header') ?? base.sections[0];
  const footer = base.sections.find((section) => section.type === 'footer') ?? base.sections[base.sections.length - 1];
  const contentBase =
    base.sections.find((section) => section.type !== 'header' && section.type !== 'footer') ?? base.sections[0];
  const block = createStorefrontEditorComponentNode('product-feed');

  block.name = 'Collection grid';
  block.frame = { x: 88, y: 96, width: 1024, height: 760 };

  const contentSection: StorefrontHomepageSection = {
    ...contentBase,
    id: 'collection-content',
    type: contentBase.type,
    props: {
      ...contentBase.props,
      editorLabel: 'Collection',
      editorBlankSection: false,
      editorHeight: 920,
      editorTabletHeight: 920,
      editorMobileHeight: 1180,
      editorBackgroundColor: '#f8fafc',
      editorBorderWidth: 0,
      editorBorderStyle: 'none',
      editorBorderColor: 'transparent',
      editorRadius: 0,
      editorShadow: 'none',
      editorOpacity: 100,
      editorComponents: [
        {
          ...block,
          props: {
            ...block.props,
            title: 'Collection',
            source: 'catalog',
            category: 'all',
            limit: 12,
            columns: 3,
            designPreset: 'grid-gallery',
            showBadges: true,
            showCompareAtPrice: true,
            showAddToCart: false,
            showFilters: true,
            showSort: true,
            showColorDots: false,
            quickAddStyle: 'none',
            textColor: '#202124',
            badgeTextColor: '#ffffff',
            badgeBackgroundColor: '#111111',
            imageRadius: 0,
          },
          responsiveFrames: {
            tablet: { x: 24, y: 88, width: 720, height: 900 },
            mobile: { x: 16, y: 72, width: 328, height: 1000 },
          },
        },
      ],
    },
  };

  return {
    version: base.version,
    pageKey: base.pageKey,
    seo: {
      title: kind === 'home' ? storeName : pageName,
      description: designId ? `Designed ${pageName} page.` : `Editable ${pageName} page.`,
    },
    sections: [header, contentSection, footer].map((section) =>
      cloneStorefrontHomepageDocument({
        ...base,
        sections: [section],
      }).sections[0]
    ),
  };
}

function buildProductDetailsManagedPageDocument(
  pageName: string,
  kind: StorefrontEditorManagedPage['kind'],
  designId: string | null,
  helpers: ManagedPageHelpers
): StorefrontHomepageDocument {
  const storeName = helpers.fallbackStoreName;
  const base = helpers.buildDefaultHomepageDocument(storeName);
  const header = base.sections.find((section) => section.type === 'header') ?? base.sections[0];
  const footer = base.sections.find((section) => section.type === 'footer') ?? base.sections[base.sections.length - 1];
  const contentBase =
    base.sections.find((section) => section.type !== 'header' && section.type !== 'footer') ?? base.sections[0];

  const block = createStorefrontEditorComponentNode('product-details');
  block.frame = { x: 60, y: 32, width: 1080, height: 568 };
  block.props = {
    ...block.props,
    showTags: true,
    skuLabel: 'SKU',
    showFacts: true,
    buyNowLabel: 'Buy it now',
    inStockLabel: 'In stock',
    showCategory: true,
    quantityLabel: 'Quantity',
    addToCartLabel: 'Add to Cart',
    outOfStockLabel: 'Out of stock',
    showDescription: true,
    showCompareAtPrice: true,
  };
  block.responsiveFrames = {
    tablet: { x: 24, y: 24, width: 720, height: 592 },
    mobile: { x: 17, y: 24, width: 360, height: 608 },
  };

  const contentSection: StorefrontHomepageSection = {
    ...contentBase,
    id: 'product-details-content',
    type: contentBase.type,
    props: {
      ...contentBase.props,
      editorLabel: 'Blank section',
      editorBlankSection: true,
      editorHeight: 659,
      editorBackgroundColor: '#f8fafc',
      editorComponents: [block],
      editorLayoutAssignments: [],
    },
  };

  return {
    version: base.version,
    pageKey: base.pageKey,
    seo: {
      title: kind === 'home' ? storeName : pageName,
      description: designId ? `Designed ${pageName} page.` : `Editable ${pageName} page.`,
    },
    sections: [header, contentSection, footer].map((section) =>
      cloneStorefrontHomepageDocument({
        ...base,
        sections: [section],
      }).sections[0]
    ),
  };
}

function buildManagedDocumentWithSingleComponent(
  pageName: string,
  kind: StorefrontEditorManagedPage['kind'],
  designId: string | null,
  helpers: ManagedPageHelpers,
  componentType: 'product-details' | 'cart-content' | 'contact-form',
  sectionLabel: string,
  sectionHeight: number
): StorefrontHomepageDocument {
  const storeName = helpers.fallbackStoreName;
  const base = helpers.buildDefaultHomepageDocument(storeName);
  const header = base.sections.find((section) => section.type === 'header') ?? base.sections[0];
  const footer = base.sections.find((section) => section.type === 'footer') ?? base.sections[base.sections.length - 1];
  const contentBase =
    base.sections.find((section) => section.type !== 'header' && section.type !== 'footer') ?? base.sections[0];

  const block = createStorefrontEditorComponentNode(componentType);
  block.frame = { x: 36, y: 36, width: componentType === 'cart-content' ? 1100 : 1080, height: sectionHeight - 72 };

  if (componentType === 'product-details') {
    block.responsiveFrames = {
      tablet: { x: 24, y: 24, width: 720, height: sectionHeight - 48 },
      mobile: { x: 16, y: 16, width: 328, height: sectionHeight - 32 },
    };
  }

  if (componentType === 'cart-content') {
    block.responsiveFrames = {
      tablet: { x: 20, y: 24, width: 728, height: sectionHeight - 48 },
      mobile: { x: 12, y: 16, width: 336, height: sectionHeight - 32 },
    };
  }

  if (componentType === 'contact-form') {
    block.frame = { x: 320, y: 64, width: 560, height: 520 };
    block.name = 'Checkout form';
  }

  const contentSection: StorefrontHomepageSection = {
    ...contentBase,
    id: `${safeManagedPageId(pageName)}-content`,
    type: contentBase.type,
    props: {
      ...contentBase.props,
      editorLabel: sectionLabel,
      editorBlankSection: false,
      editorHeight: sectionHeight,
      editorTabletHeight: sectionHeight,
      editorMobileHeight: componentType === 'cart-content' ? 980 : componentType === 'product-details' ? 920 : 820,
      editorComponents: [block],
      editorBackgroundColor: '#ffffff',
      editorBorderWidth: 0,
      editorBorderStyle: 'none',
      editorBorderColor: 'transparent',
      editorRadius: 0,
      editorShadow: 'none',
      editorOpacity: 100,
    },
  };

  return {
    version: base.version,
    pageKey: base.pageKey,
    seo: {
      title: kind === 'home' ? storeName : pageName,
      description: designId ? `Designed ${pageName} page.` : `Editable ${pageName} page.`,
    },
    sections: [header, contentSection, footer].map((section) => cloneStorefrontHomepageDocument({
      ...base,
      sections: [section],
    }).sections[0]),
  };
}

export function normalizeManagedPageDocument(
  document: unknown,
  pageName: string,
  kind: StorefrontEditorManagedPage['kind'],
  designId: string | null,
  helpers: ManagedPageHelpers
): StorefrontHomepageDocument {
  const fallback = buildDefaultManagedPageDocument(pageName, kind, designId, helpers);
  if (
    !document ||
    typeof document !== 'object' ||
    !Array.isArray((document as Partial<StorefrontHomepageDocument>).sections)
  ) {
    return fallback;
  }

  const candidate = document as Partial<StorefrontHomepageDocument>;
  return {
    version:
      typeof candidate.version === 'number' && Number.isFinite(candidate.version) ? candidate.version : 1,
    pageKey: 'home',
    seo: {
      title:
        typeof candidate.seo?.title === 'string' && candidate.seo.title.trim()
          ? candidate.seo.title
          : fallback.seo.title,
      description:
        typeof candidate.seo?.description === 'string' ? candidate.seo.description : fallback.seo.description,
    },
    sections: ensureStableStorefrontSections(
      candidate.sections!.map((section) => helpers.normalizeSection(section, helpers.fallbackStoreName)),
      helpers.fallbackStoreName
    ),
  };
}

export function normalizeManagedPages(
  pages: StorefrontEditorSession['managedPages'] | StorefrontEditorSnapshot['managedPages'],
  homeDraftDocument: StorefrontHomepageDocument | null | undefined,
  helpers: ManagedPageHelpers
): StorefrontEditorManagedPage[] {
  const normalized: StorefrontEditorManagedPage[] = [];
  const normalizedHomeDraft = normalizeManagedPageDocument(
    homeDraftDocument ?? helpers.buildDefaultHomepageDocument(helpers.fallbackStoreName),
    'Home',
    'home',
    null,
    helpers
  );

  if (Array.isArray(pages)) {
    for (const page of pages) {
      if (!page || typeof page !== 'object') {
        continue;
      }

      const id =
        typeof page.id === 'string' && page.id.trim() ? page.id.trim() : `page-${normalized.length + 1}`;
      const name = typeof page.name === 'string' && page.name.trim() ? page.name.trim() : 'New page';
      const kind =
        page.kind === 'home' || page.kind === 'blank' || page.kind === 'designed' ? page.kind : 'blank';
      const nextDesignId =
        typeof page.designId === 'string' && page.designId.trim() ? page.designId.trim() : null;

      normalized.push({
        id,
        name,
        kind,
        designId: nextDesignId,
        routeSlug:
          typeof page.routeSlug === 'string' && page.routeSlug.trim() ? page.routeSlug.trim() : null,
        draftDocument: normalizeManagedPageDocument(page.draftDocument, name, kind, nextDesignId, helpers),
      });
    }
  }

  if (!normalized.length) {
    return buildDefaultManagedPages(normalizedHomeDraft, helpers.buildDefaultHomepageDocument);
  }

  for (const required of REQUIRED_MANAGED_PAGES) {
    if (!normalized.some((page) => page.id === required.id)) {
      normalized.push({
        id: required.id,
        name: required.name,
        kind: required.kind,
        designId: required.designId,
        routeSlug: required.routeSlug,
        draftDocument:
          required.id === 'home'
            ? cloneStorefrontHomepageDocument(normalizedHomeDraft)
            : buildDefaultManagedPageDocument(required.name, required.kind, required.designId, helpers),
      });
    }
  }

  const explicitHomeIndex = normalized.findIndex((page) => page.kind === 'home');
  const fallbackHomeIndex = normalized.findIndex((page) => page.id === 'home');
  const homeIndex = explicitHomeIndex >= 0 ? explicitHomeIndex : fallbackHomeIndex >= 0 ? fallbackHomeIndex : 0;

  for (let index = 0; index < normalized.length; index += 1) {
    const page = normalized[index];
    if (index === homeIndex) {
      normalized[index] = {
        ...page,
        kind: 'home',
        draftDocument: cloneStorefrontHomepageDocument(page.draftDocument ?? normalizedHomeDraft),
      };
      continue;
    }

    if (page.kind === 'home') {
      normalized[index] = {
        ...page,
        kind: page.designId ? ('designed' as const) : ('blank' as const),
      };
    }

    if (!normalized[index].draftDocument) {
      normalized[index] = {
        ...normalized[index],
        draftDocument: buildDefaultManagedPageDocument(
          normalized[index].name,
          normalized[index].kind,
          normalized[index].designId,
          helpers
        ),
      };
    }
  }

  const homePage = normalized.find((page) => page.id === 'home');
  const productsPage = normalized.find((page) => page.id === 'products');
  const shouldMoveDesignedHomepageToHome =
    homePage &&
    productsPage &&
    isLegacyDefaultHomeStarter(homePage.draftDocument) &&
    isDesignedDefaultHomepageDocument(productsPage.draftDocument);

  if (shouldMoveDesignedHomepageToHome) {
    homePage.draftDocument = cloneStorefrontHomepageDocument(productsPage.draftDocument!);
    productsPage.draftDocument = buildDefaultManagedPageDocument(
      productsPage.name,
      productsPage.kind,
      productsPage.designId,
      helpers
    );
  }

  return normalized;
}

export function captureManagedPagesWithDraft(
  storefront: ProjectStorefront,
  selectedManagedPageId: string,
  managedPages: StorefrontEditorManagedPage[],
  helpers: ManagedPageHelpers
): StorefrontEditorManagedPage[] {
  const normalizedPages = normalizeManagedPages(managedPages, storefront.draftHomepage, helpers).map((page) =>
    page.id === selectedManagedPageId
      ? {
          ...page,
          draftDocument: cloneStorefrontHomepageDocument(storefront.draftHomepage),
        }
      : {
          ...page,
          draftDocument: cloneStorefrontHomepageDocument(
            page.draftDocument ??
              buildDefaultManagedPageDocument(page.name, page.kind, page.designId, helpers)
          ),
        }
  );
  const sharedStableSections = getSharedStableSections(storefront.draftHomepage, helpers);

  return normalizedPages.map((page) => ({
    ...page,
    draftDocument: applySharedStableSections(page.draftDocument, sharedStableSections, helpers),
  }));
}

function getSharedStableSections(
  document: StorefrontHomepageDocument,
  helpers: ManagedPageHelpers
): Partial<Record<'header' | 'footer', StorefrontHomepageSection>> {
  const normalizedDocument = normalizeManagedPageDocument(document, 'Home', 'home', null, helpers);
  const header = normalizedDocument.sections.find((section) => section.type === 'header');
  const footer = normalizedDocument.sections.find((section) => section.type === 'footer');

  return {
    header: header ? cloneStorefrontHomepageDocument({ ...normalizedDocument, sections: [header] }).sections[0] : undefined,
    footer: footer ? cloneStorefrontHomepageDocument({ ...normalizedDocument, sections: [footer] }).sections[0] : undefined,
  };
}

function applySharedStableSections(
  document: StorefrontHomepageDocument | null | undefined,
  sharedSections: Partial<Record<'header' | 'footer', StorefrontHomepageSection>>,
  helpers: ManagedPageHelpers
): StorefrontHomepageDocument {
  const normalizedDocument = normalizeManagedPageDocument(document, 'Home', 'home', null, helpers);
  const contentSections = normalizedDocument.sections.filter(
    (section) => section.type !== 'header' && section.type !== 'footer'
  );

  return {
    ...normalizedDocument,
    sections: [
      sharedSections.header
        ? cloneStorefrontHomepageDocument({ ...normalizedDocument, sections: [sharedSections.header] }).sections[0]
        : normalizedDocument.sections.find((section) => section.type === 'header')!,
      ...contentSections.map((section) => cloneStorefrontHomepageDocument({ ...normalizedDocument, sections: [section] }).sections[0]),
      sharedSections.footer
        ? cloneStorefrontHomepageDocument({ ...normalizedDocument, sections: [sharedSections.footer] }).sections[0]
        : normalizedDocument.sections.find((section) => section.type === 'footer')!,
    ],
  };
}

export function resolveManagedPageDocument(
  pageId: string,
  storefront: ProjectStorefront,
  managedPages: StorefrontEditorManagedPage[],
  helpers: ManagedPageHelpers
): StorefrontHomepageDocument {
  const targetPage = managedPages.find((page) => page.id === pageId);
  if (targetPage?.draftDocument) {
    return cloneStorefrontHomepageDocument(targetPage.draftDocument);
  }

  if (pageId === 'home') {
    return cloneStorefrontHomepageDocument(storefront.draftHomepage);
  }

  return buildDefaultManagedPageDocument(
    targetPage?.name ?? 'New page',
    targetPage?.kind ?? 'blank',
    targetPage?.designId ?? null,
    helpers
  );
}

export function createUniqueManagedPageName(
  baseName: string,
  pages: StorefrontEditorManagedPage[],
  ignorePageId: string | null = null
): string {
  const trimmed = baseName.trim() || 'New page';
  const existingNames = new Set(
    pages
      .filter((page) => page.id !== ignorePageId)
      .map((page) => page.name.trim().toLowerCase())
  );

  if (!existingNames.has(trimmed.toLowerCase())) {
    return trimmed;
  }

  let suffix = 1;
  let candidate = `${trimmed} (${suffix})`;
  while (existingNames.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${trimmed} (${suffix})`;
  }

  return candidate;
}
