import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatMoney = (value: number | string, currency = 'AZN') =>
  `${Number(value).toFixed(2)} ${currency}`;
