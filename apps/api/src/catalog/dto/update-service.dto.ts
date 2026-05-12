import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMin?: number;

  @IsOptional()
  @IsBoolean()
  isPromo?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
