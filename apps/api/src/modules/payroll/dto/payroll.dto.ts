import { IsDateString, IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import { PayrollModelType } from '@washer/db';

export class UpsertPayrollProfileDto {
  @IsUUID() userId!: string;
  @IsEnum(PayrollModelType) modelType!: PayrollModelType;
  @IsObject() params!: Record<string, unknown>;
  @IsOptional() @IsDateString() startsAt?: string;
}

export class CreateSalaryRunDto {
  @IsDateString() periodFrom!: string;
  @IsDateString() periodTo!: string;
}
