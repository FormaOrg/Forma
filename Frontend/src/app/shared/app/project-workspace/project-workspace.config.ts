import { ProjectType } from '../../../core/models/project.model';
import { AppIconName } from '../icons/app-icon';

export interface ProjectWorkspaceNavItem {
  label: string;
  icon: AppIconName;
  path: string;
}

export interface ProjectWorkspaceNavSection {
  id: string;
  label: string;
  items: ProjectWorkspaceNavItem[];
}

export interface ProjectWorkspaceConfig {
  typeLabel: string;
  defaultPath: string;
  setupTitle: string;
  homeSubtitle: string;
  heroActionLabel: string;
  heroActionPath: string;
  activityDescription: string;
  activityLinkLabel: string;
  activityLinkPath: string;
  emptyActivityDescription: string;
  placeholderDescription: string;
  sections: ProjectWorkspaceNavSection[];
}

type WorkspaceKind = 'ECOMMERCE' | 'PORTFOLIO' | 'BLOG' | 'GENERIC';

const SHARED_SETTINGS_SECTION: ProjectWorkspaceNavSection = {
  id: 'settings',
  label: 'Settings',
  items: [
    { label: 'Settings', icon: 'settings', path: 'settings' },
  ],
};

const CONFIGS: Record<WorkspaceKind, ProjectWorkspaceConfig> = {
  ECOMMERCE: {
    typeLabel: 'Ecommerce',
    defaultPath: 'home',
    setupTitle: "Let's set up your store",
    homeSubtitle: 'Keep products, customers, and orders moving from one workspace.',
    heroActionLabel: 'Open catalog',
    heroActionPath: 'catalog',
    activityDescription: 'Orders, catalog updates, customers, and launch tasks tied to this store.',
    activityLinkLabel: 'View sales',
    activityLinkPath: 'sales',
    emptyActivityDescription:
      'As soon as this store starts collecting catalog, customer, or sales activity, it will appear here.',
    placeholderDescription:
      'The route structure and store workspace are ready. You can build this ecommerce section next.',
    sections: [
      {
        id: 'setup',
        label: 'Setup',
        items: [{ label: 'Setup', icon: 'rocket', path: '' }],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          { label: 'Home', icon: 'home', path: 'home' },
          { label: 'Sales', icon: 'dollar-sign', path: 'sales' },
          { label: 'Catalog', icon: 'package', path: 'catalog' },
        ],
      },
      {
        id: 'audience',
        label: 'Audience',
        items: [
          { label: 'Customers', icon: 'users', path: 'customers' },
          { label: 'Analytics', icon: 'bar-chart', path: 'analytics' },
        ],
      },
      SHARED_SETTINGS_SECTION,
    ],
  },
  PORTFOLIO: {
    typeLabel: 'Portfolio',
    defaultPath: 'home',
    setupTitle: "Let's set up your portfolio",
    homeSubtitle: 'Shape your pages, media, and personal brand presentation from one workspace.',
    heroActionLabel: 'Edit portfolio',
    heroActionPath: 'editor',
    activityDescription: 'Recent page changes, media updates, and publishing tasks for this portfolio.',
    activityLinkLabel: 'Open editor',
    activityLinkPath: 'editor',
    emptyActivityDescription:
      'As soon as you update your portfolio pages, media, or launch settings, activity will appear here.',
    placeholderDescription:
      'The route structure and portfolio workspace are ready. You can build this portfolio section next.',
    sections: [
      {
        id: 'setup',
        label: 'Setup',
        items: [{ label: 'Setup', icon: 'rocket', path: '' }],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          { label: 'Home', icon: 'home', path: 'home' },
          { label: 'Pages', icon: 'layout-grid', path: 'pages' },
          { label: 'Media', icon: 'image', path: 'media' },
        ],
      },
      {
        id: 'audience',
        label: 'Audience',
        items: [
          { label: 'Inquiries', icon: 'users', path: 'audience' },
          { label: 'Analytics', icon: 'bar-chart', path: 'analytics' },
        ],
      },
      SHARED_SETTINGS_SECTION,
    ],
  },
  BLOG: {
    typeLabel: 'Blog',
    defaultPath: 'home',
    setupTitle: "Let's set up your blog",
    homeSubtitle: 'Manage posts, categories, and readership growth from one workspace.',
    heroActionLabel: 'Open posts',
    heroActionPath: 'posts',
    activityDescription: 'Recent publishing work, content updates, and audience signals for this blog.',
    activityLinkLabel: 'Open posts',
    activityLinkPath: 'posts',
    emptyActivityDescription:
      'As soon as you publish posts, update categories, or grow subscribers, activity will appear here.',
    placeholderDescription:
      'The route structure and blog workspace are ready. You can build this publishing section next.',
    sections: [
      {
        id: 'setup',
        label: 'Setup',
        items: [{ label: 'Setup', icon: 'rocket', path: '' }],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          { label: 'Home', icon: 'home', path: 'home' },
          { label: 'Posts', icon: 'file-text', path: 'posts' },
          { label: 'Categories', icon: 'layout-grid', path: 'categories' },
        ],
      },
      {
        id: 'audience',
        label: 'Audience',
        items: [
          { label: 'Subscribers', icon: 'users', path: 'subscribers' },
          { label: 'Analytics', icon: 'bar-chart', path: 'analytics' },
        ],
      },
      SHARED_SETTINGS_SECTION,
    ],
  },
  GENERIC: {
    typeLabel: 'Project',
    defaultPath: 'home',
    setupTitle: "Let's set up your project",
    homeSubtitle: 'Manage your workspace, edit content, and keep launch tasks moving forward.',
    heroActionLabel: 'Open editor',
    heroActionPath: 'editor',
    activityDescription: 'Recent updates and launch tasks for this project.',
    activityLinkLabel: 'View analytics',
    activityLinkPath: 'analytics',
    emptyActivityDescription:
      'As soon as this project starts collecting updates and activity, they will appear here.',
    placeholderDescription:
      'The route structure and project workspace are ready. You can build this section next.',
    sections: [
      {
        id: 'setup',
        label: 'Setup',
        items: [{ label: 'Setup', icon: 'rocket', path: '' }],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        items: [{ label: 'Home', icon: 'home', path: 'home' }],
      },
      {
        id: 'insights',
        label: 'Insights',
        items: [{ label: 'Analytics', icon: 'bar-chart', path: 'analytics' }],
      },
      SHARED_SETTINGS_SECTION,
    ],
  },
};

export function normalizeProjectWorkspaceType(type: ProjectType | string | null | undefined): WorkspaceKind {
  const normalized = String(type ?? '').trim().toUpperCase();

  if (normalized === 'ECOMMERCE') {
    return 'ECOMMERCE';
  }

  if (normalized === 'PORTFOLIO') {
    return 'PORTFOLIO';
  }

  if (normalized === 'BLOG') {
    return 'BLOG';
  }

  return 'GENERIC';
}

export function getProjectWorkspaceConfig(
  type: ProjectType | string | null | undefined
): ProjectWorkspaceConfig {
  return CONFIGS[normalizeProjectWorkspaceType(type)];
}

export function getProjectWorkspaceAllowedPaths(
  type: ProjectType | string | null | undefined
): string[] {
  const config = getProjectWorkspaceConfig(type);
  const sectionPaths = config.sections.flatMap((section) => section.items.map((item) => item.path));
  return Array.from(new Set([...sectionPaths, 'editor']));
}

export function getProjectWorkspaceDefaultPath(
  type: ProjectType | string | null | undefined
): string {
  return getProjectWorkspaceConfig(type).defaultPath;
}
