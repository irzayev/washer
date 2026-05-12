import { IsOptional, IsString } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
