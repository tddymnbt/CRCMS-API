import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class AuditTrailQueryDto {
  @ApiProperty({
    required: false,
    description: "User's external id",
    example: '',
  })
  @IsOptional()
  @IsString()
  userExternalId?: string;

  @ApiProperty({
    required: false,
    description: 'Module',
    example: '',
  })
  @IsOptional()
  @IsString()
  module?: string;

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
}
