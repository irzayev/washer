import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get()
  list(@Query('branchId') branchId?: string) {
    return this.inventory.list(branchId);
  }
}
