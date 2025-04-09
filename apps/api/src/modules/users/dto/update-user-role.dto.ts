import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @IsBoolean({ message: 'is_admin must be a boolean.' })
  @IsNotEmpty({ message: 'is_admin is required.' })
  is_admin: boolean;

  @IsString({ message: 'updated_by must be a string.' })
  @IsNotEmpty({ message: 'updated_by is required.' })
  updated_by: string;
}
