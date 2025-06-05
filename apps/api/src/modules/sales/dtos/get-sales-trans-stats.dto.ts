import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

export class GetAllSalesTransactionsStats {
  @ApiProperty({
    required: false,
    description: 'Mode: A = All | CN = Consigned | R = Regular | L = Layaway',
    example: '',
  })
  @IsOptional()
  @IsString()
  @IsIn(['A', 'CN', 'R', 'L'], {
    message:
      'Mode must be A = All | CN = Consigned | R = Regular | L = Layaway',
  })
  mode?: 'A' | 'CN' | 'R' | 'L' = 'A';

  @ApiProperty({
    required: false,
    description: 'Start date filter (YYYY-MM-DD)',
    example: '2025-06-01',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((dto) => dto.dateTo)
  dateFrom?: string;

  @ApiProperty({
    required: false,
    description: 'End date filter (YYYY-MM-DD)',
    example: '2025-06-30',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((dto) => dto.dateFrom)
  dateTo?: string;
}
