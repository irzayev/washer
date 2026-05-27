import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { VatMode } from '@washer/db';

export class CreateBranchDto {
  @IsString() code!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsEnum(VatMode) vatMode?: VatMode;
  @IsOptional() @IsNumber() @Min(0) vatRate?: number;
  @IsOptional() @IsString() currency?: string;
}

export class UpdateBranchDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsEnum(VatMode) vatMode?: VatMode;
  @IsOptional() @IsNumber() @Min(0) vatRate?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
