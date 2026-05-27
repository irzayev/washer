import { PricingService } from './pricing.service';

describe('PricingService', () => {
  const svc = new PricingService();

  it('computes simple subtotal with VAT included', () => {
    const r = svc.compute({
      items: [{ priceSnapshot: 100, qty: 1 }],
      vatMode: 'INCLUDED',
      vatRate: 18,
    });
    expect(r.subtotal.toNumber()).toBe(100);
    expect(r.grandTotal.toNumber()).toBe(100);
    expect(r.vatTotal.toNumber()).toBeCloseTo(15.25, 2);
  });

  it('computes VAT added on top', () => {
    const r = svc.compute({
      items: [{ priceSnapshot: 100, qty: 1 }],
      vatMode: 'ADDED',
      vatRate: 18,
    });
    expect(r.grandTotal.toNumber()).toBeCloseTo(118, 2);
    expect(r.vatTotal.toNumber()).toBeCloseTo(18, 2);
  });

  it('caps bonus usage at 30% of post-discount subtotal', () => {
    const r = svc.compute({
      items: [{ priceSnapshot: 100, qty: 1 }],
      bonusUsedRequested: 80,
      vatMode: 'INCLUDED',
      vatRate: 18,
    });
    expect(r.bonusUsed.toNumber()).toBe(30);
    expect(r.grandTotal.toNumber()).toBe(70);
  });

  it('applies percent discount, then fixed', () => {
    const r = svc.compute({
      items: [{ priceSnapshot: 200, qty: 1 }],
      discounts: [
        { type: 'PERCENT', value: 10 },
        { type: 'FIXED', value: 20 },
      ],
      vatMode: 'NONE',
      vatRate: 0,
    });
    expect(r.orderDiscount.toNumber()).toBe(40);
    expect(r.grandTotal.toNumber()).toBe(160);
  });

  it('computes bonus earned 5% by default', () => {
    const r = svc.compute({
      items: [{ priceSnapshot: 100, qty: 1 }],
      vatMode: 'INCLUDED',
      vatRate: 18,
    });
    expect(r.bonusEarned.toNumber()).toBeCloseTo(5, 2);
  });
});
