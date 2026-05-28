import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@washer/db';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { PayrollService } from './payroll.service';
import { CreateSalaryRunDto, UpsertPayrollProfileDto } from './dto/payroll.dto';

@ApiTags('payroll')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Roles(UserRole.ADMIN)
  @Get('profiles')
  listProfiles(@CurrentUser() user: RequestUser) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.payroll.listProfiles(user.branchId);
  }

  @Roles(UserRole.ADMIN)
  @Post('profiles')
  upsertProfile(@Body() dto: UpsertPayrollProfileDto) {
    return this.payroll.upsertProfile(dto);
  }

  @Roles(UserRole.ADMIN)
  @Get('runs')
  listRuns(@CurrentUser() user: RequestUser) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.payroll.listRuns(user.branchId);
  }

  @Roles(UserRole.ADMIN)
  @Post('runs')
  createRun(@CurrentUser() user: RequestUser, @Body() dto: CreateSalaryRunDto) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.payroll.createRun(user.branchId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get('runs/:id')
  getRun(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.payroll.getRun(user.branchId, id);
  }
}
