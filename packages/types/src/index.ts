/** Shared API contracts (keep in sync with Nest DTOs where useful). */

export type UserRoleDto = 'ADMIN' | 'MANAGER' | 'WORKER' | 'CLIENT';

export type OrderStatusDto =
  | 'NEW'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'COMPLETED'
  | 'DELIVERED';

export type PaymentMethodDto =
  | 'CASH'
  | 'POS'
  | 'AZERICARD'
  | 'BANK_TRANSFER'
  | 'BONUS'
  | 'MIXED';

export type PaymentStatusDto = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
