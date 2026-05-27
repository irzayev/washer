import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';
import { UserRole } from '@washer/db';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AzericardService } from './azericard.service';

class InitDto {
  @IsString() orderId!: string;
  @IsNumber() @Min(0.01) amount!: number;
  @IsString() returnUrl!: string;
}

@ApiTags('azericard')
@Controller('azericard')
export class AzericardController {
  constructor(private readonly azc: AzericardService) {}

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('init')
  init(@Body() dto: InitDto) {
    return this.azc.initPayment({ ...dto, currency: 'AZN' });
  }

  @Public()
  @Post('webhook')
  webhook(@Body() body: Record<string, string>) {
    return this.azc.handleWebhook(body);
  }
}
