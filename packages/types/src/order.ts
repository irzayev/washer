import { z } from 'zod';
import { UuidSchema, MoneySchema } from './common';

export const CreateOrderSchema = z.object({
  clientId: UuidSchema,
  vehicleId: UuidSchema.optional(),
  boxId: UuidSchema.optional(),
  assignedToId: UuidSchema.optional(),
  notes: z.string().max(2000).optional(),
  items: z
    .array(
      z.object({
        serviceId: UuidSchema,
        qty: z.number().int().min(1).default(1),
        executorId: UuidSchema.optional(),
        discount: MoneySchema.default(0),
      }),
    )
    .min(1),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['NEW', 'SCHEDULED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'DELIVERED', 'CANCELLED']),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

export const CloseOrderSchema = z.object({
  bonusUsed: MoneySchema.default(0),
  discounts: z
    .array(
      z.object({
        type: z.enum(['FIXED', 'PERCENT', 'MANUAL']),
        value: MoneySchema,
        reason: z.string().min(1),
        comment: z.string().optional(),
      }),
    )
    .default([]),
  payments: z
    .array(
      z.object({
        method: z.enum(['CASH', 'POS', 'AZERICARD', 'TRANSFER', 'BONUS']),
        amount: MoneySchema,
        transactionRef: z.string().optional(),
      }),
    )
    .min(1),
  idempotencyKey: z.string().min(8).max(80),
});
export type CloseOrderInput = z.infer<typeof CloseOrderSchema>;
