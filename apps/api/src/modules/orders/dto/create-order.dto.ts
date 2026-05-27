import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID() serviceId!: string;
  @IsOptional() @IsInt() @Min(1) qty?: number;
  @IsOptional() @IsUUID() executorId?: string;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
}

export class CreateOrderDto {
  @IsUUID() clientId!: string;
  @IsOptional() @IsUUID() vehicleId?: string;
  @IsOptional() @IsUUID() boxId?: string;
  @IsOptional() @IsUUID() assignedToId?: string;
  @IsOptional() @IsString() notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
