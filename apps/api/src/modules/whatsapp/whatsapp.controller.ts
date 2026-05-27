import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { UserRole } from '@washer/db';
import { Roles } from '../../common/decorators/roles.decorator';
import { EvolutionService } from './evolution.service';

class SendTextDto {
  @IsString() to!: string;
  @IsString() @MinLength(1) text!: string;
}

@ApiTags('whatsapp')
@ApiBearerAuth()
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly wa: EvolutionService) {}

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('send-text')
  sendText(@Body() dto: SendTextDto) {
    return this.wa.sendText(dto);
  }
}
