export interface ProjectCustomer {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  zoneLabel: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProjectCustomersSummary {
  totalCustomers: number;
  repeatCustomers: number;
  recentCustomers: number;
  activeZones: number;
}

export interface ProjectCustomersPage {
  summary: ProjectCustomersSummary;
  customers: ProjectCustomer[];
  zones: string[];
}

export interface ProjectCustomersQuery {
  search?: string;
  zone?: string;
}

export interface CreateProjectCustomerRequest {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  zoneLabel?: string | null;
}

export type UpdateProjectCustomerRequest = Partial<CreateProjectCustomerRequest>;
