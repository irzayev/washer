import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

async function sendEvolutionText(number: string, text: string) {
  const base = process.env.EVOLUTION_API_URL;
  const key = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE_NAME;
  if (!base || !instance) {
    console.warn('[whatsapp] Evolution not configured (EVOLUTION_API_URL / EVOLUTION_INSTANCE_NAME)');
    return;
  }
  const url = `${base.replace(/\/$/, '')}/message/sendText/${instance}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { apikey: key } : {}),
    },
    body: JSON.stringify({ number, text }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}

async function handlePdf(job: { data: { orderId: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: job.data.orderId },
    include: {
      client: true,
      lines: { include: { service: true } },
      payments: true,
    },
  });
  if (!order) {
    throw new Error(`Order ${job.data.orderId} not found`);
  }

  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c as Buffer));

  doc.fontSize(18).text('eDetailing — Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Order: ${order.id}`);
  doc.text(`Client: ${order.client.firstName ?? ''} ${order.client.lastName ?? ''}`.trim());
  doc.moveDown();
  order.lines.forEach((line: (typeof order.lines)[number]) => {
    doc.text(`${line.service.name} x${line.qty} — ${(line.lineTotalCents / 100).toFixed(2)} AZN`);
  });
  doc.moveDown();
  doc.text(`Subtotal: ${(order.subtotalCents / 100).toFixed(2)} AZN`);
  doc.text(`Discount: ${order.discountValue != null ? String(order.discountValue) : '0'}`);
  doc.text(`Bonus used: ${(order.bonusUsedCents / 100).toFixed(2)} AZN`);
  doc.text(`Total: ${(order.finalTotalCents / 100).toFixed(2)} AZN`);
  doc.end();

  await new Promise<void>((resolve) => doc.on('end', resolve));
  const pdfBuffer = Buffer.concat(chunks);
  console.log(`[pdf] generated ${pdfBuffer.length} bytes for order ${order.id}`);
  return { bytes: pdfBuffer.length };
}

new Worker(
  'notifications',
  async (job) => {
    const data = job.data as { to?: string; template?: string; payload?: Record<string, unknown> };
    if (job.name === 'whatsapp' && data.to) {
      const text = `[${data.template ?? 'notice'}] ${JSON.stringify(data.payload ?? {})}`;
      await sendEvolutionText(data.to, text);
    }
    console.log('[notifications]', job.name, job.data);
    return { ok: true };
  },
  { connection },
);

new Worker('pdf', async (job) => handlePdf(job as { data: { orderId: string } }), { connection });

console.log('worker started: queues notifications, pdf');
