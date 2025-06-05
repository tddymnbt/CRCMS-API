import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiProperty({
    example: 'admin_user_id',
    description: 'User who updated the client',
  })
  @IsString()
  @IsNotEmpty()
  updated_by: string;
}
