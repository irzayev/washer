import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@washer/db';
import { Roles } from '../../common/decorators/roles.decorator';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('chat')
  chat(@Body() body: { prompt: string; system?: string }) {
    return this.ai.chat(body.prompt, body.system);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('suggest-services')
  suggest(@Body() body: { history: string }) {
    return this.ai.suggestServices(body.history);
  }
}
