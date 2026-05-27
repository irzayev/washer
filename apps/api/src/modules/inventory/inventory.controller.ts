import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@washer/db';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, ReceiveStockDto } from './dto/inventory.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.inventory.list(user.branchId);
  }

  @Get('low-stock')
  lowStock(@CurrentUser() user: RequestUser) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.inventory.lowStock(user.branchId);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateInventoryItemDto) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.inventory.create(user.branchId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('receive')
  receive(@CurrentUser() user: RequestUser, @Body() dto: ReceiveStockDto) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.inventory.receive(user.branchId, dto, user.id);
  }
}
