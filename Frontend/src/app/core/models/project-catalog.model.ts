export type ProjectCatalogStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type ProjectCatalogType = 'PHYSICAL' | 'DIGITAL' | 'SERVICE';

export interface ProjectCatalogProduct {
  id: number;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  productType: ProjectCatalogType;
  status: ProjectCatalogStatus;
  price: number;
  compareAtPrice: number | null;
  inventoryQuantity: number;
  imageUrl: string | null;
  tags: string[];
  readyToPublish: boolean;
  readinessIssues: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProjectCatalogSummary {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  lowStockProducts: number;
  readyToPublishProducts: number;
}

export interface ProjectCatalogPage {
  summary: ProjectCatalogSummary;
  products: ProjectCatalogProduct[];
  categories: string[];
}

export interface ProjectCatalogQuery {
  search?: string;
  status?: ProjectCatalogStatus | 'ALL';
  category?: string;
}

export interface CreateProjectCatalogProductRequest {
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  productType: ProjectCatalogType;
  status: ProjectCatalogStatus;
  price: number;
  compareAtPrice?: number | null;
  inventoryQuantity: number;
  imageUrl?: string | null;
  tags?: string[];
}

export interface UpdateProjectCatalogProductRequest {
  name?: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  productType?: ProjectCatalogType;
  status?: ProjectCatalogStatus;
  price?: number;
  compareAtPrice?: number | null;
  inventoryQuantity?: number;
  imageUrl?: string | null;
  tags?: string[];
}
