import { Controller, Get, Param } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { BonusesService } from './bonuses.service';

@Controller('bonuses')
export class BonusesController {
  constructor(private readonly bonuses: BonusesService) {}

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('wallet/:clientId')
  wallet(@Param('clientId') clientId: string) {
    return this.bonuses.getWallet(clientId);
  }
}
