// dto/update-product-category.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateProductCategoryDto {
  @ApiProperty({ description: 'New name for the product category', maxLength: 100 })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  @Length(1, 100, { message: 'name must not exceed 100 characters' })
  name: string;

  @ApiProperty({ description: 'Username of the updater', maxLength: 100 })
  @IsString({ message: 'created_by must be a string' })
  @IsNotEmpty({ message: 'created_by is required' })
  @Length(1, 100, { message: 'created_by must not exceed 100 characters' })
  updated_by: string;
}