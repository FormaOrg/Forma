// ── Enums ──────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'PREMIUM' | 'STANDARD';
export type SubscriptionType = 'FREE' | 'PREMIUM';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED';
export type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'LOCAL';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

// ── Core user — no subscription embedded ──────────────────
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string; // ISO 8601
}

// ── Auth — never expose full User ─────────────────────────
export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified?: boolean; 

}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ── Subscription — fetched separately by billing service ──
export interface Subscription {
  id: number;
  userId: number;
  type: SubscriptionType;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  status: SubscriptionStatus;
  price: number;
  paymentMethod?: PaymentMethod; // typed, not string
  autoRenew: boolean;
}

// ── Composed view model (assembled in Angular, not from API)
export interface UserWithSubscription {
  user: User;
  subscription?: Subscription;
}

// ── Payment — belongs to billing service ──────────────────
export interface Payment {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionDate: string; // ISO 8601
  transactionId: string;
}

// ── Request DTOs ───────────────────────────────────────────
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}