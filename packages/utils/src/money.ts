import { Decimal } from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type MoneyInput = number | string | Decimal;

export const money = (value: MoneyInput = 0): Decimal => new Decimal(value || 0);

export const toCents = (value: MoneyInput): number => money(value).mul(100).toNumber();

export const fromCents = (cents: number): Decimal => new Decimal(cents).div(100);

export const round2 = (value: MoneyInput): Decimal =>
  money(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

export const sumMoney = (values: MoneyInput[]): Decimal =>
  values.reduce<Decimal>((acc, v) => acc.add(money(v)), money(0));

export const formatMoney = (value: MoneyInput, currency = 'AZN'): string => {
  const v = round2(value).toFixed(2);
  return `${v} ${currency}`;
};

export type VatMode = 'NONE' | 'INCLUDED' | 'ADDED';

export interface VatComputation {
  net: Decimal;
  vat: Decimal;
  gross: Decimal;
}

export const computeVat = (
  amount: MoneyInput,
  vatRate: MoneyInput,
  mode: VatMode,
): VatComputation => {
  const a = money(amount);
  const rate = money(vatRate).div(100);
  if (mode === 'NONE') return { net: a, vat: money(0), gross: a };
  if (mode === 'ADDED') {
    const vat = round2(a.mul(rate));
    return { net: round2(a), vat, gross: round2(a.add(vat)) };
  }
  const net = round2(a.div(rate.add(1)));
  const vat = round2(a.sub(net));
  return { net, vat, gross: round2(a) };
};
