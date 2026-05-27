import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  createSign,
  createVerify,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  type KeyObject,
} from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { PrismaService } from '../../prisma/prisma.service';

export interface InitPaymentInput {
  orderId: string;
  amount: number;
  currency?: string;
  description?: string;
  email?: string;
  returnUrl: string;
}

export interface InitPaymentResult {
  redirectUrl: string;
  formFields: Record<string, string>;
  reference: string;
}

/**
 * Azericard e-Commerce Gateway provider.
 *
 * Реализация по спецификации developer.azericard.com:
 *   - Алгоритм подписи: RSAwithSHA256 (2048-bit)
 *   - P_SIGN: hex(RSA_SIGN_SHA256(privateKey, MAC_SOURCE)), UPPERCASE
 *   - MAC source string: для каждого поля в фиксированном порядке записывается
 *     LENGTH (десятичная длина значения, без паддинга) + VALUE. Если поле пустое — символ "-".
 *   - Подпись ответа банка (callback) проверяется его public key.
 *
 * TRTYPE:
 *   1  — авторизация (первичная оплата)
 *   21 — checkout (capture)
 *   22 — refund
 *   24 — reversal
 *
 * AZERICARD_MODE:
 *   mock        — stub redirect, без обращения к банку (для разработки)
 *   sandbox     — testmpi.3dsecure.az
 *   production  — mpi.3dsecure.az
 *
 * Требуемые env:
 *   AZERICARD_MERCHANT_ID, AZERICARD_TERMINAL_ID, AZERICARD_MERCH_NAME, AZERICARD_MERCH_URL,
 *   AZERICARD_PRIVATE_KEY_PATH (PEM, 2048-bit RSA), AZERICARD_GATEWAY_PUBLIC_KEY_PATH (PEM),
 *   AZERICARD_GATEWAY_URL, AZERICARD_MODE, AZERICARD_COUNTRY (AZ), AZERICARD_GMT (+4)
 *
 * Генерация ключей (один раз, согласно п.4 docs):
 *   openssl genrsa -out merchant_private.pem 2048
 *   openssl rsa -in merchant_private.pem -pubout -out merchant_public.pem
 * Публичный ключ передаётся банку.
 */
@Injectable()
export class AzericardService {
  private readonly logger = new Logger(AzericardService.name);
  private readonly mode = (process.env.AZERICARD_MODE ?? 'mock') as 'mock' | 'sandbox' | 'production';
  private readonly merchantId = process.env.AZERICARD_MERCHANT_ID ?? '';
  private readonly terminalId = process.env.AZERICARD_TERMINAL_ID ?? '';
  private readonly merchName = process.env.AZERICARD_MERCH_NAME ?? 'WASHER';
  private readonly merchUrl = process.env.AZERICARD_MERCH_URL ?? 'http://localhost:3000';
  private readonly country = process.env.AZERICARD_COUNTRY ?? 'AZ';
  private readonly gmt = process.env.AZERICARD_GMT ?? '+4';
  private readonly gatewayUrl = process.env.AZERICARD_GATEWAY_URL ?? 'https://testmpi.3dsecure.az/cgi-bin/cgi_link';

  private privateKey: KeyObject | null = null;
  private gatewayPublicKey: KeyObject | null = null;

  constructor(private readonly prisma: PrismaService) {
    if (this.mode !== 'mock') {
      const pkPath = process.env.AZERICARD_PRIVATE_KEY_PATH ?? '';
      const gwPath = process.env.AZERICARD_GATEWAY_PUBLIC_KEY_PATH ?? '';
      if (pkPath && existsSync(pkPath)) {
        this.privateKey = createPrivateKey(readFileSync(pkPath));
      } else {
        this.logger.warn('AZERICARD_PRIVATE_KEY_PATH not set or file missing — signing will fail');
      }
      if (gwPath && existsSync(gwPath)) {
        this.gatewayPublicKey = createPublicKey(readFileSync(gwPath));
      } else {
        this.logger.warn('AZERICARD_GATEWAY_PUBLIC_KEY_PATH not set — webhook verification disabled');
      }
    }
  }

  /**
   * Initialize TRTYPE=1 authorization. Returns redirect URL + form fields.
   * Merchant frontend must POST the form to redirectUrl OR build query string.
   */
  async initPayment(input: InitPaymentInput): Promise<InitPaymentResult> {
    if (!input.amount || input.amount <= 0) throw new BadRequestException('Invalid amount');

    if (this.mode === 'mock') {
      const ref = `MOCK-${Date.now()}`;
      this.logger.warn(`[Azericard MOCK] init ${ref} order=${input.orderId} amount=${input.amount}`);
      return {
        redirectUrl: `${input.returnUrl}?mock=1&ref=${ref}&status=succeeded`,
        formFields: { MOCK: '1', ref },
        reference: ref,
      };
    }

    const fields: Record<string, string> = {
      AMOUNT: input.amount.toFixed(2),
      CURRENCY: input.currency ?? 'AZN',
      ORDER: input.orderId.replace(/-/g, '').slice(-12).padStart(12, '0'),
      DESC: input.description ?? 'Service payment',
      MERCH_NAME: this.merchName,
      MERCH_URL: this.merchUrl,
      TERMINAL: this.terminalId,
      EMAIL: input.email ?? '',
      TRTYPE: '1',
      COUNTRY: this.country,
      MERCH_GMT: this.gmt,
      TIMESTAMP: this.timestampGmt(),
      NONCE: randomBytes(16).toString('hex').toUpperCase(),
      BACKREF: input.returnUrl,
    };

    const macSource = this.buildMacSource(fields, [
      'AMOUNT',
      'CURRENCY',
      'ORDER',
      'DESC',
      'MERCH_NAME',
      'MERCH_URL',
      'TERMINAL',
      'EMAIL',
      'TRTYPE',
      'COUNTRY',
      'MERCH_GMT',
      'TIMESTAMP',
      'NONCE',
      'BACKREF',
    ]);
    const nonce = fields.NONCE ?? '';
    fields.P_SIGN = this.signRsaSha256(macSource);

    const body = new URLSearchParams(fields).toString();
    return {
      redirectUrl: `${this.gatewayUrl}?${body}`,
      formFields: fields,
      reference: nonce,
    };
  }

  /**
   * Handle Gateway -> Merchant callback (BACKREF).
   * Verifies Gateway's RSA signature, then idempotently updates Payment.
   *
   * Callback MAC source: AMOUNT, CURRENCY, TERMINAL, TRTYPE, TIMESTAMP, NONCE, MERCH_URL.
   */
  async handleWebhook(payload: Record<string, string>): Promise<{ ok: boolean; reason?: string }> {
    if (this.mode === 'mock') {
      this.logger.warn('[Azericard MOCK] webhook payload accepted');
      return this.applyWebhookResult(payload, true);
    }

    const sig = payload.P_SIGN;
    if (!sig) return { ok: false, reason: 'missing P_SIGN' };

    if (this.gatewayPublicKey) {
      const macSource = this.buildMacSource(payload, [
        'AMOUNT',
        'CURRENCY',
        'TERMINAL',
        'TRTYPE',
        'TIMESTAMP',
        'NONCE',
        'MERCH_URL',
      ]);
      const ok = this.verifyRsaSha256(macSource, sig, this.gatewayPublicKey);
      if (!ok) return { ok: false, reason: 'signature mismatch' };
    } else {
      this.logger.warn('Skipping signature verification — gateway public key not configured');
    }

    return this.applyWebhookResult(payload, true);
  }

  private async applyWebhookResult(
    payload: Record<string, string>,
    signatureValid: boolean,
  ): Promise<{ ok: boolean; reason?: string }> {
    const ref = payload.NONCE ?? payload.ORDER ?? '';
    if (!ref) return { ok: false, reason: 'missing ref' };

    const payment = await this.prisma.payment.findFirst({ where: { transactionRef: ref } });
    if (!payment) return { ok: false, reason: 'payment not found' };

    // Azericard ACTION/RC codes: 0 = success
    const success = signatureValid && (payload.ACTION === '0' || payload.RC === '00' || payload.status === 'succeeded');

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: success ? 'SUCCEEDED' : 'FAILED',
        capturedAt: success ? new Date() : null,
        providerPayload: payload,
      },
    });

    if (success) {
      await this.prisma.outboxEvent.create({
        data: {
          aggregate: 'payment',
          aggregateId: payment.id,
          type: 'payment.succeeded',
          payload: { paymentId: payment.id, orderId: payment.orderId },
        },
      });
    }
    return { ok: true };
  }

  // ---------- crypto helpers ----------

  /**
   * Builds MAC source string per Azericard spec:
   *   for each field in `order`: append LENGTH (decimal, no padding) + VALUE.
   *   if value is empty -> append "-".
   */
  private buildMacSource(fields: Record<string, string>, order: string[]): string {
    return order
      .map((k) => {
        const v = fields[k];
        if (v === undefined || v === null || v === '') return '-';
        return `${v.length}${v}`;
      })
      .join('');
  }

  private signRsaSha256(message: string): string {
    if (!this.privateKey) {
      throw new Error('Azericard private key not loaded');
    }
    const signer = createSign('RSA-SHA256');
    signer.update(message, 'utf8');
    signer.end();
    return signer.sign(this.privateKey).toString('hex').toUpperCase();
  }

  private verifyRsaSha256(message: string, signatureHex: string, publicKey: KeyObject): boolean {
    try {
      const verifier = createVerify('RSA-SHA256');
      verifier.update(message, 'utf8');
      verifier.end();
      return verifier.verify(publicKey, Buffer.from(signatureHex, 'hex'));
    } catch (e) {
      this.logger.warn(`signature verify error: ${(e as Error).message}`);
      return false;
    }
  }

  private timestampGmt(): string {
    return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '').slice(0, 14);
  }
}
