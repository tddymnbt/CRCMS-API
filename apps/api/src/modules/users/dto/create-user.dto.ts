import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'first_name must be a string.' })
  @IsNotEmpty({ message: 'first_name is required.' })
  first_name: string;

  @IsString({ message: 'last_name must be a string.' })
  @IsNotEmpty({ message: 'last_name is required.' })
  last_name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'email is required.' })
  email: string;

  @IsString({ message: 'created_by must be a string.' })
  @IsNotEmpty({ message: 'created_by is required.' })
  created_by: string;

  @IsOptional()
  @IsString({ message: 'updated_by must be a string.' })
  updated_by: string;

  @IsOptional()
  @IsString({ message: 'deleted_by must be a string.' })
  deleted_by: string;
}
