import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PayrollModel, UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { PayrollService } from './payroll.service';

class UpsertPayrollDto {
  model!: PayrollModel;
  baseCents?: number;
  percentBp?: number;
  notes?: string;
}

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Roles(UserRole.ADMIN)
  @Get('profiles')
  profiles() {
    return this.payroll.listProfiles();
  }

  @Roles(UserRole.ADMIN)
  @Post('profiles/:userId')
  upsert(@Param('userId') userId: string, @Body() dto: UpsertPayrollDto) {
    return this.payroll.upsertProfile(userId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get('profiles/:profileId/runs')
  runs(@Param('profileId') profileId: string) {
    return this.payroll.listRuns(profileId);
  }
}
