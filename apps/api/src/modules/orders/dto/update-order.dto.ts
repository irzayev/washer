import { IsEnum } from 'class-validator';
import { OrderStatus } from '@washer/db';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
