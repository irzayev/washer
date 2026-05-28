import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { AppointmentSource, AppointmentStatus } from '@washer/db';

export class CreateAppointmentDto {
  @IsUUID() clientId!: string;
  @IsOptional() @IsUUID() vehicleId?: string;
  @IsDateString() slotStart!: string;
  @IsDateString() slotEnd!: string;
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) serviceIds?: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() source?: AppointmentSource;
}

export class UpdateAppointmentDto {
  @IsOptional() @IsDateString() slotStart?: string;
  @IsOptional() @IsDateString() slotEnd?: string;
  @IsOptional() status?: AppointmentStatus;
  @IsOptional() @IsString() notes?: string;
}

export class PublicBookDto {
  @IsString() @MinLength(9) phone!: string;
  @IsString() @MinLength(1) firstName!: string;
  @IsOptional() @IsString() lastName?: string;
  @IsDateString() slotStart!: string;
  @IsDateString() slotEnd!: string;
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) serviceIds?: string[];
  @IsOptional() @IsString() notes?: string;
}
