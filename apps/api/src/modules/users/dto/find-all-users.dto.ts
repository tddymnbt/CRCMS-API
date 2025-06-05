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

export class FindUsersDto {
  @ApiProperty({
    required: false,
    description: 'Search by first name, last name, or email',
    example: '',
  })
  @IsOptional()
  @IsString()
  searchValue?: string;

  @ApiProperty({
    required: false,
    default: 'Y',
    description: 'Filter by active users',
    example: 'Y',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(['Y', 'N', 'y', 'n'], { message: 'isActive must be Y or N' })
  isActive?: string = 'Y';

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
    default: 'first_name',
    description: 'Field to sort by',
    example: 'first_name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sortBy: string = 'first_name';

  @ApiProperty({
    required: false,
    default: 'asc',
    description: 'Sort order: asc or desc',
    example: 'asc',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  orderBy: 'asc' | 'desc' = 'asc';
}
