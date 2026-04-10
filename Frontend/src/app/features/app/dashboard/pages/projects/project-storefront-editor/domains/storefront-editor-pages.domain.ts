import {
  ProjectStorefront,
  StorefrontEditorManagedPage,
  StorefrontEditorSession,
  StorefrontEditorSnapshot,
  StorefrontHomepageDocument,
  StorefrontHomepageSection,
} from '../../../../../../../core/models/project-storefront.model';

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

export function cloneStorefrontHomepageDocument(
  document: StorefrontHomepageDocument
): StorefrontHomepageDocument {
  return JSON.parse(JSON.stringify(document)) as StorefrontHomepageDocument;
}

export function buildDefaultManagedPages(
  homeDraftDocument: StorefrontHomepageDocument | undefined,
  buildDefaultHomepageDocument: BuildDefaultHomepageDocument
): StorefrontEditorManagedPage[] {
  return [
    {
      id: 'home',
      name: 'Home',
      kind: 'home',
      designId: null,
      draftDocument: cloneStorefrontHomepageDocument(
        homeDraftDocument ?? buildDefaultHomepageDocument('Storefront')
      ),
    },
  ];
}

export function buildDefaultManagedPageDocument(
  pageName: string,
  kind: StorefrontEditorManagedPage['kind'],
  designId: string | null,
  helpers: ManagedPageHelpers
): StorefrontHomepageDocument {
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
    sections: candidate.sections!.map((section) =>
      helpers.normalizeSection(section, helpers.fallbackStoreName)
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
        draftDocument: normalizeManagedPageDocument(page.draftDocument, name, kind, nextDesignId, helpers),
      });
    }
  }

  if (!normalized.length) {
    return buildDefaultManagedPages(normalizedHomeDraft, helpers.buildDefaultHomepageDocument);
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

  return normalized;
}

export function captureManagedPagesWithDraft(
  storefront: ProjectStorefront,
  selectedManagedPageId: string,
  managedPages: StorefrontEditorManagedPage[],
  helpers: ManagedPageHelpers
): StorefrontEditorManagedPage[] {
  return normalizeManagedPages(managedPages, storefront.draftHomepage, helpers).map((page) =>
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
