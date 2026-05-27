import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DiscountType, PaymentMethod } from '@washer/db';

export class CloseDiscountDto {
  @IsEnum(DiscountType) type!: DiscountType;
  @IsNumber() @Min(0) value!: number;
  @IsString() @MinLength(1) reason!: string;
  @IsOptional() @IsString() comment?: string;
}

export class ClosePaymentDto {
  @IsEnum(PaymentMethod) method!: PaymentMethod;
  @IsNumber() @Min(0) amount!: number;
  @IsOptional() @IsString() transactionRef?: string;
}

export class CloseOrderDto {
  @IsOptional() @IsNumber() @Min(0) bonusUsed?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloseDiscountDto)
  discounts?: CloseDiscountDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClosePaymentDto)
  payments!: ClosePaymentDto[];

  @IsString() @MinLength(8) idempotencyKey!: string;
}
