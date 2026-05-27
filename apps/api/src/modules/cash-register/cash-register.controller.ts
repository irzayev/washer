import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { UserRole } from '@washer/db';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CashRegisterService } from './cash-register.service';

class CashDto {
  @IsNumber() @Min(0) cash!: number;
}

@ApiTags('cash-register')
@ApiBearerAuth()
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cr: CashRegisterService) {}

  @Get('current')
  current(@CurrentUser() user: RequestUser) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.cr.current(user.branchId);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('open')
  open(@CurrentUser() user: RequestUser, @Body() dto: CashDto) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.cr.open(user.branchId, user.id, dto.cash);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('close')
  close(@CurrentUser() user: RequestUser, @Body() dto: CashDto) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.cr.close(user.branchId, user.id, dto.cash);
  }

  @Get('report/:shiftId')
  report(@Param('shiftId') shiftId: string) {
    return this.cr.report(shiftId);
  }
}
