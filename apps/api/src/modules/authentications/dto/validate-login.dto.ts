import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ValidateLoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'email is required.' })
  email: string;

  @IsString({ message: 'otp must be a string.' })
  @IsNotEmpty({ message: 'otp is required.' })
  otp: string;
}
