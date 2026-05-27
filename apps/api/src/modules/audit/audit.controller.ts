import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@washer/db';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  list(
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const skip = (Number(page) - 1) * Number(pageSize);
    return this.prisma.auditLog.findMany({
      where: { entity, entityId, actorId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(pageSize),
      include: { actor: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
  }
}
