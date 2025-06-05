import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateLoginDto {
  @ApiProperty({
    description: 'Email address used for login verification',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'email is required.' })
  email: string;

  @ApiProperty({
    description: 'One-time password (OTP) sent to the user for validation',
    example: '123456',
  })
  @IsString({ message: 'otp must be a string.' })
  @IsNotEmpty({ message: 'otp is required.' })
  otp: string;
}
