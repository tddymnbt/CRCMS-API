import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Name of the role to be updated',
    example: 'Admin',
  })
  @IsString({ message: 'roleName must be a string.' })
  @IsNotEmpty({ message: 'roleName is required.' })
  roleName: string;

  @ApiProperty({
    description: 'Username or ID of the person performing the update',
    example: 'johndoe',
  })
  @IsString({ message: 'updated_by must be a string.' })
  @IsNotEmpty({ message: 'updated_by is required.' })
  updated_by: string;
}
