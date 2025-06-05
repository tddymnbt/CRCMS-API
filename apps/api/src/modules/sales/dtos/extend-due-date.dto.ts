import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
export class ExtendLayawayDueDateDto {
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
