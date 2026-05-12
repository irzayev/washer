import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { DiscountType, OrderStatus } from '@prisma/client';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bonusUsedCents?: number;
}

export class SetDiscountDto {
  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @Type(() => Number)
  discountValue!: number;

  @IsOptional()
  @IsString()
  discountReason?: string;

  @IsOptional()
  @IsString()
  discountComment?: string;
}
