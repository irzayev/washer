import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class VehicleNestedDto {
  @IsOptional() @IsString() @MaxLength(20) plate?: string;
  @IsOptional() @IsString() @MaxLength(32) vin?: string;
  @IsOptional() @IsString() @MaxLength(40) make?: string;
  @IsOptional() @IsString() @MaxLength(40) model?: string;
  @IsOptional() @IsInt() @Min(1950) @Max(2100) year?: number;
  @IsOptional() @IsString() @MaxLength(40) color?: string;
}

export class CreateClientDto {
  @IsString() @MinLength(3) phone!: string;
  @IsString() @MinLength(1) @MaxLength(80) firstName!: string;
  @IsOptional() @IsString() @MaxLength(80) lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsDateString() birthday?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsIn(['ru', 'az', 'en']) preferredLang?: 'ru' | 'az' | 'en';
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @ValidateNested() @Type(() => VehicleNestedDto) vehicle?: VehicleNestedDto;
}

export class UpdateClientDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() @MaxLength(80) firstName?: string;
  @IsOptional() @IsString() @MaxLength(80) lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsDateString() birthday?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsIn(['ru', 'az', 'en']) preferredLang?: 'ru' | 'az' | 'en';
  @IsOptional() @IsArray() tags?: string[];
}
