import { Body, Controller, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';

/** Placeholder for FAQ / booking AI over WhatsApp (wire LLM + policies later). */
@Controller('ai')
export class AiController {
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('whatsapp-reply')
  reply(@Body() body: { message: string }) {
    return {
      reply: `Echo (MVP): ${body.message}`,
      note: 'Replace with LLM + tool calls for booking and catalog.',
    };
  }
}
