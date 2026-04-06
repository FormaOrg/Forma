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

export interface StoreCartItem {
  productId: number;
  name: string;
  category: string | null;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

export interface PublicCheckoutItemRequest {
  productId: number;
  quantity: number;
}

export interface PublicCheckoutRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  address: string;
  notes?: string | null;
  items: PublicCheckoutItemRequest[];
}

export interface PublicCheckoutResponse {
  orderId: number;
  orderNumber: string;
  total: number;
  currencyCode: string;
}
