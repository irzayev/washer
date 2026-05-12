import { Body, Controller, Post } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('instagram')
export class InstagramController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post('webhook')
  async webhook(@Body() body: Record<string, unknown>) {
    const objectField = body.object;
    const eventType =
      typeof objectField === 'string'
        ? objectField
        : typeof objectField === 'number'
          ? String(objectField)
          : 'instagram';
    await this.prisma.instagramWebhookEvent.create({
      data: {
        eventType,
        raw: body as Prisma.InputJsonValue,
      },
    });
    return { received: true };
  }
}
