export type ProjectSetupStatus = 'done' | 'active' | 'pending';

export type ProjectSetupItem = {
  title: string;
  description: string;
  status: ProjectSetupStatus;
  actionLabel: string;
};

export const PROJECT_SETUP_ITEMS: readonly ProjectSetupItem[] = [
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

export function getCompletedProjectSetupItems(items: readonly ProjectSetupItem[]): number {
  return items.filter((item) => item.status === 'done').length;
}

export function getProjectSetupNextStep(items: readonly ProjectSetupItem[]): string | null {
  return items.find((item) => item.status === 'active')?.title ?? items.find((item) => item.status === 'pending')?.title ?? null;
}
