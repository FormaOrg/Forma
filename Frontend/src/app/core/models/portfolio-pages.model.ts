export type PortfolioPageStatus = 'published' | 'in-progress' | 'draft';

export interface PortfolioPageItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: PortfolioPageStatus;
  statusLabel: string;
  sectionCount: number;
  seoLabel: string;
  updatedAt: string;
  featured: boolean;
}

export interface PortfolioPagesPage {
  projectId: number;
  projectName: string;
  pages: PortfolioPageItem[];
}
