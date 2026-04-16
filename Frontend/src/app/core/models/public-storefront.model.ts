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

export interface EditorStorefrontPreviewSnapshot {
  storefront: PublicStorefrontHome;
  products: PublicStorefrontProduct[];
  savedAt: string;
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
  customerSessionToken?: string | null;
  items: PublicCheckoutItemRequest[];
}

export interface PublicCheckoutResponse {
  orderId: number;
  orderNumber: string;
  total: number;
  currencyCode: string;
}

export interface PublicStorefrontAccountRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  password: string;
}

export interface PublicStorefrontAccountLoginRequest {
  email: string;
  password: string;
}

export interface PublicStorefrontCustomerProfile {
  customerId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string | null;
}

export interface PublicStorefrontCustomerOrder {
  orderId: number;
  orderNumber: string;
  placedAt: string | null;
  paymentStatus: string | null;
  fulfillmentStatus: string | null;
  total: number;
}

export interface PublicStorefrontCustomerAccount {
  sessionToken: string;
  expiresAt: string | null;
  customer: PublicStorefrontCustomerProfile;
  orders: PublicStorefrontCustomerOrder[];
}
