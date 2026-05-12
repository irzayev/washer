import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

/** SaaS / multi-tenant placeholder (use `Tenant` model in future middleware). */
@Controller('tenants')
export class TenantController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  list() {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
