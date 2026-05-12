import { Body, Controller, Post } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { EvolutionService } from './evolution.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evolution: EvolutionService,
  ) {}

  /** Evolution (and compatible) webhooks — verify signatures in production. */
  @Public()
  @Post('webhook')
  async webhook(@Body() body: Record<string, unknown>) {
    const rawEvent = body.event ?? body.type;
    const eventType =
      typeof rawEvent === 'string'
        ? rawEvent
        : typeof rawEvent === 'number'
          ? String(rawEvent)
          : 'unknown';
    await this.prisma.evolutionWebhookEvent.create({
      data: {
        eventType,
        raw: body as Prisma.InputJsonValue,
      },
    });
    return { received: true };
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('send')
  async send(@Body() dto: { number: string; text: string }) {
    return this.evolution.sendText(dto.number, dto.text);
  }
}
