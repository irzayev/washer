import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const MoneySchema = z.coerce.number().nonnegative().multipleOf(0.01);

export const UuidSchema = z.string().uuid();

export const PhoneE164Schema = z
  .string()
  .regex(/^\+994\d{9}$/, 'Phone must be in E.164 format (+994XXXXXXXXX)');

export type Locale = 'ru' | 'az' | 'en';
export const SupportedLocales: readonly Locale[] = ['ru', 'az', 'en'] as const;
