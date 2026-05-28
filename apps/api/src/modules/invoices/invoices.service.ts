import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrder(branchId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, branchId },
      include: { invoice: true, client: true, items: { include: { service: true } }, branch: true, payments: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  buildReceiptHtml(order: {
    number: string;
    grandTotal: unknown;
    subtotal: unknown;
    discountTotal: unknown;
    vatTotal: unknown;
    bonusUsed: unknown;
    completedAt: Date | null;
    branch: { name: string; address: string | null; vatRate: unknown };
    client: { firstName: string; lastName: string | null; phone: string };
    items: { qty: number; priceSnapshot: unknown; service: { name: string } }[];
    payments: { method: string; amount: unknown }[];
  }) {
    const items = order.items
      .map(
        (i) =>
          `<tr><td>${i.service.name}</td><td>${i.qty}</td><td align="right">${Number(i.priceSnapshot).toFixed(2)}</td></tr>`,
      )
      .join('');
    const pays = order.payments
      .map((p) => `<tr><td>${p.method}</td><td align="right">${Number(p.amount).toFixed(2)} AZN</td></tr>`)
      .join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Чек ${order.number}</title>
<style>body{font-family:sans-serif;max-width:400px;margin:24px auto}table{width:100%;border-collapse:collapse}td,th{padding:4px 0;border-bottom:1px solid #eee}.total{font-weight:bold;font-size:1.1em}</style></head>
<body>
<h2>${order.branch.name}</h2>
<p style="color:#666">${order.branch.address ?? ''}</p>
<p>Чек <strong>${order.number}</strong><br>${order.completedAt ? new Date(order.completedAt).toLocaleString('az-AZ') : ''}</p>
<p>${order.client.firstName} ${order.client.lastName ?? ''}<br>${order.client.phone}</p>
<table><thead><tr><th>Услуга</th><th>Кол</th><th>Сумма</th></tr></thead><tbody>${items}</tbody></table>
<p>Подытог: ${Number(order.subtotal).toFixed(2)} AZN<br>
Скидка: ${Number(order.discountTotal).toFixed(2)} AZN<br>
Бонусы: ${Number(order.bonusUsed).toFixed(2)} AZN<br>
НДС: ${Number(order.vatTotal).toFixed(2)} AZN</p>
<p class="total">Итого: ${Number(order.grandTotal).toFixed(2)} AZN</p>
<table>${pays}</table>
<p style="margin-top:24px;font-size:12px;color:#888">Washer CRM · Спасибо за визит!</p>
</body></html>`;
  }

  async ensureInvoice(orderId: string, orderNumber: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { orderId } });
    if (existing) return existing;
    return this.prisma.invoice.create({
      data: { orderId, number: `INV-${orderNumber}` },
    });
  }
}
