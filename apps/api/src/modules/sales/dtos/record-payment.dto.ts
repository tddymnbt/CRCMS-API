import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
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
}

export class RecordPaymentDto {
  @ApiProperty({ example: 'TEST123' })
  @IsString({ message: 'sale_ext_id must be a string' })
  @IsNotEmpty({ message: 'sale_ext_id is required' })
  sale_ext_id: string;

  @ApiProperty({
    description: 'payment',
    type: PaymentLogDto,
  })
  @ValidateNested()
  @Type(() => PaymentLogDto)
  payment: PaymentLogDto;

  @ApiProperty({ example: 'admin_user' })
  @IsString({ message: 'Created By must be a string' })
  @IsNotEmpty({ message: 'Created By is required' })
  created_by: string;
}
