import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsNotEmpty,
  Min,
  IsIn,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindSalesDto {
  @ApiProperty({
    required: false,
    description:
      'Search by sale external id, customer name, type, product name',
    example: '',
  })
  @IsOptional()
  @IsString()
  searchValue?: string;

  @ApiProperty({
    required: false,
    default: 1,
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageNumber: number = 1;

  @ApiProperty({
    required: false,
    default: 10,
    description: 'Number of items per page',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  displayPerPage: number = 10;

  @ApiProperty({
    required: false,
    default: 'created_at',
    description: 'Field to sort by',
    example: 'created_at',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sortBy: string = 'created_at';

  @ApiProperty({
    required: false,
    default: 'desc',
    description: 'Sort order: asc or desc',
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(['asc', 'ASC', 'desc', 'DESC'], {
    message: 'orderBy must be ASC or DESC',
  })
  orderBy: 'asc' | 'desc' = 'desc';

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
