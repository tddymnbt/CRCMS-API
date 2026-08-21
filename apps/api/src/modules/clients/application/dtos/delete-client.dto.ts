import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteClientDto {
  @ApiProperty({
    description: 'Username or ID of the person performing the deletion',
    example: 'admin_user',
  })
  @IsString({ message: 'deleted_by must be a string.' })
  @IsNotEmpty({ message: 'deleted_by is required.' })
  deleted_by: string;
}
