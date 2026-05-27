import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderStatus, UserRole } from '@washer/db';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CloseOrderDto } from './dto/close-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: OrderStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.orders.list(user.branchId, status, Number(page) || 1, Number(pageSize) || 20);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.orders.findOne(user.branchId, id);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateOrderDto) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.orders.create(user.branchId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER)
  @Patch(':id/status')
  setStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.orders.updateStatus(user.branchId, id, dto.status);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/close')
  close(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CloseOrderDto) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.orders.close(user.branchId, id, user.id, dto);
  }
}
