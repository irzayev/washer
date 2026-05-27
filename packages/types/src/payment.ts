export type PaymentMethod = 'CASH' | 'POS' | 'AZERICARD' | 'TRANSFER' | 'BONUS';
export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface PricingBreakdown {
  subtotal: number;
  discountTotal: number;
  bonusUsed: number;
  vatTotal: number;
  grandTotal: number;
  bonusEarned: number;
}
