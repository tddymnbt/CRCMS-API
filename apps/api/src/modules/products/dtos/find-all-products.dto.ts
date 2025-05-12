import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsNotEmpty,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindProductsDto {
  @ApiProperty({
    required: false,
    description:
      'Search by name, material, hardware, code, measurement, model, price',
    example: '',
  })
  @IsOptional()
  @IsString()
  searchValue?: string;

  @ApiProperty({
    required: false,
    default: 'N',
    description: 'Filter by consigned items',
    example: 'N',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Y', 'N', 'y', 'n'], { message: 'isConsigned must be Y or N' })
  isConsigned?: string;

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
    default: 'name',
    description: 'Field to sort by',
    example: 'name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sortBy: string = 'name';

  @ApiProperty({
    required: false,
    default: 'asc',
    description: 'Sort order: asc or desc',
    example: 'asc',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(['asc', 'ASC', 'desc', 'DESC'], {
    message: 'orderBy must be ASC or DESC',
  })
  orderBy: 'asc' | 'desc' = 'asc';
}
