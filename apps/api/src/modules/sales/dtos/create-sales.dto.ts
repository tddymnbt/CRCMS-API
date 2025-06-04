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

export class PaymentLogDto {
  @ApiProperty({ example: '10000' })
  @IsString({ message: 'amount must be a string' })
  @IsNotEmpty({ message: 'amount is required' })
  amount: string;

  @ApiProperty({
    example: '2025-04-01',
    required: true,
  })
  @IsDateString({}, { message: 'payment_date must be a valid date' })
  @IsNotEmpty({ message: 'payment_date is required.' })
  payment_date: string;

  @ApiProperty({ example: 'Cash, Credit Card, Debit Card, Bank Transfer' })
  @IsString({ message: 'payment_method must be a string' })
  @IsNotEmpty({ message: 'payment_method is required' })
  payment_method: string;

  // @ApiProperty({ example: false })
  // @IsBoolean({ message: 'is_deposit must be a boolean' })
  // is_deposit: boolean;

  // @ApiProperty({ example: true })
  // @IsBoolean({ message: 'is_final_payment must be a boolean' })
  // is_final_payment: boolean;
}

export class ItemProductDto {
  @ApiProperty({ example: 'TEST123' })
  @IsString({ message: 'product_ext_id must be a string' })
  @IsNotEmpty({ message: 'product_ext_id is required' })
  product_ext_id: string;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: 'qty must be a number' })
  @IsNotEmpty({ message: 'qty is required' })
  @Min(1)
  qty: number;
}

export class LayawayPlanDto {
  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: 'no_of_months must be a number' })
  @IsNotEmpty({ message: 'no_of_months is required' })
  @Min(1)
  no_of_months: number;

  @ApiProperty({
    example: '2025-04-01',
    required: true,
  })
  @IsDateString({}, { message: 'due_date must be a valid date' })
  @IsNotEmpty({ message: 'due_date is required.' })
  due_date: string;
}

export class SalesDto {
  @ApiProperty({ example: 'TEST123' })
  @IsString({ message: 'client_ext_id must be a string' })
  @IsNotEmpty({ message: 'client_ext_id is required' })
  client_ext_id: string;

  @ApiProperty({ example: 'R = Regular or L = Layaway' })
  @IsString({ message: 'type must be a string' })
  @IsNotEmpty({ message: 'type is required' })
  @MinLength(1)
  @MaxLength(1)
  @IsIn(['L', 'R'], { message: 'type must be R or L' })
  type: string;

  @ApiProperty({
    description: 'List of products',
    type: [ItemProductDto],
  })
  @IsArray({ message: 'products must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ItemProductDto)
  products: ItemProductDto[];

  @ApiProperty({
    description: 'Layaway Plan',
    type: LayawayPlanDto,
  })
  @ValidateNested()
  @Type(() => LayawayPlanDto)
  layaway?: LayawayPlanDto;

  @ApiProperty({ example: false })
  @IsBoolean({ message: 'is_discounted must be a boolean' })
  is_discounted: boolean;

  @ApiProperty({ example: '10' })
  @IsString({ message: 'discount_percentage must be a string' })
  @IsNotEmpty({ message: 'discount_percentage is required' })
  discount_percentage: string;

  @ApiProperty({ example: '1000' })
  @IsString({ message: 'discount_flat_rate must be a string' })
  @IsNotEmpty({ message: 'discount_flat_rate is required' })
  discount_flat_rate: string;

  @ApiProperty({
    example: '2025-04-01',
    required: true,
  })
  @IsDateString({}, { message: 'date_purchased must be a valid date' })
  @IsNotEmpty({ message: 'date_purchased is required.' })
  date_purchased: string;

  @ApiProperty({
    description: 'payment',
    type: PaymentLogDto,
  })
  @ValidateNested()
  @Type(() => PaymentLogDto)
  payment: PaymentLogDto;

  @ApiProperty({ example: ['img1.jpg', 'img2.jpg'], required: false })
  @IsOptional()
  @IsArray({ message: 'Images must be an array of strings' })
  images?: string[];

  @ApiProperty({ example: 'admin_user' })
  @IsString({ message: 'Created By must be a string' })
  @IsNotEmpty({ message: 'Created By is required' })
  created_by: string;
}
