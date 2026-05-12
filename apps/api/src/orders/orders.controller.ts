import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CloseOrderDto } from './dto/close-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { SetDiscountDto, UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER)
  @Get()
  list() {
    return this.orders.list();
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.get(id);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orders.update(id, dto, user);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/discount')
  discount(
    @Param('id') id: string,
    @Body() dto: SetDiscountDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orders.setDiscount(id, dto, user);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/close')
  close(
    @Param('id') id: string,
    @Body() dto: CloseOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orders.close(id, dto, user);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/recalculate')
  recalculate(@Param('id') id: string) {
    return this.orders.recalculate(id);
  }
}
