import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@washer/db';
import { InstagramService } from './instagram.service';

@ApiTags('instagram')
@Controller('instagram')
export class InstagramController {
  constructor(private readonly instagram: InstagramService) {}

  @Public()
  @Get('webhook')
  verify() {
    return { status: 'ok' };
  }

  @Public()
  @Post('webhook')
  webhook(@Body() body: unknown) {
    return this.instagram.handleWebhook(body);
  }

  @Roles(UserRole.ADMIN)
  @Post('send')
  send(@Body() body: { recipientId: string; text: string }) {
    return this.instagram.sendDm(body.recipientId, body.text);
  }
}
