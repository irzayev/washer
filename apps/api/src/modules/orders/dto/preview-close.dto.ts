import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CloseDiscountDto } from './close-order.dto';

export class PreviewCloseDto {
  @IsOptional() @IsNumber() @Min(0) bonusUsed?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloseDiscountDto)
  discounts?: CloseDiscountDto[];
}
