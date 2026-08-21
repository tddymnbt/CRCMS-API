import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { PaymentLogDto } from './create-sales.dto';

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
