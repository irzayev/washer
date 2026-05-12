import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class PaymentLineDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsInt()
  @Min(1)
  amountCents!: number;
}

export class CloseOrderDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  bonusUsedCents?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentLineDto)
  payments!: PaymentLineDto[];
}
