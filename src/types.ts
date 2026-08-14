export interface Cost {
  id: number;
  description: string;
  value: number;
}

export interface Rate {
  id: number;
  description: string;
  percentage: number;
}

export interface Supply {
  id: number;
  description: string;
  unit: string;
  cost: number;
  type?: 'produto' | 'servico';
  multiplier?: number;
  shippingCost?: number;
  shippingQty?: number;
}

export interface Process {
  id: number;
  action: string;
  unit: string;
  time: number;
}

export interface Status {
  id: number;
  name: string;
  order: number;
}

export interface ProposalItem {
  id: number;
  supplyId: number;
  description: string;
  unit: string;
  cost: number;
  qty: number;
  type?: 'produto' | 'servico';
  multiplier?: number;
  baseCost?: number;
  shippingCost?: number;
  shippingQty?: number;
}

export interface Proposal {
  id: number;
  name: string;
  projectType?: 'editorial' | 'cultural';
  date: string;
  items: ProposalItem[];
  totalCost: number;
  sellPrice: number;
  status: string;
  paymentEntryPercent?: number;
  paymentInstallments?: number;
  paymentInterestPercent?: number;
  paymentCustomText?: string;
  validationDays?: number;
  deliveryDays?: number;
  bookFeaturesDescription?: string;
  markupMultiplier?: number;
  leadId?: number; // link proposal to a lead
  clientName?: string; // store copy of customer name
  clientPhone?: string; // store copy of customer phone
  approvedValue?: number; // persisted payment details
  approvedPaymentMethod?: string; // persisted payment details
  approvedInstallmentsDetails?: string; // persisted installment or entry details
  approvedDate?: string; // date the proposal was approved (DD/MM/YYYY)
  paymentMethodCash?: boolean;
  paymentMethodInstallments?: boolean;
  paymentDiscountPercent?: number;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface IntegrationSetting {
  id: string; // 'whatsapp' | 'email'
  apiUrl?: string;
  apiKey?: string;
  instanceName?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpSsl?: boolean;
}
