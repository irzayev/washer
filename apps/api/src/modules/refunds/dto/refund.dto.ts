import { IsNumber, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateRefundDto {
  @IsUUID() paymentId!: string;
  @IsNumber() @Min(0.01) amount!: number;
  @IsString() @MinLength(3) reason!: string;
}
