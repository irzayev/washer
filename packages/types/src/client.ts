import { z } from 'zod';
import { PhoneE164Schema } from './common';

export const CreateClientSchema = z.object({
  phone: PhoneE164Schema,
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).optional(),
  email: z.string().email().optional(),
  birthday: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  preferredLang: z.enum(['ru', 'az', 'en']).default('ru'),
  vehicle: z
    .object({
      plate: z.string().max(20).optional(),
      vin: z.string().max(32).optional(),
      make: z.string().max(40).optional(),
      model: z.string().max(40).optional(),
      year: z.coerce.number().int().min(1950).max(2100).optional(),
      color: z.string().max(40).optional(),
    })
    .optional(),
});
export type CreateClientInput = z.infer<typeof CreateClientSchema>;

export const UpdateClientSchema = CreateClientSchema.partial().omit({ vehicle: true });
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

export const CreateVehicleSchema = z.object({
  plate: z.string().max(20).optional(),
  vin: z.string().max(32).optional(),
  make: z.string().max(40).optional(),
  model: z.string().max(40).optional(),
  year: z.coerce.number().int().min(1950).max(2100).optional(),
  color: z.string().max(40).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
