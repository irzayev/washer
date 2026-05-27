import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateServiceDto {
  @IsOptional() @IsUUID() branchId?: string;
  @IsUUID() categoryId!: string;
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) basePrice!: number;
  @IsOptional() @IsNumber() @Min(0) vatRate?: number;
  @IsOptional() @IsInt() @Min(1) durationMin?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() bonusEligible?: boolean;
}

export class UpdateServiceDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) basePrice?: number;
  @IsOptional() @IsNumber() @Min(0) vatRate?: number;
  @IsOptional() @IsInt() @Min(1) durationMin?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() bonusEligible?: boolean;
}
