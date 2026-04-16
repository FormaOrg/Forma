export type BlogPostStatus = 'published' | 'scheduled' | 'draft';

export interface ProjectBlogPostItem {
  id: string;
  title: string;
  excerpt: string;
  status: BlogPostStatus;
  statusLabel: string;
  categoryLabel: string;
  readTimeLabel: string;
  viewsLabel: string;
  updatedLabel: string;
  hook: string;
  seoTitle: string;
  distributionLabel: string;
}

export type CategoryState = 'healthy' | 'expanding' | 'light';

export interface ProjectBlogCategoryItem {
  id: string;
  name: string;
  description: string;
  pillarLabel: string;
  postCount: number;
  draftCount: number;
  shareLabel: string;
  state: CategoryState;
  stateLabel: string;
  cadenceLabel: string;
  nextAngle: string;
}

export type SubscriberStatus = 'new' | 'engaged' | 'vip' | 'paused';

export interface ProjectBlogSubscriberItem {
  id: number;
  name: string;
  email: string;
  status: SubscriberStatus;
  statusLabel: string;
  sourceLabel: string;
  tagLabel: string;
  joinedLabel: string;
  openRateLabel: string;
  lastTouchLabel: string;
}
