import { StorefrontHomepageDocument } from './project-storefront.model';

export interface PublicStorefrontProduct {
  id: number;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  productType: 'PHYSICAL' | 'DIGITAL' | 'SERVICE' | null;
  price: number;
  compareAtPrice: number | null;
  inventoryQuantity: number;
  imageUrl: string | null;
  tags: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PublicStorefrontHome {
  projectId: number;
  storeName: string;
  themeKey: string | null;
  homepage: StorefrontHomepageDocument;
  featuredProducts: PublicStorefrontProduct[];
}
