// ── Enums ──────────────────────────────────────────────────
export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

// ── Entities ───────────────────────────────────────────────
export interface Product {
  id: number;
  projectId: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  inStock: boolean;
  category: string;
  imageUrl?: string;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  projectId: number;
  customerId: number;
  orderNumber: string;
  orderDate: string;    // ISO 8601
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  items: OrderItem[];
}

// ── Request DTOs ───────────────────────────────────────────
export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  imageUrl?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}