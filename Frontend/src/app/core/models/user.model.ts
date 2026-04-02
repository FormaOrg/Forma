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
  username?: string;
  phone?: string;
  country?: string;
  website?: string;
  avatarUrl?: string;
  googleConnected?: boolean;
  googleEmail?: string;
  preferredLanguage?: 'en' | 'fr';
  preferredTheme?: 'light' | 'dark' | 'system';
  role: UserRole;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser;
  requiresLoginVerification?: boolean;
  loginVerificationToken?: string | null;
  message?: string;
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
  rememberMe: boolean;
}

export interface GoogleAuthRequest {
  idToken: string;
  rememberMe: boolean;
}

export interface GoogleClientConfigResponse {
  clientId: string;
}

export interface GoogleLinkRequest {
  idToken: string;
}

export interface LoginVerificationRequest {
  token: string;
  code: string;
}

export interface LoginVerificationTokenRequest {
  token: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  country?: string;
  website?: string;
}

export interface UpdatePreferencesRequest {
  preferredLanguage?: 'en' | 'fr';
  preferredTheme?: 'light' | 'dark' | 'system';
}

export interface RequestEmailChangeRequest {
  currentPassword: string;
  newEmail: string;
}

export interface ConfirmEmailChangeRequest {
  code: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SecuritySettingsResponse {
  email: string;
  loginVerificationEnabled: boolean;
  securityQuestion1?: string;
  securityQuestion2?: string;
  recoveryEmail?: string;
  recoveryPhone?: string;
}

export interface UpdateSecurityQuestionsRequest {
  currentPassword?: string;
  verificationToken?: string;
  question1: string;
  answer1: string;
  question2: string;
  answer2: string;
}

export interface UpdateRecoveryOptionsRequest {
  currentPassword?: string;
  verificationToken?: string;
  recoveryEmail?: string;
  recoveryPhone?: string;
}

export interface VerifySensitiveActionRequest {
  currentPassword: string;
}

export interface SensitiveActionVerificationResponse {
  token: string;
  message: string;
}

export interface RequestLoginVerificationChangeRequest {
  enable: boolean;
}

export interface ConfirmLoginVerificationChangeRequest {
  code: string;
}

export interface ActivitySession {
  id: string;
  deviceName: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface LoginRecord {
  id: string;
  timestamp: string;
  deviceName: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  status: 'success' | 'failed';
  failureReason?: string;
}

export interface ActivityRealtimeEvent {
  type: 'activity_refresh';
  reason?: string;
  occurredAt: string;
}
