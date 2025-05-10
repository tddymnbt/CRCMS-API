import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteProductCategoryDto {
  @ApiProperty({ description: 'Username of the deleter', maxLength: 100 })
  @IsString({ message: 'created_by must be a string' })
  @IsNotEmpty({ message: 'created_by is required' })
  @Length(1, 100, { message: 'created_by must not exceed 100 characters' })
  deleted_by: string;
}
