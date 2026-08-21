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

export interface CardInstallmentOption {
  id?: string;
  installments: number;
  interestPercent: number;
  withEntry?: boolean; // Se a 1ª parcela é como entrada (início do projeto)
}

export function getInstallmentScheduleText(installments: number, withEntry?: boolean): string {
  if (!installments || installments <= 0) return '';
  if (withEntry) {
    if (installments === 1) return 'Entrada (à vista)';
    if (installments === 2) return 'Entrada e 30 dias';
    const numbers: number[] = [];
    for (let i = 1; i < installments; i++) {
      numbers.push(i * 30);
    }
    const last = numbers.pop();
    return `Entrada, ${numbers.join(', ')} e ${last} dias`;
  } else {
    if (installments === 1) return '30 dias';
    if (installments === 2) return '30 e 60 dias';
    const numbers: number[] = [];
    for (let i = 1; i <= installments; i++) {
      numbers.push(i * 30);
    }
    const last = numbers.pop();
    return `${numbers.join(', ')} e ${last} dias`;
  }
}

export interface Proposal {
  id: number;
  name: string;
  projectType?: 'editorial' | 'cultural';
  date: string;
  validityDate?: string; // Validade da proposta (DD/MM/YYYY)
  items: ProposalItem[];
  totalCost: number;
  sellPrice: number;
  status: string;
  paymentEntryPercent?: number;
  paymentInstallments?: number;
  paymentInterestPercent?: number;
  cardInstallmentOptions?: CardInstallmentOption[]; // Multiple card installment conditions
  paymentDirectTerms?: string; // e.g. "Entrada, 30 e 60 dias", "30/60/90 dias", etc.
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
