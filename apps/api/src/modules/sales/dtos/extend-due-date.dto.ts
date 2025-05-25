import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
export class ExtendLayawayDueDateDto {
  @ApiProperty({ example: 'TEST123' })
  @IsString({ message: 'sale_ext_id must be a string' })
  @IsNotEmpty({ message: 'sale_ext_id is required' })
  sale_ext_id: string;

  @ApiProperty({
    example: '2025-04-01',
    required: true,
  })
  @IsDateString({}, { message: 'due_date must be a valid date' })
  @IsNotEmpty({ message: 'due_date is required.' })
  due_date: string;

  @ApiProperty({ example: 'admin_user' })
  @IsString({ message: 'Created By must be a string' })
  @IsNotEmpty({ message: 'Created By is required' })
  updated_by: string;
}
