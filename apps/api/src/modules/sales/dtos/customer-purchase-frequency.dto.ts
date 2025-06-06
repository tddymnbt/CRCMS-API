import { IsOptional, IsDateString } from 'class-validator';

export class CustomerPurchaseFrequencyDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
