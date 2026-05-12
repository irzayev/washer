import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CashRegisterService } from './cash-register.service';

@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cash: CashRegisterService) {}

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('days')
  days(
    @Query('branchId') branchId: string | undefined,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.cash.summary(branchId, new Date(from), new Date(to));
  }
}
