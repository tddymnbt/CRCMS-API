import { ApiProperty } from '@nestjs/swagger';

/**
 * Common `status` envelope shared by all success and business-error responses.
 */
export class ResponseStatusDto {
  @ApiProperty({
    description: 'Whether the operation succeeded',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable result message',
    example: 'Operation completed successfully',
  })
  message: string;
}

/**
 * Common pagination metadata returned by list endpoints.
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Total number of records matching the query',
    example: 42,
  })
  totalNumber: number;

  @ApiProperty({
    description: 'Total number of pages available',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Number of records displayed per page',
    example: 10,
  })
  displayPage: number;
}
