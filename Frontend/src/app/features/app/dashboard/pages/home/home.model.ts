export type HomeProjectStatus = 'published' | 'draft';

export type HomeActivityType = 'edited' | 'published' | 'created';

export interface HomeRecentProject {
  name: string;
  domain: string;
  updatedAt: string;
  status: HomeProjectStatus;
  route: string;
}

export interface HomeRecentTemplateItem {
  name: string;
  hint: string;
  image: string;
  route: string;
}

export interface HomeActivityItem {
  title: string;
  time: string;
  type: HomeActivityType;
}

export interface HomeSetupStep {
  id: string;
  label: string;
  done: boolean;
}
