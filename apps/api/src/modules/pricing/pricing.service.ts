import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { money, round2, sumMoney, computeVat, type VatMode } from '@washer/utils';

export interface PricingItemInput {
  priceSnapshot: number | string | Decimal;
  qty: number;
  discount?: number | string | Decimal;
}

export interface PricingDiscountInput {
  type: 'FIXED' | 'PERCENT' | 'MANUAL';
  value: number | string | Decimal;
}

export interface PricingInput {
  items: PricingItemInput[];
  discounts?: PricingDiscountInput[];
  bonusUsedRequested?: number | string | Decimal;
  vatMode: VatMode;
  vatRate: number | string | Decimal;
  bonusEarnRate?: number;
  bonusMaxShare?: number;
}

export interface PricingResult {
  subtotal: Decimal;
  itemsDiscount: Decimal;
  orderDiscount: Decimal;
  discountTotal: Decimal;
  bonusUsed: Decimal;
  netBeforeVat: Decimal;
  vatTotal: Decimal;
  grandTotal: Decimal;
  bonusEarned: Decimal;
}

@Injectable()
export class PricingService {
  /**
   * Order pricing pipeline:
   *   1. subtotal = sum(item.priceSnapshot * qty)
   *   2. items discounts subtracted per-line
   *   3. order-level discounts applied (FIXED / PERCENT / MANUAL=absolute)
   *   4. bonus usage capped (bonusMaxShare of post-discount subtotal, default 30%)
   *   5. VAT computed according to branch vatMode (INCLUDED/ADDED/NONE)
   *   6. bonusEarned = bonusEarnRate * grandTotal (cashback)
   */
  compute(input: PricingInput): PricingResult {
    const bonusMaxShare = input.bonusMaxShare ?? 0.3;
    const bonusEarnRate = input.bonusEarnRate ?? 0.05;

    const lineGross = input.items.map((i) => money(i.priceSnapshot).mul(i.qty));
    const subtotal = round2(sumMoney(lineGross));

    const itemsDiscount = round2(sumMoney(input.items.map((i) => i.discount ?? 0)));
    const afterItems = round2(subtotal.sub(itemsDiscount));

    let orderDiscount = money(0);
    for (const d of input.discounts ?? []) {
      if (d.type === 'PERCENT') {
        orderDiscount = orderDiscount.add(round2(afterItems.mul(money(d.value).div(100))));
      } else {
        orderDiscount = orderDiscount.add(money(d.value));
      }
    }
    orderDiscount = round2(Decimal.min(orderDiscount, afterItems));

    const afterDiscount = round2(afterItems.sub(orderDiscount));

    const bonusCap = round2(afterDiscount.mul(bonusMaxShare));
    const bonusUsed = round2(
      Decimal.max(money(0), Decimal.min(money(input.bonusUsedRequested ?? 0), bonusCap)),
    );

    const afterBonus = round2(afterDiscount.sub(bonusUsed));

    const vat = computeVat(afterBonus, input.vatRate, input.vatMode);
    const grandTotal = vat.gross;
    const vatTotal = vat.vat;
    const netBeforeVat = vat.net;

    const bonusEarned = round2(grandTotal.mul(bonusEarnRate));

    return {
      subtotal,
      itemsDiscount,
      orderDiscount,
      discountTotal: round2(itemsDiscount.add(orderDiscount)),
      bonusUsed,
      netBeforeVat,
      vatTotal,
      grandTotal,
      bonusEarned,
    };
  }
}
