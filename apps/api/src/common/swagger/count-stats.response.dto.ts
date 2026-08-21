import { ApiProperty } from '@nestjs/swagger';
import { ResponseStatusDto } from './response-common.dto';

/**
 * Shared record-count statistics response returned by the
 * `GET /clients/stats/counts` and `GET /products/stats/counts` endpoints.
 */
export class CountStatsDataDto {
  @ApiProperty({
    description: 'Total record count',
    example: '120',
  })
  totalCount: string;

  @ApiProperty({
    description: 'Records created today',
    example: '3',
  })
  todayCount: string;

  @ApiProperty({
    description: 'Records created yesterday',
    example: '5',
  })
  yesterdayCount: string;

  @ApiProperty({
    description: 'Records created in the last 7 days',
    example: '18',
  })
  lastWeekCount: string;

  @ApiProperty({
    description: 'Records created in the last calendar month',
    example: '30',
  })
  lastMonthCount: string;

  @ApiProperty({
    description: 'Records created in the last calendar year',
    example: '95',
  })
  lastYearCount: string;
}

export class CountStatsResponseDto {
  @ApiProperty({
    description: 'Operation status',
    type: ResponseStatusDto,
  })
  status: ResponseStatusDto;

  @ApiProperty({
    description: 'Record counts grouped by period',
    type: CountStatsDataDto,
  })
  data: CountStatsDataDto;
}
