export type PortfolioInquiryStatus = 'new' | 'replied' | 'scheduled';

export interface PortfolioInquiryItem {
  id: number;
  name: string;
  email: string;
  serviceLabel: string | null;
  budgetLabel: string | null;
  status: PortfolioInquiryStatus;
  statusLabel: string;
  sourceLabel: string | null;
  message: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortfolioInquiriesPage {
  projectId: number;
  projectName: string;
  inquiries: PortfolioInquiryItem[];
}

export interface UpdatePortfolioInquiryStatusRequest {
  status: string;
}
