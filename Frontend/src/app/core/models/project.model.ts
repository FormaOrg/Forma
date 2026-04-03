// ── Enums ──────────────────────────────────────────────────
export type ProjectType =
  | 'PORTFOLIO'
  | 'BLOG'
  | 'BUSINESS'
  | 'ECOMMERCE'
  | 'LANDING_PAGE';

export type CreationMethod =
  | 'DRAG_DROP'
  | 'VISUAL_DESIGNER'
  | 'GUIDED_SETUP'
  | 'QUICK_START'
  | 'AI_PROMPT'
  | 'HYBRID';
export type ProjectStatus  = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type DeploymentStatus = 'PENDING' | 'DEPLOYED' | 'FAILED' | 'UNDEPLOYED';

// ── Project — clean, no deployment/design/ecommerce embedded
export interface Project {
  id: number;
  name: string;
  description?: string;
  type: ProjectType;
  creationMethod: CreationMethod;
  status: ProjectStatus;
  ownerId: number;
  templateId?: number | null;
  isPublished?: boolean;
  createdAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
}

// ── Deployment — separate resource, references project ────
export interface Deployment {
  id: number;
  projectId: number;       // relation by id, not embedded
  subdomain: string;
  customDomain?: string;   // premium only
  status: DeploymentStatus;
  serverUrl: string;
  deployedAt?: string;     // ISO 8601
  isLive: boolean;
}

// ── Design — separate resource ────────────────────────────
export interface Design {
  id: number;
  projectId: number;
  name: string;
  figmaData: string;
  jsonStructure: string;
  createdAt: string; // ISO 8601
}

// ── Theme ─────────────────────────────────────────────────
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface Typography {
  headingFont: string;
  bodyFont: string;
  baseFontSize: string;
}

export interface Theme {
  id: number;
  name: string;
  colorPalette: ColorPalette;
  typography: Typography;
}

// ── Media ─────────────────────────────────────────────────
export interface Media {
  id: number;
  projectId: number;
  fileName: string;
  fileUrl: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  fileSize: number;
  uploadedAt: string; // ISO 8601
}

// ── E-Commerce — composition, not inheritance ─────────────
// Lives in commerce.model.ts, referenced here by id only
export interface EcommerceConfig {
  projectId: number;
  storeName: string;
  currency: string;
  paymentGateway: string;
  shippingConfig: string;
  taxRate: number;
}

export interface TemplateRecord {
  id: number | string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  summary?: string | null;
  category?: string | null;
  label?: string | null;
  type?: ProjectType | string | null;
  projectType?: ProjectType | string | null;
  creationMethod?: CreationMethod | string | null;
  previewImageUrl?: string | null;
  previewUrl?: string | null;
  previewRoute?: string | null;
  route?: string | null;
  featured?: boolean | null;
  isOwned?: boolean | null;
  tags?: string[] | null;
  usesCount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// ── Request DTOs ───────────────────────────────────────────
export interface CreateProjectRequest {
  name: string;
  description?: string;
  type: ProjectType;
  creationMethod: CreationMethod;
  templateId?: number | null;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  metaDescription?: string;
}

export interface DeployProjectRequest {
  projectId: number;
  subdomain: string;
  customDomain?: string;
}
