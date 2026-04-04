import { ProjectType } from '../../../core/models/project.model';

export type ProjectSetupStatus = 'done' | 'active' | 'pending';

export type ProjectSetupItem = {
  title: string;
  description: string;
  status: ProjectSetupStatus;
  actionLabel: string;
};

type ProjectSetupPreset = 'ECOMMERCE' | 'PORTFOLIO' | 'BLOG' | 'GENERIC';

const ECOMMERCE_SETUP_ITEMS: readonly ProjectSetupItem[] = [
  {
    title: 'Define your store identity',
    description: 'Set your project name, tone, and category so your workspace starts with a clear direction.',
    status: 'done',
    actionLabel: 'Completed'
  },
  {
    title: 'Connect a custom subdomain',
    description: 'Claim a branded subdomain now and replace it with your final domain when you are ready to launch.',
    status: 'active',
    actionLabel: "Let's go"
  },
  {
    title: 'Set up your payment flow',
    description: 'Choose how customers will pay so checkout, invoices, and future automation are ready from day one.',
    status: 'pending',
    actionLabel: 'Set up payments'
  },
  {
    title: 'Organize your catalog',
    description: 'Add your first collections, services, or featured offers to shape the structure of the site.',
    status: 'done',
    actionLabel: 'Completed'
  },
  {
    title: 'Configure shipping and delivery',
    description: 'Define delivery areas, timing, and fulfillment logic for a smoother launch later.',
    status: 'pending',
    actionLabel: 'Set up shipping'
  },
  {
    title: 'Launch your visual direction',
    description: 'Choose layout, sections, and brand moments to make the website feel distinct and polished.',
    status: 'done',
    actionLabel: 'Completed'
  },
  {
    title: 'Get found on Google',
    description: 'Prepare search visibility with metadata, structure, and basics that help the project get discovered.',
    status: 'pending',
    actionLabel: 'Get started'
  }
];

const PORTFOLIO_SETUP_ITEMS: readonly ProjectSetupItem[] = [
  {
    title: 'Define your portfolio direction',
    description: 'Set the positioning, tone, and main creative focus so the portfolio has a clear point of view.',
    status: 'done',
    actionLabel: 'Completed'
  },
  {
    title: 'Connect your branded domain',
    description: 'Use a domain that feels personal and professional before you start sending traffic to the site.',
    status: 'active',
    actionLabel: 'Connect domain'
  },
  {
    title: 'Build your core pages',
    description: 'Shape the home, about, work, and contact pages so visitors can understand your offer quickly.',
    status: 'pending',
    actionLabel: 'Plan pages'
  },
  {
    title: 'Curate featured projects',
    description: 'Select the strongest work, visuals, and case studies you want prospects to see first.',
    status: 'done',
    actionLabel: 'Completed'
  },
  {
    title: 'Upload portfolio media',
    description: 'Prepare images and presentation assets that support your best work without slowing the site down.',
    status: 'pending',
    actionLabel: 'Add media'
  },
  {
    title: 'Refine your inquiry flow',
    description: 'Set up your contact section and messaging so serious leads know how to reach you.',
    status: 'pending',
    actionLabel: 'Review inquiries'
  },
  {
    title: 'Polish SEO basics',
    description: 'Add titles, descriptions, and clean structure so the portfolio is easy to discover and share.',
    status: 'pending',
    actionLabel: 'Optimize'
  }
];

const BLOG_SETUP_ITEMS: readonly ProjectSetupItem[] = [
  {
    title: 'Define your editorial identity',
    description: 'Set the topic, tone, and publishing direction so your blog feels coherent from the beginning.',
    status: 'done',
    actionLabel: 'Completed'
  },
  {
    title: 'Connect your publication domain',
    description: 'Start publishing on a domain that supports long-term trust and recognizable sharing links.',
    status: 'active',
    actionLabel: 'Connect domain'
  },
  {
    title: 'Plan your first posts',
    description: 'Outline the first articles or essays you want live so the blog launches with momentum.',
    status: 'pending',
    actionLabel: 'Plan posts'
  },
  {
    title: 'Organize categories',
    description: 'Group your topics clearly so readers can move through the content library with less friction.',
    status: 'done',
    actionLabel: 'Completed'
  },
  {
    title: 'Set up subscribers',
    description: 'Prepare your newsletter or subscriber flow so readers can stay connected after their first visit.',
    status: 'pending',
    actionLabel: 'Set up audience'
  },
  {
    title: 'Prepare author and about pages',
    description: 'Give the publication a stronger identity with author context, about details, and supporting pages.',
    status: 'pending',
    actionLabel: 'Add pages'
  },
  {
    title: 'Tune search visibility',
    description: 'Make post metadata and site structure ready for indexing before content volume grows.',
    status: 'pending',
    actionLabel: 'Optimize'
  }
];

const GENERIC_SETUP_ITEMS: readonly ProjectSetupItem[] = [
  {
    title: 'Define your project direction',
    description: 'Set the name, audience, and purpose so the workspace starts from a clear direction.',
    status: 'done',
    actionLabel: 'Completed'
  },
  {
    title: 'Connect a custom domain',
    description: 'Claim a domain early so launch steps are easier once the project is ready to go live.',
    status: 'active',
    actionLabel: 'Connect domain'
  },
  {
    title: 'Build the core experience',
    description: 'Prepare the main pages, editing flow, and structure you need before launch.',
    status: 'pending',
    actionLabel: 'Continue setup'
  },
  {
    title: 'Review analytics basics',
    description: 'Make sure the project is ready to track visits and performance once traffic starts arriving.',
    status: 'pending',
    actionLabel: 'Review analytics'
  }
];

const PROJECT_SETUP_ITEMS_BY_TYPE: Record<ProjectSetupPreset, readonly ProjectSetupItem[]> = {
  ECOMMERCE: ECOMMERCE_SETUP_ITEMS,
  PORTFOLIO: PORTFOLIO_SETUP_ITEMS,
  BLOG: BLOG_SETUP_ITEMS,
  GENERIC: GENERIC_SETUP_ITEMS,
};

export const PROJECT_SETUP_ITEMS = ECOMMERCE_SETUP_ITEMS;

export function getProjectSetupItems(type: ProjectType | string | null | undefined): readonly ProjectSetupItem[] {
  const normalized = String(type ?? '').trim().toUpperCase();

  if (normalized === 'ECOMMERCE') {
    return PROJECT_SETUP_ITEMS_BY_TYPE.ECOMMERCE;
  }

  if (normalized === 'PORTFOLIO') {
    return PROJECT_SETUP_ITEMS_BY_TYPE.PORTFOLIO;
  }

  if (normalized === 'BLOG') {
    return PROJECT_SETUP_ITEMS_BY_TYPE.BLOG;
  }

  return PROJECT_SETUP_ITEMS_BY_TYPE.GENERIC;
}

export function getCompletedProjectSetupItems(items: readonly ProjectSetupItem[]): number {
  return items.filter((item) => item.status === 'done').length;
}

export function getProjectSetupNextStep(items: readonly ProjectSetupItem[]): string | null {
  return items.find((item) => item.status === 'active')?.title ?? items.find((item) => item.status === 'pending')?.title ?? null;
}
