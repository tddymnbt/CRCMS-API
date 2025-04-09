import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteUserDto {
  @IsString({ message: 'deleted_by must be a string.' })
  @IsNotEmpty({ message: 'deleted_by is required.' })
  deleted_by: string;
}
