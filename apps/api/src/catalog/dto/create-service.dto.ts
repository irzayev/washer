import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  categoryId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMin?: number;

  @IsOptional()
  @IsBoolean()
  isPromo?: boolean;
}
