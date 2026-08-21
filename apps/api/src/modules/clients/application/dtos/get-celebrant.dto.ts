import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class BirthMonthParamDto {
  @ApiProperty({
    required: true,
    default: 1,
    description: 'Month number (1 to 12)',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}
