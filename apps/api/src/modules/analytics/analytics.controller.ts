import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: RequestUser) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.analytics.dashboard(user.branchId);
  }

  @Get('revenue')
  revenue(@CurrentUser() user: RequestUser, @Query('days') days?: string) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.analytics.revenueByDay(user.branchId, Number(days) || 30);
  }
}
