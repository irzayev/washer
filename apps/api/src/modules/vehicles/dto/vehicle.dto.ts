import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsOptional() @IsString() @MaxLength(20) plate?: string;
  @IsOptional() @IsString() @MaxLength(32) vin?: string;
  @IsOptional() @IsString() @MaxLength(40) make?: string;
  @IsOptional() @IsString() @MaxLength(40) model?: string;
  @IsOptional() @IsInt() @Min(1950) @Max(2100) year?: number;
  @IsOptional() @IsString() @MaxLength(40) color?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class UpdateVehicleDto extends CreateVehicleDto {}
