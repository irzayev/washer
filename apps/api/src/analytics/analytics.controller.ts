import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('dashboard')
  dashboard() {
    return this.analytics.dashboard();
  }
}
