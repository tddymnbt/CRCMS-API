import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString({ message: 'first_name must be a string.' })
  @IsNotEmpty({ message: 'first_name is required.' })
  first_name: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsString({ message: 'last_name must be a string.' })
  @IsNotEmpty({ message: 'last_name is required.' })
  last_name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'email is required.' })
  email: string;

  @ApiProperty({
    description: 'Username or ID of the person creating the user',
    example: 'admin_user',
  })
  @IsString({ message: 'created_by must be a string.' })
  @IsNotEmpty({ message: 'created_by is required.' })
  created_by: string;

  @ApiPropertyOptional({
    description: 'Username or ID of the person who last updated the user',
    example: 'editor_user',
  })
  @IsOptional()
  @IsString({ message: 'updated_by must be a string.' })
  updated_by: string;

  @ApiPropertyOptional({
    description: 'Username or ID of the person who marked the user as deleted',
    example: 'admin_user',
  })
  @IsOptional()
  @IsString({ message: 'deleted_by must be a string.' })
  deleted_by: string;
}
