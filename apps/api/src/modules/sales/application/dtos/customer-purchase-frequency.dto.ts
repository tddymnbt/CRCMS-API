import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class CustomerPurchaseFrequencyDto {
  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Start of the custom date range (ISO 8601 date)',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-01-31',
    description: 'End of the custom date range (ISO 8601 date)',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
