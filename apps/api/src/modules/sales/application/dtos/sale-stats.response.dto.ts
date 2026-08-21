import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseStatusDto } from 'src/common/swagger/response-common.dto';

export class SaleTransactionStatsDto {
  @ApiProperty({
    description: 'Total amount for the period (2 decimal places)',
    example: '101500.00',
  })
  totalAmount: string;

  @ApiProperty({
    description: 'Total transaction count for the period',
    example: '25',
  })
  totalCount: string;

  @ApiPropertyOptional({ description: 'Amount today', example: '10000.00' })
  todayAmount?: string;

  @ApiPropertyOptional({ description: 'Count today', example: '2' })
  todayCount?: string;

  @ApiPropertyOptional({ description: 'Amount yesterday', example: '8500.00' })
  yesterdayAmount?: string;

  @ApiPropertyOptional({ description: 'Count yesterday', example: '1' })
  yesterdayCount?: string;

  @ApiPropertyOptional({
    description: 'Amount in the last 7 days',
    example: '45000.00',
  })
  lastWeekAmount?: string;

  @ApiPropertyOptional({
    description: 'Count in the last 7 days',
    example: '9',
  })
  lastWeekCount?: string;

  @ApiPropertyOptional({
    description: 'Amount in the last calendar month',
    example: '80000.00',
  })
  lastMonthAmount?: string;

  @ApiPropertyOptional({
    description: 'Count in the last calendar month',
    example: '18',
  })
  lastMonthCount?: string;

  @ApiPropertyOptional({
    description: 'Amount in the last calendar year',
    example: '101500.00',
  })
  lastYearAmount?: string;

  @ApiPropertyOptional({
    description: 'Count in the last calendar year',
    example: '25',
  })
  lastYearCount?: string;
}

export class SaleTransactionsStatsDataDto {
  @ApiPropertyOptional({
    description:
      'Applied date range. Present only when dateFrom/dateTo query params are provided.',
    type: Object,
    example: { from: '2025-06-01', to: '2025-06-30' },
  })
  dataRange?: {
    from?: string;
    to?: string;
  };

  @ApiPropertyOptional({
    description: 'Fully paid sales statistics',
    type: SaleTransactionStatsDto,
  })
  totalPaidSales?: SaleTransactionStatsDto;

  @ApiPropertyOptional({
    description: 'Sales with outstanding balance (deposit) statistics',
    type: SaleTransactionStatsDto,
  })
  totalPendingSales?: SaleTransactionStatsDto;

  @ApiPropertyOptional({
    description: 'Cancelled sales statistics',
    type: SaleTransactionStatsDto,
  })
  totalCancelledSales?: SaleTransactionStatsDto;
}

export class SaleTransactionsStatsResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiProperty({ type: SaleTransactionsStatsDataDto })
  data: SaleTransactionsStatsDataDto;
}

export class TopRepeatCustomerDto {
  @ApiProperty({
    description: 'Client external id',
    example: 'cX7tR2wK9p',
  })
  customerId: string;

  @ApiProperty({
    description: 'Full name of the client',
    example: 'John Cruz',
  })
  customerName: string;

  @ApiProperty({
    description: 'Number of purchases in the period',
    example: 4,
  })
  orders: number;
}

export class CustomerFrequencyResultDto {
  @ApiProperty({
    description: 'Clients with exactly one purchase in the period',
    example: 12,
  })
  newCustomers: number;

  @ApiProperty({
    description: 'Clients with more than one purchase in the period',
    example: 5,
  })
  repeatCustomers: number;

  @ApiProperty({
    description: 'Top 5 repeat customers ordered by purchase count',
    type: [TopRepeatCustomerDto],
  })
  topRepeatCustomers: TopRepeatCustomerDto[];
}

export class CustomerFrequencyDataDto {
  @ApiPropertyOptional({
    description:
      'Applied custom date range. Present only when dateFrom/dateTo are provided.',
    example: { from: '2025-06-01', to: '2025-06-30' },
    type: Object,
  })
  dataRange?: {
    from: string;
    to: string;
  };

  @ApiPropertyOptional({
    description: 'Metrics for the provided custom range',
    type: CustomerFrequencyResultDto,
  })
  customRange?: CustomerFrequencyResultDto;

  @ApiPropertyOptional({
    description: 'Metrics for the current calendar month',
    type: CustomerFrequencyResultDto,
  })
  thisMonth?: CustomerFrequencyResultDto;

  @ApiPropertyOptional({
    description: 'Metrics for the previous calendar month',
    type: CustomerFrequencyResultDto,
  })
  lastMonth?: CustomerFrequencyResultDto;

  @ApiPropertyOptional({
    description: 'Metrics for the last 6 months',
    type: CustomerFrequencyResultDto,
  })
  last6mos?: CustomerFrequencyResultDto;

  @ApiPropertyOptional({
    description: 'Metrics for the previous calendar year',
    type: CustomerFrequencyResultDto,
  })
  lastYear?: CustomerFrequencyResultDto;
}

export class CustomerFrequencyResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiProperty({ type: CustomerFrequencyDataDto })
  data: CustomerFrequencyDataDto;
}
