import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelSaleDto {
  @ApiProperty({ example: 'TEST123' })
  @IsString({ message: 'sale_ext_id must be a string' })
  @IsNotEmpty({ message: 'sale_ext_id is required' })
  sale_ext_id: string;

  @ApiProperty({ example: 'admin_user' })
  @IsString({ message: 'Created By must be a string' })
  @IsNotEmpty({ message: 'Created By is required' })
  cancelled_by: string;
}
