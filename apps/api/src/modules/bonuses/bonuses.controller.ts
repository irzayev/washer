import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BonusesService } from './bonuses.service';

@ApiTags('bonuses')
@ApiBearerAuth()
@Controller('bonuses')
export class BonusesController {
  constructor(private readonly bonuses: BonusesService) {}

  @Get('clients/:clientId/wallet')
  wallet(@Param('clientId') clientId: string) {
    return this.bonuses.wallet(clientId);
  }

  @Get('clients/:clientId/history')
  history(@Param('clientId') clientId: string) {
    return this.bonuses.history(clientId);
  }
}
