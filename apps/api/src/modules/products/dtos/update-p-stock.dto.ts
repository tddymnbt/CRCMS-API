import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateProductStockDto {
  @ApiProperty({ example: 'increase' })
  @IsString({ message: 'type must be a string' })
  @IsNotEmpty({ message: 'type is required' })
  @IsIn(['increase', 'INCREASE', 'decrease', 'DECREASE'], {
    message: 'type must be increase or decrease',
  })
  type: 'increase' | 'decrease';

  @ApiProperty({ example: 10 })
  @IsNumber({}, { message: 'Quantity in stock must be a number' })
  @IsNotEmpty({ message: 'Quantity in stock is required' })
  qty: number;

  @ApiProperty({ example: 100 })
  @IsNumber({}, { message: 'Cost must be a number' })
  cost: number;

  @ApiProperty({ example: 'admin_user' })
  @IsString({ message: 'Updated By must be a string' })
  @IsNotEmpty({ message: 'Updated By is required' })
  updated_by: string;
}
