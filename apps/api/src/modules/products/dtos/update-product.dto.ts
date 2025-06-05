import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ConditionDto {
  @ApiProperty({ example: '8' })
  @IsString({ message: 'Interior condition must be a string' })
  @IsNotEmpty({ message: 'Interior condition is required' })
  interior: string;

  @ApiProperty({ example: '9' })
  @IsString({ message: 'Exterior condition must be a string' })
  @IsNotEmpty({ message: 'Exterior condition is required' })
  exterior: string;

  @ApiProperty({ example: '96' })
  @IsString({ message: 'Overall condition must be a string' })
  @IsNotEmpty({ message: 'Overall condition is required' })
  overall: string;

  @ApiProperty({ example: 'Minor scratches on the frame' })
  @IsString({ message: 'Condition description must be a string' })
  @IsNotEmpty({ message: 'Condition description is required' })
  description: string;
}

export class UpdateProductDto {
  @ApiProperty({ example: 'cat-001' })
  @IsString({ message: 'Category External ID must be a string' })
  @IsNotEmpty({ message: 'Category External ID is required' })
  category_ext_id: string;

  @ApiProperty({ example: 'brand-001' })
  @IsString({ message: 'Brand External ID must be a string' })
  @IsNotEmpty({ message: 'Brand External ID is required' })
  brand_ext_id: string;

  @ApiProperty({ example: 'Sample Product' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ example: 'Leather', required: false })
  @IsOptional()
  @IsString({ message: 'Material must be a string' })
  material?: string;

  @ApiProperty({ example: 'Metal', required: false })
  @IsOptional()
  @IsString({ message: 'Hardware must be a string' })
  hardware?: string;

  @ApiProperty({ example: 'PRD123', required: false })
  @IsOptional()
  @IsString({ message: 'Code must be a string' })
  code?: string;

  @ApiProperty({ example: '10x20', required: false })
  @IsOptional()
  @IsString({ message: 'Measurement must be a string' })
  measurement?: string;

  @ApiProperty({ example: 'Model-X', required: false })
  @IsOptional()
  @IsString({ message: 'Model must be a string' })
  model?: string;

  @ApiProperty({ example: 'auth-001', required: false })
  @IsOptional()
  @IsString({ message: 'Auth External ID must be a string' })
  auth_ext_id?: string;

  @ApiProperty({ example: ['Item 1', 'Item 2'], required: false })
  @IsOptional()
  @IsArray({ message: 'Inclusion must be an array of strings' })
  inclusion?: string[];

  @ApiProperty({ example: ['img1.jpg', 'img2.jpg'], required: false })
  @IsOptional()
  @IsArray({ message: 'Images must be an array of strings' })
  images?: string[];

  @ApiProperty({
    description: 'Product conditions',
    type: ConditionDto,
  })
  @ValidateNested()
  @Type(() => ConditionDto)
  condition: ConditionDto;

  @ApiProperty({ example: 100 })
  @IsNumber({}, { message: 'Cost must be a number' })
  cost: number;

  @ApiProperty({ example: 150 })
  @IsNumber({}, { message: 'Price must be a number' })
  price: number;

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'Is Consigned must be a boolean' })
  is_consigned: boolean;

  @ApiProperty({ example: 'con-001', required: false })
  @IsOptional()
  @IsString({ message: 'Consignor External ID must be a string' })
  consignor_ext_id?: string;

  @ApiProperty({ example: 140, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Consignor Selling Price must be a number' })
  consignor_selling_price?: number;

  @ApiProperty({
    example: '1999-04-01',
    required: false,
  })
  @IsDateString({}, { message: 'consigned_date must be a valid date' })
  @IsOptional()
  @IsNotEmpty({ message: 'consigned_date is required.' })
  consigned_date?: string;

  @ApiProperty({ example: 'admin_user' })
  @IsString({ message: 'Updated By must be a string' })
  @IsNotEmpty({ message: 'Updated By is required' })
  updated_by: string;
}
