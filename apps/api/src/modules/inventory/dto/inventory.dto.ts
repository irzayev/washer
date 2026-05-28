import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateInventoryItemDto {
  @IsOptional() @IsString() sku?: string;
  @IsString() name!: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Min(0) costAvg?: number;
  @IsOptional() @IsNumber() @Min(0) stockQty?: number;
  @IsOptional() @IsNumber() @Min(0) minStock?: number;
}

export class ReceiveStockDto {
  @IsUUID() itemId!: string;
  @IsNumber() @Min(0) qty!: number;
  @IsNumber() @Min(0) unitCost!: number;
  @IsOptional() @IsString() note?: string;
}

export class UpdateInventoryItemDto {
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Min(0) minStock?: number;
}
